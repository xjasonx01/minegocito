'use client'

import { useState } from 'react'
import { Search, MapPin, ChevronRight, Store } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLang } from '@/lib/lang-context'
import { BusinessCard, CategoryIcon } from '@/components/store/ui-bits'
import { navigate } from '@/components/store/ui-bits'
import { pick, type PublicData } from '@/components/store/types'

type Props = {
  data: PublicData
  onOpenBusiness: (slug: string) => void
  onExplore: (filter: { categorySlug?: string; provinceSlug?: string; municipalitySlug?: string; q?: string }) => void
}

export function HomeView({ data, onOpenBusiness, onExplore }: Props) {
  const { lang, t } = useLang()
  const [q, setQ] = useState('')

  const featured = data.businesses.filter((b) => b.featured).slice(0, 6)
  const rest = data.businesses.filter((b) => !b.featured)

  function submitSearch() {
    if (!q.trim()) return
    onExplore({ provinceSlug: undefined, municipalitySlug: undefined, q: q.trim() })
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 px-4 py-14 text-white sm:py-20">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            {data.settings.siteName || 'Minegocito'}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-white/90 sm:text-lg">
            {lang === 'en' && data.settings.taglineEn ? data.settings.taglineEn : data.settings.tagline}
          </p>
          <form
            className="mx-auto mt-6 flex max-w-xl gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              submitSearch()
            }}
          >
            <Input
              className="h-11 border-transparent bg-white text-foreground shadow-lg placeholder:text-muted-foreground"
              placeholder={t('searchPlaceholder')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={t('searchPlaceholder')}
            />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0 bg-slate-900 hover:bg-slate-800" aria-label="Search">
              <Search className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <h2 className="mb-4 text-lg font-bold sm:text-xl">{t('exploreByCategory')}</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap">
          {data.categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onExplore({ categorySlug: c.slug })}
              className="flex shrink-0 items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:border-amber-500 hover:text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <CategoryIcon icon={c.icon} className="h-4 w-4 text-amber-600" />
              {pick(lang, c.name, c.nameEn)}
            </button>
          ))}
        </div>
      </section>

      {/* Provincias */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-8">
        <h2 className="mb-4 text-lg font-bold sm:text-xl">{t('exploreByLocation')}</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap">
          {data.provinces.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onExplore({ provinceSlug: p.slug })}
              className="flex shrink-0 items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:border-amber-500 hover:text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <MapPin className="h-4 w-4 text-amber-600" />
              {pick(lang, p.name, p.nameEn)}
            </button>
          ))}
        </div>
      </section>

      {/* En tendencia */}
      {featured.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 pb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold sm:text-xl">{t('trending')}</h2>
            <Button variant="ghost" size="sm" onClick={() => onExplore({})}>
              {t('allBusinesses')} <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((b) => (
              <BusinessCard key={b.id} business={b} onOpen={onOpenBusiness} />
            ))}
          </div>
        </section>
      )}

      {/* Resto de negocios */}
      {rest.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 pb-8">
          <h2 className="mb-4 text-lg font-bold sm:text-xl">{t('allBusinesses')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((b) => (
              <BusinessCard key={b.id} business={b} onOpen={onOpenBusiness} />
            ))}
          </div>
        </section>
      )}

      <PublishCta />
    </div>
  )
}

// ---------- Llamada a publicar (enlaza con el apartado completo) ----------
function PublishCta() {
  const { t } = useLang()
  return (
    <section className="border-t bg-muted/40 px-4 py-10">
      <Card className="mx-auto max-w-2xl border-amber-200 dark:border-amber-900/60">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60">
            <Store className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{t('joinHeroTag')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('joinFormText')}</p>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => navigate({ view: 'join' })}>
            <Store className="mr-2 h-4 w-4" /> {t('publishCta')}
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
