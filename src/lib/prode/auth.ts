/**
 * Autenticación propia del Prode (separada del admin Supabase).
 *
 * - Hash de contraseña con scrypt de `node:crypto` (sin dependencias extra).
 * - Sesión: cookie httpOnly `prode_session` con el playerId firmado por HMAC-SHA256.
 */

import { cookies } from "next/headers";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
import { prisma } from "@/lib/prisma/client";

const COOKIE_NAME = "prode_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90 días

function sessionSecret(): string {
  const secret =
    process.env.PRODE_SESSION_SECRET ||
    process.env.TELEGRAM_SECRET || // fallback razonable si no se configuró el propio
    "";
  if (!secret) {
    console.warn(
      "[prode/auth] PRODE_SESSION_SECRET no está configurado; usando secreto inseguro de desarrollo."
    );
    return "prode-dev-insecure-secret";
  }
  return secret;
}

// ── Contraseñas ──────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const test = scryptSync(password, salt, 64);
  if (hashBuf.length !== test.length) return false;
  return timingSafeEqual(hashBuf, test);
}

// ── Token de sesión (playerId.firma) ─────────────────────────

function sign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(value).digest("hex");
}

function makeToken(playerId: string): string {
  return `${playerId}.${sign(playerId)}`;
}

function readToken(token: string | undefined): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const playerId = token.slice(0, idx);
  const signature = token.slice(idx + 1);
  const expected = sign(playerId);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return playerId;
}

// ── Cookie helpers (usar dentro de Route Handlers / Server Components) ──

export async function createSession(playerId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, makeToken(playerId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

/** Devuelve el jugador logueado (o null). Lee y valida la cookie firmada. */
export async function getSessionPlayer() {
  const cookieStore = await cookies();
  const playerId = readToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!playerId) return null;
  return prisma.prodePlayer.findUnique({ where: { id: playerId } });
}
