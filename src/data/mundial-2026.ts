/**
 * Fixture oficial del Mundial 2026 (Canadá / México / EE.UU.).
 * Sorteo final: 05/12/2025. 48 equipos, 12 grupos (A–L) de 4 equipos.
 *
 * `code` = ISO 3166-1 alpha-2 en minúscula, usado para las banderas de flagcdn.com
 * (incluye sub-banderas británicas gb-eng / gb-sct).
 */

export interface Team {
  code: string;  // ej. "ar", "gb-eng"
  name: string;  // nombre en español
  group: string; // "A".."L"
}

export const TEAMS: Team[] = [
  // Grupo A
  { code: "mx",     name: "México",          group: "A" },
  { code: "za",     name: "Sudáfrica",       group: "A" },
  { code: "kr",     name: "Corea del Sur",   group: "A" },
  { code: "cz",     name: "Chequia",         group: "A" },
  // Grupo B
  { code: "ca",     name: "Canadá",          group: "B" },
  { code: "ba",     name: "Bosnia",          group: "B" },
  { code: "qa",     name: "Qatar",           group: "B" },
  { code: "ch",     name: "Suiza",           group: "B" },
  // Grupo C
  { code: "br",     name: "Brasil",          group: "C" },
  { code: "ht",     name: "Haití",           group: "C" },
  { code: "ma",     name: "Marruecos",       group: "C" },
  { code: "gb-sct", name: "Escocia",         group: "C" },
  // Grupo D
  { code: "us",     name: "Estados Unidos",  group: "D" },
  { code: "py",     name: "Paraguay",        group: "D" },
  { code: "tr",     name: "Turquía",         group: "D" },
  { code: "au",     name: "Australia",       group: "D" },
  // Grupo E
  { code: "de",     name: "Alemania",        group: "E" },
  { code: "cw",     name: "Curazao",         group: "E" },
  { code: "ci",     name: "Costa de Marfil", group: "E" },
  { code: "ec",     name: "Ecuador",         group: "E" },
  // Grupo F
  { code: "nl",     name: "Países Bajos",    group: "F" },
  { code: "jp",     name: "Japón",           group: "F" },
  { code: "se",     name: "Suecia",          group: "F" },
  { code: "tn",     name: "Túnez",           group: "F" },
  // Grupo G
  { code: "be",     name: "Bélgica",         group: "G" },
  { code: "eg",     name: "Egipto",          group: "G" },
  { code: "ir",     name: "Irán",            group: "G" },
  { code: "nz",     name: "Nueva Zelanda",   group: "G" },
  // Grupo H
  { code: "es",     name: "España",          group: "H" },
  { code: "cv",     name: "Cabo Verde",      group: "H" },
  { code: "sa",     name: "Arabia Saudita",  group: "H" },
  { code: "uy",     name: "Uruguay",         group: "H" },
  // Grupo I
  { code: "fr",     name: "Francia",         group: "I" },
  { code: "sn",     name: "Senegal",         group: "I" },
  { code: "iq",     name: "Irak",            group: "I" },
  { code: "no",     name: "Noruega",         group: "I" },
  // Grupo J
  { code: "ar",     name: "Argentina",       group: "J" },
  { code: "dz",     name: "Argelia",         group: "J" },
  { code: "at",     name: "Austria",         group: "J" },
  { code: "jo",     name: "Jordania",        group: "J" },
  // Grupo K
  { code: "pt",     name: "Portugal",        group: "K" },
  { code: "cd",     name: "RD Congo",        group: "K" },
  { code: "uz",     name: "Uzbekistán",      group: "K" },
  { code: "co",     name: "Colombia",        group: "K" },
  // Grupo L
  { code: "gb-eng", name: "Inglaterra",      group: "L" },
  { code: "hr",     name: "Croacia",         group: "L" },
  { code: "gh",     name: "Ghana",           group: "L" },
  { code: "pa",     name: "Panamá",          group: "L" },
];

export const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

export interface FixtureMatch {
  code: string;  // ej. "A1".."A6"
  group: string;
  home: string;  // team code
  away: string;  // team code
}

/**
 * Orden round-robin para un grupo de 4 equipos [0,1,2,3].
 * Cada equipo juega contra los otros tres → 6 partidos por grupo.
 */
const ROUND_ROBIN: [number, number][] = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2],
];

function buildFixture(): FixtureMatch[] {
  const matches: FixtureMatch[] = [];
  for (const group of GROUPS) {
    const teams = TEAMS.filter((t) => t.group === group);
    ROUND_ROBIN.forEach(([h, a], i) => {
      matches.push({
        code: `${group}${i + 1}`,
        group,
        home: teams[h].code,
        away: teams[a].code,
      });
    });
  }
  return matches;
}

/** 72 partidos de fase de grupos (12 grupos × 6). */
export const FIXTURE: FixtureMatch[] = buildFixture();

const TEAM_BY_CODE = new Map(TEAMS.map((t) => [t.code, t]));

export function teamByCode(code: string | null | undefined): Team | undefined {
  return code ? TEAM_BY_CODE.get(code) : undefined;
}

/** URL de la bandera en flagcdn.com. `size` = ancho en px del set predefinido (20,40,80,160…). */
export function flagUrl(code: string, size: 20 | 40 | 80 | 160 = 80): string {
  return `https://flagcdn.com/w${size}/${code}.png`;
}
