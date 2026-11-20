# Minegocito

Directorio de negocios con catálogos digitales: los visitantes exploran por
categoría y zona, ven la ficha de cada negocio con su catálogo de productos,
sus formas de contacto, su ubicación en Google Maps y contactan por WhatsApp
o teléfono. Interfaz en español e inglés.

## Publicar un negocio (flujo por roles)

- **Visitantes**: navegan el directorio por categoría y por ubicación
  (provincia y municipio), ven la ficha de cada negocio con su catálogo de
  productos, sus formas de contacto, su ubicación en Google Maps y contactan
  por WhatsApp o teléfono.
- **Dueños de negocio**: cualquier negocio puede alojar sus servicios en el
  sitio. Desde el apartado **"Publica tu negocio"** (`/#/publicar`) contactan
  al desarrollador por **WhatsApp**, **Telegram** o **correo** (o usan el
  formulario de solicitud). Cuando el desarrollador les crea su cuenta, entran
  al **Panel del dueño** (`/#/panel`) y crean/editan su negocio: nombre,
  categoría, provincia y municipio (toda Cuba), dirección, coordenadas de
  ubicación, teléfono, WhatsApp, correo, sitio web, Instagram, Facebook,
  horarios, imagen de portada y catálogo de productos. También pueden pausar
  o reactivar la visibilidad de su negocio y cambiar su contraseña.
- **Desarrollador (tú)**: el panel de administración ya no es visible en el
  sitio. Todas tus herramientas quedan en la ruta privada
  **`/#/desarrollador`** (no aparece en ningún menú):
  - **Solicitudes**: mensajes del formulario (marca las solicitudes de
    negocios que quieren publicarse).
  - **Dueños**: crea la cuenta de acceso de cada dueño (nombre, correo y
    contraseña de mínimo 8 caracteres), desactívala o elimínala.
  - **Negocios**: activa/desactiva y marca en tendencia cualquier negocio.
  - **Ajustes**: nombre del sitio, lema, correo, WhatsApp y Telegram de
    contacto (se muestran en el apartado "Publica tu negocio" y el pie).

## Contacto del desarrollador (para los dueños)

Los datos que ve un negocio para contactarte se guardan en Ajustes y vienen
precargados en `src/lib/seed-data.ts`:

- Correo: `minegocito@gmail.com`
- WhatsApp: `+53 56098552` (botón que abre tu chat con un mensaje listo)
- Telegram: `@jasonmh03` (botón que abre t.me/jasonmh03)

## Cuenta de dueño de prueba

Para probar el flujo completo (entrar → crear un negocio de prueba → verlo en
la página principal) hay una cuenta precargada:

- Correo: `dueno@minegocito.cu`
- Contraseña: `Prueba2026`

Entra en `/#/panel`, inicia sesión con esos datos y crea el negocio de
prueba. Puedes cambiar el correo/contraseña con las variables
`TEST_OWNER_EMAIL` y `TEST_OWNER_PASSWORD`, o eliminar la cuenta desde el
panel del desarrollador (Dueños) cuando ya no la necesites.

## Ubicaciones y categorías

El sitio está pensado para toda Cuba. La división territorial viene
precargada en `src/lib/seed-data.ts` según la división oficial vigente
(15 provincias + Isla de la Juventud, 168 municipios) y se sincroniza sola
en cada arranque: si una versión nueva añade municipios o categorías,
aparecen sin tocar la base a mano.

Las categorías de ejemplo cubren 16 tipos de negocio: restaurantes, cafeterías,
panaderías, pizzerías, alojamiento y Airbnb, transporte y taxis, tecnología y
electrónica, moda y calzado, belleza y barbería, hogar y muebles, servicios y
reparaciones, fiestas y eventos, ferreterías, veterinarias, heladerías y
regalos. Los negocios y productos de ejemplo se siembran solo cuando la base
está vacía; las categorías que crees tú no se sobreescriben.

## Ubicación en Google Maps

La ficha de cada negocio muestra una vista previa del mapa (sin API key).
Al hacer clic en cualquier parte del mapa o en el botón "Abrir en Google
Maps", el visitante va a Google Maps con la ubicación exacta.

- Si el negocio tiene **coordenadas** (lat/lng), el mapa usa esa posición
  exacta.
- Si no, usa la **dirección + municipio y provincia** registradas.

El dueño puede pegar en su panel las coordenadas sueltas (`23.1136, -82.3666`)
o directamente el **enlace compartido de Google Maps** de su negocio: el
panel extrae las coordenadas automáticamente.

## Tecnologías

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Prisma ORM + PostgreSQL (Neon) en producción / SQLite en desarrollo local
- Sesiones firmadas con HMAC separadas para desarrollador y dueños


## Estructura

```
src/app/page.tsx                  Página única con router por hash
src/components/store/             Vistas: inicio, listado, ficha, publicar,
                                  panel del dueño, panel del desarrollador
src/components/store/maps.ts      Vista previa y enlace de Google Maps
src/app/api/owner/                API del dueño (su negocio y sus productos)
src/app/api/auth/owner/           Acceso de los dueños
src/app/api/admin/                API privada del desarrollador (+ owners)
src/lib/seed-data.ts              Contenido de ejemplo (negocios ficticios,
                                  provincias/municipios de Cuba, categorías)
prisma/schema.prisma              Esquema PostgreSQL (producción)
prisma/schema.sqlite.prisma       Esquema SQLite (desarrollo local)
```
