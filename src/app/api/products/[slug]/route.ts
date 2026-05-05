import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "../../../../generated/prisma/client";

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
  is_published: true,
  created_at: true,
  updated_at: true,
  // price_cost: NUNCA incluir aquí
} satisfies Prisma.ProductSelect;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, is_published: true },
    select: SELECT,
  });

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ...product,
    price_sale: Number(product.price_sale),
    created_at: product.created_at.toISOString(),
    updated_at: product.updated_at.toISOString(),
  });
}
