"use client";

import Image from "next/image";

interface ImageItem {
  src: string;
  alt: string;
}

interface Props {
  label: string;
  title: string;
  images: [ImageItem, ImageItem];
}

export default function SeccionEditorial({ label, title, images }: Props) {
  return (
    <section className="py-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <p className="label-tag text-muted-foreground text-[10px] mb-1 tracking-widest">{label}</p>
        <h2 className="font-bebas text-5xl">{title}</h2>
      </div>

      {/* Grid de imágenes — sin gap, borde a borde */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {images.map((img) => (
          <div
            key={img.src}
            className="relative aspect-[4/3] md:aspect-[3/4] overflow-hidden group cursor-pointer"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
            />
            {/* Overlay sutil en hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-700" />
          </div>
        ))}
      </div>
    </section>
  );
}
