import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [], total: 0 });
  }

  if (q.length > 100) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: {
      is_published: true,
      OR: [
        { name:        { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { tags:        { has: q } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price_sale: true,
      images: true,
      category: true,
    },
    take: 5,
    orderBy: { created_at: "desc" },
  });

  const results = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price_sale: Number(p.price_sale),
    images: p.images.slice(0, 1),
    category: p.category,
  }));

  return NextResponse.json({ results, total: results.length });
}
