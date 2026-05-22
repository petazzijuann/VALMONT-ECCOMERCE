import { prisma } from "@/lib/prisma/client";
import HeroSection from "@/components/public/HeroSection";
import MarqueeSection from "@/components/public/MarqueeSection";
import AnimatedProductGrid from "@/components/public/AnimatedProductGrid";
import EssenceSection from "@/components/public/EssenceSection";
import EmailSubscriptionPopup from "@/components/public/EmailSubscriptionPopup";
import PublicidadCarrusel from "@/components/public/PublicidadCarrusel";
import SeccionEditorial from "@/components/public/SeccionEditorial";
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
      <EmailSubscriptionPopup />

      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Carrusel de publicidades */}
      <PublicidadCarrusel />

      {/* 3. Marquee */}
      <MarqueeSection />

      {/* 4. Últimos productos */}
      <AnimatedProductGrid products={products} />

      {/* 5. Sección Urbano */}
      <SeccionEditorial
        label="COLECCIÓN"
        title="URBANO"
        images={[
          { src: "/publicidades/urbano/imagen-1.jpeg", alt: "Colección Urbano VALMONT - imagen 1" },
          { src: "/publicidades/urbano/imagen-2.jpeg", alt: "Colección Urbano VALMONT - imagen 2" },
        ]}
      />

      {/* 6. Sección Old Money */}
      <SeccionEditorial
        label="COLECCIÓN"
        title="OLD MONEY"
        images={[
          { src: "/publicidades/oldmoney/imagen-1.jpeg", alt: "Colección Old Money VALMONT - imagen 1" },
          { src: "/publicidades/oldmoney/imagen-2.jpeg", alt: "Colección Old Money VALMONT - imagen 2" },
        ]}
      />

      {/* 7. Nuestra esencia */}
      <EssenceSection />
    </>
  );
}
