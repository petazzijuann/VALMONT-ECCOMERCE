"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

interface Props {
  count: number;
  query?: string;
}

export default function TiendaHeader({ count, query }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayCount, setDisplayCount] = useState(0);
  const router = useRouter();

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced) {
        setDisplayCount(count);
        return;
      }

      const obj = { val: 0 };
      gsap.to(obj, {
        val: count,
        duration: 0.8,
        ease: "power2.out",
        onUpdate: () => setDisplayCount(Math.round(obj.val)),
      });

      gsap.from(".tienda-title", {
        clipPath: "inset(0 100% 0 0)",
        duration: 1.0,
        ease: "power2.out",
      });
    },
    { scope: containerRef, dependencies: [count] }
  );

  function clearQuery() {
    // Navigate to same URL without `q` param, preserving other params
    const params = new URLSearchParams(window.location.search);
    params.delete("q");
    const qs = params.toString();
    router.push(qs ? `/tienda?${qs}` : "/tienda");
  }

  return (
    <div ref={containerRef} className="mb-8">
      <div className="flex items-center gap-4">
        <p className="label-tag text-muted-foreground mb-2">
          {displayCount} {query ? `RESULTADOS PARA "${query.toUpperCase()}"` : displayCount === 1 ? "PRODUCTO" : "PRODUCTOS"}
        </p>
        {query && (
          <button
            onClick={clearQuery}
            className="mb-2 label-tag text-xs text-cream-dark hover:text-brand-cream transition-colors flex items-center gap-1"
          >
            ✕ LIMPIAR BÚSQUEDA
          </button>
        )}
      </div>
      <h1
        className="tienda-title font-bebas text-5xl"
        style={{ clipPath: "inset(0 0% 0 0)" }}
      >
        TIENDA
      </h1>
    </div>
  );
}
