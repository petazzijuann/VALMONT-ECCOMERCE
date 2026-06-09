import Link from "next/link";
import { prisma } from "@/lib/prisma/client";
import { getSessionPlayer } from "@/lib/prode/auth";
import { POINTS } from "@/lib/prode/scoring";
import { TEAMS, GROUPS, teamByCode } from "@/data/mundial-2026";
import TeamFlag from "@/components/prode/TeamFlag";
import RankingTable from "@/components/prode/RankingTable";
import LogoutButton from "@/components/prode/LogoutButton";

export const metadata = {
  title: "Prode Mundial 2026 — VALMONT",
  description: "Jugá el Prode del Mundial 2026 con VALMONT. Pronosticá los partidos, el campeón, el goleador y el mejor jugador.",
};

export const dynamic = "force-dynamic";

export default async function ProdePage() {
  const [player, settings, ranking] = await Promise.all([
    getSessionPlayer(),
    prisma.prodeSettings.findUnique({ where: { id: "main" } }),
    prisma.prodePlayer.findMany({
      where: { submitted_at: { not: null } },
      orderBy: [{ total_points: "desc" }, { submitted_at: "asc" }],
      take: 200,
      select: { instagram: true, total_points: true, match_points: true, extras_points: true },
    }),
  ]);

  const hasOfficialResults =
    settings?.champion || settings?.runner_up || settings?.top_scorer || settings?.best_player;

  return (
    <div className="bg-background">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="bg-brand-green text-brand-cream">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
          <p className="label-tag text-cream-dark">CANADÁ · MÉXICO · ESTADOS UNIDOS</p>
          <h1 className="font-bebas text-6xl md:text-8xl tracking-wide mt-2 leading-none">
            PRODE MUNDIAL<br />2026
          </h1>
          <p className="max-w-xl mx-auto mt-5 text-cream-dark text-sm md:text-base">
            Pronosticá los 72 partidos de la fase de grupos, el campeón, el subcampeón,
            el goleador y el mejor jugador. Sumá puntos y peleá el primer puesto del ranking VALMONT.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {player ? (
              <>
                <Link
                  href="/prode/jugar"
                  className="bg-brand-cream text-brand-green px-8 py-4 font-bold tracking-widest text-sm hover:bg-white transition-colors"
                >
                  {player.submitted_at ? "VER MIS PRONÓSTICOS" : "CARGAR MIS PRONÓSTICOS"}
                </Link>
                <span className="label-tag text-cream-dark">@{player.instagram}</span>
                <LogoutButton className="label-tag text-cream-dark hover:text-brand-cream transition-colors" />
              </>
            ) : (
              <>
                <Link
                  href="/prode/registro"
                  className="bg-brand-cream text-brand-green px-8 py-4 font-bold tracking-widest text-sm hover:bg-white transition-colors"
                >
                  JUGAR AHORA
                </Link>
                <Link
                  href="/prode/login"
                  className="border border-cream-dark text-brand-cream px-8 py-4 font-bold tracking-widest text-sm hover:border-brand-cream transition-colors"
                >
                  YA TENGO CUENTA
                </Link>
              </>
            )}
          </div>
          {settings?.predictions_locked && (
            <p className="label-tag text-cream-dark/70 mt-4">⚠ LOS PRONÓSTICOS ESTÁN CERRADOS</p>
          )}
        </div>
      </section>

      {/* ── Cómo funciona ────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="font-bebas text-3xl text-brand-green text-center mb-8">CÓMO SE PUNTÚA</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          <ScoreCard pts={POINTS.exactScore} label="Resultado exacto" />
          <ScoreCard pts={POINTS.outcome} label="Acertar el ganador" />
          <ScoreCard pts={POINTS.champion} label="Campeón" />
          <ScoreCard pts={POINTS.runnerUp} label="Subcampeón" />
          <ScoreCard pts={POINTS.topScorer} label="Goleador" />
          <ScoreCard pts={POINTS.bestPlayer} label="Mejor jugador" />
        </div>
      </section>

      {/* ── Resultados oficiales (si están cargados) ─────── */}
      {hasOfficialResults && (
        <section className="bg-muted">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <h2 className="font-bebas text-3xl text-brand-green text-center mb-8">
              RESULTADOS OFICIALES
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <OfficialCard label="🏆 Campeón" value={teamByCode(settings?.champion)?.name} code={settings?.champion} />
              <OfficialCard label="🥈 Subcampeón" value={teamByCode(settings?.runner_up)?.name} code={settings?.runner_up} />
              <OfficialCard label="⚽ Goleador" value={settings?.top_scorer} />
              <OfficialCard label="⭐ Mejor jugador" value={settings?.best_player} />
            </div>
          </div>
        </section>
      )}

      {/* ── Ranking ──────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-14">
        <h2 className="font-bebas text-3xl text-brand-green text-center mb-2">RANKING</h2>
        <p className="text-center text-muted-foreground text-sm mb-8">
          {ranking.length} {ranking.length === 1 ? "jugador" : "jugadores"} en juego
        </p>
        <RankingTable players={ranking} highlight={player?.instagram} />
      </section>

      {/* ── Grupos ───────────────────────────────────────── */}
      <section className="bg-muted">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="font-bebas text-3xl text-brand-green text-center mb-8">LOS 12 GRUPOS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {GROUPS.map((g) => (
              <div key={g} className="bg-card border border-border p-5">
                <p className="font-bebas text-xl text-brand-green mb-3">GRUPO {g}</p>
                <ul className="space-y-2">
                  {TEAMS.filter((t) => t.group === g).map((t) => (
                    <li key={t.code} className="text-sm">
                      <TeamFlag code={t.code} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────── */}
      {!player && (
        <section className="bg-brand-green text-brand-cream text-center py-14 px-4">
          <h2 className="font-bebas text-4xl tracking-wide">¿LISTO PARA JUGAR?</h2>
          <p className="text-cream-dark text-sm mt-2 mb-6">Registrate con tu Instagram y cargá tus pronósticos.</p>
          <Link
            href="/prode/registro"
            className="inline-block bg-brand-cream text-brand-green px-10 py-4 font-bold tracking-widest text-sm hover:bg-white transition-colors"
          >
            CREAR MI CUENTA
          </Link>
        </section>
      )}
    </div>
  );
}

function ScoreCard({ pts, label }: { pts: number; label: string }) {
  return (
    <div className="border border-border bg-card p-4">
      <p className="font-bebas text-3xl text-brand-green">+{pts}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function OfficialCard({ label, value, code }: { label: string; value?: string | null; code?: string | null }) {
  return (
    <div className="bg-card border border-border p-5">
      <p className="label-tag text-muted-foreground mb-2">{label}</p>
      {value ? (
        code ? (
          <div className="flex justify-center">
            <TeamFlag code={code} />
          </div>
        ) : (
          <p className="font-bebas text-xl text-brand-green">{value}</p>
        )
      ) : (
        <p className="text-muted-foreground text-sm">—</p>
      )}
    </div>
  );
}
