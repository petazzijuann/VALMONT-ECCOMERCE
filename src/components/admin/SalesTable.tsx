"use client";

import useSWR from "swr";
import type { SaleRecord } from "@/types";
import { formatARS } from "@/lib/utils";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<SaleRecord[]>);

function MarginBadge({ sale, cost }: { sale: number; cost: number }) {
  const m = Math.round(((sale - cost) / sale) * 100);
  const cls =
    m >= 40
      ? "bg-valmont-success/10 text-valmont-success"
      : m >= 20
      ? "bg-yellow-500/10 text-yellow-600"
      : "bg-valmont-error/10 text-valmont-error";
  return <span className={`label-tag text-[10px] px-2 py-0.5 ${cls}`}>{m}%</span>;
}

const HEADERS = [
  "FECHA", "PRODUCTO", "TALLE", "U.",
  "PRECIO", "COSTO", "MARGEN", "CANAL", "PAGO",
];

export default function SalesTable() {
  const { data: sales, isLoading } = useSWR<SaleRecord[]>(
    "/api/admin/sales?limit=200",
    fetcher
  );

  function exportCSV() {
    window.open("/api/admin/sales?format=csv", "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="label-tag text-muted-foreground text-[10px] mb-1">HISTORIAL</p>
          <h1 className="font-bebas text-5xl">VENTAS</h1>
        </div>
        <button
          onClick={exportCSV}
          className="label-tag text-[11px] px-6 py-3 bg-brand-green text-brand-cream hover:bg-green-mid transition-colors shrink-0"
        >
          EXPORTAR CSV
        </button>
      </div>

      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="border-b border-border">
            <tr>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="label-tag text-[10px] text-muted-foreground text-left px-4 py-3 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {HEADERS.map((h) => (
                      <td key={h} className="px-4 py-3">
                        <div className="h-4 bg-muted animate-pulse rounded-none w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              : sales?.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No hay ventas registradas todavía.
                    </td>
                  </tr>
                )
              : sales?.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{s.product_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.size}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.quantity}</td>
                    <td className="px-4 py-3">{formatARS(s.sale_price)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatARS(s.cost_price)}</td>
                    <td className="px-4 py-3">
                      <MarginBadge sale={s.sale_price} cost={s.cost_price} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`label-tag text-[10px] px-2 py-0.5 ${
                          s.channel === "online"
                            ? "bg-brand-green/10 text-brand-green"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.payment_method}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
