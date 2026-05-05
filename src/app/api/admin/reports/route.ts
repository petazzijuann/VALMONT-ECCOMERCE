import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const [sales, products] = await Promise.all([
    prisma.sale.findMany({
      where: {
        created_at: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      select: {
        product_id: true,
        sale_price: true,
        cost_price: true,
        quantity:   true,
        channel:    true,
        payment_method: true,
      },
    }),
    prisma.product.findMany({
      select: { id: true, category: true },
    }),
  ]);

  const categoryMap: Record<string, string> = {};
  for (const p of products) categoryMap[p.id] = p.category;

  type Bucket = { revenue: number; profit: number; units: number };

  const byCategory: Record<string, Bucket> = {};
  const byChannel:  Record<string, Bucket> = {};
  const byPayment:  Record<string, Bucket> = {};

  for (const s of sales) {
    const r = Number(s.sale_price) * s.quantity;
    const c = Number(s.cost_price) * s.quantity;
    const p = r - c;

    const cat = categoryMap[s.product_id] ?? "otro";
    if (!byCategory[cat]) byCategory[cat] = { revenue: 0, profit: 0, units: 0 };
    byCategory[cat].revenue += r;
    byCategory[cat].profit  += p;
    byCategory[cat].units   += s.quantity;

    const ch = s.channel;
    if (!byChannel[ch]) byChannel[ch] = { revenue: 0, profit: 0, units: 0 };
    byChannel[ch].revenue += r;
    byChannel[ch].profit  += p;
    byChannel[ch].units   += s.quantity;

    const pay = s.payment_method;
    if (!byPayment[pay]) byPayment[pay] = { revenue: 0, profit: 0, units: 0 };
    byPayment[pay].revenue += r;
    byPayment[pay].profit  += p;
    byPayment[pay].units   += s.quantity;
  }

  return NextResponse.json({ byCategory, byChannel, byPayment });
}
