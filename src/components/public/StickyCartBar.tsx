"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { formatARS } from "@/lib/utils";

interface Props {
  name: string;
  price: number;
}

export default function StickyCartBar({ name, price }: Props) {
  const barRef    = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const btn = document.getElementById("add-to-cart-btn");
    if (!btn) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(btn);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bar     = barRef.current;
    if (!bar) return;

    if (visible) {
      bar.style.display = "flex";
      gsap.to(bar, {
        y: 0,
        duration: reduced ? 0 : 0.3,
        ease: "power2.out",
      });
    } else {
      gsap.to(bar, {
        y: "100%",
        duration: reduced ? 0 : 0.2,
        ease: "power1.in",
        onComplete: () => { bar.style.display = "none"; },
      });
    }
  }, [visible]);

  function handleTap() {
    document
      .getElementById("add-to-cart-btn")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div
      ref={barRef}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-brand-green text-brand-cream border-t border-green-mid items-center justify-between px-4 py-3 gap-4 translate-y-full"
      style={{ display: "none" }}
    >
      <div className="flex-1 min-w-0">
        <p className="font-bebas text-lg leading-tight truncate">{name}</p>
        <p className="label-tag text-cream-dark text-xs">{formatARS(price)}</p>
      </div>
      <button
        onClick={handleTap}
        className="shrink-0 flex items-center gap-2 bg-brand-cream text-brand-green px-5 py-2.5 font-bold tracking-widest text-xs hover:bg-white transition-colors"
      >
        <ShoppingBag size={14} />
        AGREGAR
      </button>
    </div>
  );
}
