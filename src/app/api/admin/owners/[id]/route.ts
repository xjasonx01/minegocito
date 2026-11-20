import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guard } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'

// Activar/desactivar una cuenta de dueño (revocar o restablecer el acceso)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard()
  if (g instanceof NextResponse) return g
  const { id } = await params
  try {
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (body.active !== undefined) data.active = !!body.active
    if (body.password !== undefined) {
      const password = String(body.password)
      if (password.length < 8) {
        return NextResponse.json({ error: 'invalid_data' }, { status: 400 })
      }
      const { hashPassword } = await import('@/lib/auth')
      data.passwordHash = hashPassword(password)
    }
    const owner = await db.ownerUser.update({ where: { id }, data })
    return NextResponse.json({ ok: true, owner: { id: owner.id, email: owner.email, active: owner.active } })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard()
  if (g instanceof NextResponse) return g
  const { id } = await params
  try {
    await db.ownerUser.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
