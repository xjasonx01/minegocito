// Utilidades de Google Maps para la vista previa y el enlace de ubicación.
// Todo funciona sin API key: el embed usa output=embed y el enlace
// redirige a google.com/maps/search/?api=1&query=...

import type { Business } from '@/components/store/types'

// Extrae coordenadas de varias entradas posibles:
//  - "23.1136, -82.3666"
//  - enlace de Google Maps con @lat,lng o !3dlat!4dlng
export function parseLatLng(input: string | null | undefined): { lat: number; lng: number } | null {
  if (!input) return null
  const s = input.trim()

  // Par simple de números
  const pair = s.match(/^(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/)
  if (pair) {
    const lat = Number(pair[1])
    const lng = Number(pair[2])
    if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng }
    }
  }

  // Enlace con @lat,lng (google.com/maps/@23.11,-82.36,17z)
  const at = s.match(/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/)
  if (at) {
    const lat = Number(at[1])
    const lng = Number(at[2])
    if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng }
    }
  }

  // Enlace con !3dlat!4dlng (google.com/maps/place/.../!3d23.11!4d-82.36...)
  const place = s.match(/!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/)
  if (place) {
    const lat = Number(place[1])
    const lng = Number(place[2])
    if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng }
    }
  }

  return null
}

// Consulta que se le envía a Google Maps: coordenadas si hay, si no dirección
// y localidad (municipio, provincia, Cuba)
export function mapQuery(
  business: Pick<Business, 'lat' | 'lng' | 'address'>,
  locality?: string
): string {
  if (typeof business.lat === 'number' && typeof business.lng === 'number') {
    return `${business.lat},${business.lng}`
  }
  return [business.address, locality].filter(Boolean).join(', ')
}

// URL del iframe de vista previa (sin API key)
export function mapsEmbedUrl(query: string): string | null {
  const q = query.trim()
  if (!q) return null
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
}

// URL que abre Google Maps con la ubicación exacta
export function mapsLinkUrl(query: string): string | null {
  const q = query.trim()
  if (!q) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}
