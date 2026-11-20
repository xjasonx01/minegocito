'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Mail, MessageCircle, PlusCircle, Send, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { LangProvider, useLang } from '@/lib/lang-context'
import { navigate, useHashRoute } from '@/components/store/ui-bits'
import { HomeView } from '@/components/store/home-view'
import { ListView, type Filters } from '@/components/store/list-view'
import { BusinessView } from '@/components/store/business-view'
import { JoinView } from '@/components/store/join-view'
import { OwnerView } from '@/components/store/owner-view'
import { DevView } from '@/components/store/dev-view'
import { type PublicData } from '@/components/store/types'

export default function Page() {
  return (
    <LangProvider>
      <AppShell />
    </LangProvider>
  )
}

function AppShell() {
  const { lang, setLang, t } = useLang()
  const route = useHashRoute()
  const [data, setData] = useState<PublicData | null>(null)
  const [error, setError] = useState(false)
  const [filters, setFilters] = useState<Filters>({ q: '' })
  const hasData = useRef(false)

  // Carga (o recarga) los datos públicos del directorio. Se ejecuta al montar
  // y en cada cambio de vista para que el inicio, el listado y las fichas
  // reflejen siempre lo último (p. ej. un negocio recién creado en el panel).
  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/public/data', { cache: 'no-store' })
      if (!res.ok) throw new Error('fetch_failed')
      const json = (await res.json()) as PublicData
      hasData.current = true
      setData(json)
      setError(false)
    } catch {
      // Solo muestra la pantalla de error si aún no hay nada que mostrar;
      // si falla una recarga, se conserva el contenido ya cargado.
      if (!hasData.current) setError(true)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, route.view])

  const siteName = data?.settings.siteName || 'Minegocito'

  const openBusiness = useCallback((slug: string) => navigate({ view: 'business', slug }), [])
  const explore = useCallback((f: { categorySlug?: string; provinceSlug?: string; municipalitySlug?: string; q?: string }) => {
    setFilters({
      q: f.q ?? '',
      categorySlug: f.categorySlug,
      provinceSlug: f.provinceSlug,
      municipalitySlug: f.municipalitySlug,
    })
    navigate({ view: 'list' })
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Cabecera */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <button
            type="button"
            className="flex items-center gap-2 font-extrabold tracking-tight"
            onClick={() => navigate({ view: 'home' })}
            aria-label={siteName}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <Store className="h-4.5 w-4.5" />
            </span>
            <span className="text-lg">{siteName}</span>
          </button>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
            <Button variant="ghost" size="sm" onClick={() => navigate({ view: 'home' })}>
              {lang === 'en' ? 'Home' : 'Inicio'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate({ view: 'list' })}>
              {lang === 'en' ? 'Businesses' : 'Negocios'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setLang(lang === 'es' ? 'en' : 'es')} aria-label="Language">
              {t('langLabel')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-600 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
              onClick={() => navigate({ view: 'join' })}
            >
              <PlusCircle className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">{t('publishCta')}</span>
            </Button>
          </nav>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1">
        {error && route.view !== 'owner' && route.view !== 'dev' ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
            <p className="text-muted-foreground">{lang === 'en' ? 'Could not load data.' : 'No se pudieron cargar los datos.'}</p>
            <Button variant="outline" onClick={() => void load()}>{lang === 'en' ? 'Retry' : 'Reintentar'}</Button>
          </div>
        ) : route.view === 'home' || route.view === 'list' || route.view === 'business' ? (
          !data ? (
            <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
              <Skeleton className="h-40 w-full rounded-xl" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-56 w-full rounded-xl" />
                ))}
              </div>
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
              </div>
            </div>
          ) : route.view === 'home' ? (
            <HomeView data={data} onOpenBusiness={openBusiness} onExplore={explore} />
          ) : route.view === 'list' ? (
            <ListView data={data} filters={filters} setFilters={setFilters} onOpenBusiness={openBusiness} />
          ) : (
            (() => {
              const biz = data.businesses.find((b) => b.slug === route.slug)
              if (!biz) {
                return (
                  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
                    <p className="text-muted-foreground">{t('noResults')}</p>
                    <Button variant="outline" onClick={() => navigate({ view: 'list' })}>{t('allBusinesses')}</Button>
                  </div>
                )
              }
              return <BusinessView business={biz} onBack={() => navigate({ view: 'list' })} />
            })()
          )
        ) : route.view === 'join' ? (
          <JoinView siteName={siteName} settings={data?.settings} />
        ) : route.view === 'owner' ? (
          <OwnerView onDataChanged={load} />
        ) : route.view === 'dev' ? (
          <DevView />
        ) : (
          null
        )}
      </main>

      {/* Pie pegado abajo */}
      <footer className="mt-auto border-t bg-muted/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 pb-8 sm:py-10">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-extrabold">{siteName}</p>
              <p className="text-sm text-muted-foreground">{t('footerText')}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              {/* Solo los iconos de cada aplicación de contacto, cada uno con
                  su hipervínculo (WhatsApp, Telegram y correo). */}
              <div className="flex items-center gap-2.5">
                {data?.settings.contactPhone && (
                  <a
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition-colors hover:bg-emerald-700"
                    href={`https://wa.me/${data.settings.contactPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    title="WhatsApp"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                )}
                {data?.settings.telegram && (
                  <a
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm transition-colors hover:bg-sky-700"
                    href={`https://t.me/${data.settings.telegram.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Telegram"
                    title="Telegram"
                  >
                    <Send className="h-5 w-5" />
                  </a>
                )}
                {data?.settings.contactEmail && (
                  <a
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-white shadow-sm transition-colors hover:bg-amber-700"
                    href={`mailto:${data.settings.contactEmail}`}
                    aria-label={lang === 'en' ? 'Email' : 'Correo'}
                    title={lang === 'en' ? 'Email' : 'Correo'}
                  >
                    <Mail className="h-5 w-5" />
                  </a>
                )}
              </div>
              <button
                type="button"
                className="mt-2 font-medium text-amber-600 hover:text-amber-700 hover:underline"
                onClick={() => navigate({ view: 'join' })}
              >
                {t('publishCta')}
              </button>
            </div>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">© {new Date().getFullYear()} {siteName}</p>
        </div>
      </footer>
    </div>
  )
}
