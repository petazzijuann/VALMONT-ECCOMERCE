import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const players = await prisma.prodePlayer.findMany({
    where: { submitted_at: { not: null } },
    orderBy: [{ total_points: "desc" }, { submitted_at: "asc" }],
    take: 200,
    select: {
      instagram: true,
      total_points: true,
      match_points: true,
      extras_points: true,
    },
  });

  return NextResponse.json({ players });
}
