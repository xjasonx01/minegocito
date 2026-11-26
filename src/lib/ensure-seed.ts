// Garantiza que la base de datos tenga contenido inicial.
// Se ejecuta automáticamente en la primera petición (local y en Render/Neon).
//
// Estrategia:
//  - Ajustes, cuentas (desarrollador y dueño de prueba) y datos de
//    referencia (provincias, municipios, categorías) se sincronizan SIEMPRE
//    con upserts/creaciones puntuales: al desplegar una versión nueva, las
//    provincias, municipios y categorías añadidos aparecen solos.
//  - Las columnas nuevas del modelo Business se añaden de forma idempotente
//    (ver ensureBusinessColumns), sin pasos manuales de migración.
//  - Negocios y productos de ejemplo se siembran solo si no hay ninguno.
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { SETTINGS, CATEGORIES, PROVINCES, BUSINESSES } from '@/lib/seed-data'

// Cuenta de dueño de PRUEBA, lista para entrar al panel del dueño y crear
// un negocio de prueba. El desarrollador puede eliminarla luego desde el
// panel del desarrollador (#/desarrollador → Dueños).
const TEST_OWNER_EMAIL = (process.env.TEST_OWNER_EMAIL || 'dueno@minegocito.cu').toLowerCase()
const TEST_OWNER_PASSWORD = process.env.TEST_OWNER_PASSWORD || 'Prueba2026'

let seedPromise: Promise<void> | null = null

export function ensureSeed(): Promise<void> {
  if (!seedPromise) {
    seedPromise = doSeed().catch((e) => {
      seedPromise = null
      throw e
    })
  }
  return seedPromise
}

// El esquema evoluciona entre versiones: las columnas nuevas del modelo
// Business se añaden aquí de forma idempotente para que el despliegue
// (Render/Neon) no necesite pasos manuales de migración.
async function ensureBusinessColumns() {
  const url = process.env.DATABASE_URL || ''
  const isPostgres = /^postgres(ql)?:\/\//i.test(url)
  const columns: Array<[string, string]> = [
    ['whatsappGroup', 'TEXT'],
    ['telegramGroup', 'TEXT'],
  ]
  await ensureColumns('Business', columns, isPostgres)
  // Stock de productos (null = producto único, se compra 1 sola vez).
  await ensureColumns('Product', [['stock', 'INTEGER']], isPostgres)
}

async function ensureColumns(table: string, columns: Array<[string, string]>, isPostgres: boolean) {
  for (const [name, type] of columns) {
    if (isPostgres) {
      // Postgres admite IF NOT EXISTS: no falla si la columna ya existe.
      await db.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${name}" ${type}`)
    } else {
      // SQLite no admite IF NOT EXISTS: se ignora el error de columna duplicada.
      try {
        await db.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${name}" ${type}`)
      } catch (e) {
        const msg = String((e as { message?: string })?.message || e)
        if (!msg.toLowerCase().includes('duplicate column')) throw e
      }
    }
  }
}

async function doSeed() {
  // Columnas nuevas antes de usar el modelo Business.
  await ensureBusinessColumns()

  // Ajustes del sitio: se sincronizan SIEMPRE (aunque la base ya tenga datos)
  // para que el correo, WhatsApp y Telegram del desarrollador estén al día.
  for (const [key, value] of Object.entries(SETTINGS)) {
    await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
  }

  // Cuenta de dueño de prueba: disponible siempre para poder probar el
  // flujo completo (entrar → crear negocio → verlo en la página principal).
  await db.ownerUser.upsert({
    where: { email: TEST_OWNER_EMAIL },
    update: {},
    create: {
      email: TEST_OWNER_EMAIL,
      name: 'Dueño de prueba',
      passwordHash: hashPassword(TEST_OWNER_PASSWORD),
    },
  })

  // Usuario desarrollador inicial (panel privado #/desarrollador)
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@minegocito.cu').toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD || 'Minegocito2026'
  await db.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash: hashPassword(adminPassword) },
  })

  await syncReferenceData()

  // Negocios y productos de ejemplo: solo si la base no tiene ninguno.
  if ((await db.business.count()) === 0) {
    await seedBusinesses()
  }
}

// Provincias, municipios y categorías: se crean los que falten, sin tocar
// los que el desarrollador haya editado o desactivado.
async function syncReferenceData() {
  // ---- Provincias y municipios ----
  const existingProvinces = new Set(
    (await db.province.findMany({ select: { slug: true } })).map((p) => p.slug)
  )
  const existingMunicipalities = new Set(
    (await db.municipality.findMany({ select: { slug: true } })).map((m) => m.slug)
  )

  for (const [pi, p] of PROVINCES.entries()) {
    let provinceId: string
    if (existingProvinces.has(p.slug)) {
      const found = await db.province.findUnique({ where: { slug: p.slug }, select: { id: true } })
      if (!found) continue
      provinceId = found.id
    } else {
      const created = await db.province.create({
        data: { slug: p.slug, name: p.name, nameEn: p.nameEn, sortOrder: pi + 1 },
      })
      provinceId = created.id
    }
    const missing = p.municipalities.filter((m) => !existingMunicipalities.has(m.slug))
    if (missing.length > 0) {
      await db.municipality.createMany({
        data: missing.map((m) => ({
          slug: m.slug,
          name: m.name,
          provinceId,
          sortOrder: m.sortOrder,
        })),
      })
    }
  }

  // ---- Categorías (solo crear las que falten) ----
  const existingCategories = new Set(
    (await db.category.findMany({ select: { slug: true } })).map((c) => c.slug)
  )
  const missingCategories = CATEGORIES.filter((c) => !existingCategories.has(c.slug))
  if (missingCategories.length > 0) {
    await db.category.createMany({ data: missingCategories })
  }
}

async function seedBusinesses() {
  // Mapas slug → id de categorías y municipios
  const catMap = new Map<string, string>()
  for (const c of await db.category.findMany({ select: { id: true, slug: true } })) {
    catMap.set(c.slug, c.id)
  }
  const munMap = new Map<string, string>()
  for (const m of await db.municipality.findMany({ select: { id: true, slug: true } })) {
    munMap.set(m.slug, m.id)
  }

  for (const [i, b] of BUSINESSES.entries()) {
    const categoryId = catMap.get(b.category)
    const municipalityId = munMap.get(b.municipality)
    if (!categoryId || !municipalityId) continue // datos de referencia ausentes

    const created = await db.business.create({
      data: {
        slug: b.slug,
        name: b.name,
        nameEn: b.nameEn,
        description: b.description,
        descriptionEn: b.descriptionEn,
        categoryId,
        municipalityId,
        address: b.address,
        phone: b.phone,
        whatsapp: b.whatsapp,
        hours: b.hours,
        coverUrl: b.cover,
        rating: b.rating,
        featured: !!b.featured,
        delivery: !!b.delivery,
        sortOrder: i + 1,
      },
    })
    for (const [j, p] of b.products.entries()) {
      await db.product.create({
        data: {
          businessId: created.id,
          name: p.name,
          nameEn: p.nameEn,
          description: p.description,
          descriptionEn: undefined,
          price: p.price,
          imageUrl: p.img,
          sortOrder: j + 1,
        },
      })
    }
  }
}
