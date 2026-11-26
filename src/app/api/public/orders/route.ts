import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

type IncomingItem = { productId?: unknown; qty?: unknown }

// Crea un pedido en la bandeja del dueño a partir del carrito del comprador.
//
// El cliente solo envía productId + cantidad: los precios, los nombres y el
// tope de stock SIEMPRE se resuelven aquí contra la base de datos, para que
// nadie pueda enviar un pedido con precios inventados o cantidades superiores
// a las disponibles.
export async function POST(req: NextRequest) {
  let body: { businessId?: unknown; items?: unknown; buyerName?: unknown; buyerNote?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const businessId = typeof body.businessId === 'string' ? body.businessId : ''
  const rawItems = Array.isArray(body.items)
    ? (body.items as IncomingItem[]).slice(0, 50)
    : []
  if (!businessId || rawItems.length === 0) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true, active: true },
  })
  if (!business || !business.active) {
    return NextResponse.json({ error: 'business_not_found' }, { status: 404 })
  }

  // Productos pedidos: solo activos y de ese negocio
  const ids = [
    ...new Set(
      rawItems
        .map((i) => (typeof i.productId === 'string' ? i.productId : ''))
        .filter(Boolean),
    ),
  ]
  if (ids.length === 0) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
  const products = await db.product.findMany({
    where: { id: { in: ids }, businessId, active: true },
  })
  const byId = new Map(products.map((p) => [p.id, p]))

  // Arma el snapshot con precio real del catálogo y cantidad limitada al
  // stock disponible (null = producto único, máximo 1; 0 = agotado).
  const items: Array<{ productId: string; name: string; price: number; qty: number }> = []
  for (const raw of rawItems) {
    const product = byId.get(String(raw.productId ?? ''))
    if (!product) continue
    const maxQty = product.stock == null ? 1 : product.stock
    const qty = Math.min(Math.max(1, Math.round(Number(raw.qty) || 1)), maxQty)
    if (qty < 1) continue // producto agotado: no entra en el pedido
    items.push({ productId: product.id, name: product.name, price: product.price, qty })
  }
  if (items.length === 0) {
    return NextResponse.json({ error: 'no_stock' }, { status: 409 })
  }

  const total = items.reduce((acc, i) => acc + i.price * i.qty, 0)
  const buyerName = String(body.buyerName ?? '').trim().slice(0, 60) || null
  const buyerNote = String(body.buyerNote ?? '').trim().slice(0, 200) || null

  const order = await db.order.create({
    data: {
      businessId,
      items: JSON.stringify(items),
      total,
      buyerName,
      buyerNote,
      status: 'pendiente',
    },
  })

  return NextResponse.json({ ok: true, orderId: order.id })
}
