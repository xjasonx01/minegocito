import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Mensaje de contacto desde la web (se ve en el panel del desarrollador).
// kind = "join" cuando viene del apartado "Publica tu negocio".
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = String(body.name || '').trim().slice(0, 120)
    const contact = String(body.contact || '').trim().slice(0, 160)
    const message = String(body.message || '').trim().slice(0, 2000)
    const kind = body.kind === 'join' ? 'join' : 'general'
    if (!name || !contact || !message) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }
    await db.contactMessage.create({ data: { name, contact, message, kind } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
