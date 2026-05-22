"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

const SLIDES = [
  { src: "/publicidades/carrusel/imagen-1.jpeg", alt: "Campaña VALMONT 1" },
  { src: "/publicidades/carrusel/imagen-2.jpeg", alt: "Campaña VALMONT 2" },
  { src: "/publicidades/carrusel/imagen-3.jpeg", alt: "Campaña VALMONT 3" },
  { src: "/publicidades/carrusel/imagen-4.jpeg", alt: "Campaña VALMONT 4" },
  { src: "/publicidades/carrusel/imagen-5.jpeg", alt: "Campaña VALMONT 5" },
  { src: "/publicidades/carrusel/imagen-6.jpeg", alt: "Campaña VALMONT 6" },
  { src: "/publicidades/carrusel/imagen-7.jpeg", alt: "Campaña VALMONT 7" },
  { src: "/publicidades/carrusel/imagen-8.jpeg", alt: "Campaña VALMONT 8" },
  { src: "/publicidades/carrusel/imagen-9.jpeg", alt: "Campaña VALMONT 9" },
];

// [clone-of-last, ...real slides, clone-of-first]
const EXTENDED = [SLIDES[SLIDES.length - 1], ...SLIDES, SLIDES[0]];
const TOTAL    = EXTENDED.length; // 11

const INTERVAL_MS = 4000;
const GAP_PX      = 12;

export default function PublicidadCarrusel() {
  // rawIndex: position in EXTENDED (1 = first real slide)
  const [rawIndex,     setRawIndex]     = useState(1);
  const [animated,     setAnimated]     = useState(true);
  const [paused,       setPaused]       = useState(false);
  const [reduced,      setReduced]      = useState(false);
  const [slideVw,      setSlideVw]      = useState(72);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const snappingRef = useRef(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    function measure() {
      setSlideVw(window.innerWidth >= 768 ? 60 : 82);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Cuando caemos en un clon, esperamos que termine la animación y saltamos sin transición
  useEffect(() => {
    if (rawIndex === TOTAL - 1) {
      const t = setTimeout(() => {
        snappingRef.current = true;
        setAnimated(false);
        setRawIndex(1);
      }, 700);
      return () => clearTimeout(t);
    }
    if (rawIndex === 0) {
      const t = setTimeout(() => {
        snappingRef.current = true;
        setAnimated(false);
        setRawIndex(SLIDES.length);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [rawIndex]);

  // Reactivar animación después del snap silencioso
  useEffect(() => {
    if (!animated) {
      const t = setTimeout(() => {
        setAnimated(true);
        snappingRef.current = false;
      }, 50);
      return () => clearTimeout(t);
    }
  }, [animated]);

  const advance = useCallback(() => {
    if (snappingRef.current) return;
    setRawIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (reduced || paused) return;
    intervalRef.current = setInterval(advance, INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [reduced, paused, advance]);

  useEffect(() => {
    function onVisibility() { setPaused(document.hidden); }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  function goTo(logicalIdx: number) {
    if (snappingRef.current) return;
    clearInterval(intervalRef.current);
    setAnimated(true);
    setRawIndex(logicalIdx + 1);
    if (!reduced) {
      intervalRef.current = setInterval(advance, INTERVAL_MS);
    }
  }

  // Índice lógico (0-8) para los dots
  const logicalIndex =
    rawIndex === 0           ? SLIDES.length - 1 :
    rawIndex === TOTAL - 1   ? 0                 :
    rawIndex - 1;

  const centerVw   = (100 - slideVw) / 2;
  const shiftVw    = rawIndex * slideVw;
  const shiftPx    = rawIndex * GAP_PX;
  const translateX = `calc(${centerVw - shiftVw}vw - ${shiftPx}px)`;

  return (
    <section
      aria-label="Carrusel de campañas VALMONT"
      className="w-full overflow-hidden bg-brand-green py-6 md:py-10"
    >
      {/* Track */}
      <div
        className="flex items-center"
        style={{
          transform:  `translateX(${translateX})`,
          gap:        `${GAP_PX}px`,
          transition: animated && !reduced ? "transform 700ms ease-in-out" : "none",
        }}
      >
        {EXTENDED.map((slide, i) => {
          const isActive = i === rawIndex;
          return (
            <div
              key={`${i}-${slide.src}`}
              onClick={() => {
                if (i >= 1 && i <= SLIDES.length) goTo(i - 1);
              }}
              className={`shrink-0 relative overflow-hidden cursor-pointer transition-all duration-700 ease-in-out ${
                isActive
                  ? "opacity-100 scale-100 shadow-2xl"
                  : "opacity-40 scale-[0.88]"
              }`}
              style={{ width: `${slideVw}vw` }}
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={i === 1}
                  className="object-contain"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Ir al slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === logicalIndex ? "w-4 h-2 bg-white" : "w-2 h-2 bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
