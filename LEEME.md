# Minegocito — Carrito con stock por producto y pedido por WhatsApp

Con estos archivos agregas a tu app dos funcionalidades que trabajan juntas:

1. **Carrito de compras con pedido por WhatsApp** (ya lo tenías de la versión
   anterior; estos archivos lo incluyen todo).
2. **Stock por producto**: el dueño define cuántas unidades tiene de cada
   producto y el comprador no puede pasarse de esa cantidad.

## Cómo funciona el stock

- En el panel del dueño, el formulario de cada producto tiene un campo
  **«Cantidad disponible (opcional)»**:
  - **Vacío** → el producto se considera **único** y solo se puede comprar
    **una vez** (ej.: una casa que se alquila, un servicio).
  - **Número ≥ 1** → el comprador puede pedir hasta esa cantidad de unidades
    (ej.: 30 dulces, 5 piezas de computadora).
- En la ficha pública cada producto muestra su disponibilidad:
  - «Producto único» o «Disponibles: N».
  - En el carrito: «Restantes: N» y «Máximo alcanzado» con el botón «+»
    deshabilitado al llegar al tope.
- La cantidad se limita también por debajo (en el almacén del carrito), no
  solo visualmente: aunque el comprador pulse «+» muchas veces o cambie el
  carrito guardado, nunca supera el stock definido.
- Los productos que ya existían en tu base de datos quedan automáticamente
  como **compra única** (stock vacío). Cada dueño puede editar sus productos
  y ponerles la cantidad que quiera.

## Archivos a subir a GitHub (raíz del repo `xjasonx01/minegocito`)

Mantén exactamente las mismas rutas. Si ya subiste la versión anterior del
carrito, ahora solo cambian todos estos (los 14, porque el stock toca varios):

| Archivo | Estado | Qué hace |
| --- | --- | --- |
| `prisma/schema.prisma` | **REEMPLAZAR** | Campo nuevo `stock Int?` en Product (PostgreSQL) |
| `prisma/schema.sqlite.prisma` | **REEMPLAZAR** | Campo nuevo `stock Int?` en Product (SQLite local) |
| `src/lib/ensure-seed.ts` | **REEMPLAZAR** | Crea la columna `stock` automáticamente al arrancar (sin migración manual) |
| `src/components/store/types.ts` | **REEMPLAZAR** | Tipo `Product` con `stock` |
| `src/app/api/owner/products/route.ts` | **REEMPLAZAR** | Crear producto con stock (normaliza: vacío→null, `<1`→null) |
| `src/app/api/owner/products/[id]/route.ts` | **REEMPLAZAR** | Editar producto con stock |
| `src/app/api/admin/products/route.ts` | **REEMPLAZAR** | API de admin con stock (consistencia) |
| `src/app/api/admin/products/[id]/route.ts` | **REEMPLAZAR** | API de admin con stock (consistencia) |
| `src/components/store/owner-view.tsx` | **REEMPLAZAR** | Formulario de producto con campo de stock + lista con disponibilidad |
| `src/components/store/business-view.tsx` | **REEMPLAZAR** | Ficha pública: «Agregar» con tope de stock y pistas de disponibilidad |
| `src/components/store/cart-sheet.tsx` | **REEMPLAZAR** | Carrito: «+» deshabilitado al tope, pistas por producto |
| `src/lib/cart-store.ts` | **REEMPLAZAR** | Almacén del carrito con límite de cantidad (incluye carrito por negocio) |
| `src/lib/i18n.ts` | **REEMPLAZAR** | Textos nuevos ES/EN (carrito + stock) |
| `src/app/page.tsx` | **REEMPLAZAR** | Detalle: remonta la vista al cambiar de negocio (carrito limpio) |

## Cómo subirlos

**Opción A — desde la web de GitHub** (sin comandos):
1. Entra a cada carpeta del repo. Para los archivos nuevos usa
   «Add file → Upload files»; para los que se reemplazan, abre el archivo,
   lápiz («Edit»), borra todo, pega el contenido nuevo y «Commit changes».
2. Respeta las rutas (p. ej. `src/app/api/owner/products/[id]/route.ts`).

**Opción B — con git** (en tu copia local):

```bash
git add prisma/schema.prisma prisma/schema.sqlite.prisma src/lib/ensure-seed.ts \
  src/components/store/types.ts src/app/api/owner/products \
  src/app/api/admin/products src/components/store/owner-view.tsx \
  src/components/store/business-view.tsx src/components/store/cart-sheet.tsx \
  src/lib/cart-store.ts src/lib/i18n.ts src/app/page.tsx
git commit -m "Carrito con stock por producto y pedido por WhatsApp"
git push
```

## Después del push: NO necesitas migración manual

La primera petición que llegue a la app ejecuta el auto-ajuste que ya usaba tu
proyecto: crea la columna `stock` en la tabla `Product` de forma idempotente
(funciona igual en PostgreSQL/Neon y en SQLite). Solo asegúrate de que el
despliegue haga `npm install` + `npm run build` como siempre (el cliente de
Prisma se regenera con el campo nuevo en el postinstall).

## Verificado

- Compilación de producción (`npm run build`), TypeScript y ESLint sin errores
  nuevos (los 2 avisos de lint que salen son del código original del repo).
- Probado en navegador de punta a punta:
  - Dueño crea negocio y producto con stock 5 → aparece «1500 CUP · Disponibles: 5».
  - Comprador intenta pedir 6 y el carrito se queda en 5 («Máximo alcanzado»).
  - Producto sin stock → «Producto único», no se puede agregar 2 veces.
  - Carrito guarda cantidades, persiste recargas y el pedido llega a WhatsApp
    con la lista completa, cantidades y total.
