import type { Context } from "telegraf";
import { prisma } from "@/lib/prisma/client";
import { formatARS } from "@/lib/utils";

function startOf(unit: "day" | "week" | "month"): Date {
  const now = new Date();
  if (unit === "day") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (unit === "week") {
    const dow = now.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function summarize(sales: { sale_price: unknown; cost_price: unknown; quantity: number }[]) {
  const revenue = sales.reduce((s, v) => s + Number(v.sale_price) * v.quantity, 0);
  const cost    = sales.reduce((s, v) => s + Number(v.cost_price) * v.quantity, 0);
  const margin  = revenue > 0 ? Math.round(((revenue - cost) / revenue) * 100) : 0;
  return { count: sales.length, revenue, profit: revenue - cost, margin };
}

export async function handleMetricas(ctx: Context) {
  const [dayStart, weekStart, monthStart] = [startOf("day"), startOf("week"), startOf("month")];

  const [salesDay, salesWeek, salesMonth, products] = await Promise.all([
    prisma.sale.findMany({
      where: { created_at: { gte: dayStart } },
      select: { sale_price: true, cost_price: true, quantity: true, product_name: true },
    }),
    prisma.sale.findMany({
      where: { created_at: { gte: weekStart } },
      select: { sale_price: true, cost_price: true, quantity: true },
    }),
    prisma.sale.findMany({
      where: { created_at: { gte: monthStart } },
      select: { sale_price: true, cost_price: true, quantity: true, product_name: true },
    }),
    prisma.product.findMany({
      select: { name: true, stock: true },
    }),
  ]);

  const d = summarize(salesDay);
  const w = summarize(salesWeek);
  const m = summarize(salesMonth);

  // Top product of the month by units sold
  const topMap: Record<string, number> = {};
  for (const s of salesMonth) {
    topMap[s.product_name] = (topMap[s.product_name] ?? 0) + s.quantity;
  }
  const topEntry = Object.entries(topMap).sort((a, b) => b[1] - a[1])[0];

  // Low stock: any size with ≤ 2 units
  const lowStock = products.filter((p) => {
    const stock = p.stock as Record<string, number>;
    return Object.values(stock).some((qty) => qty <= 2);
  });

  let msg =
    `📊 *Métricas VALMONT*\n\n` +
    `*Hoy*\n` +
    `${d.count} ventas · ${formatARS(d.revenue)} · margen ${d.margin}%\n\n` +
    `*Esta semana*\n` +
    `${w.count} ventas · ${formatARS(w.revenue)} · ganancia ${formatARS(w.profit)}\n\n` +
    `*Este mes*\n` +
    `${m.count} ventas · ${formatARS(m.revenue)}\n` +
    `Ganancia neta: *${formatARS(m.profit)}* · margen ${m.margin}%`;

  if (topEntry) {
    msg += `\n\n🥇 *Top del mes:* ${topEntry[0]} (${topEntry[1]} u.)`;
  }

  if (lowStock.length > 0) {
    msg += `\n\n⚠️ *Stock bajo (≤ 2 u.):*`;
    for (const p of lowStock.slice(0, 6)) {
      const stock = p.stock as Record<string, number>;
      const low = Object.entries(stock)
        .filter(([, q]) => q <= 2)
        .map(([sz, q]) => `${sz}:${q}`)
        .join(" ");
      msg += `\n• ${p.name} — ${low}`;
    }
  }

  await ctx.reply(msg, { parse_mode: "Markdown" });
}

export async function handleStock(ctx: Context) {
  const products = await prisma.product.findMany({
    where: { is_published: true },
    select: { name: true, stock: true },
    orderBy: { name: "asc" },
  });

  if (products.length === 0) {
    await ctx.reply("No hay productos publicados.");
    return;
  }

  const lines = products.map((p) => {
    const stock = p.stock as Record<string, number>;
    const total = Object.values(stock).reduce((s, q) => s + q, 0);
    const detail = Object.entries(stock)
      .map(([sz, q]) => `${sz}:${q}`)
      .join(" ");
    return `• *${p.name}* (${total} u.) — ${detail}`;
  });

  await ctx.reply(
    `📦 *Stock actual*\n\n${lines.join("\n")}`,
    { parse_mode: "Markdown" }
  );
}
