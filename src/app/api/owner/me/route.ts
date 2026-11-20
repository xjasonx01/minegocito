import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireOwner } from '@/lib/owner-api'
import { ensureSeed } from '@/lib/ensure-seed'

export const dynamic = 'force-dynamic'

// Datos del dueño autenticado: su cuenta y su negocio (si ya lo creó)
export async function GET() {
  const guard = await requireOwner()
  if (guard instanceof NextResponse) return guard
  await ensureSeed()

  const [categories, provinces, business] = await Promise.all([
    db.category.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    db.province.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: { municipalities: { where: { active: true }, orderBy: { sortOrder: 'asc' } } },
    }),
    guard.businessId
      ? db.business.findUnique({
          where: { id: guard.businessId },
          include: {
            category: true,
            municipality: { include: { province: true } },
            products: { orderBy: { sortOrder: 'asc' } },
          },
        })
      : Promise.resolve(null),
  ])

  return NextResponse.json({
    owner: { email: guard.email, name: guard.name },
    business,
    categories,
    provinces,
  })
}
