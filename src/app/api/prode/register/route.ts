import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { hashPassword, createSession } from "@/lib/prode/auth";

const schema = z.object({
  instagram: z
    .string()
    .trim()
    .min(2, "Instagram inválido")
    .max(40)
    .transform((s) => s.replace(/^@+/, "").toLowerCase()),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { instagram, email, password } = parsed.data;

  try {
    const player = await prisma.prodePlayer.create({
      data: { instagram, email, password_hash: hashPassword(password) },
    });

    // El email también se guarda en Suscriptores (ignorar si ya existe).
    await prisma.subscriber.create({ data: { email } }).catch((err) => {
      if (!isUniqueViolation(err)) throw err;
    });

    await createSession(player.id);
    return NextResponse.json({ ok: true, instagram }, { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { error: "Ese Instagram o email ya está registrado. Probá iniciar sesión." },
        { status: 409 }
      );
    }
    console.error("[prode/register]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
