'use client'

// Botón de alternancia de tema: sol (claro) / luna (oscuro).
// Renderiza la luna hasta montar en el cliente para evitar desajustes de
// hidratación con el tema resuelto por next-themes.

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useLang } from '@/lib/lang-context'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const { lang } = useLang()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

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
