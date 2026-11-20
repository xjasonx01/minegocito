import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setOwnerSessionCookie, verifyPassword } from '@/lib/auth'
import { ensureSeed } from '@/lib/ensure-seed'

export const dynamic = 'force-dynamic'

// Acceso del dueño de negocio con las credenciales que le entrega el desarrollador
export async function POST(req: NextRequest) {
  try {
    await ensureSeed()
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }
    const owner = await db.ownerUser.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    })
    if (!owner || !owner.active || !verifyPassword(String(password), owner.passwordHash)) {
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
    }
    await setOwnerSessionCookie(owner.email)
    return NextResponse.json({ ok: true, email: owner.email, name: owner.name })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
