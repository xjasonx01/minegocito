import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireOwnerWithBusiness } from '@/lib/owner-api'

export const dynamic = 'force-dynamic'

// Bandeja de pedidos del dueño: los últimos 200 pedidos de su negocio,
// del más reciente al más antiguo.
export async function GET() {
  const guard = await requireOwnerWithBusiness()
  if (guard instanceof NextResponse) return guard

  const orders = await db.order.findMany({
    where: { businessId: guard.businessId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({ orders })
}
