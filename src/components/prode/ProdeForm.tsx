"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TEAMS, GROUPS, teamByCode, flagUrl } from "@/data/mundial-2026";

interface ApiMatch {
  id: string;
  code: string;
  group: string;
  home_team: string;
  away_team: string;
}

interface MineData {
  submitted: boolean;
  champion: string | null;
  runner_up: string | null;
  top_scorer: string | null;
  best_player: string | null;
  scores: Record<string, { home: number; away: number }>;
}

type ScoreState = Record<string, { home: string; away: string }>;

export default function ProdeForm({ instagram }: { instagram: string }) {
  const router = useRouter();
  const [matches, setMatches] = useState<ApiMatch[]>([]);
  const [scores, setScores] = useState<ScoreState>({});
  const [champion, setChampion] = useState("");
  const [runnerUp, setRunnerUp] = useState("");
  const [topScorer, setTopScorer] = useState("");
  const [bestPlayer, setBestPlayer] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/prode/predictions");
        if (res.status === 401) {
          router.push("/prode/login");
          return;
        }
        const data = await res.json();
        const mine: MineData = data.mine;
        setMatches(data.matches);
        setLocked(data.locked);
        setSubmitted(mine.submitted);
        setChampion(mine.champion ?? "");
        setRunnerUp(mine.runner_up ?? "");
        setTopScorer(mine.top_scorer ?? "");
        setBestPlayer(mine.best_player ?? "");

        const initial: ScoreState = {};
        for (const m of data.matches as ApiMatch[]) {
          const s = mine.scores[m.id];
          initial[m.id] = {
            home: s ? String(s.home) : "",
            away: s ? String(s.away) : "",
          };
        }
        setScores(initial);
      } catch {
        setError("No se pudieron cargar los partidos.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const readOnly = submitted || locked;

  const matchesByGroup = useMemo(() => {
    const map: Record<string, ApiMatch[]> = {};
    for (const m of matches) (map[m.group] ??= []).push(m);
    return map;
  }, [matches]);

  function setScore(id: string, side: "home" | "away", value: string) {
    const clean = value.replace(/\D/g, "").slice(0, 2);
    setScores((prev) => ({ ...prev, [id]: { ...prev[id], [side]: clean } }));
  }

  async function handleSubmit() {
    setError("");

    const missing = matches.some((m) => scores[m.id]?.home === "" || scores[m.id]?.away === "");
    if (missing) {
      setError("Completá el resultado de todos los partidos.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!champion || !runnerUp) {
      setError("Elegí campeón y subcampeón.");
      return;
    }
    if (topScorer.trim().length < 2 || bestPlayer.trim().length < 2) {
      setError("Completá goleador y mejor jugador.");
      return;
    }

    setSaving(true);
    const payload = {
      scores: Object.fromEntries(
        matches.map((m) => [
          m.id,
          { home: Number(scores[m.id].home), away: Number(scores[m.id].away) },
        ])
      ),
      champion,
      runner_up: runnerUp,
      top_scorer: topScorer.trim(),
      best_player: bestPlayer.trim(),
    };

    try {
      const res = await fetch("/api/prode/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar.");
        setSaving(false);
        return;
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("No se pudo conectar. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <p className="label-tag text-cream-dark">CARGANDO PARTIDOS…</p>
      </div>
    );
  }

  const teamsSorted = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Encabezado */}
      <div className="mb-8">
        <p className="label-tag text-green-mid">@{instagram}</p>
        <h1 className="font-bebas text-4xl md:text-5xl text-brand-green tracking-wide">
          MIS PRONÓSTICOS
        </h1>
      </div>

      {/* Estado */}
      {submitted && (
        <div className="mb-8 border-l-4 border-brand-green bg-brand-green/5 px-5 py-4">
          <p className="font-bebas text-2xl text-brand-green">¡PRONÓSTICOS ENVIADOS!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Quedaron guardados y no se pueden modificar. Seguí el ranking para ver cómo te va. 🏆
          </p>
        </div>
      )}
      {locked && !submitted && (
        <div className="mb-8 border-l-4 border-valmont-error bg-valmont-error/5 px-5 py-4">
          <p className="font-bebas text-2xl text-valmont-error">PRONÓSTICOS CERRADOS</p>
          <p className="text-sm text-muted-foreground mt-1">El Mundial ya arrancó. ¡La próxima!</p>
        </div>
      )}

      {error && (
        <div className="mb-6 border border-valmont-error bg-valmont-error/5 px-4 py-3">
          <p className="text-sm text-valmont-error font-medium">{error}</p>
        </div>
      )}

      {/* Predicciones especiales */}
      <section className="mb-10">
        <h2 className="font-bebas text-2xl text-brand-green border-b border-border pb-2 mb-5">
          PREDICCIONES ESPECIALES
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label-tag text-muted-foreground block mb-2">🏆 CAMPEÓN</label>
            <select
              value={champion}
              onChange={(e) => setChampion(e.target.value)}
              disabled={readOnly}
              className="w-full border border-input bg-card px-3 py-3 text-sm focus:outline-none focus:border-brand-green disabled:opacity-60"
            >
              <option value="">Elegí un equipo…</option>
              {teamsSorted.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-tag text-muted-foreground block mb-2">🥈 SUBCAMPEÓN</label>
            <select
              value={runnerUp}
              onChange={(e) => setRunnerUp(e.target.value)}
              disabled={readOnly}
              className="w-full border border-input bg-card px-3 py-3 text-sm focus:outline-none focus:border-brand-green disabled:opacity-60"
            >
              <option value="">Elegí un equipo…</option>
              {teamsSorted.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-tag text-muted-foreground block mb-2">⚽ GOLEADOR</label>
            <input
              type="text"
              value={topScorer}
              onChange={(e) => setTopScorer(e.target.value)}
              disabled={readOnly}
              placeholder="Nombre del jugador"
              className="w-full border border-input bg-card px-3 py-3 text-sm focus:outline-none focus:border-brand-green disabled:opacity-60"
            />
          </div>
          <div>
            <label className="label-tag text-muted-foreground block mb-2">⭐ MEJOR JUGADOR</label>
            <input
              type="text"
              value={bestPlayer}
              onChange={(e) => setBestPlayer(e.target.value)}
              disabled={readOnly}
              placeholder="Nombre del jugador"
              className="w-full border border-input bg-card px-3 py-3 text-sm focus:outline-none focus:border-brand-green disabled:opacity-60"
            />
          </div>
        </div>
      </section>

      {/* Partidos por grupo */}
      <section>
        <h2 className="font-bebas text-2xl text-brand-green border-b border-border pb-2 mb-5">
          FASE DE GRUPOS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
          {GROUPS.map((g) => (
            <div key={g}>
              <p className="font-bebas text-xl text-brand-green mb-3">GRUPO {g}</p>
              <div className="space-y-2">
                {(matchesByGroup[g] ?? []).map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    score={scores[m.id] ?? { home: "", away: "" }}
                    readOnly={readOnly}
                    onChange={(side, v) => setScore(m.id, side, v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Enviar */}
      {!readOnly && (
        <div className="sticky bottom-0 mt-10 -mx-4 px-4 py-4 bg-background/95 backdrop-blur border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-brand-green text-brand-cream py-4 font-bold tracking-widest text-sm hover:bg-green-mid transition-colors disabled:opacity-50"
          >
            {saving ? "ENVIANDO…" : "ENVIAR PRONÓSTICOS (UNA SOLA VEZ)"}
          </button>
          <p className="text-center text-[11px] text-muted-foreground mt-2">
            Revisá todo bien: una vez enviados no se pueden cambiar.
          </p>
        </div>
      )}
    </div>
  );
}

function MatchRow({
  match,
  score,
  readOnly,
  onChange,
}: {
  match: ApiMatch;
  score: { home: string; away: string };
  readOnly: boolean;
  onChange: (side: "home" | "away", value: string) => void;
}) {
  const home = teamByCode(match.home_team);
  const away = teamByCode(match.away_team);

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Local */}
      <div className="flex items-center gap-2 justify-end flex-1 min-w-0">
        <span className="truncate text-right">{home?.name ?? match.home_team}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={flagUrl(match.home_team, 40)} alt="" width={24} height={16}
          className="h-4 w-6 object-cover border border-black/10 shrink-0" />
      </div>
      {/* Marcador */}
      <input
        inputMode="numeric"
        value={score.home}
        onChange={(e) => onChange("home", e.target.value)}
        disabled={readOnly}
        className="w-9 h-9 text-center border border-input bg-card focus:outline-none focus:border-brand-green disabled:opacity-70"
        aria-label={`Goles ${home?.name ?? match.home_team}`}
      />
      <span className="text-muted-foreground">-</span>
      <input
        inputMode="numeric"
        value={score.away}
        onChange={(e) => onChange("away", e.target.value)}
        disabled={readOnly}
        className="w-9 h-9 text-center border border-input bg-card focus:outline-none focus:border-brand-green disabled:opacity-70"
        aria-label={`Goles ${away?.name ?? match.away_team}`}
      />
      {/* Visitante */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={flagUrl(match.away_team, 40)} alt="" width={24} height={16}
          className="h-4 w-6 object-cover border border-black/10 shrink-0" />
        <span className="truncate">{away?.name ?? match.away_team}</span>
      </div>
    </div>
  );
}
