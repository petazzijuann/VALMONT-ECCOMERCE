"use client";

import { useState } from "react";
import useSWR from "swr";
import type { DashboardMetrics } from "@/types";
import { formatARS } from "@/lib/utils";
import MetricCard from "./MetricCard";
import SalesChart from "./SalesChart";
import TopProductsTable from "./TopProductsTable";
import LowStockAlert from "./LowStockAlert";

type Period = DashboardMetrics["period"];

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "HOY" },
  { key: "week",  label: "SEMANA" },
  { key: "month", label: "MES" },
  { key: "all",   label: "TODO" },
];

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<DashboardMetrics>);

function SkeletonCard() {
  return <div className="bg-muted h-28 animate-pulse" />;
}

export default function DashboardClient() {
  const [period, setPeriod] = useState<Period>("month");
  const { data, isLoading } = useSWR<DashboardMetrics>(
    `/api/admin/dashboard?period=${period}`,
    fetcher
  );

  return (
    <div className="space-y-8">
      {/* Period selector */}
      <div className="flex gap-1">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`label-tag text-[11px] px-4 py-2 transition-colors ${
              period === key
                ? "bg-brand-green text-brand-cream"
                : "border border-border text-muted-foreground hover:border-brand-green hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
        ) : data ? (
          <>
            <MetricCard label="INGRESOS"          value={data.revenue}          format="currency" />
            <MetricCard label="GANANCIA NETA"     value={data.profit}           format="currency" />
            <MetricCard label="MARGEN PROMEDIO"   value={data.margin_avg}       format="percent" />
            <MetricCard label="VENTAS"            value={data.sales_count}      format="number" />
            <MetricCard
              label="STOCK AL COSTO"
              value={data.stock_value_cost}
              format="currency"
              sub={`Valor venta: ${formatARS(data.stock_value_sale)}`}
            />
            <MetricCard label="CMV"               value={data.cogs}             format="currency" />
          </>
        ) : null}
      </div>

      {/* Sales chart */}
      {!isLoading && data && (
        <div className="bg-card border border-border p-6">
          <p className="label-tag text-[10px] text-muted-foreground mb-6">
            INGRESOS VS GANANCIA
          </p>
          <SalesChart data={data.sales_by_day} />
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-brand-green" />
              <span className="label-tag text-[10px] text-muted-foreground">INGRESOS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-green-mid" />
              <span className="label-tag text-[10px] text-muted-foreground">GANANCIA</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom grid */}
      {!isLoading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopProductsTable products={data.top_products} />
          <LowStockAlert    items={data.low_stock} />
        </div>
      )}
    </div>
  );
}
