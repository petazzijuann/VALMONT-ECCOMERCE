import type { Metadata } from "next";
import { prisma } from "@/lib/prisma/client";
import TiendaHeader from "@/components/public/TiendaHeader";
import FiltrosBarra from "@/components/public/FiltrosBarra";
import TiendaProductGrid from "@/components/public/TiendaProductGrid";
import type { ColorVariant, ProductPublic } from "@/types";
import type { Prisma } from "../../../generated/prisma/client";

const CATEGORY_LABELS: Record<string, string> = {
  remeras:    "Remeras",
  pantalones: "Pantalones",
  buzos:      "Buzos",
  accesorios: "Accesorios",
};

type SearchParams = Promise<{ categoria?: string; talle?: string; q?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { categoria } = await searchParams;
  const catLabel = categoria ? CATEGORY_LABELS[categoria] : null;
  return {
    title: catLabel ?? "Tienda",
    description: catLabel
      ? `Comprá ${catLabel.toLowerCase()} VALMONT. Indumentaria urbano-elegante argentina.`
      : "Explorá la colección completa VALMONT. Remeras, pantalones, buzos, accesorios y calzado.",
  };
}

async function getProducts(category?: string, size?: string, query?: string): Promise<ProductPublic[]> {
  const where: Prisma.ProductWhereInput = { is_published: true };
  if (category && category !== "todos") where.category = category;
  if (query && query.trim().length >= 2) {
    where.OR = [
      { name:        { contains: query.trim(), mode: "insensitive" } },
      { description: { contains: query.trim(), mode: "insensitive" } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true, name: true, slug: true, description: true,
      category: true, images: true, tags: true,
      price_sale: true, stock: true, color_variants: true, is_published: true,
      created_at: true, updated_at: true,
    },
    orderBy: { created_at: "desc" },
  });

  // El filtro por talle debe considerar tanto el color principal (stock)
  // como los colores adicionales (color_variants), ya que un talle puede
  // tener stock solo en una de las variantes de color.
  const filtered = size
    ? products.filter((p) => {
        const mainStock = (p.stock as Record<string, number> | null) ?? {};
        if ((mainStock[size] ?? 0) > 0) return true;
        const variants = (p.color_variants as unknown as ColorVariant[] | null) ?? [];
        return variants.some((v) => (v.stock?.[size] ?? 0) > 0);
      })
    : products;

  return filtered.map((p) => ({
    ...p,
    price_sale: Number(p.price_sale),
    created_at: p.created_at.toISOString(),
    updated_at: p.updated_at.toISOString(),
  })) as unknown as ProductPublic[];
}

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { categoria, talle, q } = await searchParams;
  const products = await getProducts(categoria, talle, q);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      <FiltrosBarra categoria={categoria} talle={talle} q={q} />
      <div className="pt-8">
        <TiendaHeader count={products.length} query={q} />
        <TiendaProductGrid products={products} />
      </div>
    </div>
  );
}
