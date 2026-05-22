"use client";

import useSWR from "swr";

interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<Subscriber[]>);

export default function SubscribersTable() {
  const { data: subscribers, isLoading } = useSWR<Subscriber[]>(
    "/api/admin/subscribers",
    fetcher
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="label-tag text-muted-foreground text-[10px] mb-1">LISTA</p>
          <h1 className="font-bebas text-5xl">SUSCRIPTORES</h1>
        </div>
        <button
          onClick={() => window.open("/api/admin/subscribers?format=csv", "_blank")}
          className="label-tag text-[11px] px-6 py-3 bg-brand-green text-brand-cream hover:bg-green-mid transition-colors shrink-0"
        >
          EXPORTAR CSV
        </button>
      </div>

      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr>
              <th className="label-tag text-[10px] text-muted-foreground text-left px-4 py-3">EMAIL</th>
              <th className="label-tag text-[10px] text-muted-foreground text-left px-4 py-3">FECHA</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-4 py-3"><div className="h-4 bg-muted animate-pulse w-48" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-muted animate-pulse w-24" /></td>
                </tr>
              ))
            ) : subscribers?.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Todavía no hay suscriptores.
                </td>
              </tr>
            ) : (
              subscribers?.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString("es-AR", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && subscribers && subscribers.length > 0 && (
        <p className="text-muted-foreground text-xs label-tag text-right">
          {subscribers.length} suscriptor{subscribers.length !== 1 ? "es" : ""}
        </p>
      )}
    </div>
  );
}
