"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

const TITLE = "VALMONT";

export default function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.from(".hero-label", { x: -30, opacity: 0, duration: 0.8 })
        .from(
          ".hero-letter",
          { y: 60, opacity: 0, duration: 0.8, stagger: 0.05 },
          "-=0.4"
        )
        .from(".hero-sub", { y: 20, opacity: 0, duration: 0.8 }, "-=0.3")
        .from(".hero-cta", { y: 30, opacity: 0, duration: 0.8 }, "-=0.5")
        .from(".hero-scroll", { opacity: 0, duration: 0.6 }, "-=0.3");
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative min-h-[90vh] bg-green-dark flex items-center justify-center overflow-hidden"
    >
      {/* geometric pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg,#e2e2d2 0,#e2e2d2 1px,transparent 0,transparent 50%)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <p className="hero-label label-tag text-cream-dark mb-6 tracking-[0.3em]">
          NUEVA COLECCIÓN
        </p>

        <h1 className="font-bebas text-[clamp(80px,15vw,160px)] text-brand-cream leading-none tracking-wide">
          {TITLE.split("").map((letter, i) => (
            <span key={i} className="hero-letter inline-block">
              {letter === " " ? " " : letter}
            </span>
          ))}
        </h1>

        <p className="hero-sub mt-4 text-brand-cream/80 text-lg max-w-md mx-auto">
          Indumentaria urbano-elegante para quienes definen su propio estilo.
        </p>

        <div className="hero-cta mt-12">
          <Link
            href="/tienda"
            className="inline-block bg-brand-cream text-brand-green px-10 py-4 font-bold tracking-widest text-sm hover:bg-white transition-colors"
          >
            VER COLECCIÓN
          </Link>
        </div>
      </div>

      {/* scroll indicator */}
      <div className="hero-scroll absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="label-tag text-cream-dark text-[10px] tracking-widest">SCROLL</span>
        <div className="w-px h-10 bg-cream-dark/40 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full bg-brand-cream"
            style={{ animation: "scrollLine 1.5s ease-in-out infinite" }}
          />
        </div>
      </div>

      <style>{`
        @keyframes scrollLine {
          0%   { height: 0; top: 0; }
          50%  { height: 100%; top: 0; }
          100% { height: 0; top: 100%; }
        }
      `}</style>
    </section>
  );
}
