import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { recalcAll } from "@/lib/prode/scoring";

// ── GET: partidos + settings + cantidad de jugadores ─────────

export async function GET() {
  const [matches, settings, players] = await Promise.all([
    prisma.prodeMatch.findMany({ orderBy: { code: "asc" } }),
    prisma.prodeSettings.findUnique({ where: { id: "main" } }),
    prisma.prodePlayer.count({ where: { submitted_at: { not: null } } }),
  ]);

  return NextResponse.json({
    matches: matches.map((m) => ({
      id: m.id,
      code: m.code,
      group: m.group,
      home_team: m.home_team,
      away_team: m.away_team,
      home_score: m.home_score,
      away_score: m.away_score,
      finished: m.finished,
    })),
    settings: {
      champion: settings?.champion ?? "",
      runner_up: settings?.runner_up ?? "",
      top_scorer: settings?.top_scorer ?? "",
      best_player: settings?.best_player ?? "",
      predictions_locked: settings?.predictions_locked ?? false,
    },
    players,
  });
}

// ── POST: guardar resultados / respuestas oficiales + recalcular ──

const matchResultSchema = z.object({
  id: z.string(),
  home_score: z.number().int().min(0).max(99).nullable(),
  away_score: z.number().int().min(0).max(99).nullable(),
  finished: z.boolean(),
});

const schema = z.object({
  matches: z.array(matchResultSchema),
  champion: z.string().trim().max(80).nullable().optional(),
  runner_up: z.string().trim().max(80).nullable().optional(),
  top_scorer: z.string().trim().max(80).nullable().optional(),
  best_player: z.string().trim().max(80).nullable().optional(),
  predictions_locked: z.boolean(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await Promise.all(
        d.matches.map((m) =>
          tx.prodeMatch.update({
            where: { id: m.id },
            data: {
              home_score: m.finished ? m.home_score : null,
              away_score: m.finished ? m.away_score : null,
              finished: m.finished && m.home_score !== null && m.away_score !== null,
            },
          })
        )
      );
      await tx.prodeSettings.upsert({
        where: { id: "main" },
        create: {
          id: "main",
          champion: d.champion || null,
          runner_up: d.runner_up || null,
          top_scorer: d.top_scorer || null,
          best_player: d.best_player || null,
          predictions_locked: d.predictions_locked,
        },
        update: {
          champion: d.champion || null,
          runner_up: d.runner_up || null,
          top_scorer: d.top_scorer || null,
          best_player: d.best_player || null,
          predictions_locked: d.predictions_locked,
        },
      });
    }, { timeout: 30000 });

    await recalcAll();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/prode POST]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
