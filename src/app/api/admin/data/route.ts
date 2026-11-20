import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeed } from '@/lib/ensure-seed'
import { guard } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'

// Datos completos para el panel (incluye inactivos y mensajes)
export async function GET() {
  const g = await guard()
  if (g instanceof NextResponse) return g
  await ensureSeed()

  const [settingsRows, categories, provinces, businesses, messages] = await Promise.all([
    db.setting.findMany(),
    db.category.findMany({ orderBy: { sortOrder: 'asc' } }),
    db.province.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { municipalities: { orderBy: { sortOrder: 'asc' } } },
    }),
    db.business.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { category: true, municipality: { include: { province: true } }, products: { orderBy: { sortOrder: 'asc' } } },
    }),
    db.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
  ])

  const settings: Record<string, string> = {}
  for (const row of settingsRows) settings[row.key] = row.value

  return NextResponse.json({ settings, categories, provinces, businesses, messages })
}
