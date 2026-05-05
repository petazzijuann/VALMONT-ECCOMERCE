import type { Metadata } from "next";
import { prisma } from "@/lib/prisma/client";
import ProductGrid from "@/components/public/ProductGrid";
import type { ProductPublic, ProductCategory } from "@/types";
import type { Prisma } from "../../../generated/prisma/client";

const CATEGORIES: { value: ProductCategory | "todos"; label: string }[] = [
  { value: "todos",      label: "TODOS" },
  { value: "remeras",    label: "REMERAS" },
  { value: "pantalones", label: "PANTALONES" },
  { value: "buzos",      label: "BUZOS" },
  { value: "accesorios", label: "ACCESORIOS" },
  { value: "calzado",    label: "CALZADO" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const CATEGORY_LABELS: Record<string, string> = {
  remeras:    "Remeras",
  pantalones: "Pantalones",
  buzos:      "Buzos",
  accesorios: "Accesorios",
  calzado:    "Calzado",
};

type SearchParams = Promise<{ categoria?: string; talle?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { categoria } = await searchParams;
  const catLabel = categoria ? CATEGORY_LABELS[categoria] : null;

  const title       = catLabel ?? "Tienda";
  const description = catLabel
    ? `Comprá ${catLabel.toLowerCase()} VALMONT. Indumentaria urbano-elegante argentina.`
    : "Explorá la colección completa VALMONT. Remeras, pantalones, buzos, accesorios y calzado.";

  return { title, description };
}

async function getProducts(category?: string, size?: string): Promise<ProductPublic[]> {
  const where: Prisma.ProductWhereInput = { is_published: true };
  if (category && category !== "todos") where.category = category;
  if (size) where.stock = { path: [size], gt: 0 };

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true, name: true, slug: true, description: true,
      category: true, images: true, tags: true,
      price_sale: true, stock: true, is_published: true,
      created_at: true, updated_at: true,
    },
    orderBy: { created_at: "desc" },
  });

  return products.map((p) => ({
    ...p,
    price_sale: Number(p.price_sale),
    created_at: p.created_at.toISOString(),
    updated_at: p.updated_at.toISOString(),
  })) as ProductPublic[];
}

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { categoria, talle } = await searchParams;
  const products = await getProducts(categoria, talle);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <p className="label-tag text-muted-foreground mb-2">
          {products.length} {products.length === 1 ? "PRODUCTO" : "PRODUCTOS"}
        </p>
        <h1 className="font-bebas text-5xl">TIENDA</h1>
      </div>

      {/* Filtros categoría — scroll horizontal en mobile */}
      <div className="flex flex-nowrap gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-none">
        {CATEGORIES.map(({ value, label }) => {
          const isActive = value === "todos" ? !categoria : categoria === value;
          const href =
            value === "todos"
              ? `/tienda${talle ? `?talle=${talle}` : ""}`
              : `/tienda?categoria=${value}${talle ? `&talle=${talle}` : ""}`;

          return (
            <a
              key={value}
              href={href}
              className={`label-tag px-4 py-2 border transition-colors shrink-0 ${
                isActive
                  ? "bg-brand-green text-brand-cream border-brand-green"
                  : "border-border hover:border-brand-green"
              }`}
            >
              {label}
            </a>
          );
        })}
      </div>

      {/* Filtros talle — scroll horizontal en mobile */}
      <div className="flex flex-nowrap gap-2 mb-10 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-none">
        <a
          href={categoria ? `/tienda?categoria=${categoria}` : "/tienda"}
          className={`label-tag px-3 py-1.5 border text-xs transition-colors shrink-0 ${
            !talle
              ? "bg-brand-green text-brand-cream border-brand-green"
              : "border-border hover:border-brand-green"
          }`}
        >
          TODOS
        </a>
        {SIZES.map((size) => {
          const params = new URLSearchParams();
          if (categoria && categoria !== "todos") params.set("categoria", categoria);
          params.set("talle", size);

          return (
            <a
              key={size}
              href={`/tienda?${params}`}
              className={`label-tag px-3 py-1.5 border text-xs transition-colors shrink-0 ${
                talle === size
                  ? "bg-brand-green text-brand-cream border-brand-green"
                  : "border-border hover:border-brand-green"
              }`}
            >
              {size}
            </a>
          );
        })}
      </div>

      <ProductGrid products={products} />
    </div>
  );
}
