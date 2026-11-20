'use client'

// Vista previa de Google Maps sin API key.
// Todo el bloque es un enlace: al hacer clic se abre Google Maps con la
// ubicación exacta del negocio en una pestaña nueva.

import { ExternalLink, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLang } from '@/lib/lang-context'
import { mapQuery, mapsEmbedUrl, mapsLinkUrl } from '@/components/store/maps'
import type { Business } from '@/components/store/types'

type MapSource = Pick<Business, 'lat' | 'lng' | 'address'> & { locality?: string }

export function MapPreview({
  source,
  heightClass = 'h-64 sm:h-72',
  showHint = true,
}: {
  source: MapSource
  heightClass?: string
  showHint?: boolean
}) {
  const { t } = useLang()
  const query = mapQuery({ lat: source.lat, lng: source.lng, address: source.address }, source.locality)
  const embed = mapsEmbedUrl(query)
  const link = mapsLinkUrl(query)

  if (!embed || !link) {
    return (
      <div className={`flex ${heightClass} w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 p-4 text-center`}>
        <MapPin className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {t('coordinatesHint')}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className={`relative w-full overflow-hidden rounded-lg border bg-muted ${heightClass}`}>
        <iframe
          src={embed}
          title={t('mapTitle')}
          className="h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        {/* Capa de clic: redirige a Google Maps con la dirección exacta */}
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 cursor-pointer"
          aria-label={t('openInMaps')}
        />
        <Button asChild size="sm" className="absolute bottom-3 right-3 shadow-md">
          <a href={link} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> {t('openInMaps')}
          </a>
        </Button>
      </div>
      {showHint && <p className="mt-1.5 text-xs text-muted-foreground">{t('mapHint')}</p>}
    </div>
  )
}
