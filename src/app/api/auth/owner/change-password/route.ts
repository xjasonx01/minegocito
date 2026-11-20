import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOwnerSession, hashPassword, verifyPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// El dueño puede cambiar su propia contraseña desde su panel
export async function POST(req: NextRequest) {
  const session = await getOwnerSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { currentPassword, newPassword } = await req.json()
    if (!currentPassword || !newPassword || String(newPassword).length < 8) {
      return NextResponse.json({ error: 'invalid_data' }, { status: 400 })
    }
    const owner = await db.ownerUser.findUnique({ where: { email: session.email } })
    if (!owner || !verifyPassword(String(currentPassword), owner.passwordHash)) {
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
    }
    await db.ownerUser.update({
      where: { email: session.email },
      data: { passwordHash: hashPassword(String(newPassword)) },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
