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
    if (body.description !== undefined) data.description = String(body.description).trim()
    if (body.descriptionEn !== undefined) data.descriptionEn = String(body.descriptionEn).trim() || null
    if (body.categoryId !== undefined) data.categoryId = String(body.categoryId)
    if (body.municipalityId !== undefined) data.municipalityId = String(body.municipalityId)
    if (body.address !== undefined) data.address = String(body.address).trim() || null
    if (body.phone !== undefined) data.phone = String(body.phone).trim() || null
    if (body.whatsapp !== undefined) data.whatsapp = String(body.whatsapp).replace(/[^0-9]/g, '') || null
    if (body.hours !== undefined) data.hours = String(body.hours).trim() || null
    if (body.coverUrl !== undefined) data.coverUrl = String(body.coverUrl).trim() || null
    if (body.rating !== undefined) data.rating = Math.min(5, Math.max(1, Number(body.rating) || 4.5))
    if (body.featured !== undefined) data.featured = !!body.featured
    if (body.delivery !== undefined) data.delivery = !!body.delivery
    if (body.active !== undefined) data.active = !!body.active
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0
    const business = await db.business.update({ where: { id }, data })
    return NextResponse.json({ ok: true, business })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard()
  if (g instanceof NextResponse) return g
  const { id } = await params
  try {
    await db.business.delete({ where: { id } }) // productos se borran en cascada
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
