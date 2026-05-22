"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

export default function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected]     = useState(0);
  const [displaySrc, setDisplaySrc] = useState(images[0] ?? "");
  const containerRef                = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-muted flex items-center justify-center">
        <span className="label-tag text-muted-foreground">SIN IMAGEN</span>
      </div>
    );
  }

  function changeImage(i: number) {
    if (i === selected) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setDisplaySrc(images[i]);
      setSelected(i);
      return;
    }

    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.15,
      ease: "power1.in",
      onComplete: () => {
        setDisplaySrc(images[i]);
        setSelected(i);
        gsap.to(containerRef.current, { opacity: 1, duration: 0.3, ease: "power1.out" });
      },
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Imagen principal */}
      <div ref={containerRef} className="relative aspect-[3/4] bg-muted overflow-hidden">
        <Image
          src={displaySrc}
          alt={name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => changeImage(i)}
              className={`relative w-20 h-24 shrink-0 overflow-hidden border-l-2 transition-all duration-200 hover:scale-105 ${
                selected === i
                  ? "border-brand-green"
                  : "border-transparent hover:border-green-mid"
              }`}
            >
              <Image
                src={img}
                alt={`${name} ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
