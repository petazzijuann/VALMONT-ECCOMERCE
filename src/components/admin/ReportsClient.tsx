"use client";

import useSWR from "swr";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatARS } from "@/lib/utils";

interface Bucket {
  revenue: number;
  profit: number;
  units: number;
}

interface ReportsData {
  byCategory: Record<string, Bucket>;
  byChannel:  Record<string, Bucket>;
  byPayment:  Record<string, Bucket>;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<ReportsData>);

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-green border border-green-mid px-3 py-2 text-xs text-brand-cream space-y-1">
      <p className="font-bold capitalize">{label}</p>
      {payload.map((e) => (
        <p key={e.dataKey}>
          {e.dataKey === "revenue" ? "Ingresos" : "Ganancia"}: {formatARS(e.value)}
        </p>
      ))}
    </div>
  );
}

function StatRow({ label, bucket }: { label: string; bucket: Bucket }) {
  const margin =
    bucket.revenue > 0
      ? Math.round(((bucket.revenue - (bucket.revenue - bucket.profit)) / bucket.revenue) * 100)
      : 0;
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="label-tag text-[11px] capitalize">{label}</span>
      <div className="flex gap-6 text-sm">
        <span className="text-muted-foreground">{bucket.units} u.</span>
        <span>{formatARS(bucket.revenue)}</span>
        <span className="text-valmont-success">{formatARS(bucket.profit)}</span>
        <span className="label-tag text-[10px] text-muted-foreground">{margin}%</span>
      </div>
    </div>
  );
}

export default function ReportsClient() {
  const { data, isLoading } = useSWR<ReportsData>("/api/admin/reports", fetcher);

  const categoryData = data
    ? Object.entries(data.byCategory).map(([name, v]) => ({ name, ...v }))
    : [];

  return (
    <div className="space-y-8">
      <div>
        <p className="label-tag text-muted-foreground text-[10px] mb-1">ANÁLISIS</p>
        <h1 className="font-bebas text-5xl">REPORTES</h1>
        <p className="text-sm text-muted-foreground mt-1">Datos del mes en curso.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-muted h-40 animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Revenue by category — bar chart */}
          <div className="bg-card border border-border p-6">
            <p className="label-tag text-[10px] text-muted-foreground mb-6">
              INGRESOS POR CATEGORÍA
            </p>
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin ventas este mes.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={categoryData}
                  margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#d4d4cc"
                    strokeOpacity={0.4}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#737370" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#737370" }}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                    }
                    tickLine={false}
                    axisLine={false}
                    width={48}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" fill="#1b3022" maxBarSize={48} />
                  <Bar dataKey="profit"  fill="#2d4a35" maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Channel breakdown */}
          <div className="bg-card border border-border p-6">
            <p className="label-tag text-[10px] text-muted-foreground mb-4">
              VENTAS POR CANAL
            </p>
            {Object.entries(data.byChannel).map(([key, bucket]) => (
              <StatRow key={key} label={key} bucket={bucket} />
            ))}
          </div>

          {/* Payment breakdown */}
          <div className="bg-card border border-border p-6">
            <p className="label-tag text-[10px] text-muted-foreground mb-4">
              VENTAS POR MÉTODO DE PAGO
            </p>
            {Object.entries(data.byPayment).map(([key, bucket]) => (
              <StatRow key={key} label={key} bucket={bucket} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
