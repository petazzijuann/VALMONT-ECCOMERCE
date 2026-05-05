import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma/client";
import ImageGallery from "@/components/public/ImageGallery";
import AddToCartSection from "@/components/public/AddToCartSection";
import type { ProductPublic, StockMap } from "@/types";

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://valmont.com.ar";

export const revalidate = 3600;

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where:  { is_published: true },
    select: { slug: true },
  });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where:  { slug, is_published: true },
    select: { name: true, description: true, images: true, price_sale: true },
  });
  if (!product) return {};

  const title       = product.name;
  const description = product.description;
  const image       = product.images[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type:   "website",
      url:    `${BASE}/producto/${slug}`,
      images: image
        ? [{ url: image, width: 1200, height: 1600, alt: product.name }]
        : [],
    },
    twitter: {
      card:        "summary_large_image",
      title,
      description,
      images:      image ? [image] : [],
    },
  };
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const raw = await prisma.product.findUnique({
    where: { slug, is_published: true },
    select: {
      id: true, name: true, slug: true, description: true,
      category: true, images: true, tags: true,
      price_sale: true, stock: true, is_published: true,
      created_at: true, updated_at: true,
    },
  });

  if (!raw) notFound();

  const product = {
    ...raw,
    price_sale: Number(raw.price_sale),
    created_at: raw.created_at.toISOString(),
    updated_at: raw.updated_at.toISOString(),
  } as ProductPublic;

  const stock = product.stock as StockMap;
  const hasStock = Object.values(stock).some((q) => q > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type":    "Product",
    name:       product.name,
    description: product.description,
    image:      product.images,
    brand:      { "@type": "Brand", name: "VALMONT" },
    offers: {
      "@type":       "Offer",
      priceCurrency: "ARS",
      price:         product.price_sale.toString(),
      availability:  hasStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${BASE}/producto/${product.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 label-tag text-muted-foreground mb-8 text-xs overflow-x-auto whitespace-nowrap scrollbar-none pb-1"
        >
          <Link href="/" className="hover:text-foreground transition-colors shrink-0">HOME</Link>
          <span aria-hidden>/</span>
          <Link href="/tienda" className="hover:text-foreground transition-colors shrink-0">TIENDA</Link>
          <span aria-hidden>/</span>
          <Link
            href={`/tienda?categoria=${product.category}`}
            className="hover:text-foreground transition-colors shrink-0"
          >
            {product.category.toUpperCase()}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground">{product.name.toUpperCase()}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Galería */}
          <ImageGallery images={product.images} name={product.name} />

          {/* Info */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="label-tag text-muted-foreground mb-2">
                {product.category.toUpperCase()}
              </p>
              <h1 className="font-bebas text-5xl lg:text-6xl leading-none">{product.name}</h1>
              <p className="price-text text-2xl mt-3">
                ${product.price_sale.toLocaleString("es-AR")}
              </p>
            </div>

            <AddToCartSection product={product} />

            {/* Descripción */}
            {product.description && (
              <div className="border-t border-border pt-6">
                <p className="label-tag mb-3">DESCRIPCIÓN</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="label-tag border border-border px-3 py-1 text-[10px] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
