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
    const message = await db.contactMessage.update({
      where: { id },
      data: { read: body.read !== false },
    })
    return NextResponse.json({ ok: true, message })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard()
  if (g instanceof NextResponse) return g
  const { id } = await params
  try {
    await db.contactMessage.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
