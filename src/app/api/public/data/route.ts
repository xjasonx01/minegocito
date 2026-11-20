import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeed } from '@/lib/ensure-seed'

export const dynamic = 'force-dynamic'

// Datos públicos para la tienda: ajustes, categorías, provincias con sus
// municipios, negocios activos con sus productos activos.
export async function GET() {
  await ensureSeed()

  const [settingsRows, categories, provinces, businesses] = await Promise.all([
    db.setting.findMany(),
    db.category.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    db.province.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: { municipalities: { where: { active: true }, orderBy: { sortOrder: 'asc' } } },
    }),
    db.business.findMany({
      where: { active: true },
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        category: true,
        municipality: { include: { province: true } },
        products: { where: { active: true }, orderBy: { sortOrder: 'asc' } },
      },
    }),
  ])

  const settings: Record<string, string> = {}
  for (const row of settingsRows) settings[row.key] = row.value

  return NextResponse.json({ settings, categories, provinces, businesses })
}
