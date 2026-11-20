import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guard } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  const g = await guard()
  if (g instanceof NextResponse) return g
  try {
    const body = await req.json()
    const settings: Record<string, string> = body.settings || {}
    for (const [key, value] of Object.entries(settings)) {
      await db.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
