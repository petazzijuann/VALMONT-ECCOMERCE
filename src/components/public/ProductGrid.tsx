import ProductCard from "./ProductCard";
import type { ProductPublic } from "@/types";

export default function ProductGrid({ products }: { products: ProductPublic[] }) {
  if (products.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-bebas text-3xl text-muted-foreground">SIN RESULTADOS</p>
        <p className="label-tag text-muted-foreground mt-2">
          Probá con otro filtro
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
