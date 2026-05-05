import { NextRequest, NextResponse } from "next/server";
import { bot } from "@/lib/telegram/bot";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (secret !== process.env.TELEGRAM_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  await bot.handleUpdate(body);
  return NextResponse.json({ ok: true });
}
