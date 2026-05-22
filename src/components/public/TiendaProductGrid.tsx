"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import ProductCard from "./ProductCard";
import type { ProductPublic } from "@/types";

export default function TiendaProductGrid({ products }: { products: ProductPublic[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      if (products.length === 0) {
        gsap.from(".tienda-empty", { opacity: 0, y: 20, duration: 0.6, ease: "power2.out" });
        return;
      }

      gsap.from(".tienda-card", {
        y: 40,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
      });
    },
    { scope: containerRef, dependencies: [products.length] }
  );

  if (products.length === 0) {
    return (
      <div ref={containerRef} className="tienda-empty py-24 text-center">
        <p className="font-bebas text-3xl text-muted-foreground mb-4">
          SIN PRODUCTOS DISPONIBLES
        </p>
        <p className="label-tag text-muted-foreground mb-8">
          No hay productos en esta categoría por el momento.
        </p>
        <Link
          href="/tienda"
          className="inline-block bg-brand-green text-brand-cream px-8 py-3 font-bold tracking-widest text-sm hover:bg-green-mid transition-colors"
        >
          VER TODO
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10"
    >
      {products.map((product) => (
        <div key={product.id} className="tienda-card">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
