import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";

const schema = z.object({
  nombre:  z.string().min(2, "Nombre demasiado corto"),
  email:   z.string().email("Email inválido"),
  asunto:  z.string().max(100).optional(),
  mensaje: z.string().min(10, "Mensaje demasiado corto").max(1000),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first.message, field: String(first.path[0]) }, { status: 400 });
  }

  const { nombre, email, asunto, mensaje } = parsed.data;

  // Rate limit: max 3 mensajes por email en la última hora
  const recentCount = await prisma.contactMessage.count({
    where: {
      email,
      created_at: { gte: new Date(Date.now() - 3_600_000) },
    },
  });
  if (recentCount >= 3) {
    return NextResponse.json(
      { error: "Demasiados mensajes. Intentá de nuevo en una hora." },
      { status: 429 }
    );
  }

  await prisma.contactMessage.create({
    data: { nombre, email, asunto, mensaje },
  });

  // Notificación Telegram (no bloqueante)
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  if (chatId && token) {
    const text =
      `📩 *Nuevo mensaje de contacto*\n\n` +
      `*Nombre:* ${nombre}\n` +
      `*Email:* ${email}\n` +
      (asunto ? `*Asunto:* ${asunto}\n` : "") +
      `*Mensaje:*\n${mensaje}`;

    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
