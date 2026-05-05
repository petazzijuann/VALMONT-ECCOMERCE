"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatARS } from "@/lib/utils";

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="font-bebas text-5xl mb-4">CARRITO VACÍO</h1>
        <p className="text-muted-foreground mb-8">
          Todavía no agregaste ningún producto.
        </p>
        <Link
          href="/tienda"
          className="inline-block bg-brand-green text-brand-cream px-10 py-4 font-bold tracking-widest text-sm hover:bg-green-mid transition-colors"
        >
          IR A LA TIENDA
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/tienda" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-bebas text-5xl">CARRITO</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {items.map((item) => (
            <div
              key={`${item.product_id}-${item.size}`}
              className="flex gap-4 pb-6 border-b border-border"
            >
              {/* Imagen */}
              <div className="relative w-24 h-32 bg-muted shrink-0 overflow-hidden">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bebas text-xl">{item.name}</h3>
                  <p className="label-tag text-muted-foreground mt-1">
                    Talle {item.size}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  {/* Cantidad */}
                  <div className="flex items-center border border-border">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.size, item.quantity - 1)}
                      className="px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      −
                    </button>
                    <span className="px-4 py-2 text-sm border-x border-border min-w-[40px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.size, item.quantity + 1)}
                      className="px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="price-text">{formatARS(item.price * item.quantity)}</p>
                    <button
                      onClick={() => removeItem(item.product_id, item.size)}
                      className="text-muted-foreground hover:text-valmont-error transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={clearCart}
            className="label-tag text-muted-foreground hover:text-valmont-error transition-colors self-start text-xs"
          >
            VACIAR CARRITO
          </button>
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="border border-border p-6 sticky top-24">
            <h2 className="font-bebas text-2xl mb-6">RESUMEN</h2>

            <div className="flex flex-col gap-3 mb-6 text-sm">
              {items.map((item) => (
                <div
                  key={`${item.product_id}-${item.size}`}
                  className="flex justify-between text-muted-foreground"
                >
                  <span>{item.name} ({item.size}) ×{item.quantity}</span>
                  <span>{formatARS(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 flex items-center justify-between mb-6">
              <p className="label-tag">TOTAL</p>
              <p className="price-text text-xl">{formatARS(totalPrice())}</p>
            </div>

            <Link
              href="/checkout"
              className="block w-full bg-brand-green text-brand-cream text-center py-4 font-bold tracking-widest text-sm hover:bg-green-mid transition-colors"
            >
              FINALIZAR COMPRA
            </Link>

            <Link
              href="/tienda"
              className="block w-full text-center label-tag text-muted-foreground hover:text-foreground transition-colors mt-4 py-2"
            >
              SEGUIR COMPRANDO
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
