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
    const description = String(body.description || '').trim()
    const categoryId = String(body.categoryId || '')
    const municipalityId = String(body.municipalityId || '')
    if (!name || !description || !categoryId || !municipalityId) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }
    const slug = await uniqueSlug(name, (s) => db.business.findUnique({ where: { slug: s } }).then((r) => !!r))
    const business = await db.business.create({
      data: {
        slug,
        name,
        nameEn: String(body.nameEn || '').trim() || null,
        description,
        descriptionEn: String(body.descriptionEn || '').trim() || null,
        categoryId,
        municipalityId,
        address: String(body.address || '').trim() || null,
        phone: String(body.phone || '').trim() || null,
        whatsapp: String(body.whatsapp || '').replace(/[^0-9]/g, '') || null,
        hours: String(body.hours || '').trim() || null,
        coverUrl: String(body.coverUrl || '').trim() || null,
        rating: Math.min(5, Math.max(1, Number(body.rating) || 4.5)),
        featured: !!body.featured,
        delivery: !!body.delivery,
        active: body.active !== false,
        sortOrder: Number(body.sortOrder) || 99,
      },
    })
    return NextResponse.json({ ok: true, business })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
