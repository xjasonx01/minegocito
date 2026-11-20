'use client'

import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useLang } from '@/lib/lang-context'
import { BusinessCard } from '@/components/store/ui-bits'
import { pick, type Category, type Province, type PublicData } from '@/components/store/types'

export type Filters = {
  q: string
  categorySlug?: string
  provinceSlug?: string
  municipalitySlug?: string
}

type Props = {
  data: PublicData
  filters: Filters
  setFilters: (f: Filters) => void
  onOpenBusiness: (slug: string) => void
}

export function ListView({ data, filters, setFilters, onOpenBusiness }: Props) {
  const { lang, t } = useLang()

  const q = filters.q.trim().toLowerCase()
  const results = data.businesses.filter((b) => {
    if (filters.categorySlug && b.category.slug !== filters.categorySlug) return false
    if (filters.provinceSlug && b.municipality.province.slug !== filters.provinceSlug) return false
    if (filters.municipalitySlug && b.municipality.slug !== filters.municipalitySlug) return false
    if (q) {
      const hay = [
        b.name,
        b.nameEn,
        b.description,
        b.category.name,
        b.municipality.name,
        b.municipality.province.name,
        ...b.products.map((p) => p.name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  const category: Category | undefined = data.categories.find((c) => c.slug === filters.categorySlug)
  const province: Province | undefined = data.provinces.find((p) => p.slug === filters.provinceSlug)
  const municipality = province?.municipalities.find((m) => m.slug === filters.municipalitySlug)
  const hasFilters = !!(q || filters.categorySlug || filters.provinceSlug || filters.municipalitySlug)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{t('allBusinesses')}</h1>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('searchPlaceholder')}
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            aria-label={t('searchPlaceholder')}
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.categorySlug || ''}
          onChange={(e) => setFilters({ ...filters, categorySlug: e.target.value || undefined })}
          aria-label={t('allCategories')}
        >
          <option value="">{t('allCategories')}</option>
          {data.categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {pick(lang, c.name, c.nameEn)}
            </option>
          ))}
        </select>
      </div>

      {/* Ubicación: primero provincia, luego municipio (opcional) */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.provinceSlug || ''}
          onChange={(e) => {
            const provinceSlug = e.target.value || undefined
            setFilters({ ...filters, provinceSlug, municipalitySlug: undefined })
          }}
          aria-label={t('allProvinces')}
        >
          <option value="">{t('allProvinces')}</option>
          {data.provinces.map((p) => (
            <option key={p.id} value={p.slug}>
              {pick(lang, p.name, p.nameEn)}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          value={filters.municipalitySlug || ''}
          onChange={(e) => setFilters({ ...filters, municipalitySlug: e.target.value || undefined })}
          aria-label={t('allMunicipalities')}
          disabled={!province}
        >
          <option value="">{province ? t('allMunicipalities') : t('chooseProvinceFirst')}</option>
          {province?.municipalities.map((m) => (
            <option key={m.id} value={m.slug}>
              {pick(lang, m.name, m.nameEn)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>
          {results.length} {t('resultsCount')}
        </span>
        {category && <Badge variant="secondary">{pick(lang, category.name, category.nameEn)}</Badge>}
        {province && <Badge variant="secondary">{pick(lang, province.name, province.nameEn)}</Badge>}
        {municipality && <Badge variant="secondary">{pick(lang, municipality.name, municipality.nameEn)}</Badge>}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ q: '' })}
            className="h-7 px-2 text-xs"
          >
            <X className="mr-1 h-3 w-3" /> {t('clearFilters')}
          </Button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p>{t('noResults')}</p>
          {hasFilters && (
            <Button variant="outline" className="mt-4" onClick={() => setFilters({ q: '' })}>
              {t('clearFilters')}
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((b) => (
            <BusinessCard key={b.id} business={b} onOpen={onOpenBusiness} />
          ))}
        </div>
      )}
    </div>
  )
}
