"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatARS } from "@/lib/utils";

interface DataPoint {
  date: string;
  revenue: number;
  profit: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-green border border-green-mid px-3 py-2 text-xs text-brand-cream space-y-1">
      <p className="font-bold">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey}>
          {entry.dataKey === "revenue" ? "Ingresos" : "Ganancia"}:{" "}
          {formatARS(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function SalesChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
        Sin ventas en el período seleccionado.
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date + "T00:00:00").toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#1b3022" stopOpacity={0.7} />
            <stop offset="95%" stopColor="#1b3022" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#2d4a35" stopOpacity={0.7} />
            <stop offset="95%" stopColor="#2d4a35" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#d4d4cc" strokeOpacity={0.4} />
        <XAxis
          dataKey="date"
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
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#1b3022"
          strokeWidth={2}
          fill="url(#gradRevenue)"
        />
        <Area
          type="monotone"
          dataKey="profit"
          stroke="#2d4a35"
          strokeWidth={2}
          fill="url(#gradProfit)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
