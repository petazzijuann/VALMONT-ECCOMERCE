"use client";

import { useState } from "react";
import ImageGallery from "./ImageGallery";
import ProductInfoAnimated from "./ProductInfoAnimated";
import type { ProductPublic } from "@/types";

export default function ProductPageClient({ product }: { product: ProductPublic }) {
  const variants = product.color_variants;

  // Arranca en el primer color con stock; si todos están sin stock, usa el primero
  const firstWithStock = variants.find((v) =>
    Object.values(v.stock).some((q) => q > 0)
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    (firstWithStock ?? variants[0])?.name ?? null
  );

  const currentVariant = variants.find((v) => v.name === selectedColor);
  const currentImages  = currentVariant?.images?.length ? currentVariant.images : product.images;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
      <div className="opacity-0 animate-[fadeSlideUp_0.8s_ease-out_0.1s_forwards]">
        <ImageGallery
          key={selectedColor ?? "default"}
          images={currentImages}
          name={product.name}
        />
      </div>
      <ProductInfoAnimated
        product={product}
        selectedColor={selectedColor}
        onColorChange={variants.length > 1 ? setSelectedColor : undefined}
      />
    </div>
  );
}
