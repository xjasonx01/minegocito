// Tipos compartidos entre el frontend y las respuestas de la API

export type Category = {
  id: string
  slug: string
  name: string
  nameEn: string | null
  icon: string | null
  sortOrder: number
  active: boolean
}

export type Municipality = {
  id: string
  slug: string
  name: string
  nameEn: string | null
  provinceId: string
  sortOrder: number
  active: boolean
}

export type Province = {
  id: string
  slug: string
  name: string
  nameEn: string | null
  sortOrder: number
  active: boolean
  municipalities: Municipality[]
}

// Municipio tal y como llega incrustado en un negocio (con su provincia,
// que a su vez no arrastra la lista completa de municipios)
export type BusinessMunicipality = Municipality & {
  province: Omit<Province, 'municipalities'>
}

export type Product = {
  id: string
  businessId: string
  name: string
  nameEn: string | null
  description: string | null
  descriptionEn: string | null
  price: number
  /** Stock disponible. null = producto único (se puede comprar 1 sola vez) */
  stock: number | null
  imageUrl: string | null
  sortOrder: number
  active: boolean
}

export type Business = {
  id: string
  slug: string
  name: string
  nameEn: string | null
  description: string
  descriptionEn: string | null
  categoryId: string
  municipalityId: string
  address: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  whatsappGroup: string | null
  telegramGroup: string | null
  hours: string | null
  coverUrl: string | null
  lat: number | null
  lng: number | null
  rating: number
  featured: boolean
  delivery: boolean
  active: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  category: Category
  municipality: BusinessMunicipality
  products: Product[]
}

export type ContactMessage = {
  id: string
  name: string
  contact: string
  message: string
  kind: string
  read: boolean
  createdAt: string
}

export type PublicData = {
  settings: Record<string, string>
  categories: Category[]
  provinces: Province[]
  businesses: Business[]
}

export type AdminData = PublicData & {
  messages: ContactMessage[]
}

// Localización flexible del contenido
export function pick(lang: string, es: string | null | undefined, en: string | null | undefined): string {
  if (lang === 'en' && en) return en
  return es || ''
}

export function formatPrice(n: number): string {
  const rounded = Math.round(n)
  return `${rounded.toLocaleString('es-ES').replace(/,/g, '.')} CUP`
}
