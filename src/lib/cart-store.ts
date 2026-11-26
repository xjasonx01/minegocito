// Carrito de compras del lado del cliente.
//
// - Un carrito independiente por negocio (el pedido siempre va dirigido a un
//   solo dueño, así que no se mezclan productos de distintos negocios).
// - Persistido en localStorage (clave "mg_cart") para sobrevivir recargas.
// - Patrón idéntico al de lang-context.tsx: almacén externo leído con
//   useSyncExternalStore, sin proveedor de contexto y seguro en SSR.
//
// Este módulo solo se importa desde componentes cliente ('use client').

import { useCallback, useSyncExternalStore } from 'react'

export type CartItem = {
  productId: string
  /** Nombre ya resuelto en el idioma activo al momento de agregarlo */
  name: string
  /** Precio unitario en CUP */
  price: number
  qty: number
}

/** businessId -> items de ese negocio */
export type CartState = Record<string, CartItem[]>

const STORAGE_KEY = 'mg_cart'
const listeners = new Set<() => void>()
let cachedCart: CartState | null = null

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function readCart(): CartState {
  if (cachedCart === null) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? (JSON.parse(raw) as CartState) : {}
      // Saneado básico por si el formato guardado no es válido
      cachedCart = {}
      for (const [businessId, items] of Object.entries(parsed)) {
        if (!Array.isArray(items)) continue
        cachedCart[businessId] = items
          .filter((i) => i && typeof i.productId === 'string' && typeof i.price === 'number')
          .map((i) => ({
            productId: i.productId,
            name: typeof i.name === 'string' ? i.name : '',
            price: i.price,
            qty: Math.max(1, Math.round(Number(i.qty) || 1)),
          }))
      }
    } catch {
      cachedCart = {}
    }
  }
  return cachedCart
}

function writeCart(next: CartState) {
  cachedCart = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* almacenamiento no disponible */
  }
  for (const listener of listeners) listener()
}

export const cartStore = {
  subscribe,

  getSnapshot: readCart,

  /** En el servidor (SSR) el carrito siempre empieza vacío */
  getServerSnapshot(): CartState {
    return {}
  },

  /** Agrega un producto (o suma cantidad si ya estaba en el carrito) */
  add(businessId: string, item: Omit<CartItem, 'qty'>, qty = 1) {
    const cart = readCart()
    const items = [...(cart[businessId] ?? [])]
    const idx = items.findIndex((i) => i.productId === item.productId)
    if (idx >= 0) {
      items[idx] = { ...items[idx], qty: items[idx].qty + qty }
    } else {
      items.push({ ...item, qty: Math.max(1, qty) })
    }
    writeCart({ ...cart, [businessId]: items })
  },

  /** Cambia la cantidad de un producto; con qty <= 0 lo elimina */
  setQty(businessId: string, productId: string, qty: number) {
    const cart = readCart()
    const current = cart[businessId] ?? []
    if (!current.some((i) => i.productId === productId)) return
    if (qty <= 0) {
      cartStore.remove(businessId, productId)
      return
    }
    const items = current.map((i) =>
      i.productId === productId ? { ...i, qty: Math.round(qty) } : i,
    )
    writeCart({ ...cart, [businessId]: items })
  },

  /** Quita un producto del carrito del negocio */
  remove(businessId: string, productId: string) {
    const cart = readCart()
    const items = (cart[businessId] ?? []).filter((i) => i.productId !== productId)
    writeCart({ ...cart, [businessId]: items })
  },

  /** Vacía el carrito del negocio (tras enviar el pedido) */
  clear(businessId: string) {
    const cart = readCart()
    if (!cart[businessId]?.length) return
    const next = { ...cart }
    delete next[businessId]
    writeCart(next)
  },
}

export type CartSummary = {
  items: CartItem[]
  /** Unidades totales (sumando cantidades) */
  count: number
  /** Importe total en CUP */
  total: number
  /** Cantidad actual de un producto concreto */
  qtyOf: (productId: string) => number
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  setQty: (productId: string, qty: number) => void
  remove: (productId: string) => void
  clear: () => void
}

/** Hook para leer y manipular el carrito de un negocio concreto */
export function useCart(businessId: string): CartSummary {
  const state = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  )
  const items = state[businessId] ?? []

  const add = useCallback(
    (item: Omit<CartItem, 'qty'>, qty = 1) => cartStore.add(businessId, item, qty),
    [businessId],
  )
  const setQty = useCallback(
    (productId: string, qty: number) => cartStore.setQty(businessId, productId, qty),
    [businessId],
  )
  const remove = useCallback(
    (productId: string) => cartStore.remove(businessId, productId),
    [businessId],
  )
  const clear = useCallback(() => cartStore.clear(businessId), [businessId])
  const qtyOf = useCallback(
    (productId: string) => items.find((i) => i.productId === productId)?.qty ?? 0,
    [items],
  )

  return {
    items,
    count: items.reduce((acc, i) => acc + i.qty, 0),
    total: items.reduce((acc, i) => acc + i.qty * i.price, 0),
    qtyOf,
    add,
    setQty,
    remove,
    clear,
  }
}
