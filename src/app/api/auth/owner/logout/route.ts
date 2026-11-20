import { NextResponse } from 'next/server'
import { clearOwnerSessionCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  await clearOwnerSessionCookie()
  return NextResponse.json({ ok: true })
}
