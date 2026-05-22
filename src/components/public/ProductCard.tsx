import Image from "next/image";
import Link from "next/link";
import { formatARS } from "@/lib/utils";
import type { ProductPublic } from "@/types";

export default function ProductCard({ product }: { product: ProductPublic }) {
  const image = product.images[0];
  const sizes = Object.entries(product.stock as Record<string, number>)
    .filter(([, qty]) => qty > 0)
    .map(([size]) => size);

  return (
    <Link href={`/producto/${product.slug}`} className="group block">
      {/* Imagen */}
      <div className="relative aspect-[3/4] bg-muted overflow-hidden mb-3">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-[400ms] ease-[power1.out]"
          />
        ) : (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <span className="label-tag text-muted-foreground">SIN IMAGEN</span>
          </div>
        )}

        {/* Overlay crema sutil en hover */}
        <div className="absolute inset-0 bg-brand-cream opacity-0 group-hover:opacity-[0.06] transition-opacity duration-400" />

        {/* Tag de categoría */}
        <div className="absolute top-3 left-3">
          <span className="label-tag bg-brand-green text-brand-cream px-2 py-1 text-[10px]">
            {product.category.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Info */}
      <div>
        <h3 className="font-bebas text-xl leading-tight group-hover:text-brand-green group-hover:-translate-y-0.5 transition-[color,transform] duration-300">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mt-1">
          <p className="price-text">{formatARS(product.price_sale)}</p>
          {sizes.length > 0 && (
            <p className="label-tag text-muted-foreground text-[10px]">
              {sizes.join(" · ")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
