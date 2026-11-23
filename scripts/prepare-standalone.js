// Copia los archivos estáticos (public/ y .next/static) dentro de la carpeta
// del servidor standalone. Se ejecuta automáticamente tras "npm run build"
// (hook postbuild), así no hace falta encadenar comandos "cp" en el Build
// Command de Render ni recordarlos a mano.
//
// Sin este paso el sitio responde, pero pierde el CSS y el JavaScript
// (los archivos /_next/static/* devolverían 404).
const fs = require('node:fs')
const path = require('node:path')

const root = process.cwd()
const standalone = path.join(root, '.next', 'standalone')

if (!fs.existsSync(path.join(standalone, 'server.js'))) {
  console.warn('> prepare-standalone: no existe .next/standalone/server.js, se omite la copia.')
  process.exit(0)
}

// public → .next/standalone/public
const publicSrc = path.join(root, 'public')
if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, path.join(standalone, 'public'), { recursive: true })
  console.log('> prepare-standalone: public/ copiado a .next/standalone/public/')
}

// .next/static → .next/standalone/.next/static
const staticSrc = path.join(root, '.next', 'static')
if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, path.join(standalone, '.next', 'static'), { recursive: true })
  console.log('> prepare-standalone: .next/static copiado a .next/standalone/.next/static/')
}

console.log('> prepare-standalone: listo.')
