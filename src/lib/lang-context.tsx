'use client'

import { createContext, useCallback, useContext, useSyncExternalStore } from 'react'
import { DICTS, type Dict, type Lang } from '@/lib/i18n'

// Almacén externo del idioma (localStorage) leído con useSyncExternalStore:
// sin setState dentro de efectos y sin desajustes de hidratación.
const STORAGE_KEY = 'mg_lang'
const listeners = new Set<() => void>()
let cachedLang: Lang | null = null

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): Lang {
  if (cachedLang === null) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      cachedLang = saved === 'en' ? 'en' : 'es'
    } catch {
      cachedLang = 'es'
    }
  }
  return cachedLang
}

function getServerSnapshot(): Lang {
  return 'es'
}

function persistLang(lang: Lang) {
  cachedLang = lang
  try {
    window.localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* almacenamiento no disponible */
  }
  for (const listener of listeners) listener()
}

type LangCtx = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: keyof Dict) => string
}

const Ctx = createContext<LangCtx | null>(null)

export function LangProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setLang = useCallback((l: Lang) => persistLang(l), [])
  const t = useCallback((key: keyof Dict) => DICTS[lang][key] ?? String(key), [lang])

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useLang fuera de LangProvider')
  return ctx
}
