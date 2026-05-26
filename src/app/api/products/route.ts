import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "../../../generated/prisma/client";
import type { ColorVariant, StockMap } from "@/types";

const SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  category: true,
  images: true,
  tags: true,
  price_sale: true,
  stock: true,
  color_variants: true,
  is_published: true,
  created_at: true,
  updated_at: true,
  // price_cost: NUNCA incluir aquí
} satisfies Prisma.ProductSelect;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const size = searchParams.get("size");
  const limit = parseInt(searchParams.get("limit") ?? "100");

  const where: Prisma.ProductWhereInput = { is_published: true };
  if (category) where.category = category;
  if (size) {
    where.stock = { path: [size], gt: 0 };
  }

  const products = await prisma.product.findMany({
    where,
    select: SELECT,
    orderBy: { created_at: "desc" },
    take: limit,
  });

  const serialized = products
    .map((p) => ({
      ...p,
      price_sale: Number(p.price_sale),
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
    }))
    .filter((p) => {
      const variants = (p.color_variants ?? []) as ColorVariant[];
      if (variants.length > 0) {
        return variants.some((v) => Object.values(v.stock).some((q) => q > 0));
      }
      return Object.values(p.stock as StockMap).some((q) => q > 0);
    });

  return NextResponse.json(serialized);
}
