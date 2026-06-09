"use client";

import { useEffect, useMemo, useState } from "react";
import { TEAMS, GROUPS, teamByCode } from "@/data/mundial-2026";

interface AdminMatch {
  id: string;
  code: string;
  group: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  finished: boolean;
}

interface Settings {
  champion: string;
  runner_up: string;
  top_scorer: string;
  best_player: string;
  predictions_locked: boolean;
}

type MatchState = Record<string, { home: string; away: string; finished: boolean }>;

export default function ProdeAdminClient() {
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [state, setState] = useState<MatchState>({});
  const [settings, setSettings] = useState<Settings>({
    champion: "",
    runner_up: "",
    top_scorer: "",
    best_player: "",
    predictions_locked: false,
  });
  const [playersCount, setPlayersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/prode");
      const data = await res.json();
      setMatches(data.matches);
      setSettings(data.settings);
      setPlayersCount(data.players);
      const init: MatchState = {};
      for (const m of data.matches as AdminMatch[]) {
        init[m.id] = {
          home: m.home_score === null ? "" : String(m.home_score),
          away: m.away_score === null ? "" : String(m.away_score),
          finished: m.finished,
        };
      }
      setState(init);
      setLoading(false);
    })();
  }, []);

  const byGroup = useMemo(() => {
    const map: Record<string, AdminMatch[]> = {};
    for (const m of matches) (map[m.group] ??= []).push(m);
    return map;
  }, [matches]);

  function setField(id: string, side: "home" | "away", value: string) {
    const clean = value.replace(/\D/g, "").slice(0, 2);
    setState((p) => ({ ...p, [id]: { ...p[id], [side]: clean } }));
  }

  function toggleFinished(id: string) {
    setState((p) => ({ ...p, [id]: { ...p[id], finished: !p[id].finished } }));
  }

  async function handleSave() {
    setSaving(true);
    setMsg("");
    const payload = {
      matches: matches.map((m) => {
        const s = state[m.id];
        const home = s.home === "" ? null : Number(s.home);
        const away = s.away === "" ? null : Number(s.away);
        return { id: m.id, home_score: home, away_score: away, finished: s.finished };
      }),
      champion: settings.champion || null,
      runner_up: settings.runner_up || null,
      top_scorer: settings.top_scorer || null,
      best_player: settings.best_player || null,
      predictions_locked: settings.predictions_locked,
    };
    try {
      const res = await fetch("/api/admin/prode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg(d.error ?? "Error al guardar.");
      } else {
        setMsg("✅ Guardado y ranking recalculado.");
      }
    } catch {
      setMsg("Error de conexión.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="label-tag text-muted-foreground">CARGANDO…</p>;
  }

  const teamsSorted = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8 pb-28">
      <div>
        <p className="label-tag text-muted-foreground text-[10px] mb-1">MUNDIAL 2026</p>
        <h1 className="font-bebas text-5xl">PRODE</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {playersCount} {playersCount === 1 ? "jugador" : "jugadores"} con pronósticos enviados.
        </p>
      </div>

      {/* Respuestas oficiales + lock */}
      <section className="bg-card border border-border p-6 space-y-5">
        <h2 className="font-bebas text-2xl text-brand-green">RESPUESTAS OFICIALES</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label-tag text-muted-foreground block mb-2">CAMPEÓN</label>
            <select
              value={settings.champion}
              onChange={(e) => setSettings({ ...settings, champion: e.target.value })}
              className="w-full border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-brand-green"
            >
              <option value="">— sin definir —</option>
              {teamsSorted.map((t) => (
                <option key={t.code} value={t.code}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-tag text-muted-foreground block mb-2">SUBCAMPEÓN</label>
            <select
              value={settings.runner_up}
              onChange={(e) => setSettings({ ...settings, runner_up: e.target.value })}
              className="w-full border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-brand-green"
            >
              <option value="">— sin definir —</option>
              {teamsSorted.map((t) => (
                <option key={t.code} value={t.code}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-tag text-muted-foreground block mb-2">GOLEADOR</label>
            <input
              type="text"
              value={settings.top_scorer}
              onChange={(e) => setSettings({ ...settings, top_scorer: e.target.value })}
              placeholder="Nombre exacto del jugador"
              className="w-full border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-brand-green"
            />
          </div>
          <div>
            <label className="label-tag text-muted-foreground block mb-2">MEJOR JUGADOR</label>
            <input
              type="text"
              value={settings.best_player}
              onChange={(e) => setSettings({ ...settings, best_player: e.target.value })}
              placeholder="Nombre exacto del jugador"
              className="w-full border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-brand-green"
            />
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={settings.predictions_locked}
            onChange={(e) => setSettings({ ...settings, predictions_locked: e.target.checked })}
            className="w-4 h-4 accent-[#1b3022]"
          />
          <span className="text-sm">
            Cerrar pronósticos (nadie más puede registrar/enviar).
          </span>
        </label>
      </section>

      {/* Resultados de partidos */}
      <section className="space-y-6">
        <h2 className="font-bebas text-2xl text-brand-green">RESULTADOS DE PARTIDOS</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
          {GROUPS.map((g) => (
            <div key={g} className="bg-card border border-border p-4">
              <p className="font-bebas text-lg text-brand-green mb-3">GRUPO {g}</p>
              <div className="space-y-2">
                {(byGroup[g] ?? []).map((m) => {
                  const s = state[m.id];
                  return (
                    <div key={m.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 text-right truncate">
                        {teamByCode(m.home_team)?.name}
                      </span>
                      <input
                        inputMode="numeric"
                        value={s.home}
                        onChange={(e) => setField(m.id, "home", e.target.value)}
                        className="w-9 h-8 text-center border border-input bg-background focus:outline-none focus:border-brand-green"
                      />
                      <span className="text-muted-foreground">-</span>
                      <input
                        inputMode="numeric"
                        value={s.away}
                        onChange={(e) => setField(m.id, "away", e.target.value)}
                        className="w-9 h-8 text-center border border-input bg-background focus:outline-none focus:border-brand-green"
                      />
                      <span className="flex-1 truncate">{teamByCode(m.away_team)?.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleFinished(m.id)}
                        title="Marcar como finalizado"
                        className={`shrink-0 px-2 h-8 text-[10px] tracking-wide border transition-colors ${
                          s.finished
                            ? "bg-brand-green text-brand-cream border-brand-green"
                            : "bg-background text-muted-foreground border-input"
                        }`}
                      >
                        {s.finished ? "FIN" : "—"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Barra de guardado */}
      <div className="fixed bottom-0 left-56 right-0 bg-background/95 backdrop-blur border-t border-border px-8 py-4 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-green text-brand-cream px-8 py-3 font-bold tracking-widest text-sm hover:bg-green-mid transition-colors disabled:opacity-50"
        >
          {saving ? "GUARDANDO…" : "GUARDAR Y RECALCULAR RANKING"}
        </button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </div>
  );
}
