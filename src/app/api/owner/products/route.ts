import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireOwnerWithBusiness } from '@/lib/owner-api'

export const dynamic = 'force-dynamic'

// Stock opcional: null/vacío = producto único (se compra 1 sola vez);
// número >= 1 = unidades disponibles. Se normaliza aquí para que nunca
// llegue un 0 u otro valor inválido a la base de datos.
function parseStock(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Math.round(Number(value))
  if (!Number.isFinite(n) || n < 1) return null
  return n
}

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
        stock: parseStock(body.stock),
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
