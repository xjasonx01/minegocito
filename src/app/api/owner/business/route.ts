import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireOwner } from '@/lib/owner-api'
import { uniqueSlug, slugify } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'

// Campos que el dueño puede definir en su negocio.
// rating/featured/active inicial los controla el desarrollador; el dueño
// decide si su negocio está publicado mediante el campo active.
const OWNER_FIELDS = [
  'name',
  'description',
  'categoryId',
  'municipalityId',
  'address',
  'phone',
  'whatsapp',
  'email',
  'website',
  'instagram',
  'facebook',
  'hours',
  'coverUrl',
  'lat',
  'lng',
  'delivery',
] as const

function cleanText(v: unknown, max: number): string {
  return String(v ?? '').trim().slice(0, max)
}

function optional(v: unknown, max: number): string | null {
  const s = cleanText(v, max)
  return s || null
}

function parseCoord(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function buildData(body: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = cleanText(body.name, 120)
  if (body.description !== undefined) data.description = cleanText(body.description, 3000)
  if (body.categoryId !== undefined) data.categoryId = cleanText(body.categoryId, 64)
  if (body.municipalityId !== undefined) data.municipalityId = cleanText(body.municipalityId, 64)
  if (body.address !== undefined) data.address = optional(body.address, 300)
  if (body.phone !== undefined) data.phone = optional(body.phone, 40)
  if (body.whatsapp !== undefined) data.whatsapp = optional(String(body.whatsapp).replace(/[^0-9]/g, ''), 20)
  if (body.email !== undefined) data.email = optional(body.email, 160)
  if (body.website !== undefined) data.website = optional(body.website, 300)
  if (body.instagram !== undefined) data.instagram = optional(String(body.instagram).replace(/^@/, ''), 60)
  if (body.facebook !== undefined) data.facebook = optional(body.facebook, 200)
  if (body.hours !== undefined) data.hours = optional(body.hours, 500)
  if (body.coverUrl !== undefined) data.coverUrl = optional(body.coverUrl, 500_000)
  if (body.lat !== undefined) data.lat = parseCoord(body.lat)
  if (body.lng !== undefined) data.lng = parseCoord(body.lng)
  if (body.delivery !== undefined) data.delivery = !!body.delivery
  return data
}

async function categoryAndMunicipalityExist(data: Record<string, unknown>): Promise<boolean> {
  const [cat, municipality] = await Promise.all([
    db.category.findUnique({ where: { id: String(data.categoryId) } }),
    db.municipality.findUnique({ where: { id: String(data.municipalityId) } }),
  ])
  return !!cat && !!municipality
}

// Crear el negocio del dueño (solo si aún no tiene uno)
export async function POST(req: NextRequest) {
  const guard = await requireOwner()
  if (guard instanceof NextResponse) return guard
  if (guard.businessId) {
    return NextResponse.json({ error: 'already_has_business' }, { status: 409 })
  }
  try {
    const body = (await req.json()) as Record<string, unknown>
    const data = buildData(body)
    if (!data.name || !data.description || !data.categoryId || !data.municipalityId) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }
    if (!(await categoryAndMunicipalityExist(data))) {
      return NextResponse.json({ error: 'invalid_category_or_municipality' }, { status: 400 })
    }
    const slug = await uniqueSlug(
      String(data.name),
      (s) => db.business.findUnique({ where: { slug: s } }).then((r) => !!r)
    )
    const business = await db.business.create({
      data: {
        slug,
        name: String(data.name),
        description: String(data.description),
        categoryId: String(data.categoryId),
        municipalityId: String(data.municipalityId),
        address: data.address as string | null,
        phone: data.phone as string | null,
        whatsapp: data.whatsapp as string | null,
        email: data.email as string | null,
        website: data.website as string | null,
        instagram: data.instagram as string | null,
        facebook: data.facebook as string | null,
        hours: data.hours as string | null,
        coverUrl: data.coverUrl as string | null,
        lat: data.lat as number | null,
        lng: data.lng as number | null,
        delivery: data.delivery as boolean,
        active: true,
        sortOrder: 50,
      },
    })
    await db.ownerUser.update({
      where: { id: guard.ownerId },
      data: { businessId: business.id },
    })
    return NextResponse.json({ ok: true, business })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}

// Actualizar el negocio propio del dueño
export async function PUT(req: NextRequest) {
  const guard = await requireOwner()
  if (guard instanceof NextResponse) return guard
  if (!guard.businessId) {
    return NextResponse.json({ error: 'no_business' }, { status: 409 })
  }
  try {
    const body = (await req.json()) as Record<string, unknown>
    const data = buildData(body)
    if (data.name === '') data.name = 'Mi negocio'
    if (data.categoryId !== undefined || data.municipalityId !== undefined) {
      const current = await db.business.findUnique({ where: { id: guard.businessId } })
      if (!current) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      const check: Record<string, unknown> = {
        categoryId: data.categoryId ?? current.categoryId,
        municipalityId: data.municipalityId ?? current.municipalityId,
      }
      if (!(await categoryAndMunicipalityExist(check))) {
        return NextResponse.json({ error: 'invalid_category_or_municipality' }, { status: 400 })
      }
    }
    // El dueño puede pausar/reactivar la visibilidad de su propio negocio
    if (body.active !== undefined) data.active = !!body.active
    const business = await db.business.update({
      where: { id: guard.businessId },
      data,
    })
    return NextResponse.json({ ok: true, business })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}

// Utilidad expuesta por si se necesita regenerar el slug (no usada por la UI)
export async function GET() {
  const guard = await requireOwner()
  if (guard instanceof NextResponse) return guard
  const business = guard.businessId
    ? await db.business.findUnique({ where: { id: guard.businessId } })
    : null
  return NextResponse.json({ slug: business ? business.slug : slugify(String(guard.name || 'mi-negocio')) })
}
