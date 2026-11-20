import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guard, uniqueSlug } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const g = await guard()
  if (g instanceof NextResponse) return g
  try {
    const body = await req.json()
    const name = String(body.name || '').trim()
    if (!name) return NextResponse.json({ error: 'missing_name' }, { status: 400 })
    const slug = await uniqueSlug(name, (s) => db.category.findUnique({ where: { slug: s } }).then((r) => !!r))
    const category = await db.category.create({
      data: {
        slug,
        name,
        nameEn: String(body.nameEn || '').trim() || null,
        icon: String(body.icon || '').trim() || null,
        sortOrder: Number(body.sortOrder) || 99,
        active: body.active !== false,
      },
    })
    return NextResponse.json({ ok: true, category })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
