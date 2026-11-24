'use client'

// Apartado "Publica tu negocio": explica cómo alojar servicios en el sitio,
// permite contactar al desarrollador y da acceso al panel del dueño.

import { useState } from 'react'
import {
  KeyRound, Loader2, Mail, MapPin, MessageCircle, Rocket, Send, Store,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useLang } from '@/lib/lang-context'
import { navigate } from '@/components/store/ui-bits'

type Props = {
  siteName: string
  settings?: Record<string, string>
}

export function JoinView({ siteName, settings }: Props) {
  const { lang, t } = useLang()
  const { toast } = useToast()
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ name: '', contact: '', message: '' })

  const devPhone = (settings?.contactPhone || '').replace(/[^0-9+]/g, '').replace(/^\+/, '')
  const devEmail = settings?.contactEmail || ''
  const devTelegram = (settings?.telegram || '').replace(/^@/, '')

  const steps = [
    { icon: MessageCircle, title: t('joinStep1'), text: t('joinStep1Text') },
    { icon: KeyRound, title: t('joinStep2'), text: t('joinStep2Text') },
    { icon: Store, title: t('joinStep3'), text: t('joinStep3Text') },
  ]

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault()
    if (sending) return
    setSending(true)
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, kind: 'join' }),
      })
      if (res.ok) {
        toast({ description: t('joinSent') })
        setForm({ name: '', contact: '', message: '' })
      } else {
        toast({ description: t('errorSaving'), variant: 'destructive' })
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Portada */}
      <section className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 px-4 py-12 text-white sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
            <Rocket className="h-4 w-4" /> {t('publishCta')}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t('joinHeroTag')}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-white/90">
            {lang === 'en'
              ? `Any business can host its services on ${siteName}: digital catalog, direct contacts and Google Maps location.`
              : `Cualquier negocio puede alojar sus servicios en ${siteName}: catálogo digital, contactos directos y ubicación en Google Maps.`}
          </p>
        </div>
      </section>

      {/* Pasos */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <Card key={s.title} className="relative overflow-hidden">
              <CardContent className="p-6">
                <span className="absolute right-4 top-3 text-5xl font-black text-amber-500/10" aria-hidden>
                  {i + 1}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/60">
                  <s.icon className="h-5.5 w-5.5 text-amber-600" />
                </div>
                <h2 className="mt-3 font-bold">{s.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contacto directo con el desarrollador */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-10">
        <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/30">
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h2 className="flex items-center gap-2 font-bold">
                <MessageCircle className="h-5 w-5 text-amber-600" /> {t('devContactTitle')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('devContactText')}
                {devEmail && (
                  <>
                    {' '}
                    <a className="font-medium text-amber-700 underline underline-offset-2 dark:text-amber-400" href={`mailto:${devEmail}`}>
                      {devEmail}
                    </a>
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {devPhone && (
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                  <a
                    href={`https://wa.me/${devPhone}?text=${encodeURIComponent(
                      lang === 'en'
                        ? `Hi! I want to list my business on ${siteName}`
                        : `¡Hola! Quiero publicar mi negocio en ${siteName}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              )}
              {devTelegram && (
                <Button asChild className="bg-sky-600 hover:bg-sky-700">
                  <a
                    href={`https://t.me/${devTelegram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Send className="mr-2 h-4 w-4" /> Telegram
                  </a>
                </Button>
              )}
              {devEmail && (
                <Button asChild variant="outline">
                  <a href={`mailto:${devEmail}?subject=${encodeURIComponent(t('publishCta') + ' — ' + siteName)}`}>
                    <Mail className="mr-2 h-4 w-4" /> {lang === 'en' ? 'Email' : 'Correo'}
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Solicitud + acceso existente */}
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-14 lg:grid-cols-2">
        {/* Formulario de solicitud */}
        <Card>
          <CardContent className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Send className="h-5 w-5 text-amber-600" /> {t('joinFormTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('joinFormText')}</p>
            <form className="mt-4 space-y-3" onSubmit={submitRequest}>
              <div className="space-y-1.5">
                <Label htmlFor="join-name">{t('yourName')} *</Label>
                <Input
                  id="join-name"
                  required
                  placeholder={lang === 'en' ? 'Your name or your business' : 'Tu nombre o el de tu negocio'}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="join-contact">{t('yourContact')} *</Label>
                <Input
                  id="join-contact"
                  required
                  placeholder={lang === 'en' ? 'Email or phone' : 'Correo o teléfono'}
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="join-message">{t('yourMessage')} *</Label>
                <Textarea
                  id="join-message"
                  required
                  rows={4}
                  placeholder={
                    lang === 'en'
                      ? 'Tell us about your business: what you offer, where you are...'
                      : 'Cuéntanos de tu negocio: qué ofertas, dónde estás...'
                  }
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={sending}>
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {t('send')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Acceso para dueños */}
        <Card className="flex flex-col justify-between">
          <CardContent className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <KeyRound className="h-5 w-5 text-amber-600" /> {t('joinLoginTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('joinLoginText')}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li className="flex items-start gap-2.5">
                <Store className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                {lang === 'en' ? 'Manage your business info anytime' : 'Gestiona la información de tu negocio cuando quieras'}
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                {lang === 'en' ? 'Google Maps location with one-tap directions' : 'Ubicación en Google Maps con direcciones a un toque'}
              </li>
              <li className="flex items-start gap-2.5">
                <Store className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                {lang === 'en' ? 'Publish your product catalog with prices' : 'Publica tu catálogo de productos con precios'}
              </li>
            </ul>
          </CardContent>
          <CardContent className="pt-0">
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700"
              onClick={() => navigate({ view: 'owner' })}
            >
              <KeyRound className="mr-2 h-4 w-4" /> {t('joinLogin')}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
