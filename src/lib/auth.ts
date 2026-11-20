import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

const SECRET = process.env.ADMIN_SESSION_SECRET || 'minegocito-dev-secret-2026'
const COOKIE_NAME = 'mg_session'
const OWNER_COOKIE_NAME = 'mg_owner_session'
const SESSION_HOURS = 24 * 14

// ---------- Password hashing (scrypt, sin dependencias externas) ----------
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

// ---------- Session token (HMAC firmado) ----------
export type SessionPayload = { email: string; exp: number }

function sign(data: string): string {
  return createHmac('sha256', SECRET).update(data).digest('hex')
}

export function createSessionToken(email: string): string {
  const payload: SessionPayload = { email, exp: Date.now() + SESSION_HOURS * 3600_000 }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

export function readSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  if (sign(body) !== sig) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export async function setSessionCookie(email: string) {
  const store = await cookies()
  store.set(COOKIE_NAME, createSessionToken(email), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 })
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  return readSessionToken(store.get(COOKIE_NAME)?.value)
}

export async function requireSession(): Promise<SessionPayload | null> {
  return getSession()
}

// ---------- Sesiones del dueño de negocio (cookie separada) ----------
export async function setOwnerSessionCookie(email: string) {
  const store = await cookies()
  store.set(OWNER_COOKIE_NAME, createSessionToken(email), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  })
}

export async function clearOwnerSessionCookie() {
  const store = await cookies()
  store.set(OWNER_COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 })
}

export async function getOwnerSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  return readSessionToken(store.get(OWNER_COOKIE_NAME)?.value)
}
