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
    if (body.icon !== undefined) data.icon = String(body.icon).trim() || null
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0
    if (body.active !== undefined) data.active = !!body.active
    const category = await db.category.update({ where: { id }, data })
    return NextResponse.json({ ok: true, category })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard()
  if (g instanceof NextResponse) return g
  const { id } = await params
  try {
    const count = await db.business.count({ where: { categoryId: id } })
    if (count > 0) {
      return NextResponse.json({ error: 'has_businesses', count }, { status: 409 })
    }
    await db.category.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
