import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { safeCompareSecret } from "@/lib/security";
import type { StockMap, ColorVariant } from "@/types";

function hasStock(product: { stock: unknown; color_variants: unknown }): boolean {
  const variants = product.color_variants as ColorVariant[] | null;
  if (Array.isArray(variants) && variants.length > 0) {
    return variants.some((v) => Object.values(v.stock).some((q) => q > 0));
  }
  return Object.values(product.stock as StockMap).some((q) => q > 0);
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-api-secret");
  if (!safeCompareSecret(secret, process.env.INSTAGRAM_API_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { is_published: true },
    select: {
      id:             true,
      name:           true,
      category:       true,
      price_sale:     true,
      images:         true,
      stock:          true,
      color_variants: true,
    },
  });

  const inStock = products
    .filter(hasStock)
    .filter((p) => p.images.length > 0)
    .map((p) => ({
      id:         p.id,
      name:       p.name,
      category:   p.category,
      price_sale: Number(p.price_sale),
      image_url:  p.images[0],
      has_stock:  true,
    }));

  return NextResponse.json(inStock);
}
