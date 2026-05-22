"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useCartStore } from "@/store/cart";
import type { ProductPublic, StockMap } from "@/types";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

type BtnStatus = "idle" | "loading" | "done";

export default function AddToCartSection({ product }: { product: ProductPublic }) {
  const stock      = product.stock as StockMap;
  const allSizes   = SIZE_ORDER.filter((s) => s in stock);
  const firstAvail = allSizes.find((s) => (stock[s] ?? 0) > 0) ?? null;

  const [selectedSize, setSelectedSize] = useState<string | null>(
    allSizes.filter((s) => (stock[s] ?? 0) > 0).length === 1 ? firstAvail : null
  );
  const [quantity, setQuantity]       = useState(1);
  const [btnStatus, setBtnStatus]     = useState<BtnStatus>("idle");
  const { addItem, openCart }         = useCartStore();

  const noStock = allSizes.every((s) => (stock[s] ?? 0) === 0);

  function handleSizeSelect(size: string) {
    if ((stock[size] ?? 0) === 0) return;
    setSelectedSize(size);
    setQuantity(1);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) {
      const el = document.getElementById(`size-btn-${product.id}-${size}`);
      if (el) gsap.fromTo(el, { scale: 1 }, { scale: 1.12, duration: 0.1, yoyo: true, repeat: 1, ease: "power1.out" });
    }
  }

  function handleAddToCart() {
    if (!selectedSize || btnStatus !== "idle") return;
    setBtnStatus("loading");

    setTimeout(() => {
      addItem({
        product_id: product.id,
        slug:       product.slug,
        name:       product.name,
        image:      product.images[0] ?? "",
        size:       selectedSize,
        price:      product.price_sale,
        quantity,
      });
      openCart();
      setBtnStatus("done");
      setTimeout(() => setBtnStatus("idle"), 1500);
    }, 400);
  }

  if (noStock) {
    return (
      <div className="border border-border px-6 py-4 text-center">
        <p className="label-tag text-muted-foreground">SIN STOCK</p>
      </div>
    );
  }

  const isIdle = btnStatus === "idle";

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de talle */}
      <div>
        <div className="flex items-center mb-3">
          <p className="label-tag">TALLE</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {allSizes.map((size) => {
            const qty       = stock[size] ?? 0;
            const available = qty > 0;
            const active    = selectedSize === size;
            return (
              <button
                key={size}
                id={`size-btn-${product.id}-${size}`}
                onClick={() => handleSizeSelect(size)}
                disabled={!available}
                className={`relative w-12 h-12 border label-tag text-sm transition-colors overflow-hidden ${
                  active
                    ? "bg-brand-green text-brand-cream border-brand-green"
                    : available
                    ? "border-border hover:border-brand-green hover:bg-brand-green/5"
                    : "border-border text-muted-foreground cursor-not-allowed"
                }`}
              >
                {size}
                {/* diagonal line for out-of-stock */}
                {!available && (
                  <span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to top right, transparent calc(50% - 1px), #d4d4cc calc(50% - 1px), #d4d4cc calc(50% + 1px), transparent calc(50% + 1px))",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de cantidad */}
      {selectedSize && (
        <div className="flex items-center gap-4">
          <p className="label-tag">CANTIDAD</p>
          <div className="flex items-center border border-border">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-4 py-2 text-sm hover:bg-muted transition-colors"
              aria-label="Restar cantidad"
            >
              −
            </button>
            <span className="px-4 py-2 text-sm border-x border-border min-w-[3rem] text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(stock[selectedSize] ?? 1, q + 1))}
              className="px-4 py-2 text-sm hover:bg-muted transition-colors"
              aria-label="Sumar cantidad"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Botón agregar */}
      <button
        id="add-to-cart-btn"
        onClick={handleAddToCart}
        disabled={!selectedSize || !isIdle}
        className={`relative overflow-hidden group w-full py-4 font-bold tracking-widest text-sm flex items-center justify-center gap-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          btnStatus === "done"
            ? "bg-green-mid text-brand-cream"
            : "bg-brand-green text-brand-cream"
        }`}
      >
        {/* hover fill — solo cuando idle y habilitado */}
        {isIdle && selectedSize && (
          <span className="absolute inset-0 bg-brand-cream -translate-x-full group-hover:translate-x-0 transition-transform duration-100 ease-in-out" aria-hidden />
        )}

        <span className={`relative z-10 flex items-center gap-3 transition-colors duration-100 ${isIdle && selectedSize ? "group-hover:text-brand-green" : ""}`}>
          {btnStatus === "done" ? (
            <><Check size={18} />✓ AGREGADO</>
          ) : btnStatus === "loading" ? (
            <><span className="w-4 h-4 border-2 border-brand-cream/40 border-t-brand-cream rounded-full animate-spin" />AGREGANDO...</>
          ) : (
            <><ShoppingBag size={18} />{!selectedSize ? "ELEGÍ UN TALLE" : "AGREGAR AL CARRITO"}</>
          )}
        </span>
      </button>
    </div>
  );
}
