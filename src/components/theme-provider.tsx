'use client'

// Proveedor de tema (next-themes): gestiona el modo claro/oscuro del sitio.
// El tema se aplica como clase (.dark) sobre <html> para que las variables
// CSS de globals.css cambien de paleta.

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
