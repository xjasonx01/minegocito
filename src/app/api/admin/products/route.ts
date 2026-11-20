import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guard } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const g = await guard()
  if (g instanceof NextResponse) return g
  try {
    const body = await req.json()
    const businessId = String(body.businessId || '')
    const name = String(body.name || '').trim()
    const price = Number(body.price)
    if (!businessId || !name || !Number.isFinite(price)) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }
    const count = await db.product.count({ where: { businessId } })
    const product = await db.product.create({
      data: {
        businessId,
        name,
        nameEn: String(body.nameEn || '').trim() || null,
        description: String(body.description || '').trim() || null,
        descriptionEn: String(body.descriptionEn || '').trim() || null,
        price,
        imageUrl: String(body.imageUrl || '').trim() || null,
        sortOrder: count + 1,
        active: body.active !== false,
      },
    })
    return NextResponse.json({ ok: true, product })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
