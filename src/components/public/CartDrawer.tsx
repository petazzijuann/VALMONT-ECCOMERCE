"use client";

import { useEffect } from "react";
import { X, Trash2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cart";
import { formatARS } from "@/lib/utils";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } =
    useCartStore();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:max-w-sm bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <p className="font-bebas text-2xl tracking-widest">
            CARRITO
            {items.length > 0 && (
              <span className="font-inter text-sm font-normal text-muted-foreground ml-2">
                ({items.length} {items.length === 1 ? "producto" : "productos"})
              </span>
            )}
          </p>
          <button
            onClick={closeCart}
            className="p-1 hover:opacity-60 transition-opacity"
            aria-label="Cerrar carrito"
          >
            <X size={22} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              <ShoppingBag size={48} strokeWidth={1} />
              <p className="label-tag">TU CARRITO ESTÁ VACÍO</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-6">
              {items.map((item) => (
                <li key={`${item.product_id}-${item.size}-${item.color ?? ""}`} className="flex gap-4">
                  {/* Imagen */}
                  <div className="w-20 h-24 bg-muted shrink-0 relative overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <p className="font-medium text-sm leading-tight">{item.name}</p>
                      <p className="label-tag text-muted-foreground mt-1">
                        Talle {item.size}{item.color && item.color !== "Único" ? ` · ${item.color.toUpperCase()}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Cantidad */}
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() =>
                            updateQuantity(item.product_id, item.size, item.color, item.quantity - 1)
                          }
                          className="px-3 py-1 text-sm hover:bg-muted transition-colors"
                        >
                          −
                        </button>
                        <span className="px-3 py-1 text-sm border-x border-border">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product_id, item.size, item.color, item.quantity + 1)
                          }
                          className="px-3 py-1 text-sm hover:bg-muted transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <p className="price-text text-base">
                          {formatARS(item.price * item.quantity)}
                        </p>
                        <button
                          onClick={() => removeItem(item.product_id, item.size, item.color)}
                          className="text-muted-foreground hover:text-valmont-error transition-colors"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-6 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <p className="label-tag">TOTAL</p>
              <p className="price-text text-xl">{formatARS(totalPrice())}</p>
            </div>
            <Link
              href="/carrito"
              onClick={closeCart}
              className="block w-full bg-brand-green text-brand-cream text-center py-4 font-bold tracking-widest text-sm hover:bg-green-mid transition-colors"
            >
              VER CARRITO Y PAGAR
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
