import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guard } from '@/lib/admin-api'
import { hashPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Lista de cuentas de dueños de negocio (para el desarrollador)
export async function GET() {
  const g = await guard()
  if (g instanceof NextResponse) return g

  const owners = await db.ownerUser.findMany({
    orderBy: { createdAt: 'desc' },
    include: { business: { select: { id: true, name: true, slug: true, active: true } } },
  })
  return NextResponse.json({
    owners: owners.map((o) => ({
      id: o.id,
      email: o.email,
      name: o.name,
      active: o.active,
      businessId: o.businessId,
      businessName: o.business?.name ?? null,
      businessSlug: o.business?.slug ?? null,
      createdAt: o.createdAt,
    })),
  })
}

// Crear una cuenta de dueño: así el desarrollador "da acceso" a un negocio
export async function POST(req: NextRequest) {
  const g = await guard()
  if (g instanceof NextResponse) return g
  try {
    const body = await req.json()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const name = String(body.name || '').trim().slice(0, 120) || null
    if (!email || !email.includes('@') || password.length < 8) {
      return NextResponse.json({ error: 'invalid_data' }, { status: 400 })
    }
    const exists = await db.ownerUser.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'email_taken' }, { status: 409 })
    }
    const owner = await db.ownerUser.create({
      data: {
        email,
        name,
        passwordHash: hashPassword(password),
      },
    })
    return NextResponse.json({ ok: true, owner: { id: owner.id, email: owner.email, name: owner.name } })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
