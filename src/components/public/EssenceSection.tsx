"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export default function EssenceSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(".essence-left", {
        x: -60,
        opacity: 0,
        duration: 1.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      gsap.from(".essence-right", {
        x: 60,
        opacity: 0,
        duration: 1.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      return () => ScrollTrigger.getAll().forEach((t) => t.kill());
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="grid grid-cols-1 md:grid-cols-2 min-h-[60vh]">
      {/* izquierda */}
      <div className="essence-left bg-green-dark flex items-center justify-center p-12 md:p-20">
        <div className="text-center">
          <p className="label-tag text-cream-dark text-[10px] tracking-widest mb-4">FUNDADA EN</p>
          <p className="font-bebas text-[clamp(80px,12vw,140px)] text-brand-cream leading-none">
            2026
          </p>
          <p className="label-tag text-cream-dark mt-4 tracking-widest">ROSARIO, SANTA FE</p>
        </div>
      </div>

      {/* derecha */}
      <div className="essence-right bg-background flex items-center p-12 md:p-20">
        <div className="max-w-sm">
          <p className="label-tag text-muted-foreground text-[10px] mb-4 tracking-widest">
            NUESTRA ESENCIA
          </p>
          <h2 className="font-bebas text-5xl mb-6 leading-tight">
            DEFINIMOS NUESTRO PROPIO ESTILO
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            VALMONT nace de la convicción de que la moda no sigue tendencias,
            las crea. Cada prenda es una declaración: calidad premium, diseño
            urbano y un carácter que no se negocia.
          </p>
          <Link
            href="/tienda"
            className="inline-block border border-brand-green text-brand-green px-8 py-3 font-bold tracking-widest text-sm hover:bg-brand-green hover:text-brand-cream transition-colors"
          >
            CONOCER MÁS
          </Link>
        </div>
      </div>
    </section>
  );
}
