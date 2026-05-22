"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import type { ProductCategory } from "@/types";

const CATEGORIES: { value: ProductCategory | "todos"; label: string }[] = [
  { value: "todos",      label: "TODOS" },
  { value: "remeras",    label: "REMERAS" },
  { value: "pantalones", label: "PANTALONES" },
  { value: "buzos",      label: "BUZOS" },
  { value: "accesorios", label: "ACCESORIOS" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

interface Props {
  categoria?: string;
  talle?: string;
  q?: string;
}

export default function FiltrosBarra({ categoria, talle, q }: Props) {
  const barRef     = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const router     = useRouter();
  const [isSticky, setIsSticky] = useState(false);
  const reduced    = useRef(false);

  // Detect sticky state via IntersectionObserver
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Stagger animation on mount
  const containerRef = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(".cat-filter", {
        x: -20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power2.out",
      });

      gsap.from(".size-filter", {
        x: -20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power2.out",
        delay: 0.1 + CATEGORIES.length * 0.06,
      });
    },
    { scope: containerRef }
  );

  function navigate(href: string) {
    if (reduced.current) {
      router.push(href);
      return;
    }
    gsap.to(".tienda-card", {
      opacity: 0,
      duration: 0.2,
      ease: "power1.in",
      onComplete: () => router.push(href),
    });
  }

  function catHref(value: string) {
    const params = new URLSearchParams();
    if (value !== "todos") params.set("categoria", value);
    if (talle) params.set("talle", talle);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/tienda?${qs}` : "/tienda";
  }

  function sizeHref(size?: string) {
    const params = new URLSearchParams();
    if (categoria && categoria !== "todos") params.set("categoria", categoria);
    if (size) params.set("talle", size);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/tienda?${qs}` : "/tienda";
  }

  return (
    <>
      {/* sentinel — invisible div that triggers sticky detection */}
      <div ref={sentinelRef} className="h-px" />

      <div
        ref={barRef}
        className={`sticky top-16 z-40 bg-background/95 backdrop-blur-sm transition-shadow duration-200 -mx-4 px-4 sm:mx-0 sm:px-0 ${
          isSticky ? "shadow-[0_1px_0_0_var(--border)]" : ""
        }`}
      >
        <div ref={containerRef} className="py-3 flex flex-col gap-2">
          {/* categorías */}
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map(({ value, label }) => {
              const isActive = value === "todos" ? !categoria || categoria === "todos" : categoria === value;
              return (
                <button
                  key={value}
                  onClick={() => navigate(catHref(value))}
                  className={`cat-filter label-tag px-4 py-2 border transition-colors shrink-0 ${
                    isActive
                      ? "bg-brand-green text-brand-cream border-brand-green"
                      : "border-border hover:border-brand-green"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* talles */}
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => navigate(sizeHref())}
              className={`size-filter label-tag px-3 py-1.5 border text-xs transition-colors shrink-0 ${
                !talle
                  ? "bg-brand-green text-brand-cream border-brand-green"
                  : "border-border hover:border-brand-green"
              }`}
            >
              TODOS
            </button>
            {SIZES.map((size) => (
              <button
                key={size}
                onClick={() => navigate(sizeHref(size))}
                className={`size-filter label-tag px-3 py-1.5 border text-xs transition-colors shrink-0 ${
                  talle === size
                    ? "bg-brand-green text-brand-cream border-brand-green"
                    : "border-border hover:border-brand-green"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
