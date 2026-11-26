import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireOwnerWithBusiness } from '@/lib/owner-api'

export const dynamic = 'force-dynamic'

async function ownProduct(ownerBusinessId: string, id: string) {
  const product = await db.product.findUnique({ where: { id } })
  if (!product || product.businessId !== ownerBusinessId) return null
  return product
}

// Editar un producto propio
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireOwnerWithBusiness()
  if (guard instanceof NextResponse) return guard
  const { id } = await params
  try {
    const existing = await ownProduct(guard.businessId, id)
    if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = String(body.name).trim().slice(0, 120)
    if (body.description !== undefined) data.description = String(body.description).trim().slice(0, 1000) || null
    if (body.price !== undefined) data.price = Math.max(0, Number(body.price) || 0)
    if (body.stock !== undefined) {
      // null/vacío = producto único; número >= 1 = unidades disponibles
      const n = Math.round(Number(body.stock))
      data.stock = body.stock === null || body.stock === '' || !Number.isFinite(n) || n < 1 ? null : n
    }
    if (body.imageUrl !== undefined) data.imageUrl = String(body.imageUrl).trim().slice(0, 500_000) || null
    if (body.active !== undefined) data.active = !!body.active
    const product = await db.product.update({ where: { id }, data })
    return NextResponse.json({ ok: true, product })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}

// Eliminar un producto propio
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireOwnerWithBusiness()
  if (guard instanceof NextResponse) return guard
  const { id } = await params
  try {
    const existing = await ownProduct(guard.businessId, id)
    if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    await db.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
