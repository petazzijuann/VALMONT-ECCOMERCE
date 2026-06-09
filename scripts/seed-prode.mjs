/**
 * Siembra los 72 partidos de fase de grupos del Mundial 2026 en `prode_matches`
 * y crea la fila singleton de `prode_settings`.
 *
 * Idempotente: usa ON CONFLICT, se puede correr varias veces sin duplicar.
 *
 * Uso:
 *   node --env-file=.env.local scripts/seed-prode.mjs
 *
 * IMPORTANTE: los códigos/equipos de los grupos deben coincidir con
 * src/data/mundial-2026.ts (mismo orden de equipos por grupo).
 */

import pg from "pg";

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error("❌ Falta DATABASE_URL en el entorno (.env.local).");
  process.exit(1);
}

// Equipos por grupo, en el mismo orden que src/data/mundial-2026.ts
const GROUP_TEAMS = {
  A: ["mx", "za", "kr", "cz"],
  B: ["ca", "ba", "qa", "ch"],
  C: ["br", "ht", "ma", "gb-sct"],
  D: ["us", "py", "tr", "au"],
  E: ["de", "cw", "ci", "ec"],
  F: ["nl", "jp", "se", "tn"],
  G: ["be", "eg", "ir", "nz"],
  H: ["es", "cv", "sa", "uy"],
  I: ["fr", "sn", "iq", "no"],
  J: ["ar", "dz", "at", "jo"],
  K: ["pt", "cd", "uz", "co"],
  L: ["gb-eng", "hr", "gh", "pa"],
};

// Round-robin de 4 equipos → 6 partidos por grupo
const ROUND_ROBIN = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2],
];

function buildFixture() {
  const matches = [];
  for (const [group, teams] of Object.entries(GROUP_TEAMS)) {
    ROUND_ROBIN.forEach(([h, a], i) => {
      matches.push({
        code: `${group}${i + 1}`,
        group,
        home: teams[h],
        away: teams[a],
      });
    });
  }
  return matches;
}

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

try {
  const fixture = buildFixture();
  for (const m of fixture) {
    await client.query(
      `INSERT INTO prode_matches (id, code, "group", home_team, away_team, finished)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, false)
       ON CONFLICT (code) DO UPDATE
         SET "group" = EXCLUDED."group",
             home_team = EXCLUDED.home_team,
             away_team = EXCLUDED.away_team`,
      [m.code, m.group, m.home, m.away]
    );
  }

  await client.query(
    `INSERT INTO prode_settings (id, predictions_locked, updated_at)
     VALUES ('main', false, now())
     ON CONFLICT (id) DO NOTHING`
  );

  const { rows } = await client.query("SELECT count(*)::int AS n FROM prode_matches");
  console.log(`✅ Seed completo. ${rows[0].n} partidos en prode_matches.`);
} catch (err) {
  console.error("❌ Error en el seed:", err);
  process.exitCode = 1;
} finally {
  await client.end();
}
