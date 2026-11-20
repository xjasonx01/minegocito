// Helpers compartidos para las rutas de administración
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import type { SessionPayload } from '@/lib/auth'

export async function guard(): Promise<SessionPayload | NextResponse> {
  const session = await requireSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return session
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'item'
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = slugify(base)
  let i = 1
  while (await exists(slug)) {
    i += 1
    slug = `${slugify(base)}-${i}`
  }
  return slug
}

export function num(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}
