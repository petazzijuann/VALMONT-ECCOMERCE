"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export default function ContactHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(".contact-label", { x: -30, opacity: 0, duration: 0.6 })
        .from(".contact-title", { clipPath: "inset(0 100% 0 0)", duration: 1.0 }, "-=0.3")
        .from(".contact-sub",   { y: 16, opacity: 0, duration: 0.6 }, "-=0.4");

      // form col desde izquierda
      gsap.from(".contact-form-col", {
        x: -60,
        opacity: 0,
        duration: 1.0,
        ease: "power2.out",
        scrollTrigger: { trigger: ".contact-form-col", start: "top 80%" },
      });

      // info col desde derecha
      gsap.from(".contact-info-col", {
        x: 60,
        opacity: 0,
        duration: 1.0,
        ease: "power2.out",
        scrollTrigger: { trigger: ".contact-info-col", start: "top 80%" },
      });

      // parallax "HABLEMOS"
      gsap.to(".contact-close-inner", {
        y: "-20%",
        ease: "none",
        scrollTrigger: {
          trigger: ".contact-close-inner",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      return () => ScrollTrigger.getAll().forEach((t) => t.kill());
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef}>
      <section className="bg-green-dark py-20 px-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p
            className="contact-label label-tag text-cream-dark text-[10px] mb-4 tracking-[0.3em]"
          >
            VALMONT
          </p>
          <h1
            className="contact-title font-bebas text-[clamp(60px,10vw,100px)] text-brand-cream leading-none"
            style={{ clipPath: "inset(0 0% 0 0)" }}
          >
            CONTACTO
          </h1>
          <p className="contact-sub label-tag text-cream-dark mt-4 tracking-widest">
            ESTAMOS PARA AYUDARTE
          </p>
        </div>
      </section>
    </div>
  );
}
