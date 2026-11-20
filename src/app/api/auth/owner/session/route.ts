import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOwnerSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Sesión actual del dueño: autenticado, datos y si ya tiene negocio creado
export async function GET() {
  const session = await getOwnerSession()
  if (!session) {
    return NextResponse.json({ authenticated: false })
  }
  const owner = await db.ownerUser.findUnique({
    where: { email: session.email },
    select: { email: true, name: true, businessId: true, active: true },
  })
  if (!owner || !owner.active) {
    return NextResponse.json({ authenticated: false })
  }
  return NextResponse.json({
    authenticated: true,
    email: owner.email,
    name: owner.name,
    businessId: owner.businessId,
  })
}
