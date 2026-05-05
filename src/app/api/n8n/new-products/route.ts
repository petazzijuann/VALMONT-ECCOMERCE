import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { generateInstagramCaption } from "@/lib/openai/generate-caption";

export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${process.env.N8N_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where:   { is_published: true, instagram_posted: false },
    orderBy: { created_at: "asc" }, // oldest first → respect upload order
    take:    5,
    select: {
      id:          true,
      name:        true,
      category:    true,
      description: true,
      images:      true,
      tags:        true,
      price_sale:  true,
    },
  });

  if (products.length === 0) {
    return NextResponse.json([]);
  }

  const results = await Promise.all(
    products.map(async (p) => {
      const price_sale = Number(p.price_sale);
      const caption = await generateInstagramCaption({
        name:        p.name,
        category:    p.category,
        description: p.description,
        tags:        p.tags,
        price_sale,
      });
      return {
        id:         p.id,
        name:       p.name,
        category:   p.category,
        image_url:  p.images[0] ?? "",
        price_sale,
        caption,
      };
    })
  );

  return NextResponse.json(results);
}
