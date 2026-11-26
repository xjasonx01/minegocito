'use client'

// Panel del dueño de negocio: con las credenciales que entrega el
// desarrollador, el dueño crea su negocio (nombre, ubicación, contactos,
// horarios, portada) y administra su catálogo de productos.

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check, ClipboardList, ExternalLink, Loader2, Lock, MapPin, Package, Pencil, Plus,
  Settings2, Store, Trash2, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useLang } from '@/lib/lang-context'
import { ImageUpload } from '@/components/store/image-upload'
import { MapPreview } from '@/components/store/map-preview'
import { parseLatLng } from '@/components/store/maps'
import { navigate } from '@/components/store/ui-bits'
import { formatPrice, pick, type Business, type Category, type Product, type Province } from '@/components/store/types'

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

type OwnerMeData = {
  owner: { email: string; name: string | null }
  business: Business | null
  categories: Category[]
  provinces: Province[]
}

export function OwnerView({ onDataChanged }: { onDataChanged?: () => void | Promise<void> }) {
  const { t } = useLang()
  const { toast } = useToast()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [data, setData] = useState<OwnerMeData | null>(null)

  const reload = useCallback(async () => {
    try {
      const d = await api<OwnerMeData>('/api/owner/me', 'GET')
      setData(d)
      setAuthed(true)
    } catch {
      setAuthed(false)
      return
    }
    // Mantén sincronizados el inicio, el listado y las fichas públicas con
    // los cambios que hace el dueño (crear/editar negocio, productos, etc.).
    try {
      await onDataChanged?.()
    } catch {
      // Si la recarga pública falla, se volverá a intentar al cambiar de vista.
    }
  }, [onDataChanged])

  useEffect(() => {
    void reload()
  }, [reload])

  async function doLogout() {
    try {
      await api('/api/auth/owner/logout', 'POST')
    } finally {
      setAuthed(false)
      setData(null)
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
      <OwnerLogin
        onOk={async () => {
          setAuthed(true)
          await reload()
        }}
        toast={toast}
        t={t}
      />
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <OwnerDashboard
      data={data}
      reload={reload}
      onLogout={doLogout}
      toast={toast}
      t={t}
    />
  )
}

// ---------- Acceso ----------
function OwnerLogin({
  onOk,
  toast,
  t,
}: {
  onOk: () => Promise<void>
  toast: ReturnType<typeof useToast>['toast']
  t: (key: Parameters<ReturnType<typeof useLang>['t']>[0]) => string
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      await api('/api/auth/owner/login', 'POST', { email, password })
      await onOk()
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
            <Store className="h-5 w-5 text-amber-600" /> {t('ownerPanel')}
          </h1>
          <form className="mt-4 space-y-3" onSubmit={submit}>
            <div className="space-y-1.5">
              <Label htmlFor="owner-email">{t('email')}</Label>
              <Input id="owner-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner-pass">{t('password')}</Label>
              <Input id="owner-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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

// ---------- Panel principal ----------
function OwnerDashboard({
  data, reload, onLogout, toast, t,
}: {
  data: OwnerMeData
  reload: () => Promise<void>
  onLogout: () => Promise<void>
  toast: ReturnType<typeof useToast>['toast']
  t: (key: Parameters<ReturnType<typeof useLang>['t']>[0]) => string
}) {
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [productDialog, setProductDialog] = useState<{ open: boolean; editing: Product | null }>({ open: false, editing: null })

  const business = data.business

  async function confirmDeleteProduct() {
    if (!deleteProduct) return
    try {
      await api(`/api/owner/products/${deleteProduct.id}`, 'DELETE')
      toast({ description: t('deletedOk') })
      setDeleteProduct(null)
      await reload()
    } catch {
      toast({ description: t('errorSaving'), variant: 'destructive' })
      setDeleteProduct(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Store className="h-6 w-6 text-amber-600" /> {t('ownerPanel')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('ownerGreeting')}, {data.owner.name || data.owner.email}
          </p>
        </div>
        <div className="flex gap-2">
          {business && (
            <Button variant="outline" onClick={() => navigate({ view: 'business', slug: business.slug })}>
              <ExternalLink className="mr-2 h-4 w-4" /> {t('ownerViewBusiness')}
            </Button>
          )}
          <Button variant="destructive" onClick={() => void onLogout()}>
            {t('ownerLogout')}
          </Button>
        </div>
      </div>

      {!business ? (
        <>
          <Card className="mt-6 border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/30">
            <CardContent className="flex items-start gap-3 p-5">
              <Store className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-sm leading-relaxed">{t('ownerNoBusiness')}</p>
            </CardContent>
          </Card>
          <BusinessForm
            categories={data.categories}
            provinces={data.provinces}
            onSaved={async () => {
              toast({ description: t('ownerCreated') })
              await reload()
            }}
            toast={toast}
            t={t}
          />
        </>
      ) : (
        <>
          {/* Estado del negocio */}
          <Card className="mt-6">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-bold">{business.name}</h2>
                  {business.active ? (
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">{t('ownerVisible')}</Badge>
                  ) : (
                    <Badge variant="secondary">OFF</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pick('es', business.category.name, business.category.nameEn)} · {pick('es', business.municipality.name, business.municipality.nameEn)}, {pick('es', business.municipality.province.name, business.municipality.province.nameEn)} · /negocio/{business.slug}
                </p>
              </div>
              <label className="flex shrink-0 items-center gap-2 text-sm font-medium">
                <Switch
                  checked={business.active}
                  onCheckedChange={async (v) => {
                    try {
                      await api('/api/owner/business', 'PUT', { active: v })
                      toast({ description: t('savedOk') })
                      await reload()
                    } catch {
                      toast({ description: t('errorSaving'), variant: 'destructive' })
                    }
                  }}
                />
                {t('ownerVisible')}
              </label>
            </CardContent>
          </Card>

          {/* Bandeja de pedidos: los compradores que pulsan "Comprar por WhatsApp" */}
          <OrdersCard onChanged={reload} toast={toast} t={t} />

          {/* Formulario de edición */}
          <BusinessForm
            key={business.id + String(business.updatedAt)}
            business={business}
            categories={data.categories}
            provinces={data.provinces}
            onSaved={async () => {
              toast({ description: t('ownerSaved') })
              await reload()
            }}
            toast={toast}
            t={t}
          />

          {/* Catálogo */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Package className="h-5 w-5 text-amber-600" /> {t('ownerProducts')}
                </h2>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setProductDialog({ open: true, editing: null })}>
                  <Plus className="mr-1.5 h-4 w-4" /> {t('addProduct')}
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                {business.products.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">{t('productsEmpty')}</p>
                )}
                {business.products.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(p.price)} ·{' '}
                        {p.stock == null
                          ? t('stockUnique')
                          : p.stock === 0
                            ? t('stockSoldOut')
                            : `${t('stockAvailableLabel')}: ${p.stock}`}
                      </p>
                    </div>
                    {!p.active && <Badge variant="secondary">OFF</Badge>}
                    <Button variant="outline" size="sm" onClick={() => setProductDialog({ open: true, editing: p })} aria-label={t('edit')}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-400" onClick={() => setDeleteProduct(p)} aria-label={t('delete')}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Cuenta */}
      <AccountCard toast={toast} t={t} />

      {/* Diálogo de producto */}
      {productDialog.open && (
        <ProductFormDialog
          product={productDialog.editing}
          onClose={() => setProductDialog({ open: false, editing: null })}
          onSaved={async () => {
            setProductDialog({ open: false, editing: null })
            toast({ description: t('savedOk') })
            await reload()
          }}
          toast={toast}
          t={t}
        />
      )}

      {/* Confirmación de borrado */}
      <AlertDialog open={!!deleteProduct} onOpenChange={(o) => !o && setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteProduct?.name}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDeleteProduct}>
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------- Bandeja de pedidos ----------
// Los pedidos llegan cuando un comprador pulsa "Comprar por WhatsApp":
// el navegador del comprador los registra en /api/public/orders y aquí
// el dueño los marca como concretados (descuenta el stock del catálogo)
// o descartados (no toca el stock).
type OrderItemRow = { productId: string; name: string; price: number; qty: number }

type OrderRow = {
  id: string
  items: string
  total: number
  buyerName: string | null
  buyerNote: string | null
  status: string
  createdAt: string
}

function parseOrderItems(raw: string): OrderItemRow[] {
  try {
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return []
    return arr
      .filter(
        (i): i is OrderItemRow =>
          !!i && typeof i === 'object' && typeof (i as OrderItemRow).productId === 'string',
      )
      .map((i) => ({
        productId: i.productId,
        name: typeof i.name === 'string' ? i.name : '',
        price: typeof i.price === 'number' ? i.price : 0,
        qty: Math.max(1, Math.round(Number(i.qty) || 1)),
      }))
  } catch {
    return []
  }
}

const ORDER_STATUS_BADGE: Record<string, string> = {
  pendiente: 'bg-amber-500 text-white hover:bg-amber-500',
  concretado: 'bg-emerald-600 text-white hover:bg-emerald-600',
  cancelado: 'bg-muted text-muted-foreground hover:bg-muted',
}

function OrdersCard({
  onChanged, toast, t,
}: {
  onChanged: () => Promise<void>
  toast: ReturnType<typeof useToast>['toast']
  t: (key: Parameters<ReturnType<typeof useLang>['t']>[0]) => string
}) {
  const { lang } = useLang()
  const [orders, setOrders] = useState<OrderRow[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmOrder, setConfirmOrder] = useState<OrderRow | null>(null)

  const load = useCallback(async () => {
    try {
      const d = await api<{ orders: OrderRow[] }>('/api/owner/orders', 'GET')
      setOrders(d.orders)
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }, [])

  // Primer fetch al montar: setState ocurre solo en los callbacks (tras el
  // await), nunca de forma síncrona dentro del efecto. `alive` evita pintar
  // estado si el componente se desmontó antes de la respuesta.
  useEffect(() => {
    let alive = true
    api<{ orders: OrderRow[] }>('/api/owner/orders', 'GET')
      .then((d) => {
        if (alive) {
          setOrders(d.orders)
          setFailed(false)
        }
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [])

  async function mark(id: string, action: 'concretado' | 'cancelado') {
    if (busyId) return
    setBusyId(id)
    try {
      await api(`/api/owner/orders/${id}`, 'PATCH', { action })
      toast({ description: action === 'concretado' ? t('orderDoneOk') : t('orderCancelledOk') })
      setConfirmOrder(null)
      await load()
      // Concretar descuenta stock: sincroniza el catálogo y las fichas públicas.
      if (action === 'concretado') await onChanged()
    } catch {
      toast({ description: t('errorSaving'), variant: 'destructive' })
    } finally {
      setBusyId(null)
    }
  }

  const pendingCount = (orders ?? []).filter((o) => o.status === 'pendiente').length

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <ClipboardList className="h-5 w-5 text-amber-600" /> {t('ordersTitle')}
          {pendingCount > 0 && (
            <Badge className="bg-amber-500 text-white hover:bg-amber-500">{pendingCount}</Badge>
          )}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('ordersHint')}</p>

        <div className="mt-4 space-y-3">
          {failed && (
            <p className="py-4 text-center text-sm text-muted-foreground">{t('ordersLoadError')}</p>
          )}
          {orders && orders.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">{t('ordersEmpty')}</p>
          )}
          {(orders ?? []).map((o) => {
            const items = parseOrderItems(o.items)
            const when = new Date(o.createdAt).toLocaleString(lang === 'en' ? 'en-US' : 'es-CU', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })
            const statusLabel =
              o.status === 'concretado'
                ? t('orderStatusDone')
                : o.status === 'cancelado'
                  ? t('orderStatusCancelled')
                  : t('orderStatusPending')
            return (
              <div key={o.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className={ORDER_STATUS_BADGE[o.status] ?? ORDER_STATUS_BADGE.cancelado}>
                      {statusLabel}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{when}</span>
                  </div>
                  <span className="text-sm font-bold text-amber-600">{formatPrice(o.total)}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {items.map((i) => (
                    <li key={i.productId} className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate">
                        {i.qty} × {i.name || t('products')}
                      </span>
                      <span className="shrink-0 text-muted-foreground">{formatPrice(i.price * i.qty)}</span>
                    </li>
                  ))}
                </ul>
                {(o.buyerName || o.buyerNote) && (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {o.buyerName && (
                      <span>
                        {t('orderBuyer')}: {o.buyerName}
                        {o.buyerNote ? '. ' : ''}
                      </span>
                    )}
                    {o.buyerNote && (
                      <span>
                        {t('orderNoteLabel')}: {o.buyerNote}
                      </span>
                    )}
                  </p>
                )}
                {o.status === 'pendiente' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={!!busyId}
                      onClick={() => setConfirmOrder(o)}
                    >
                      <Check className="mr-1.5 h-4 w-4" /> {t('orderMarkDone')}
                    </Button>
                    <Button size="sm" variant="outline" disabled={!!busyId} onClick={() => void mark(o.id, 'cancelado')}>
                      <X className="mr-1.5 h-4 w-4" /> {t('orderMarkCancelled')}
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>

      {/* Confirmación al concretar: es la acción que descuenta el stock */}
      <AlertDialog open={!!confirmOrder} onOpenChange={(o) => !o && setConfirmOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('orderConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('orderConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!!busyId}
              onClick={() => confirmOrder && void mark(confirmOrder.id, 'concretado')}
            >
              {t('orderMarkDone')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

// ---------- Formulario de negocio (crear/editar) ----------
function BusinessForm({
  business, categories, provinces, onSaved, toast, t,
}: {
  business?: Business
  categories: Category[]
  provinces: Province[]
  onSaved: () => Promise<void>
  toast: ReturnType<typeof useToast>['toast']
  t: (key: Parameters<ReturnType<typeof useLang>['t']>[0]) => string
}) {
  const [busy, setBusy] = useState(false)
  const [coordsInput, setCoordsInput] = useState(
    business?.lat != null && business?.lng != null ? `${business.lat}, ${business.lng}` : ''
  )
  const [form, setForm] = useState(() => ({
    name: business?.name ?? '',
    description: business?.description ?? '',
    categoryId: business?.categoryId ?? '',
    provinceId: business?.municipality.province.id ?? '',
    municipalityId: business?.municipalityId ?? '',
    address: business?.address ?? '',
    phone: business?.phone ?? '',
    whatsapp: business?.whatsapp ?? '',
    email: business?.email ?? '',
    website: business?.website ?? '',
    instagram: business?.instagram ?? '',
    facebook: business?.facebook ?? '',
    whatsappGroup: business?.whatsappGroup ?? '',
    telegramGroup: business?.telegramGroup ?? '',
    hours: business?.hours ?? '',
    coverUrl: business?.coverUrl ?? '',
    delivery: business?.delivery ?? false,
  }))

  const coords = useMemo(() => parseLatLng(coordsInput), [coordsInput])
  const selectedProvince = provinces.find((p) => p.id === form.provinceId)
  const municipalityName = selectedProvince?.municipalities.find(
    (m) => m.id === form.municipalityId
  )?.name
  const locality = [municipalityName, selectedProvince?.name, 'Cuba']
    .filter(Boolean)
    .join(', ')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!form.name || !form.description || !form.categoryId || !form.municipalityId) {
      toast({ description: t('errorSaving'), variant: 'destructive' })
      return
    }
    setBusy(true)
    try {
      const { provinceId: _provinceId, ...payloadFields } = form
      const payload = { ...payloadFields, lat: coords?.lat ?? null, lng: coords?.lng ?? null }
      if (business) {
        await api('/api/owner/business', 'PUT', payload)
      } else {
        await api('/api/owner/business', 'POST', payload)
      }
      await onSaved()
    } catch (err) {
      const msg = String(err)
      toast({
        description: msg.includes('invalid_category_or_municipality') ? t('errorSaving') : t('errorSaving'),
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          {business ? <Pencil className="h-5 w-5 text-amber-600" /> : <Store className="h-5 w-5 text-amber-600" />}
          {business ? t('ownerEdit') : t('ownerCreate')}
        </h2>

        <form className="mt-4 space-y-5" onSubmit={submit}>
          {/* Datos del negocio */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('bizInfo')}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="biz-name">{t('bizName')} *</Label>
                <Input id="biz-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={120} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('bizCategory')} *</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger aria-label={t('bizCategory')}><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{pick('es', c.name, c.nameEn)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('bizProvince')} *</Label>
                <Select
                  value={form.provinceId}
                  onValueChange={(v) => setForm({ ...form, provinceId: v, municipalityId: '' })}
                >
                  <SelectTrigger aria-label={t('bizProvince')}><SelectValue placeholder={t('bizProvince')} /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {provinces.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{pick('es', p.name, p.nameEn)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('bizMunicipality')} *</Label>
                <Select
                  value={form.municipalityId}
                  onValueChange={(v) => setForm({ ...form, municipalityId: v })}
                  disabled={!form.provinceId}
                >
                  <SelectTrigger aria-label={t('bizMunicipality')}>
                    <SelectValue placeholder={form.provinceId ? t('bizMunicipality') : t('chooseProvinceFirst')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {(selectedProvince?.municipalities ?? []).map((m) => (
                      <SelectItem key={m.id} value={m.id}>{pick('es', m.name, m.nameEn)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="biz-desc">{t('bizDesc')} *</Label>
              <Textarea id="biz-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required maxLength={3000} />
            </div>
            <ImageUpload label={t('coverImage')} value={form.coverUrl} onChange={(v) => setForm({ ...form, coverUrl: v })} />
          </div>

          {/* Ubicación */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <MapPin className="h-4 w-4 text-amber-600" /> {t('locationSection')}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="biz-address">{t('address')}</Label>
                <Input id="biz-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={300} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-coords">{t('coordinates')}</Label>
                <Input
                  id="biz-coords"
                  value={coordsInput}
                  onChange={(e) => setCoordsInput(e.target.value)}
                  placeholder={t('coordinatesPh')}
                />
                <p className="text-[11px] leading-relaxed text-muted-foreground">{t('coordinatesHint')}</p>
              </div>
            </div>
            <MapPreview
              source={{ lat: coords?.lat ?? null, lng: coords?.lng ?? null, address: form.address, locality }}
              heightClass="h-56"
              showHint={false}
            />
            <p className="text-[11px] text-muted-foreground">{t('mapPreviewHint')}</p>
          </div>

          {/* Formas de contacto */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('contactMethods')}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="biz-phone">{t('phone')}</Label>
                <Input id="biz-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-wa">{t('bizWhatsapp')}</Label>
                <Input id="biz-wa" inputMode="numeric" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-email">{t('bizEmail')}</Label>
                <Input id="biz-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-web">{t('bizWebsite')}</Label>
                <Input id="biz-web" placeholder="https://..." value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-ig">{t('bizInstagram')}</Label>
                <Input id="biz-ig" placeholder="@minegocito" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-fb">{t('bizFacebook')}</Label>
                <Input id="biz-fb" placeholder="facebook.com/..." value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-wa-group">{t('bizWhatsappGroup')}</Label>
                <Input
                  id="biz-wa-group"
                  placeholder="https://chat.whatsapp.com/..."
                  value={form.whatsappGroup}
                  onChange={(e) => setForm({ ...form, whatsappGroup: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-tg-group">{t('bizTelegramGroup')}</Label>
                <Input
                  id="biz-tg-group"
                  placeholder="https://t.me/... o @usuario"
                  value={form.telegramGroup}
                  onChange={(e) => setForm({ ...form, telegramGroup: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Horarios y preferencias */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-1.5">
              <Label htmlFor="biz-hours">{t('hours')}</Label>
              <Input id="biz-hours" placeholder={t('bizHoursPh')} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} maxLength={500} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <Switch checked={form.delivery} onCheckedChange={(v) => setForm({ ...form, delivery: v })} /> {t('bizDelivery')}
            </label>
          </div>

          <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 sm:w-auto" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ---------- Diálogo de producto ----------
function ProductFormDialog({
  product, onClose, onSaved, toast, t,
}: {
  product: Product | null
  onClose: () => void
  onSaved: () => Promise<void>
  toast: ReturnType<typeof useToast>['toast']
  t: (key: Parameters<ReturnType<typeof useLang>['t']>[0]) => string
}) {
  const [busy, setBusy] = useState(false)
  // Stock como texto: vacío = producto único (null); número >= 1 = unidades
  const [form, setForm] = useState(() => ({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price ?? 0,
    stock: product?.stock != null ? String(product.stock) : '',
    imageUrl: product?.imageUrl ?? '',
    active: product?.active ?? true,
  }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!form.name) {
      toast({ description: t('errorSaving'), variant: 'destructive' })
      return
    }
    setBusy(true)
    try {
      // Normaliza el stock antes de enviarlo: vacío → null (compra única);
      // número válido → entero >= 0 (0 = agotado)
      const n = Math.round(Number(form.stock))
      const payload = {
        ...form,
        stock: form.stock === '' || !Number.isFinite(n) || n < 0 ? null : n,
      }
      if (product) {
        await api(`/api/owner/products/${product.id}`, 'PUT', payload)
      } else {
        await api('/api/owner/products', 'POST', payload)
      }
      await onSaved()
    } catch {
      toast({ description: t('errorSaving'), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? t('edit') : t('addProduct')}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="prod-name">{t('productName')} *</Label>
            <Input id="prod-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-desc">{t('description')}</Label>
            <Textarea id="prod-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="prod-price">{t('productPrice')} *</Label>
              <Input id="prod-price" type="number" min={0} step={1} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-stock">{t('ownerStockLabel')}</Label>
              <Input
                id="prod-stock"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder={t('ownerStockPh')}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> {t('activeLabel')}
              </label>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{t('ownerStockHint')}</p>
          <ImageUpload label={t('productImage')} value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} />
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

// ---------- Cuenta ----------
function AccountCard({
  toast, t,
}: {
  toast: ReturnType<typeof useToast>['toast']
  t: (key: Parameters<ReturnType<typeof useLang>['t']>[0]) => string
}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      await api('/api/auth/owner/change-password', 'POST', { currentPassword, newPassword })
      toast({ description: t('passwordChanged') })
      setCurrentPassword('')
      setNewPassword('')
    } catch {
      toast({ description: t('errorSaving'), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Settings2 className="h-5 w-5 text-amber-600" /> {t('ownerAccount')}
        </h2>
        <form className="mt-4 grid max-w-md gap-3" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="acc-cur">{t('currentPassword')}</Label>
            <Input id="acc-cur" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-new">{t('newPassword')}</Label>
            <Input id="acc-new" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <Button type="submit" variant="outline" className="justify-self-start" disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            {t('changePassword')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
