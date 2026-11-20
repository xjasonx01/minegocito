import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hashPassword, verifyPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { currentPassword, newPassword } = await req.json()
    if (!currentPassword || !newPassword || String(newPassword).length < 8) {
      return NextResponse.json({ error: 'invalid_data' }, { status: 400 })
    }
    const admin = await db.adminUser.findUnique({ where: { email: session.email } })
    if (!admin || !verifyPassword(String(currentPassword), admin.passwordHash)) {
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
    }
    await db.adminUser.update({
      where: { email: session.email },
      data: { passwordHash: hashPassword(String(newPassword)) },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
