import { NextResponse } from "next/server";
import { clearSession } from "@/lib/prode/auth";

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
