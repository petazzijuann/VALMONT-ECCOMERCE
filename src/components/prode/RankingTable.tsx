interface Row {
  instagram: string;
  total_points: number;
  match_points: number;
  extras_points: number;
}

export default function RankingTable({
  players,
  highlight,
}: {
  players: Row[];
  highlight?: string;
}) {
  if (players.length === 0) {
    return (
      <p className="text-center text-muted-foreground text-sm py-10">
        Todavía no hay pronósticos enviados. ¡Sé el primero! 🏆
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-3 pr-2 label-tag text-muted-foreground w-10">#</th>
            <th className="py-3 px-2 label-tag text-muted-foreground">JUGADOR</th>
            <th className="py-3 px-2 label-tag text-muted-foreground text-right hidden sm:table-cell">
              PARTIDOS
            </th>
            <th className="py-3 px-2 label-tag text-muted-foreground text-right hidden sm:table-cell">
              ESPECIALES
            </th>
            <th className="py-3 pl-2 label-tag text-muted-foreground text-right">PUNTOS</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => {
            const isMe = highlight && p.instagram === highlight;
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <tr
                key={p.instagram}
                className={`border-b border-border/60 ${isMe ? "bg-brand-green/10 font-semibold" : ""}`}
              >
                <td className="py-3 pr-2 text-muted-foreground">{medal ?? i + 1}</td>
                <td className="py-3 px-2">
                  <a
                    href={`https://instagram.com/${p.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-green hover:underline"
                  >
                    @{p.instagram}
                  </a>
                </td>
                <td className="py-3 px-2 text-right text-muted-foreground hidden sm:table-cell">
                  {p.match_points}
                </td>
                <td className="py-3 px-2 text-right text-muted-foreground hidden sm:table-cell">
                  {p.extras_points}
                </td>
                <td className="py-3 pl-2 text-right font-bebas text-xl text-brand-green">
                  {p.total_points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
