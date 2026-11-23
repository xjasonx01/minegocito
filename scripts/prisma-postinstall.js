// Elige el esquema de Prisma correcto al instalar dependencias.
//
//  - Si DATABASE_URL apunta a PostgreSQL (Neon/Render)  → prisma/schema.prisma
//  - En cualquier otro caso (desarrollo local)          → prisma/schema.sqlite.prisma
//
// Antes el postinstall generaba SIEMPRE el cliente de SQLite, y eso rompía la
// app en producción cuando DATABASE_URL era una cadena postgres:// de Neon.
const { execSync } = require('node:child_process')

const url = process.env.DATABASE_URL || ''
const isPostgres = /^postgres(ql)?:\/\//i.test(url)
const schema = isPostgres ? 'prisma/schema.prisma' : 'prisma/schema.sqlite.prisma'

console.log(`> postinstall: DATABASE_URL ${isPostgres ? 'es PostgreSQL' : 'no es PostgreSQL (local)'} → generando cliente con ${schema}`)
execSync(`npx prisma generate --schema ${schema}`, { stdio: 'inherit' })
