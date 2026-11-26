import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireOwnerWithBusiness } from '@/lib/owner-api'

export const dynamic = 'force-dynamic'

type OrderItem = { productId: string; name?: string; price?: number; qty: number }

// Decodifica el snapshot JSON de los productos de un pedido. Si el formato
// no es válido se devuelve una lista vacía (el pedido se puede concretar
// igualmente, solo que no descuenta stock).
function parseItems(raw: string): OrderItem[] {
  try {
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return []
    return arr
      .filter(
        (i): i is OrderItem =>
          !!i && typeof i === 'object' &&
          typeof (i as OrderItem).productId === 'string' &&
          typeof (i as OrderItem).qty === 'number',
      )
      .map((i) => ({ productId: i.productId, qty: Math.max(1, Math.round(i.qty || 1)) }))
  } catch {
    return []
  }
}

// Acciones del dueño sobre un pedido de su negocio:
//  - concretado: la venta se realizó → descuenta el stock de cada producto
//    pedido (un producto único/null pasa a 0 = agotado) y marca el pedido.
//  - cancelado: el comprador no concretó → no se toca el stock.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireOwnerWithBusiness()
  if (guard instanceof NextResponse) return guard
  const { id } = await params

  let action = ''
  try {
    const body = await req.json()
    action = String(body.action || '')
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
  if (action !== 'concretado' && action !== 'cancelado') {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const order = await db.order.findUnique({ where: { id } })
  if (!order || order.businessId !== guard.businessId) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  // Solo los pedidos pendientes admiten cambios: evita descontar el stock
  // dos veces si el dueño pulsa "Concretar" por accidente.
  if (order.status !== 'pendiente') {
    return NextResponse.json({ error: 'already_processed' }, { status: 409 })
  }

  if (action === 'concretado') {
    // Transacción: descuenta el stock y actualiza el pedido de forma atómica.
    await db.$transaction(async (tx) => {
      for (const item of parseItems(order.items)) {
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        // Un producto eliminado del catálogo no detiene el resto del pedido.
        if (!product || product.businessId !== guard.businessId) continue
        const nextStock =
          product.stock == null ? 0 : Math.max(0, product.stock - item.qty)
        await tx.product.update({ where: { id: product.id }, data: { stock: nextStock } })
      }
      await tx.order.update({ where: { id: order.id }, data: { status: 'concretado' } })
    })
  } else {
    await db.order.update({ where: { id: order.id }, data: { status: 'cancelado' } })
  }

  return NextResponse.json({ ok: true })
}
