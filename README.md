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

## Arranque rápido en Render

La guía completa paso a paso está en el PDF "Guía de despliegue". Resumen:

1. Crea la base de datos gratuita en [neon.tech](https://neon.tech) y copia la
   cadena de conexión (`postgresql://...`).
2. Sube este proyecto a un repositorio en [github.com](https://github.com).
   Puedes hacerlo sin comandos git: crea el repositorio y arrastra los
   archivos de esta carpeta en el navegador (GitHub acepta hasta 100 archivos
   por arrastre, así que sube primero `prisma` y `public` y los archivos
   sueltos, y luego `src` en dos tandas). Nunca subas la carpeta
   `node_modules` ni el archivo `.env`; el `.gitignore` y el `.env.example`
   incluidos ya lo evitan si usas git o GitHub Desktop.
3. En [render.com](https://render.com) crea un **Web Service** conectado al
   repositorio y configura:
   - **Build Command**: `npm install && npx prisma db push && npm run build`
     (los hooks `postinstall` y `postbuild` hacen el resto: eligen el esquema
     de Prisma correcto y copian los archivos estáticos al servidor standalone).
   - **Start Command**: `npm run start` (el script `start` ya fija
     `HOSTNAME=0.0.0.0`, imprescindible en Render: sin él el servidor escucha
     en el nombre interno del contenedor y la URL pública responde 502).
   - **Variable de entorno**: `DATABASE_URL` con la cadena de Neon (y,
     opcionalmente, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`).
     Consejo: si la cadena de conexión llegó a un chat o correo, pulsa
     **Reset password** en Neon y pega en Render la cadena nueva.
4. Abre tu URL `*.onrender.com`: el contenido de ejemplo se siembra solo en el
   primer arranque. En el log de Render, el arranque correcto muestra
   `- Local: http://localhost:10000` (no el nombre interno del contenedor).

## Desarrollador por defecto

- Correo: `admin@minegocito.cu` (o el valor de `ADMIN_EMAIL`)
- Contraseña: `Minegocito2026` (o el valor de `ADMIN_PASSWORD`)

Entra a `/#/desarrollador` y **cámbiala en Ajustes → Cambiar contraseña**.

## Desarrollo local (SQLite)

```bash
cp .env.example .env              # usa DATABASE_URL=file:./db/custom.db
npm install
npm run db:push                   # aplica prisma/schema.sqlite.prisma
npm run dev                       # http://localhost:3000
```

En producción (PostgreSQL/Neon) los esquemas se aplican con
`npx prisma db push` (Render lo hace en el Build Command) o
`npm run db:push:pg`.

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
