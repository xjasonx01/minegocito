'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  UtensilsCrossed, Coffee, Croissant, Pizza, Shirt, Scissors, Hammer, PawPrint,
  IceCreamCone, Gift, Store, Star, MapPin, Truck, Crown, Phone, Clock, Package,
  BedDouble, CarTaxiFront, Cpu, Armchair, Wrench, PartyPopper,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLang } from '@/lib/lang-context'
import { formatPrice, pick, type Business } from '@/components/store/types'

// ---------- Iconos de categoría ----------
export const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  UtensilsCrossed, Coffee, Croissant, Pizza, Shirt, Scissors, Hammer, PawPrint,
  IceCreamCone, Gift, BedDouble, CarTaxiFront, Cpu, Armchair, Wrench, PartyPopper, Store,
}

export function CategoryIcon({ icon, className }: { icon: string | null; className?: string }) {
  const Cmp = (icon && CATEGORY_ICONS[icon]) || Store
  return <Cmp className={className} />
}

// ---------- Estrellas de valoración ----------
export function Stars({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-label={`${value}/5`}>
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
      <span className="text-sm font-medium">{value.toFixed(1)}</span>
    </span>
  )
}

// ---------- Router por hash (todo vive en la ruta /) ----------
export type Route =
  | { view: 'home' }
  | { view: 'list' }
  | { view: 'business'; slug: string }
  | { view: 'join' }
  | { view: 'owner' }
  | { view: 'dev' } // ruta privada del desarrollador, sin enlace visible en el sitio

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#/, '')
  if (h.startsWith('/negocio/')) return { view: 'business', slug: decodeURIComponent(h.slice('/negocio/'.length)) }
  if (h.startsWith('/negocios')) return { view: 'list' }
  if (h.startsWith('/publicar')) return { view: 'join' }
  if (h.startsWith('/panel')) return { view: 'owner' }
  if (h.startsWith('/desarrollador')) return { view: 'dev' }
  return { view: 'home' }
}

export function navigate(route: Route) {
  if (route.view === 'home') window.location.hash = '/'
  else if (route.view === 'list') window.location.hash = '/negocios'
  else if (route.view === 'join') window.location.hash = '/publicar'
  else if (route.view === 'owner') window.location.hash = '/panel'
  else if (route.view === 'dev') window.location.hash = '/desarrollador'
  else window.location.hash = `/negocio/${encodeURIComponent(route.slug)}`
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(typeof window === 'undefined' ? '' : window.location.hash))
  const onChange = useCallback(() => {
    setRoute(parseHash(window.location.hash))
    window.scrollTo({ top: 0 })
  }, [])
  useEffect(() => {
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [onChange])
  return route
}

// ---------- Tarjeta de negocio ----------
export function BusinessCard({ business, onOpen }: { business: Business; onOpen: (slug: string) => void }) {
  const { lang, t } = useLang()
  const minPrice = business.products.length ? Math.min(...business.products.map((p) => p.price)) : null
  return (
    <button
      type="button"
      onClick={() => onOpen(business.slug)}
      className="group w-full overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      aria-label={business.name}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {business.coverUrl ? (
           
          <img
            src={business.coverUrl}
            alt={business.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Store className="h-10 w-10" />
          </div>
        )}
        {business.featured && (
          <Badge className="absolute left-2 top-2 bg-amber-500 text-white hover:bg-amber-500">
            <Crown className="mr-1 h-3 w-3" /> {t('featured')}
          </Badge>
        )}
        {business.delivery && (
          <Badge className="absolute right-2 top-2 bg-emerald-600 text-white hover:bg-emerald-600">
            <Truck className="mr-1 h-3 w-3" /> {t('delivery')}
          </Badge>
        )}
      </div>
      <div className="space-y-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold group-hover:text-amber-600">{pick(lang, business.name, business.nameEn)}</h3>
          <Stars value={business.rating} />
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CategoryIcon icon={business.category.icon} className="h-3.5 w-3.5 text-amber-600" />
            {pick(lang, business.category.name, business.category.nameEn)}
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {pick(lang, business.municipality.name, business.municipality.nameEn)}, {pick(lang, business.municipality.province.name, business.municipality.province.nameEn)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            {business.products.length} {t('productsCount')}
          </span>
          {minPrice !== null && (
            <span className="font-medium text-foreground">
              {t('priceFrom')}: {formatPrice(minPrice)}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ---------- Botones de contacto ----------
export function ContactButtons({ business }: { business: Business }) {
  const { t } = useLang()
  const waNumber = business.whatsapp || (business.phone ? business.phone.replace(/[^0-9]/g, '') : '')
  const waText = encodeURIComponent(`Hola ${business.name}, escribo desde Minegocito`)
  return (
    <div className="flex flex-wrap gap-2">
      {waNumber && (
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <a href={`https://wa.me/${waNumber}?text=${waText}`} target="_blank" rel="noopener noreferrer">
            <Phone className="mr-2 h-4 w-4" /> {t('whatsapp')}
          </a>
        </Button>
      )}
      {business.phone && (
        <Button asChild variant="outline">
          <a href={`tel:${business.phone.replace(/\s/g, '')}`}>
            <Phone className="mr-2 h-4 w-4" /> {t('call')}
          </a>
        </Button>
      )}
    </div>
  )
}

export function InfoRow({
  icon: Icon,
  label,
  value,
  href,
  external,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  href?: string
  external?: boolean
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div className="min-w-0">
        <span className="block text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        {href ? (
          <a
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="break-all text-amber-700 hover:text-amber-800 hover:underline"
          >
            {value}
          </a>
        ) : (
          <span className="break-words">{value}</span>
        )}
      </div>
    </div>
  )
}

export { Clock }
