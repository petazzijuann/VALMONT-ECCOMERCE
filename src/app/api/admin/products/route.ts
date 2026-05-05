import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { created_at: "desc" },
  });

  const serialized = products.map((p) => ({
    ...p,
    price_sale: Number(p.price_sale),
    price_cost: Number(p.price_cost),
    created_at: p.created_at.toISOString(),
    updated_at: p.updated_at.toISOString(),
  }));

  return NextResponse.json(serialized);
}
