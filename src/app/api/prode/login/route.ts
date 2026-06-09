import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { verifyPassword, createSession } from "@/lib/prode/auth";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { email, password } = parsed.data;
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
