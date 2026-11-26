import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guard } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard()
  if (g instanceof NextResponse) return g
  const { id } = await params
  try {
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = String(body.name).trim()
    if (body.nameEn !== undefined) data.nameEn = String(body.nameEn).trim() || null
    if (body.description !== undefined) data.description = String(body.description).trim() || null
    if (body.descriptionEn !== undefined) data.descriptionEn = String(body.descriptionEn).trim() || null
    if (body.price !== undefined) data.price = Number(body.price) || 0
    if (body.stock !== undefined) {
      // null/vacío = producto único; número >= 1 = unidades disponibles
      const n = Math.round(Number(body.stock))
      data.stock = body.stock === null || body.stock === '' || !Number.isFinite(n) || n < 1 ? null : n
    }
    if (body.imageUrl !== undefined) data.imageUrl = String(body.imageUrl).trim() || null
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0
    if (body.active !== undefined) data.active = !!body.active
    const product = await db.product.update({ where: { id }, data })
    return NextResponse.json({ ok: true, product })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard()
  if (g instanceof NextResponse) return g
  const { id } = await params
  try {
    await db.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
