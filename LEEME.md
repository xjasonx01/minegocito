# Minegocito — Carrito, stock y bandeja de pedidos

Con estos archivos agregas a tu app tres funcionalidades que trabajan juntas:

1. **Carrito de compras con pedido por WhatsApp** — el comprador arma su lista
   y la envía al dueño por WhatsApp (de la versión anterior; estos archivos lo
   incluyen todo).
2. **Stock por producto** — el dueño define cuántas unidades tiene de cada
   producto y el comprador no puede pasarse de esa cantidad.
3. **Bandeja de pedidos** (nuevo) — cada pedido queda registrado en la base de
   datos y el dueño lo marca como **concretado** (descuenta el stock
   automáticamente) o **descartado** (no toca el stock).

## Cómo funciona el stock

- En el panel del dueño, el formulario de cada producto tiene un campo
  **«Cantidad disponible (opcional)»**:
  - **Vacío** → el producto se considera **único** y solo se puede comprar
    **una vez** (ej.: una casa que se alquila, un servicio).
  - **Número ≥ 1** → el comprador puede pedir hasta esa cantidad de unidades
    (ej.: 30 dulces, 5 piezas de computadora).
  - **0** → el producto aparece como **agotado** y no se puede agregar al
    carrito hasta que el dueño le ponga stock de nuevo.
- En la ficha pública cada producto muestra su disponibilidad:
  «Producto único», «Disponibles: N» o «Agotado» (con el botón deshabilitado).
- La cantidad se limita por debajo (en el almacén del carrito), no solo
  visualmente: aunque el comprador pulse «+» muchas veces o edite el carrito
  guardado, nunca supera el stock definido.

## Cómo funciona la bandeja de pedidos (nuevo)

1. Cuando el comprador pulsa **«Comprar por WhatsApp»**, la app registra el
   pedido en la base de datos (productos, cantidades, total, nombre y nota del
   comprador) **y además abre WhatsApp como siempre**. El registro tiene un
   tope de 5 segundos: si la red está lenta o sin conexión, el envío por
   WhatsApp nunca se bloquea — la bandeja es un extra, no un requisito.
2. En el panel del dueño aparece la sección **«Pedidos recibidos»** con un
   contador de pendientes. Cada pedido muestra: estado, fecha, productos con
   sus importes, total, comprador y nota.
3. El dueño decide con dos botones:
   - **«Concretar»** (pide confirmación): la venta se realizó → descuenta el
     stock de cada producto pedido (un producto único pasa a 0 = agotado) y el
     pedido queda «Concretado». Solo se puede concretar una vez: si se pulsa
     de nuevo, la API lo rechaza para no descontar dos veces.
   - **«Descartar»**: el comprador finalmente no compró → el stock no cambia.
4. **Importante**: el pedido se guarda con nombre y precio del momento
   (snapshot). Si el dueño cambia precios o borra un producto después, el
   histórico del pedido no se altera. Si concretó y un producto ya no existe,
   los demás igual se descuentan.
5. Los precios y el tope de stock los recalcula **el servidor** al recibir el
   pedido: el comprador no puede enviar precios inventados ni cantidades por
   encima del stock disponible.

## Archivos a subir a GitHub (raíz del repo `xjasonx01/minegocito`)

Mantén exactamente las mismas rutas (los 17 archivos, porque la bandeja de
pedidos toca varios):

