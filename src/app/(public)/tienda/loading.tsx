import ProductCardSkeleton from "@/components/public/ProductCardSkeleton";

export default function TiendaLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="h-3 bg-muted animate-pulse w-28 mb-2" />
        <div className="h-12 bg-muted animate-pulse w-32" />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-4">
        {[88, 96, 112, 96, 104, 88].map((w, i) => (
          <div key={i} className="h-9 bg-muted animate-pulse shrink-0" style={{ width: w }} />
        ))}
      </div>

      {/* Size filter */}
      <div className="flex gap-2 mb-10">
        {[64, 40, 40, 40, 40, 40, 48].map((w, i) => (
          <div key={i} className="h-8 bg-muted animate-pulse shrink-0" style={{ width: w }} />
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
        {[...Array(8)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
