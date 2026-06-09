import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSessionPlayer } from "@/lib/prode/auth";

export async function GET() {
  const player = await getSessionPlayer();
  const settings = await prisma.prodeSettings.findUnique({ where: { id: "main" } });
  const locked = settings?.predictions_locked ?? false;

  if (!player) {
    return NextResponse.json({ player: null, locked });
  }

  return NextResponse.json({
    player: {
      instagram: player.instagram,
      email: player.email,
      submitted: player.submitted_at !== null,
      total_points: player.total_points,
    },
    locked,
  });
}
