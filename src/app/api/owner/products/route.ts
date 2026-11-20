import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireOwnerWithBusiness } from '@/lib/owner-api'

export const dynamic = 'force-dynamic'

// Crear un producto en el catálogo del propio negocio del dueño
export async function POST(req: NextRequest) {
  const guard = await requireOwnerWithBusiness()
  if (guard instanceof NextResponse) return guard
  try {
    const body = await req.json()
    const name = String(body.name || '').trim().slice(0, 120)
    if (!name) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }
    const count = await db.product.count({ where: { businessId: guard.businessId } })
    const product = await db.product.create({
      data: {
        businessId: guard.businessId,
        name,
        description: String(body.description || '').trim().slice(0, 1000) || null,
        price: Math.max(0, Number(body.price) || 0),
        imageUrl: String(body.imageUrl || '').trim().slice(0, 500_000) || null,
        active: body.active !== false,
        sortOrder: Number(body.sortOrder) || count + 1,
      },
    })
    return NextResponse.json({ ok: true, product })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
