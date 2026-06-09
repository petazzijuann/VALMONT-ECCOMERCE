/**
 * Reglas de puntaje del Prode y recálculo del ranking.
 *
 * Ajustá las constantes de POINTS para cambiar cuánto vale cada acierto.
 */

import { prisma } from "@/lib/prisma/client";

export const POINTS = {
  exactScore: 5, // acertar el marcador exacto (ej. 2-1)
  outcome: 2,    // acertar solo el resultado (local / empate / visitante)
  champion: 15,  // acertar el campeón
  runnerUp: 10,  // acertar el subcampeón / finalista
  topScorer: 10, // acertar el goleador
  bestPlayer: 10, // acertar el mejor jugador
} as const;

function outcome(home: number, away: number): "H" | "D" | "A" {
  if (home > away) return "H";
  if (home < away) return "A";
  return "D";
}

/** Puntos de una predicción de partido contra el resultado real. */
export function scoreMatch(
  pred: { home_score: number; away_score: number },
  real: { home_score: number | null; away_score: number | null; finished: boolean }
): number {
  if (!real.finished || real.home_score === null || real.away_score === null) return 0;
  if (pred.home_score === real.home_score && pred.away_score === real.away_score) {
    return POINTS.exactScore;
  }
  if (outcome(pred.home_score, pred.away_score) === outcome(real.home_score, real.away_score)) {
    return POINTS.outcome;
  }
  return 0;
}

/** Compara texto libre (goleador / mejor jugador) ignorando mayúsculas y espacios. */
function textMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const norm = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, ""); // quita acentos combinados
  return norm(a) === norm(b);
}

function scoreExtras(
  player: {
    champion: string | null;
    runner_up: string | null;
    top_scorer: string | null;
    best_player: string | null;
  },
  official: {
    champion: string | null;
    runner_up: string | null;
    top_scorer: string | null;
    best_player: string | null;
  }
): number {
  let pts = 0;
  if (official.champion && player.champion === official.champion) pts += POINTS.champion;
  if (official.runner_up && player.runner_up === official.runner_up) pts += POINTS.runnerUp;
  if (textMatch(player.top_scorer, official.top_scorer)) pts += POINTS.topScorer;
  if (textMatch(player.best_player, official.best_player)) pts += POINTS.bestPlayer;
  return pts;
}

/**
 * Recalcula los puntos de TODAS las predicciones y los totales de cada jugador.
 * Se llama después de que el admin guarda resultados / respuestas oficiales.
 */
export async function recalcAll(): Promise<void> {
  const [matches, settings, players] = await Promise.all([
    prisma.prodeMatch.findMany(),
    prisma.prodeSettings.findUnique({ where: { id: "main" } }),
    prisma.prodePlayer.findMany({ include: { predictions: true } }),
  ]);

  const matchById = new Map(matches.map((m) => [m.id, m]));
  const official = {
    champion: settings?.champion ?? null,
    runner_up: settings?.runner_up ?? null,
    top_scorer: settings?.top_scorer ?? null,
    best_player: settings?.best_player ?? null,
  };

  for (const player of players) {
    let matchPoints = 0;

    for (const pred of player.predictions) {
      const real = matchById.get(pred.match_id);
      const pts = real ? scoreMatch(pred, real) : 0;
      matchPoints += pts;
      if (pts !== pred.points) {
        await prisma.prodeMatchPrediction.update({
          where: { id: pred.id },
          data: { points: pts },
        });
      }
    }

    const extrasPoints = scoreExtras(player, official);

    await prisma.prodePlayer.update({
      where: { id: player.id },
      data: {
        match_points: matchPoints,
        extras_points: extrasPoints,
        total_points: matchPoints + extrasPoints,
      },
    });
  }
}
