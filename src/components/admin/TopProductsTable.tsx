import type { DashboardMetrics } from "@/types";
import { formatARS } from "@/lib/utils";

type Product = DashboardMetrics["top_products"][number];

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

export default function TopProductsTable({ products }: { products: Product[] }) {
  return (
    <div className="bg-card border border-border p-6">
      <p className="label-tag text-[10px] text-muted-foreground mb-4">TOP PRODUCTOS</p>
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin ventas en este período.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["PRODUCTO", "U.", "GANANCIA", "MARGEN"].map((h) => (
                <th
                  key={h}
                  className={`label-tag text-[10px] text-muted-foreground pb-3 ${
                    h === "PRODUCTO" ? "text-left" : "text-right"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.name} className="border-b border-border last:border-0">
                <td className="py-3 font-medium truncate max-w-[160px]">{p.name}</td>
                <td className="py-3 text-right text-muted-foreground">{p.units_sold}</td>
                <td className="py-3 text-right">{formatARS(p.profit_total)}</td>
                <td className="py-3 text-right">
                  <MarginBadge value={p.margin} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
