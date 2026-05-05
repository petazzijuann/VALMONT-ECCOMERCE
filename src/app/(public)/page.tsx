import Link from "next/link";
import { prisma } from "@/lib/prisma/client";
import ProductGrid from "@/components/public/ProductGrid";
import type { ProductPublic } from "@/types";

async function getLatestProducts(): Promise<ProductPublic[]> {
  try {
    const products = await prisma.product.findMany({
      where: { is_published: true },
      select: {
        id: true, name: true, slug: true, description: true,
        category: true, images: true, tags: true,
        price_sale: true, stock: true, is_published: true,
        created_at: true, updated_at: true,
      },
      orderBy: { created_at: "desc" },
      take: 4,
    });

    return products.map((p) => ({
      ...p,
      price_sale: Number(p.price_sale),
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
    })) as ProductPublic[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getLatestProducts();

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] bg-green-dark flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg,#e2e2d2 0,#e2e2d2 1px,transparent 0,transparent 50%)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="label-tag text-cream-dark mb-6 tracking-[0.3em]">
            NUEVA COLECCIÓN
          </p>
          <h1 className="font-bebas text-[clamp(80px,15vw,160px)] text-brand-cream leading-none tracking-wide">
            VALMONT
          </h1>
          <p className="mt-4 text-brand-cream/80 text-lg max-w-md mx-auto">
            Indumentaria urbano-elegante para quienes definen su propio estilo.
          </p>
          <div className="mt-12">
            <Link
              href="/tienda"
              className="inline-block bg-brand-cream text-brand-green px-10 py-4 font-bold tracking-widest text-sm hover:bg-white transition-colors"
            >
              VER COLECCIÓN
            </Link>
          </div>
        </div>
      </section>

      {/* Últimos productos */}
      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="label-tag text-muted-foreground mb-2">NUEVOS INGRESOS</p>
              <h2 className="font-bebas text-5xl">ÚLTIMOS PRODUCTOS</h2>
            </div>
            <Link
              href="/tienda"
              className="label-tag text-brand-green hover:underline underline-offset-4 hidden sm:block"
            >
              VER TODO →
            </Link>
          </div>
          <ProductGrid products={products} />
          <div className="mt-10 text-center sm:hidden">
            <Link
              href="/tienda"
              className="inline-block bg-brand-green text-brand-cream px-8 py-3 font-bold tracking-widest text-sm hover:bg-green-mid transition-colors"
            >
              VER TODO
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
