"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import ProductCard from "./ProductCard";
import type { ProductPublic } from "@/types";

export default function AnimatedProductGrid({ products }: { products: ProductPublic[] }) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(".anim-title", {
        clipPath: "inset(0 100% 0 0)",
        duration: 1.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".anim-title",
          start: "top 85%",
        },
      });

      gsap.from(".anim-card", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.15,
        scrollTrigger: {
          trigger: ".anim-card",
          start: "top 85%",
        },
      });

      gsap.from(".anim-ver-todo", {
        opacity: 0,
        duration: 0.6,
        ease: "power1.out",
        scrollTrigger: {
          trigger: ".anim-ver-todo",
          start: "top 90%",
        },
      });

      return () => ScrollTrigger.getAll().forEach((t) => t.kill());
    },
    { scope: sectionRef }
  );

  if (products.length === 0) return null;

  return (
    <section ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="label-tag text-muted-foreground mb-2">NUEVOS INGRESOS</p>
          <h2
            className="anim-title font-bebas text-5xl"
            style={{ clipPath: "inset(0 0% 0 0)" }}
          >
            ÚLTIMOS PRODUCTOS
          </h2>
        </div>
        <Link
          href="/tienda"
          className="anim-ver-todo label-tag text-brand-green hover:underline underline-offset-4 hidden sm:block"
        >
          VER TODO →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
        {products.map((product) => (
          <div key={product.id} className="anim-card">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <div className="mt-10 text-center sm:hidden">
        <Link
          href="/tienda"
          className="inline-block bg-brand-green text-brand-cream px-8 py-3 font-bold tracking-widest text-sm hover:bg-green-mid transition-colors"
        >
          VER TODO
        </Link>
      </div>
    </section>
  );
}
