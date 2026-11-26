'use client'

// Panel lateral del carrito: lista del pedido con cantidades, datos
// opcionales del comprador y botón "Comprar por WhatsApp" que abre un chat
// con el dueño del negocio llevando todos los productos y el total.

import { useState } from 'react'
import {
  Minus,
  PackageOpen,
  Plus,
  Send,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useLang } from '@/lib/lang-context'
import { useCart } from '@/lib/cart-store'
import { formatPrice, pick, type Business } from '@/components/store/types'

type Props = {
  business: Business
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CartSheet({ business, open, onOpenChange }: Props) {
  const { lang, t } = useLang()
  const { items, count, total, setQty, remove, clear } = useCart(business.id)
  const [buyerName, setBuyerName] = useState('')
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  // Envuelve el cambio de apertura del panel: al reabrir después de un
  // envío se muestra de nuevo el pedido (patrón de handler, sin efectos).
  const handleOpenChange = (next: boolean) => {
    if (next) setSent(false)
    onOpenChange(next)
  }

  const waNumber = business.whatsapp || (business.phone ? business.phone.replace(/[^0-9]/g, '') : '')

  const buildMessage = (): string => {
    const lines: string[] = []
    if (lang === 'en') {
      lines.push(`Hello ${business.name}! I'd like to place this order:`)
    } else {
      lines.push(`Hola ${business.name}! Quiero hacer este pedido:`)
    }
    lines.push('')
    for (const item of items) {
      lines.push(`• ${item.qty} × ${item.name} — ${formatPrice(item.price * item.qty)}`)
    }
    lines.push('')
    lines.push(`${lang === 'en' ? 'Total' : 'Total'}: ${formatPrice(total)}`)
    if (buyerName.trim()) {
      lines.push('')
      lines.push(`${lang === 'en' ? 'Name' : 'Nombre'}: ${buyerName.trim()}`)
    }
    if (note.trim()) {
      lines.push(`${lang === 'en' ? 'Note' : 'Nota'}: ${note.trim()}`)
    }
    lines.push('')
    lines.push(lang === 'en' ? '(Sent from Minegocito)' : '(Enviado desde Minegocito)')
    return lines.join('\n')
  }

  const buy = () => {
    if (!waNumber || items.length === 0) return
    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(buildMessage())}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setSent(true)
    clear()
    setBuyerName('')
    setNote('')
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-amber-600" />
            {t('cartTitle')}
          </SheetTitle>
          <SheetDescription>
            {pick(lang, business.name, business.nameEn)} ·{' '}
            {count > 0 ? (
              <>
                {count} {count === 1 ? t('cartItemSingular') : t('cartItemsPlural')}
              </>
            ) : (
              t('cartEmptyHint')
            )}
          </SheetDescription>
        </SheetHeader>

        {sent ? (
          // Confirmación tras abrir WhatsApp con el pedido
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Send className="h-7 w-7" />
            </span>
            <p className="font-semibold">{t('orderSentTitle')}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{t('orderSentText')}</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('cartClose')}
            </Button>
          </div>
        ) : items.length === 0 ? (
          // Carrito vacío
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <PackageOpen className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('cartEmpty')}</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('cartKeepBrowsing')}
            </Button>
          </div>
        ) : (
          <>
            {/* Lista de productos del pedido */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.productId} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold leading-snug">{item.name}</span>
                      <button
                        type="button"
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => remove(item.productId)}
                        aria-label={`${t('cartRemove')}: ${item.name}`}
                        title={t('cartRemove')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatPrice(item.price)} × {item.qty}
                      </span>
                      {/* Control de cantidad */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setQty(item.productId, item.qty - 1)}
                          aria-label={t('cartDecrease')}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setQty(item.productId, item.qty + 1)}
                          aria-label={t('cartIncrease')}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-1 text-right text-sm font-bold text-amber-600">
                      {formatPrice(item.price * item.qty)}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Datos opcionales del comprador */}
              <div className="mt-4 space-y-2">
                <Input
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder={t('cartYourName')}
                  maxLength={60}
                />
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('cartNote')}
                  maxLength={200}
                />
              </div>
            </div>

            {/* Total y botón de compra */}
            <SheetFooter className="border-t">
              <div className="flex items-center justify-between text-base font-bold">
                <span>{t('cartTotal')}</span>
                <span className="text-amber-600">{formatPrice(total)}</span>
              </div>
              <Separator />
              {waNumber ? (
                <Button
                  size="lg"
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={buy}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {t('cartBuyWhatsapp')}
                </Button>
              ) : (
                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                  {t('cartNoWhatsapp')}
                </p>
              )}
              <Button variant="ghost" size="sm" className="w-full" onClick={() => clear()}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('cartClear')}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
