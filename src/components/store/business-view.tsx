'use client'

import { useState } from 'react'
import { ArrowLeft, Clock, Globe, Instagram, Mail, MapPin, MessageCircle, Minus, Package, Phone, Facebook, Plus, Send, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useLang } from '@/lib/lang-context'
import { useCart } from '@/lib/cart-store'
import { ContactButtons, InfoRow, Stars, CategoryIcon } from '@/components/store/ui-bits'
import { MapPreview } from '@/components/store/map-preview'
import { CartSheet } from '@/components/store/cart-sheet'
import { formatPrice, pick, type Business, type Product } from '@/components/store/types'

type Props = {
  business: Business
  onBack: () => void
}

export function BusinessView({ business, onBack }: Props) {
  const { lang, t } = useLang()
  const cart = useCart(business.id)
  const [cartOpen, setCartOpen] = useState(false)

  const hasContactInfo = !!(business.address || business.phone || business.hours || business.email ||
    business.website || business.instagram || business.facebook ||
    business.whatsappGroup || business.telegramGroup)
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
              {business.whatsappGroup && (
                <InfoRow
                  icon={MessageCircle}
                  label={t('whatsappGroup')}
                  value={t('joinGroup')}
                  href={business.whatsappGroup}
                  external
                />
              )}
              {business.telegramGroup && (
                <InfoRow
                  icon={Send}
                  label={t('telegramGroup')}
                  value={t('joinGroup')}
                  href={business.telegramGroup}
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
              <ProductCard key={p.id} product={p} qty={cart.qtyOf(p.id)} onAdd={cart.add} onSetQty={cart.setQty} />
            ))}
          </div>
        )}
      </div>

      {/* Barra flotante del carrito: abre el resumen del pedido */}
      {cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <Button
            size="lg"
            className="h-12 rounded-full bg-amber-500 px-5 text-base font-bold text-white shadow-xl hover:bg-amber-600 sm:px-6"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {cart.count} {cart.count === 1 ? t('cartItemSingular') : t('cartItemsPlural')}
            <span aria-hidden>·</span>
            {formatPrice(cart.total)}
            <span className="ml-1 hidden sm:inline">· {t('cartViewOrder')}</span>
          </Button>
        </div>
      )}

      {/* Panel del carrito con el botón de Comprar por WhatsApp */}
      <CartSheet business={business} open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  )
}

// Tarjeta de producto con control para agregar al carrito (o ajustar la
// cantidad si ya está agregado).
function ProductCard({
  product,
  qty,
  onAdd,
  onSetQty,
}: {
  product: Product
  qty: number
  onAdd: (item: { productId: string; name: string; price: number }, qty?: number) => void
  onSetQty: (productId: string, qty: number) => void
}) {
  const { lang, t } = useLang()
  const name = pick(lang, product.name, product.nameEn)
  const inCart = qty > 0

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Package className="h-8 w-8" />
          </div>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col space-y-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug">{name}</h3>
          <span className="whitespace-nowrap font-bold text-amber-600">{formatPrice(product.price)}</span>
        </div>
        {pick(lang, product.description, product.descriptionEn) && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {pick(lang, product.description, product.descriptionEn)}
          </p>
        )}
        {/* Agregar al carrito / ajustar cantidad */}
        <div className="flex items-center justify-end pt-2 mt-auto">
          {inCart ? (
            <div
              className="flex items-center gap-1 rounded-full border border-amber-500/60 bg-amber-500/10 p-1"
              aria-label={`${name} — ${t('cartQtyLabel')}`}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-amber-500/20"
                onClick={() => onSetQty(product.id, qty - 1)}
                aria-label={t('cartDecrease')}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-6 text-center text-sm font-bold text-amber-700 dark:text-amber-400">{qty}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-amber-500/20"
                onClick={() => onSetQty(product.id, qty + 1)}
                aria-label={t('cartIncrease')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="border-amber-600 font-semibold text-amber-700 hover:bg-amber-500 hover:text-white dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-500 dark:hover:text-white"
              onClick={() => onAdd({ productId: product.id, name, price: product.price })}
            >
              <Plus className="mr-1 h-4 w-4" /> {t('addToCart')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
