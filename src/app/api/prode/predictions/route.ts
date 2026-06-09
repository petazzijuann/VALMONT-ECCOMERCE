import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { getSessionPlayer } from "@/lib/prode/auth";
import { teamByCode } from "@/data/mundial-2026";

// ── GET: partidos + predicciones propias ─────────────────────

export async function GET() {
  const player = await getSessionPlayer();
  if (!player) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [matches, settings, myPreds] = await Promise.all([
    prisma.prodeMatch.findMany({ orderBy: { code: "asc" } }),
    prisma.prodeSettings.findUnique({ where: { id: "main" } }),
    prisma.prodeMatchPrediction.findMany({ where: { player_id: player.id } }),
  ]);

  const scores: Record<string, { home: number; away: number }> = {};
  for (const p of myPreds) {
    scores[p.match_id] = { home: p.home_score, away: p.away_score };
  }

  return NextResponse.json({
    matches: matches.map((m) => ({
      id: m.id,
      code: m.code,
      group: m.group,
      home_team: m.home_team,
      away_team: m.away_team,
    })),
    locked: settings?.predictions_locked ?? false,
    mine: {
      submitted: player.submitted_at !== null,
      champion: player.champion,
      runner_up: player.runner_up,
      top_scorer: player.top_scorer,
      best_player: player.best_player,
      scores,
    },
  });
}

// ── POST: envío único de pronósticos ─────────────────────────

const scoreSchema = z.object({
  home: z.number().int().min(0).max(99),
  away: z.number().int().min(0).max(99),
});

const schema = z.object({
  scores: z.record(z.string(), scoreSchema),
  champion: z.string().min(1, "Elegí el campeón"),
  runner_up: z.string().min(1, "Elegí el subcampeón"),
  top_scorer: z.string().trim().min(2, "Ingresá el goleador").max(80),
  best_player: z.string().trim().min(2, "Ingresá el mejor jugador").max(80),
});

export async function POST(request: NextRequest) {
  const player = await getSessionPlayer();
  if (!player) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const settings = await prisma.prodeSettings.findUnique({ where: { id: "main" } });
  if (settings?.predictions_locked) {
    return NextResponse.json(
      { error: "Los pronósticos están cerrados. ¡El Mundial ya arrancó!" },
      { status: 403 }
    );
  }
  if (player.submitted_at) {
    return NextResponse.json(
      { error: "Ya enviaste tus pronósticos. Solo se puede una vez." },
      { status: 409 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const { scores, champion, runner_up, top_scorer, best_player } = parsed.data;

  if (!teamByCode(champion) || !teamByCode(runner_up)) {
    return NextResponse.json({ error: "Selección inválida" }, { status: 400 });
  }

  const matches = await prisma.prodeMatch.findMany({ select: { id: true } });
  const missing = matches.find((m) => !scores[m.id]);
  if (missing) {
    return NextResponse.json(
      { error: "Faltan resultados de algunos partidos." },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.prodeMatchPrediction.createMany({
      data: matches.map((m) => ({
        player_id: player.id,
        match_id: m.id,
        home_score: scores[m.id].home,
        away_score: scores[m.id].away,
      })),
    }),
    prisma.prodePlayer.update({
      where: { id: player.id },
      data: {
        champion,
        runner_up,
        top_scorer: top_scorer.trim(),
        best_player: best_player.trim(),
        submitted_at: new Date(),
      },
    }),
  ]);

  return NextResponse.json({ ok: true }, { status: 201 });
}
