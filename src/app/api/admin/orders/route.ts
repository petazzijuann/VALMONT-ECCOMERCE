import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { created_at: "desc" },
    take: 200,
  });

  const serialized = orders.map((o) => ({
    ...o,
    total_amount:  Number(o.total_amount),
    shipping_cost: o.shipping_cost ? Number(o.shipping_cost) : null,
    created_at:    o.created_at.toISOString(),
    updated_at:    o.updated_at.toISOString(),
  }));

  return NextResponse.json(serialized);
}
