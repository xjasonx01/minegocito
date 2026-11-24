import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Minegocito — Directorio de negocios y catálogos digitales",
  description:
    "Descubre los mejores negocios de tu zona: restaurantes, cafeterías, panaderías, tiendas y más. Catálogos digitales, contacto directo y entrega a domicilio.",
  keywords: ["directorio", "negocios", "catálogo digital", "menú", "tiendas", "restaurantes", "Minegocito"],
  authors: [{ name: "Minegocito" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Minegocito — Descubre los mejores negocios de tu zona",
    description:
      "Directorio de negocios con catálogos digitales: mira su carta, contacta por WhatsApp y pide a domicilio.",
    siteName: "Minegocito",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Minegocito — Directorio de negocios",
    description: "Descubre los mejores negocios de tu zona con catálogos digitales.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
