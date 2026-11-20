'use client'

// Panel privado del desarrollador. No aparece en ningún menú del sitio:
// solo se abre entrando manualmente a /#/desarrollador.
// Aquí el desarrollador ve las solicitudes de negocios, crea las cuentas de
// acceso para los dueños ("dar acceso"), gestiona los negocios y los ajustes.

import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft, Building2, Crown, KeyRound, Loader2, MapPin, MessageSquarePlus,
  Package, Settings, Shield, Store, Trash2, TrendingUp, UserRoundPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useLang } from '@/lib/lang-context'
import { navigate } from '@/components/store/ui-bits'
import { pick, type AdminData } from '@/components/store/types'

// ---------- cliente API ----------
async function api<T = Record<string, unknown>>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) throw new Error(String(json.error || `http_${res.status}`))
  return json as T
}

type OwnerRow = {
  id: string
  email: string
  name: string | null
  active: boolean
  businessId: string | null
  businessName: string | null
  businessSlug: string | null
  createdAt: string
}

type Tab = 'resumen' | 'solicitudes' | 'negocios' | 'duenos' | 'ajustes'

export function DevView() {
  const { t } = useLang()
  const { toast } = useToast()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [email, setEmail] = useState('')
  const [data, setData] = useState<AdminData | null>(null)
  const [owners, setOwners] = useState<OwnerRow[]>([])
  const [tab, setTab] = useState<Tab>('resumen')
  const [ownerDialog, setOwnerDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ kind: 'business' | 'message' | 'owner'; id: string; name: string } | null>(null)

  const reload = useCallback(async () => {
    try {
      const [d, o] = await Promise.all([
        api<AdminData>('/api/admin/data', 'GET'),
        api<{ owners: OwnerRow[] }>('/api/admin/owners', 'GET'),
      ])
      setData(d)
      setOwners(o.owners)
      setAuthed(true)
    } catch {
      setAuthed(false)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      await reload()
    })()
  }, [reload])

  async function confirmDelete() {
    if (!deleteTarget) return
    const { kind, id } = deleteTarget
    try {
      if (kind === 'business') await api(`/api/admin/businesses/${id}`, 'DELETE')
      if (kind === 'message') await api(`/api/admin/messages/${id}`, 'DELETE')
      if (kind === 'owner') await api(`/api/admin/owners/${id}`, 'DELETE')
      toast({ description: t('deletedOk') })
      setDeleteTarget(null)
      await reload()
    } catch {
      toast({ description: t('errorSaving'), variant: 'destructive' })
      setDeleteTarget(null)
    }
  }

  if (authed === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  if (!authed) {
    return (
      <DevLogin
        onOk={async (e) => {
          setAuthed(true)
          setEmail(e)
          await reload()
        }}
      />
    )
  }

  const messages = data?.messages || []
  const joinRequests = messages.filter((m) => m.kind === 'join')
  const unreadJoin = joinRequests.filter((m) => !m.read).length

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Shield className="h-6 w-6 text-amber-600" /> {t('devPanel')}
          </h1>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        <Button variant="outline" onClick={() => navigate({ view: 'home' })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('back')}
        </Button>
      </div>

      {/* Pestañas */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ['resumen', t('summary'), TrendingUp],
            ['solicitudes', t('messagesTab'), MessageSquarePlus],
            ['negocios', t('businessesTab'), Building2],
            ['duenos', t('ownersTab'), KeyRound],
            ['ajustes', t('settingsTab'), Settings],
          ] as [Tab, string, React.ComponentType<{ className?: string }>][]
        ).map(([key, label, Icon]) => (
          <Button key={key} variant={tab === key ? 'default' : 'outline'} size="sm" className={tab === key ? 'bg-amber-600 hover:bg-amber-700' : ''} onClick={() => setTab(key)}>
            <Icon className="mr-1.5 h-4 w-4" /> {label}
            {key === 'solicitudes' && unreadJoin > 0 && (
              <Badge className="ml-1.5 bg-red-600 text-white hover:bg-red-600">{unreadJoin}</Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Contenido */}
      {tab === 'resumen' && data && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: t('totalBusinesses'), value: data.businesses.length, Icon: Building2 },
            { label: t('totalProducts'), value: data.businesses.reduce((acc, b) => acc + b.products.length, 0), Icon: Package },
            { label: t('totalOwners'), value: owners.length, Icon: KeyRound },
            { label: t('totalMessages'), value: messages.length, sub: unreadJoin > 0 ? `${unreadJoin} ${t('unread')}` : undefined, Icon: MessageSquarePlus },
            { label: t('totalCategories'), value: data.categories.length, Icon: MapPin },
          ].map(({ label, value, sub, Icon }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Icon className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">
                    {label}
                    {sub ? ` · ${sub}` : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === 'solicitudes' && data && (
        <MessagesTab
          data={data}
          onReload={reload}
          onDelete={(id, name) => setDeleteTarget({ kind: 'message', id, name })}
        />
      )}

      {tab === 'negocios' && data && (
        <BusinessesTab
          data={data}
          onDelete={(b) => setDeleteTarget({ kind: 'business', id: b.id, name: b.name })}
          onReload={reload}
          toast={toast}
        />
      )}

      {tab === 'duenos' && (
        <OwnersTab
          owners={owners}
          onNew={() => setOwnerDialog(true)}
          onReload={reload}
          onDelete={(o) => setDeleteTarget({ kind: 'owner', id: o.id, name: o.email })}
          toast={toast}
        />
      )}

      {tab === 'ajustes' && data && <SettingsTab data={data} onReload={reload} />}

      {/* Diálogo: crear acceso de dueño */}
      {ownerDialog && (
        <OwnerDialog
          onClose={() => setOwnerDialog(false)}
          onSaved={async () => {
            setOwnerDialog(false)
            await reload()
          }}
        />
      )}

      {/* Confirmación de borrado */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTarget?.name}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------- Acceso ----------
function DevLogin({ onOk }: { onOk: (email: string) => Promise<void> }) {
  const { t } = useLang()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const r = await api<{ ok: true; email: string }>('/api/auth/login', 'POST', { email, password })
      await onOk(r.email)
    } catch {
      toast({ description: t('invalidCredentials'), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">
          <h1 className="flex items-center gap-2 text-lg font-bold">
            <Shield className="h-5 w-5 text-amber-600" /> {t('devLogin')}
          </h1>
          <form className="mt-4 space-y-3" onSubmit={submit}>
            <div className="space-y-1.5">
              <Label htmlFor="dev-email">{t('email')}</Label>
              <Input id="dev-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dev-pass">{t('password')}</Label>
              <Input id="dev-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('signIn')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------- Solicitudes y mensajes ----------
function MessagesTab({
  data, onReload, onDelete,
}: {
  data: AdminData
  onReload: () => Promise<void>
  onDelete: (id: string, name: string) => void
}) {
  const { t } = useLang()
  const { toast } = useToast()
  const [filter, setFilter] = useState<'all' | 'join' | 'general'>('all')
  const messages = data.messages.filter((m) => filter === 'all' || m.kind === filter)

  async function markRead(id: string) {
    try {
      await api(`/api/admin/messages/${id}`, 'PUT', { read: true })
      await onReload()
    } catch {
      toast({ description: t('errorSaving'), variant: 'destructive' })
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap gap-2">
        {(
          [
            ['all', t('messagesTab')],
            ['join', t('publishCta')],
            ['general', t('contactTitle')],
          ] as ['all' | 'join' | 'general', string][]
        ).map(([key, label]) => (
          <Button key={key} variant={filter === key ? 'default' : 'outline'} size="sm" className={filter === key ? 'bg-amber-600 hover:bg-amber-700' : ''} onClick={() => setFilter(key)}>
            {label}
          </Button>
        ))}
      </div>
      <div className="max-h-[36rem] space-y-3 overflow-y-auto rounded-lg pr-1">
        {messages.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{t('noMessages')}</p>}
        {messages.map((m) => (
          <Card key={m.id} className={m.read ? '' : 'border-amber-300 bg-amber-50/50'}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                {!m.read && <Badge className="bg-red-600 text-white hover:bg-red-600">{t('unread')}</Badge>}
                {m.kind === 'join' && (
                  <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                    <MessageSquarePlus className="mr-1 h-3 w-3" /> {t('publishCta')}
                  </Badge>
                )}
                <h3 className="font-semibold">{m.name}</h3>
                <span className="text-sm text-muted-foreground">· {m.contact}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(m.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{m.message}</p>
              <div className="mt-3 flex gap-2">
                {!m.read && (
                  <Button variant="outline" size="sm" onClick={() => void markRead(m.id)}>
                    {t('markRead')}
                  </Button>
                )}
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => onDelete(m.id, m.name)}>
                  <Trash2 className="mr-1.5 h-4 w-4" /> {t('delete')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ---------- Negocios (activar/destacar/eliminar) ----------
function BusinessesTab({
  data, onDelete, onReload, toast,
}: {
  data: AdminData
  onDelete: (b: AdminData['businesses'][number]) => void
  onReload: () => Promise<void>
  toast: ReturnType<typeof useToast>['toast']
}) {
  const { lang, t } = useLang()

  async function patch(id: string, payload: Record<string, unknown>) {
    try {
      await api(`/api/admin/businesses/${id}`, 'PUT', payload)
      await onReload()
    } catch {
      toast({ description: t('errorSaving'), variant: 'destructive' })
    }
  }

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-lg font-bold">{t('businessesTab')}</h2>
      <div className="max-h-[36rem] space-y-3 overflow-y-auto rounded-lg pr-1">
        {data.businesses.map((b) => (
          <Card key={b.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">{pick(lang, b.name, b.nameEn)}</h3>
                  {b.featured && (
                    <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                      <Crown className="mr-1 h-3 w-3" /> {t('featuredLabel')}
                    </Badge>
                  )}
                  {!b.active && <Badge variant="secondary">OFF</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pick(lang, b.category.name, b.category.nameEn)} · {pick(lang, b.municipality.name, b.municipality.nameEn)}, {pick(lang, b.municipality.province.name, b.municipality.province.nameEn)} · {b.products.length} {t('productsCount')}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-medium">
                  <Switch checked={b.active} onCheckedChange={(v) => void patch(b.id, { active: v })} /> {t('activeLabel')}
                </label>
                <label className="flex items-center gap-2 text-xs font-medium">
                  <Switch checked={b.featured} onCheckedChange={(v) => void patch(b.id, { featured: v })} /> <Crown className="h-3.5 w-3.5 text-amber-600" />
                </label>
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => onDelete(b)}>
                  <Trash2 className="mr-1.5 h-4 w-4" /> {t('delete')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ---------- Dueños (cuentas de acceso) ----------
function OwnersTab({
  owners, onNew, onReload, onDelete, toast,
}: {
  owners: OwnerRow[]
  onNew: () => void
  onReload: () => Promise<void>
  onDelete: (o: OwnerRow) => void
  toast: ReturnType<typeof useToast>['toast']
}) {
  const { t } = useLang()

  async function toggle(o: OwnerRow) {
    try {
      await api(`/api/admin/owners/${o.id}`, 'PUT', { active: !o.active })
      await onReload()
    } catch {
      toast({ description: t('errorSaving'), variant: 'destructive' })
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{t('ownersTab')}</h2>
        <Button className="bg-amber-600 hover:bg-amber-700" onClick={onNew}>
          <UserRoundPlus className="mr-2 h-4 w-4" /> {t('newOwner')}
        </Button>
      </div>
      <div className="max-h-[36rem] space-y-3 overflow-y-auto rounded-lg pr-1">
        {owners.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">{t('ownerNoBusinessYet')}</p>
        )}
        {owners.map((o) => (
          <Card key={o.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">{o.name || o.email}</h3>
                  {!o.active && <Badge variant="secondary">{t('accessDeactivated')}</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {o.email} ·{' '}
                  {o.businessName ? (
                    <span>
                      <Store className="mr-1 inline h-3 w-3 text-amber-600" />
                      {o.businessName}
                    </span>
                  ) : (
                    t('ownerNoBusinessYet')
                  )}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => void toggle(o)}>
                  {o.active ? t('deactivate') : t('activate')}
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => onDelete(o)}>
                  <Trash2 className="mr-1.5 h-4 w-4" /> {t('delete')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ---------- Diálogo: crear cuenta de dueño ----------
function OwnerDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => Promise<void> }) {
  const { t } = useLang()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      await api('/api/admin/owners', 'POST', form)
      toast({ description: t('ownerCreatedOk') })
      await onSaved()
    } catch (err) {
      const msg = String(err)
      toast({
        description: msg.includes('email_taken') ? t('ownerEmailTaken') : t('errorSaving'),
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRoundPlus className="h-5 w-5 text-amber-600" /> {t('newOwner')}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="new-owner-name">{t('ownerNameLabel')}</Label>
            <Input id="new-owner-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-owner-email">{t('email')} *</Label>
            <Input id="new-owner-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-owner-pass">{t('ownerPass')} *</Label>
            <Input id="new-owner-pass" type="text" autoComplete="off" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Ajustes del sitio + contraseña del desarrollador ----------
function SettingsTab({ data, onReload }: { data: AdminData; onReload: () => Promise<void> }) {
  const { t } = useLang()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(() => ({
    siteName: data.settings.siteName || '',
    tagline: data.settings.tagline || '',
    taglineEn: data.settings.taglineEn || '',
    contactEmail: data.settings.contactEmail || '',
    contactPhone: data.settings.contactPhone || '',
    telegram: data.settings.telegram || '',
  }))
  const [pass, setPass] = useState({ currentPassword: '', newPassword: '' })

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      await api('/api/admin/settings', 'PUT', { settings: form })
      toast({ description: t('savedOk') })
      await onReload()
    } catch {
      toast({ description: t('errorSaving'), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api('/api/auth/change-password', 'POST', pass)
      toast({ description: t('passwordChanged') })
      setPass({ currentPassword: '', newPassword: '' })
    } catch {
      toast({ description: t('errorSaving'), variant: 'destructive' })
    }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Settings className="h-5 w-5 text-amber-600" /> {t('settingsTab')}
          </h2>
          <form className="mt-4 space-y-3" onSubmit={saveSettings}>
            <div className="space-y-1.5">
              <Label htmlFor="set-name">{t('siteName')}</Label>
              <Input id="set-name" value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-tag">{t('tagline')}</Label>
              <Input id="set-tag" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-tagen">{t('taglineEn')}</Label>
              <Input id="set-tagen" value={form.taglineEn} onChange={(e) => setForm({ ...form, taglineEn: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="set-mail">{t('contactEmail')}</Label>
                <Input id="set-mail" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="set-phone">{t('contactPhone')}</Label>
                <Input id="set-phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="set-tg">{t('contactTelegram')}</Label>
                <Input id="set-tg" placeholder="@usuario" value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} />
              </div>
            </div>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('save')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <KeyRound className="h-5 w-5 text-amber-600" /> {t('changePassword')}
          </h2>
          <form className="mt-4 space-y-3" onSubmit={changePassword}>
            <div className="space-y-1.5">
              <Label htmlFor="dev-cur">{t('currentPassword')}</Label>
              <Input id="dev-cur" type="password" autoComplete="current-password" value={pass.currentPassword} onChange={(e) => setPass({ ...pass, currentPassword: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dev-new">{t('newPassword')}</Label>
              <Input id="dev-new" type="password" autoComplete="new-password" minLength={8} value={pass.newPassword} onChange={(e) => setPass({ ...pass, newPassword: e.target.value })} required />
            </div>
            <Button type="submit" variant="outline">
              <KeyRound className="mr-2 h-4 w-4" /> {t('changePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