| Archivo | Estado | Qué hace |
| --- | --- | --- |
| `prisma/schema.prisma` | **REEMPLAZAR** | Modelo nuevo `Order` + campo `stock` (PostgreSQL) |
| `prisma/schema.sqlite.prisma` | **REEMPLAZAR** | Modelo nuevo `Order` + campo `stock` (SQLite local) |
| `src/lib/ensure-seed.ts` | **REEMPLAZAR** | Crea la tabla `Order` y la columna `stock` automáticamente al arrancar (sin migración manual) |
| `src/app/api/public/orders/route.ts` | **NUEVO** | Recibe el pedido del comprador: valida negocio activo, recalcula precios y tope de stock, guarda con estado «pendiente» |
| `src/app/api/owner/orders/route.ts` | **NUEVO** | Lista los pedidos del negocio del dueño (últimos 200) |
| `src/app/api/owner/orders/[id]/route.ts` | **NUEVO** | Marca pedido «concretado» (descuenta stock en transacción) o «cancelado» |
| `src/app/api/owner/products/route.ts` | **REEMPLAZAR** | Crear producto con stock (acepta 0 = agotado) |
| `src/app/api/owner/products/[id]/route.ts` | **REEMPLAZAR** | Editar producto con stock (acepta 0 = agotado) |
| `src/app/api/admin/products/route.ts` | **REEMPLAZAR** | API de admin con stock (consistencia) |
| `src/app/api/admin/products/[id]/route.ts` | **REEMPLAZAR** | API de admin con stock (consistencia) |
| `src/components/store/owner-view.tsx` | **REEMPLAZAR** | Sección «Pedidos recibidos» con acciones + formulario de producto con stock |
| `src/components/store/business-view.tsx` | **REEMPLAZAR** | Ficha pública: tope de stock y estado «Agotado» |
| `src/components/store/cart-sheet.tsx` | **REEMPLAZAR** | Carrito: guarda el pedido antes de abrir WhatsApp, pistas de stock |
| `src/lib/cart-store.ts` | **REEMPLAZAR** | Almacén del carrito con límite de cantidad (carrito por negocio) |
| `src/lib/i18n.ts` | **REEMPLAZAR** | Textos nuevos ES/EN (carrito, stock, pedidos) |
| `src/components/store/types.ts` | **REEMPLAZAR** | Tipo `Product` con `stock` |
| `src/app/page.tsx` | **REEMPLAZAR** | Detalle: remonta la vista al cambiar de negocio (carrito limpio) |

## Cómo subirlos

**Opción A — desde la web de GitHub** (sin comandos):
1. Entra a cada carpeta del repo. Para los archivos nuevos (`src/app/api/public/orders/`,
   `src/app/api/owner/orders/` y su subcarpeta `[id]`) usa «Add file → Upload files».
   Para los que se reemplazan, abre el archivo, lápiz («Edit»), borra todo,
   pega el contenido nuevo y «Commit changes».
2. Respeta las rutas (p. ej. `src/app/api/owner/orders/[id]/route.ts`).

**Opción B — con git** (en tu copia local):

```bash
git add prisma/schema.prisma prisma/schema.sqlite.prisma src/lib/ensure-seed.ts \
  src/app/api/public/orders src/app/api/owner/orders \
  src/app/api/owner/products src/app/api/admin/products \
  src/components/store/owner-view.tsx src/components/store/business-view.tsx \
  src/components/store/cart-sheet.tsx src/lib/cart-store.ts src/lib/i18n.ts \
  src/components/store/types.ts src/app/page.tsx
git commit -m "Bandeja de pedidos con descuento de stock automático"
git push
```

## Después del push: NO necesitas migración manual

La primera petición que llegue a la app ejecuta el auto-ajuste que ya usaba tu
proyecto: crea la **tabla `Order`** y la columna `stock` de forma idempotente
(`CREATE TABLE IF NOT EXISTS`), igual en PostgreSQL/Neon y en SQLite. Solo
asegúrate de que el despliegue haga `npm install` + `npm run build` como
siempre (el cliente de Prisma se regenera en el postinstall). Si prefieres
migrar a mano, `npx prisma db push` logra lo mismo.

## Verificado

- Compilación de producción (`npm run build`), TypeScript y ESLint sin errores
  nuevos (los avisos que salen son del código original del repo).
- Probado en navegador de punta a punta con dos negocios de ejemplo:
  - Comprador arma pedido (2 × pizza con stock 3 + 1 pizza única), pulsa
    «Comprar por WhatsApp» → WhatsApp se abre con la lista y el total, y el
    pedido aparece en el panel del dueño como «Pendiente» con comprador y nota.
  - Dueño pulsa «Concretar» → confirmación → el pedido queda «Concretado», la
    pizza pasa a «Disponibles: 1» y la pizza única a «Agotado» (desaparece el
    botón de agregar en la ficha pública).
  - Segundo pedido del comprador y el dueño pulsa «Descartar» → queda «No
    concretó» y el stock del calzone no cambia (sigue vendiéndose).
  - Con stock 1, el botón «+» del carrito se deshabilita («Máximo alcanzado»).
