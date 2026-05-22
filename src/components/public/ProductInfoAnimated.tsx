"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { formatARS } from "@/lib/utils";
import AddToCartSection from "./AddToCartSection";
import type { ProductPublic } from "@/types";

export default function ProductInfoAnimated({ product }: { product: ProductPublic }) {
  const containerRef              = useRef<HTMLDivElement>(null);
  const [displayPrice, setDisplayPrice] = useState(0);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced) {
        setDisplayPrice(product.price_sale);
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.from(".info-cat",  { y: 16, opacity: 0, duration: 0.5 }, 0.1)
        .from(".info-name", { y: 16, opacity: 0, duration: 0.5 }, 0.2)
        .from(".info-price",{ y: 16, opacity: 0, duration: 0.5 }, 0.3)
        .from(".info-cart", { y: 16, opacity: 0, duration: 0.5 }, 0.4)
        .from(".info-desc", { y: 16, opacity: 0, duration: 0.5 }, 0.5)
        .from(".info-tags", { opacity: 0, duration: 0.5 }, 0.6);

      // Price count-up
      const obj = { val: 0 };
      gsap.to(obj, {
        val: product.price_sale,
        duration: 0.8,
        delay: 0.3,
        ease: "power1.out",
        onUpdate: () => setDisplayPrice(Math.round(obj.val)),
      });

      // Tags stagger on scroll
      gsap.from(".product-tag", {
        x: -20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".info-tags",
          start: "top 90%",
        },
      });

      // Descripción fade-up on scroll
      gsap.from(".info-desc-text", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".info-desc",
          start: "top 90%",
        },
      });

      return () => ScrollTrigger.getAll().forEach((t) => t.kill());
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="flex flex-col gap-6">
      <div>
        <p className="info-cat label-tag text-muted-foreground mb-2">
          {product.category.toUpperCase()}
        </p>
        <h1 className="info-name font-bebas text-5xl lg:text-6xl leading-none">
          {product.name}
        </h1>
        <p className="info-price price-text text-2xl mt-3">
          {formatARS(displayPrice)}
        </p>
      </div>

      <div className="info-cart">
        <AddToCartSection product={product} />
      </div>

      {product.description && (
        <div className="info-desc border-t border-border pt-6">
          <p className="label-tag mb-3">DESCRIPCIÓN</p>
          <p className="info-desc-text text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        </div>
      )}

      {product.tags.length > 0 && (
        <div className="info-tags flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="product-tag label-tag border border-border px-3 py-1 text-[10px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
