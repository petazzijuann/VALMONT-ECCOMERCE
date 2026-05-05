"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCartStore } from "@/store/cart";

export default function Navbar() {
  const { totalItems, toggleCart } = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const count = totalItems();

  return (
    <nav className="sticky top-0 z-50 bg-brand-green text-brand-cream border-b border-green-mid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            href="/"
            className="font-bebas text-2xl tracking-widest hover:text-white transition-colors"
          >
            VALMONT
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/tienda"
              className="label-tag text-cream-dark hover:text-brand-cream transition-colors"
            >
              TIENDA
            </Link>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleCart}
              className="relative p-2 hover:text-white transition-colors"
              aria-label="Carrito"
            >
              <ShoppingBag size={22} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-cream text-brand-green text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {count}
                </span>
              )}
            </button>

            {/* Hamburger mobile */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden p-2 hover:text-white transition-colors"
              aria-label="Menú"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-green-mid bg-brand-green px-4 py-4">
          <Link
            href="/tienda"
            onClick={() => setMenuOpen(false)}
            className="label-tag text-cream-dark block py-2 hover:text-brand-cream transition-colors"
          >
            TIENDA
          </Link>
        </div>
      )}
    </nav>
  );
}
