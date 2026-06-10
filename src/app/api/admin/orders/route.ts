import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import type { OrderItem, ColorVariant } from "@/types";

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { created_at: "desc" },
    take: 200,
  });

  // Resolver la foto de cada ítem desde la tabla de productos (incluye pedidos viejos).
  const productIds = new Set<string>();
  for (const o of orders) {
    for (const it of (o.items as unknown as OrderItem[]) ?? []) {
      if (it?.product_id) productIds.add(it.product_id);
    }
  }

  const products = productIds.size
    ? await prisma.product.findMany({
        where: { id: { in: [...productIds] } },
        select: { id: true, slug: true, images: true, color_variants: true },
      })
    : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  function resolveImage(item: OrderItem): string | null {
    const p = productMap.get(item.product_id);
    if (!p) return null;
    if (item.color) {
      const variants = (p.color_variants as unknown as ColorVariant[]) ?? [];
      const variant = variants.find((v) => v.name === item.color);
      if (variant?.images?.[0]) return variant.images[0];
    }
    return p.images?.[0] ?? null;
  }

  const serialized = orders.map((o) => ({
    ...o,
    items: ((o.items as unknown as OrderItem[]) ?? []).map((it) => ({
      ...it,
      image: resolveImage(it),
    })),
    total_amount:  Number(o.total_amount),
    shipping_cost: o.shipping_cost ? Number(o.shipping_cost) : null,
    created_at:    o.created_at.toISOString(),
    updated_at:    o.updated_at.toISOString(),
  }));

  return NextResponse.json(serialized);
}
