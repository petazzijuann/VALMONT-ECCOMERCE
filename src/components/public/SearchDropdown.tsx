"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price_sale: number;
  images: string[];
  category: string;
}

interface Props {
  query: string;
  results: SearchResult[];
  loading: boolean;
  onClose: () => void;
}

export default function SearchDropdown({ query, results, loading, onClose }: Props) {
  const router = useRouter();

  function handleResultClick(slug: string) {
    router.push(`/producto/${slug}`);
    onClose();
  }

  return (
    <div
      className="absolute top-full left-0 right-0 mt-1 bg-brand-green border border-green-mid shadow-lg z-50 min-w-[240px]"
      role="listbox"
      aria-label="Resultados de búsqueda"
    >
      {loading && (
        <div className="p-3 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-green-mid shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-green-mid rounded w-3/4" />
                <div className="h-3 bg-green-mid rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="p-4 text-center">
          <p className="label-tag text-cream-dark text-xs">
            SIN RESULTADOS PARA &ldquo;{query}&rdquo;
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <ul>
            {results.map((item) => (
              <li key={item.id} role="option" aria-selected={false}>
                <button
                  onClick={() => handleResultClick(item.slug)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-green-mid transition-colors text-left"
                >
                  {item.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-green-mid shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-brand-cream text-sm font-medium truncate">{item.name}</p>
                    <p className="text-cream-dark text-xs">
                      ${item.price_sale.toLocaleString("es-AR")}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className="border-t border-green-mid">
            <Link
              href={`/tienda?q=${encodeURIComponent(query)}`}
              onClick={onClose}
              className="block px-3 py-2.5 label-tag text-cream-dark text-xs hover:text-brand-cream transition-colors hover:bg-green-mid"
            >
              VER TODOS LOS RESULTADOS PARA &ldquo;{query}&rdquo; →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
