"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Menu, X, Search, ChevronDown } from "lucide-react";
import { useCartStore } from "@/store/cart";
import SearchDropdown from "@/components/public/SearchDropdown";

const CATEGORIAS = [
  { value: "remeras",    label: "REMERAS" },
  { value: "pantalones", label: "PANTALONES" },
  { value: "buzos",      label: "BUZOS" },
  { value: "accesorios", label: "ACCESORIOS" },
] as const;

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price_sale: number;
  images: string[];
  category: string;
}

export default function Navbar() {
  const { totalItems, toggleCart } = useCartStore();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results,     setResults]     = useState<SearchResult[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [dropOpen,    setDropOpen]    = useState(false);
  const [mounted,     setMounted]     = useState(false);
  const count  = totalItems();
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const inputRef           = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchBarRef = useRef<HTMLDivElement>(null);
  const searchTimerRef     = useRef<ReturnType<typeof setTimeout>>(undefined);
  const openTimerRef      = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimerRef     = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── Search ────────────────────────────────────────────────
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setResults([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (searchContainerRef.current?.contains(target)) return;
      if (mobileSearchBarRef.current?.contains(target)) return;
      closeSearch();
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [searchOpen, closeSearch]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [searchOpen]);

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      closeSearch();
    } else if (e.key === "Enter" && searchQuery.trim().length >= 2) {
      router.push(`/tienda?q=${encodeURIComponent(searchQuery.trim())}`);
      closeSearch();
    }
  }

  function handleQueryChange(value: string) {
    setSearchQuery(value);
    clearTimeout(searchTimerRef.current);
    if (value.trim().length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch { setResults([]); }
      finally  { setLoading(false); }
    }, 300);
  }

  const showSearchDropdown = searchOpen && searchQuery.trim().length >= 2;

  // ── Dropdown categorías ───────────────────────────────────
  function handleDropEnter() {
    clearTimeout(closeTimerRef.current);
    openTimerRef.current = setTimeout(() => setDropOpen(true), 80);
  }

  function handleDropLeave() {
    clearTimeout(openTimerRef.current);
    closeTimerRef.current = setTimeout(() => setDropOpen(false), 100);
  }

  // Escape cierra el dropdown
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDropOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <nav className="bg-brand-green text-brand-cream border-b border-green-mid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-8">

          {/* Logo */}
          <Link href="/" className="font-bebas text-2xl tracking-widest hover:text-white transition-colors shrink-0">
            VALMONT
          </Link>

          {/* Derecha */}
          <div className="flex items-center gap-6 ml-auto">

            {/* Nav desktop */}
            <div className="hidden md:flex items-center gap-8">

              {/* PRODUCTOS con dropdown */}
              <div
                className="relative"
                onMouseEnter={handleDropEnter}
                onMouseLeave={handleDropLeave}
              >
                <Link
                  href="/tienda"
                  onClick={() => setDropOpen(false)}
                  className={`label-tag flex items-center gap-1 transition-colors ${
                    dropOpen ? "text-white" : "text-cream-dark hover:text-brand-cream"
                  }`}
                >
                  PRODUCTOS
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${dropOpen ? "rotate-180" : "rotate-0"}`}
                  />
                </Link>

                {/* Dropdown */}
                <div
                  className={`absolute top-full left-0 z-40 min-w-[160px] bg-brand-green border border-green-mid shadow-lg transition-all duration-200 ease-out ${
                    dropOpen
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 -translate-y-2 pointer-events-none"
                  }`}
                >
                  {CATEGORIAS.map(({ value, label }) => (
                    <Link
                      key={value}
                      href={`/tienda?categoria=${value}`}
                      onClick={() => setDropOpen(false)}
                      className="label-tag block px-6 py-3 text-cream-dark hover:text-brand-cream hover:bg-green-mid/50 transition-colors duration-150"
                    >
                      {label}
                    </Link>
                  ))}
                  <div className="border-t border-green-mid">
                    <Link
                      href="/tienda"
                      onClick={() => setDropOpen(false)}
                      className="label-tag block px-6 py-3 text-cream-dark hover:text-brand-cream hover:bg-green-mid/50 transition-colors duration-150"
                    >
                      VER TODO →
                    </Link>
                  </div>
                </div>
              </div>

              <Link href="/prode" className="label-tag text-cream-dark hover:text-brand-cream transition-colors">
                PRODE MUNDIAL
              </Link>

              <Link href="/contacto" className="label-tag text-cream-dark hover:text-brand-cream transition-colors">
                CONTACTO
              </Link>
            </div>

            {/* Search desktop */}
            <div ref={searchContainerRef} className="hidden md:flex items-center relative">
              <div className="flex items-center">
                <div className={`overflow-hidden transition-[width] duration-[250ms] ease-out ${searchOpen ? "w-60" : "w-0"}`}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="BUSCAR PRODUCTOS..."
                    aria-label="Buscar productos"
                    className="w-full bg-green-mid text-brand-cream placeholder-cream-dark text-xs tracking-wider px-3 py-1.5 outline-none border-0"
                  />
                </div>
                <button
                  onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
                  className="p-2 hover:text-white transition-colors"
                  aria-label={searchOpen ? "Cerrar buscador" : "Abrir buscador"}
                >
                  {searchOpen ? <X size={22} /> : <Search size={22} />}
                </button>
              </div>
              {showSearchDropdown && (
                <SearchDropdown query={searchQuery.trim()} results={results} loading={loading} onClose={closeSearch} />
              )}
            </div>

            {/* Search mobile */}
            <button
              type="button"
              onClick={searchOpen ? closeSearch : () => setSearchOpen(true)}
              className="md:hidden p-3 -m-1 hover:text-white transition-colors"
              aria-label={searchOpen ? "Cerrar buscador" : "Abrir buscador"}
            >
              {searchOpen ? <X size={22} /> : <Search size={22} />}
            </button>

            {/* Carrito */}
            <button onClick={toggleCart} className="relative p-3 -m-1 hover:text-white transition-colors" aria-label="Carrito">
              <ShoppingBag size={22} />
              {mounted && count > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-cream text-brand-green text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {count}
                </span>
              )}
            </button>

            {/* Hamburger mobile */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden p-3 -m-1 hover:text-white transition-colors"
              aria-label="Menú"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Barra búsqueda mobile */}
      {searchOpen && (
        <div ref={mobileSearchBarRef} className="md:hidden border-t border-green-mid bg-green-mid px-4 py-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="BUSCAR PRODUCTOS..."
              aria-label="Buscar productos"
              autoFocus
              className="w-full bg-transparent text-brand-cream placeholder-cream-dark text-xs tracking-wider py-2 outline-none border-0"
            />
            {showSearchDropdown && (
              <SearchDropdown query={searchQuery.trim()} results={results} loading={loading} onClose={closeSearch} />
            )}
          </div>
        </div>
      )}

      {/* Menú mobile */}
      {menuOpen && (
        <div className="md:hidden border-t border-green-mid bg-brand-green px-4 py-4">
          {/* PRODUCTOS + subcategorías */}
          <Link
            href="/tienda"
            onClick={() => setMenuOpen(false)}
            className="label-tag text-cream-dark block py-2 hover:text-brand-cream transition-colors"
          >
            PRODUCTOS
          </Link>
          {CATEGORIAS.map(({ value, label }) => (
            <Link
              key={value}
              href={`/tienda?categoria=${value}`}
              onClick={() => setMenuOpen(false)}
              className="label-tag text-cream-dark/70 block py-1.5 pl-6 text-xs hover:text-brand-cream transition-colors"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/prode"
            onClick={() => setMenuOpen(false)}
            className="label-tag text-cream-dark block py-2 mt-1 hover:text-brand-cream transition-colors"
          >
            PRODE MUNDIAL
          </Link>
          <Link
            href="/contacto"
            onClick={() => setMenuOpen(false)}
            className="label-tag text-cream-dark block py-2 hover:text-brand-cream transition-colors"
          >
            CONTACTO
          </Link>
        </div>
      )}
    </nav>
  );
}
