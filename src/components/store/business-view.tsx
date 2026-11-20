'use client'

import { ArrowLeft, Clock, Globe, Instagram, Mail, MapPin, Package, Phone, Facebook } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useLang } from '@/lib/lang-context'
import { ContactButtons, InfoRow, Stars, CategoryIcon } from '@/components/store/ui-bits'
import { MapPreview } from '@/components/store/map-preview'
import { formatPrice, pick, type Business } from '@/components/store/types'

type Props = {
  business: Business
  onBack: () => void
}

export function BusinessView({ business, onBack }: Props) {
  const { lang, t } = useLang()

  const hasContactInfo = !!(business.address || business.phone || business.hours || business.email ||
    business.website || business.instagram || business.facebook)
  const hasMap = !!(business.address || (typeof business.lat === 'number' && typeof business.lng === 'number'))

  return (
    <div className="flex flex-col">
      {/* Portada */}
      <div className="relative h-56 w-full overflow-hidden bg-muted sm:h-72">
        {business.coverUrl && (
          <img src={business.coverUrl} alt={business.name} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Button
          variant="secondary"
          size="sm"
          className="absolute left-4 top-4 shadow-md"
          onClick={onBack}
          aria-label={t('back')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> {t('back')}
        </Button>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-amber-500 text-white hover:bg-amber-500">
              <CategoryIcon icon={business.category.icon} className="mr-1 h-3 w-3" />
              {pick(lang, business.category.name, business.category.nameEn)}
            </Badge>
            <Badge className="bg-white/20 backdrop-blur hover:bg-white/20">
              <MapPin className="mr-1 h-3 w-3" />
              {pick(lang, business.municipality.name, business.municipality.nameEn)} · {pick(lang, business.municipality.province.name, business.municipality.province.nameEn)}
            </Badge>
            {business.delivery && (
              <Badge className="bg-emerald-600 hover:bg-emerald-600">{t('delivery')}</Badge>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold drop-shadow sm:text-4xl">
            {pick(lang, business.name, business.nameEn)}
          </h1>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Stars value={business.rating} />
          <ContactButtons business={business} />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-foreground/90 sm:text-base">
          {pick(lang, business.description, business.descriptionEn)}
        </p>

        {/* Datos de contacto */}
        {hasContactInfo && (
          <Card className="mt-6">
            <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
              {business.address && <InfoRow icon={MapPin} label={t('address')} value={business.address} />}
              {business.phone && <InfoRow icon={Phone} label={t('phone')} value={business.phone} />}
              {business.hours && <InfoRow icon={Clock} label={t('hours')} value={business.hours} />}
              {business.email && (
                <InfoRow
                  icon={Mail}
                  label={t('bizEmail')}
                  value={business.email}
                  href={`mailto:${business.email}`}
                />
              )}
              {business.website && (
                <InfoRow
                  icon={Globe}
                  label={t('bizWebsite')}
                  value={business.website.replace(/^https?:\/\//, '')}
                  href={business.website}
                  external
                />
              )}
              {business.instagram && (
                <InfoRow
                  icon={Instagram}
                  label={t('bizInstagram')}
                  value={`@${business.instagram.replace(/^@/, '')}`}
                  href={`https://instagram.com/${business.instagram.replace(/^@/, '')}`}
                  external
                />
              )}
              {business.facebook && (
                <InfoRow
                  icon={Facebook}
                  label={t('bizFacebook')}
                  value={business.facebook.replace(/^https?:\/\/(www\.)?/, '')}
                  href={business.facebook.startsWith('http') ? business.facebook : `https://facebook.com/${business.facebook}`}
                  external
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Ubicación en Google Maps */}
        {hasMap && (
          <section className="mt-8">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
                <MapPin className="h-5 w-5 text-amber-600" /> {t('mapTitle')}
              </h2>
            </div>
            <MapPreview
              source={{
                lat: business.lat,
                lng: business.lng,
                address: business.address,
                locality: [
                  pick(lang, business.municipality.name, business.municipality.nameEn),
                  pick(lang, business.municipality.province.name, business.municipality.province.nameEn),
                  'Cuba',
                ].filter(Boolean).join(', '),
              }}
            />
          </section>
        )}

        {/* Catálogo */}
        <h2 className="mt-8 flex items-center gap-2 text-lg font-bold sm:text-xl">
          <Package className="h-5 w-5 text-amber-600" />
          {t('menu')}
          <span className="text-sm font-normal text-muted-foreground">
            ({business.products.length} {t('productsCount')})
          </span>
        </h2>

        {business.products.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t('productsEmpty')}</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {business.products.map((p) => (
              <Card key={p.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={pick(lang, p.name, p.nameEn)}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Package className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-snug">{pick(lang, p.name, p.nameEn)}</h3>
                    <span className="whitespace-nowrap font-bold text-amber-600">{formatPrice(p.price)}</span>
                  </div>
                  {pick(lang, p.description, p.descriptionEn) && (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {pick(lang, p.description, p.descriptionEn)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
