"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import type { ProductPublic, StockMap } from "@/types";

export default function AddToCartSection({ product }: { product: ProductPublic }) {
  const stock = product.stock as StockMap;
  const availableSizes = Object.entries(stock)
    .filter(([, qty]) => qty > 0)
    .map(([size]) => size);

  const [selectedSize, setSelectedSize] = useState<string | null>(
    availableSizes.length === 1 ? availableSizes[0] : null
  );
  const [added, setAdded] = useState(false);
  const { addItem, openCart } = useCartStore();

  function handleAddToCart() {
    if (!selectedSize) return;

    addItem({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? "",
      size: selectedSize,
      price: product.price_sale,
      quantity: 1,
    });

    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  }

  if (availableSizes.length === 0) {
    return (
      <div className="border border-border px-6 py-4 text-center">
        <p className="label-tag text-muted-foreground">SIN STOCK</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de talle */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="label-tag">TALLE</p>
          {selectedSize && (
            <p className="label-tag text-muted-foreground">
              Stock: {stock[selectedSize]}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`w-12 h-12 border label-tag text-sm transition-colors ${
                selectedSize === size
                  ? "bg-brand-green text-brand-cream border-brand-green"
                  : "border-border hover:border-brand-green"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Botón agregar */}
      <button
        onClick={handleAddToCart}
        disabled={!selectedSize}
        className="flex items-center justify-center gap-3 bg-brand-green text-brand-cream py-4 font-bold tracking-widest text-sm hover:bg-green-mid transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ShoppingBag size={18} />
        {added ? "¡AGREGADO!" : !selectedSize ? "ELEGÍ UN TALLE" : "AGREGAR AL CARRITO"}
      </button>
    </div>
  );
}
