# Minegocito — Carrito de compras con pedido por WhatsApp

Con estos 5 archivos agregas a tu app un **carrito de compras** que resuelve el
problema de los distintos tipos de negocio:

- **Negocio con stock** (piezas de computadora, dulces, pizzas…): el comprador
  puede agregar **1, 2 o más unidades** de cada producto y armar su pedido.
- **Negocio sin stock** (alquiler de casa, taxi…): funciona igual, solo tiene
  1 producto que se agrega una vez y se compra. No hay que configurar nada.

## Cómo funciona para el comprador

1. Entra a la ficha de un negocio y toca **«+ Agregar»** en cada producto que
   quiera. Si ya lo agregó, ve un control **(− cantidad +)** para subir o bajar
   las unidades.
2. Abajo aparece una **barra flotante ámbar** con el resumen
   (ej.: «3 artículos · 4300 CUP · Ver pedido»). Al tocarla se abre el carrito.
3. En el carrito puede ajustar cantidades, quitar productos, y dejar
   **nombre** y **nota** opcionales (ej.: dirección de entrega).
4. Toca **«Comprar por WhatsApp»** y se abre WhatsApp con el dueño llevando
   automáticamente la lista completa, por ejemplo:

```
Hola Pizzería Don Mario! Quiero hacer este pedido:

• 1 × Pizza familiar de pepperoni — 2400 CUP
• 2 × Pizza personal hawaiana — 1900 CUP
• 1 × Calzone relleno de queso — 1100 CUP

Total: 5400 CUP

Nombre: Juan Pérez
Nota: Entregar en Calle 23 #456 a las 6pm

(Enviado desde Minegocito)
```

5. El número de WhatsApp al que llega el pedido es el que el dueño ya puso en
   su panel (campo «WhatsApp»), o el teléfono como respaldo. El carrito se
   vacía al enviar y queda guardado por negocio, así que no se mezclan pedidos
   de negocios distintos. El contenido sobrevive recargas (localStorage).

## Archivos a subir a GitHub (raíz del repo `xjasonx01/minegocito`)

| Archivo | Estado | Qué hace |
| --- | --- | --- |
| `src/lib/cart-store.ts` | **NUEVO** | Almacén del carrito (por negocio, con cantidades, persistente) |
| `src/components/store/cart-sheet.tsx` | **NUEVO** | Panel lateral del carrito + botón «Comprar por WhatsApp» |
| `src/components/store/business-view.tsx` | **REEMPLAZAR** | Ficha del negocio con «Agregar», control de cantidad y barra flotante |
| `src/lib/i18n.ts` | **REEMPLAZAR** | Textos nuevos en español e inglés del carrito |
| `src/app/page.tsx` | **REEMPLAZAR** | Detalle: remonta la vista al cambiar de negocio para reiniciar el carrito |

Mantén exactamente las mismas rutas. Dos archivos son nuevos y tres sustituyen
al archivo existente con el mismo nombre.

## Cómo subirlos

**Opción A — desde la web de GitHub** (sin comandos):
1. En el repo, entra a cada carpeta (`src/lib`, `src/components/store`, `src/app`).
2. Para los nuevos: «Add file → Upload files» y sube `cart-store.ts` en
   `src/lib/` y `cart-sheet.tsx` en `src/components/store/`.
3. Para los que se reemplazan: abre el archivo, lápiz («Edit»), borra todo,
   pega el contenido del archivo nuevo y «Commit changes».

**Opción B — con git** (en tu copia local del proyecto): copia los 5 archivos
respetando las rutas y haz:

```bash
git add src/lib/cart-store.ts src/components/store/cart-sheet.tsx src/components/store/business-view.tsx src/lib/i18n.ts src/app/page.tsx
git commit -m "Carrito de compras con pedido por WhatsApp"
git push
```

Después del push, redeploy (Vercel/Render u donde tengas la app). **No hay que
tocar la base de datos ni correr migraciones**: el carrito vive en el navegador
del comprador y usa los productos y el WhatsApp que ya existen.

## Verificado

- Compilación de producción (`npm run build`) sin errores.
- Chequeo de tipos (`tsc --noEmit`) y ESLint sin errores nuevos.
- Probado en navegador: agregar productos, cambiar cantidades, total correcto,
  mensaje de WhatsApp generado con la lista completa, carrito vaciado tras el
  envío y ambos tipos de negocio (pizzería con stock y casa de alquiler sin él).
