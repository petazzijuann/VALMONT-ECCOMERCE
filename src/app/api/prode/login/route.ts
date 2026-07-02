import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { verifyPassword, createSession } from "@/lib/prode/auth";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

// Rate limit anti fuerza bruta: 10 intentos por IP+email cada 15 minutos.
// In-memory (best-effort en serverless), igual patrón que shipping/quote.
const attempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(key: string): boolean {
  const now = Date.now();
  if (attempts.size > 1000) {
    for (const [k, v] of attempts) {
      if (now > v.resetAt) attempts.delete(k);
    }
  }
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkLoginRateLimit(`${ip}:${email}`)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
      { status: 429 }
    );
  }
  const player = await prisma.prodePlayer.findUnique({ where: { email } });

  if (!player || !verifyPassword(password, player.password_hash)) {
    return NextResponse.json(
      { error: "Email o contraseña incorrectos." },
      { status: 401 }
    );
  }

  await createSession(player.id);
  return NextResponse.json({ ok: true, instagram: player.instagram });
}
