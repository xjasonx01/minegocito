// Guard compartido para las rutas del panel del dueño de negocio
import { NextResponse } from 'next/server'
import { getOwnerSession } from '@/lib/auth'
import { db } from '@/lib/db'

export type OwnerGuard = {
  ownerId: string
  email: string
  name: string | null
  businessId: string | null
}

// Devuelve los datos del dueño autenticado o una respuesta 401.
// El dueño puede existir sin negocio creado todavía.
export async function requireOwner(): Promise<OwnerGuard | NextResponse> {
  const session = await getOwnerSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const owner = await db.ownerUser.findUnique({
    where: { email: session.email },
    select: { id: true, email: true, name: true, businessId: true, active: true },
  })
  if (!owner || !owner.active) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return { ownerId: owner.id, email: owner.email, name: owner.name, businessId: owner.businessId }
}

// Igual que requireOwner pero exige que el dueño ya tenga un negocio creado.
export async function requireOwnerWithBusiness(): Promise<
  (OwnerGuard & { businessId: string }) | NextResponse
> {
  const guard = await requireOwner()
  if (guard instanceof NextResponse) return guard
  if (!guard.businessId) {
    return NextResponse.json({ error: 'no_business' }, { status: 409 })
  }
  return guard as OwnerGuard & { businessId: string }
}
