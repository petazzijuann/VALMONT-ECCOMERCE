"use client";

import useSWR from "swr";
import type { ProductAdmin, StockMap } from "@/types";
import { formatARS, calculateMargin } from "@/lib/utils";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<ProductAdmin[]>);

function MarginBadge({ value }: { value: number }) {
  const cls =
    value >= 40
      ? "bg-valmont-success/10 text-valmont-success"
      : value >= 20
      ? "bg-yellow-500/10 text-yellow-600"
      : "bg-valmont-error/10 text-valmont-error";
  return (
    <span className={`label-tag text-[10px] px-2 py-0.5 ${cls}`}>{value}%</span>
  );
}

const HEADERS = ["NOMBRE", "CATEGORÍA", "VENTA", "COSTO", "MARGEN", "STOCK", "ESTADO"];

export default function ProductsTable() {
  const { data: products, isLoading } = useSWR<ProductAdmin[]>(
    "/api/admin/products",
    fetcher
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="label-tag text-muted-foreground text-[10px] mb-1">GESTIÓN</p>
        <h1 className="font-bebas text-5xl">PRODUCTOS</h1>
      </div>

      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="border-b border-border">
            <tr>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="label-tag text-[10px] text-muted-foreground text-left px-4 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {HEADERS.map((h) => (
                      <td key={h} className="px-4 py-3">
                        <div className="h-4 bg-muted animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              : products?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-muted-foreground text-sm"
                    >
                      No hay productos cargados todavía.
                    </td>
                  </tr>
                )
              : products?.map((p) => {
                  const stock = p.stock as StockMap;
                  const totalUnits = Object.values(stock).reduce((s, q) => s + q, 0);
                  const margin = calculateMargin(p.price_sale, p.price_cost);
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium max-w-[200px] truncate">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">
                        {p.category}
                      </td>
                      <td className="px-4 py-3">{formatARS(p.price_sale)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatARS(p.price_cost)}
                      </td>
                      <td className="px-4 py-3">
                        <MarginBadge value={margin} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{totalUnits} u.</td>
                      <td className="px-4 py-3">
                        <span
                          className={`label-tag text-[10px] px-2 py-0.5 ${
                            p.is_published
                              ? "bg-valmont-success/10 text-valmont-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {p.is_published ? "PUBLICADO" : "BORRADOR"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
