'use client'

// Botón de alternancia de tema: sol (claro) / luna (oscuro).
// Renderiza la luna hasta montar en el cliente para evitar desajustes de
// hidratación con el tema resuelto por next-themes.

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useLang } from '@/lib/lang-context'

// Detecta si ya estamos en el cliente sin setState en useEffect:
// - snapshot del servidor: false (misma salida que el SSR, sin desajuste)
// - snapshot del cliente: true
const emptySubscribe = () => () => {}
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const { lang } = useLang()
  const mounted = useMounted()

  const isDark = mounted && resolvedTheme === 'dark'
  const label = isDark
    ? lang === 'en'
      ? 'Switch to light mode'
      : 'Cambiar a modo claro'
    : lang === 'en'
      ? 'Switch to dark mode'
      : 'Cambiar a modo oscuro'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={label}
      title={label}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}
