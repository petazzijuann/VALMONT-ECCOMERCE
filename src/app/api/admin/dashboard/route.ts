import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import type { DashboardMetrics, StockMap } from "@/types";

function startOf(unit: "today" | "week" | "month"): Date {
  const now = new Date();
  if (unit === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (unit === "week") {
    const dow = now.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function GET(request: NextRequest) {
  const rawPeriod = request.nextUrl.searchParams.get("period") ?? "month";
  const period = (["today", "week", "month", "all"].includes(rawPeriod)
    ? rawPeriod
    : "month") as DashboardMetrics["period"];

  const since =
    period === "all"
      ? undefined
      : startOf(period === "today" ? "today" : period === "week" ? "week" : "month");

  const [sales, products] = await Promise.all([
    prisma.sale.findMany({
      where: since ? { created_at: { gte: since } } : {},
      orderBy: { created_at: "asc" },
    }),
    prisma.product.findMany({
      select: { name: true, stock: true, price_sale: true, price_cost: true },
    }),
  ]);

  const revenue = sales.reduce((s, v) => s + Number(v.sale_price) * v.quantity, 0);
  const cogs    = sales.reduce((s, v) => s + Number(v.cost_price) * v.quantity, 0);
  const profit  = revenue - cogs;
  const margin_avg = revenue > 0 ? Math.round(((revenue - cogs) / revenue) * 100) : 0;

  // Top products by units sold
  const pMap: Record<string, { units: number; rev: number; cost: number }> = {};
  for (const s of sales) {
    const r = Number(s.sale_price) * s.quantity;
    const c = Number(s.cost_price) * s.quantity;
    if (!pMap[s.product_name]) pMap[s.product_name] = { units: 0, rev: 0, cost: 0 };
    pMap[s.product_name].units += s.quantity;
    pMap[s.product_name].rev  += r;
    pMap[s.product_name].cost += c;
  }
  const top_products = Object.entries(pMap)
    .sort((a, b) => b[1].units - a[1].units)
    .slice(0, 5)
    .map(([name, d]) => ({
      name,
      units_sold:   d.units,
      profit_total: d.rev - d.cost,
      margin:       d.rev > 0 ? Math.round(((d.rev - d.cost) / d.rev) * 100) : 0,
    }));

  // Low stock: any size ≤ 3
  const low_stock = products
    .filter((p) => {
      const s = p.stock as StockMap;
      return Object.values(s).some((q) => q <= 3);
    })
    .map((p) => {
      const s = p.stock as StockMap;
      return {
        name:        p.name,
        stock:       s,
        total_units: Object.values(s).reduce((acc, q) => acc + q, 0),
      };
    });

  // Stock values
  const stock_value_cost = products.reduce((acc, p) => {
    const s = p.stock as StockMap;
    const units = Object.values(s).reduce((a, q) => a + q, 0);
    return acc + units * Number(p.price_cost);
  }, 0);
  const stock_value_sale = products.reduce((acc, p) => {
    const s = p.stock as StockMap;
    const units = Object.values(s).reduce((a, q) => a + q, 0);
    return acc + units * Number(p.price_sale);
  }, 0);

  // Sales by day
  const dayMap: Record<string, { revenue: number; profit: number }> = {};
  for (const s of sales) {
    const key = s.created_at.toISOString().slice(0, 10);
    if (!dayMap[key]) dayMap[key] = { revenue: 0, profit: 0 };
    const r = Number(s.sale_price) * s.quantity;
    const c = Number(s.cost_price) * s.quantity;
    dayMap[key].revenue += r;
    dayMap[key].profit  += r - c;
  }
  const sales_by_day = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));

  return NextResponse.json({
    period,
    revenue,
    cogs,
    profit,
    margin_avg,
    sales_count: sales.length,
    stock_value_cost,
    stock_value_sale,
    top_products,
    low_stock,
    sales_by_day,
  } satisfies DashboardMetrics);
}
