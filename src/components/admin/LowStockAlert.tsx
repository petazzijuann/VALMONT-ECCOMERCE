import type { DashboardMetrics } from "@/types";

type Item = DashboardMetrics["low_stock"][number];

export default function LowStockAlert({ items }: { items: Item[] }) {
  return (
    <div className="bg-card border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <p className="label-tag text-[10px] text-muted-foreground">STOCK BAJO</p>
        {items.length > 0 && (
          <span className="label-tag text-[10px] bg-valmont-error text-white px-1.5 py-0.5">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Stock saludable en todos los productos.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.name} className="border-b border-border pb-4 last:border-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <span className="font-medium text-sm truncate">{item.name}</span>
                <span className="label-tag text-[10px] text-muted-foreground shrink-0">
                  {item.total_units} u. total
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(item.stock).map(([size, qty]) => (
                  <span
                    key={size}
                    className={`label-tag text-[10px] px-2 py-0.5 ${
                      qty <= 3
                        ? "bg-valmont-error/10 text-valmont-error"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {size}: {qty}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
