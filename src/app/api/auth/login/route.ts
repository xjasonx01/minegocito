import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setSessionCookie, verifyPassword } from '@/lib/auth'
import { ensureSeed } from '@/lib/ensure-seed'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    await ensureSeed()
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }
    const admin = await db.adminUser.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    })
    if (!admin || !verifyPassword(String(password), admin.passwordHash)) {
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
    }
    await setSessionCookie(admin.email)
    return NextResponse.json({ ok: true, email: admin.email })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
