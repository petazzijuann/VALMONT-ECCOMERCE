import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma/client";

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://valmont.com.ar";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where:  { is_published: true },
    select: { slug: true, updated_at: true },
  });

  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url:             `${BASE}/producto/${p.slug}`,
    lastModified:    p.updated_at,
    changeFrequency: "weekly",
    priority:        0.8,
  }));

  return [
    { url: BASE,                changeFrequency: "daily",  priority: 1.0, lastModified: new Date() },
    { url: `${BASE}/tienda`,    changeFrequency: "daily",  priority: 0.9, lastModified: new Date() },
    { url: `${BASE}/carrito`,   changeFrequency: "yearly", priority: 0.2, lastModified: new Date() },
    ...productUrls,
  ];
}
