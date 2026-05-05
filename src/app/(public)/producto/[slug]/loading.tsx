export default function ProductoLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8">
        {[48, 12, 56, 12, 72, 12, 120].map((w, i) => (
          <div key={i} className="h-3 bg-muted animate-pulse" style={{ width: w }} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Image */}
        <div className="aspect-[3/4] bg-muted animate-pulse" />

        {/* Info */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="h-3 bg-muted animate-pulse w-20 mb-3" />
            <div className="h-14 bg-muted animate-pulse w-4/5 mb-3" />
            <div className="h-7 bg-muted animate-pulse w-1/3" />
          </div>

          {/* Size selector */}
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 w-14 bg-muted animate-pulse" />
            ))}
          </div>

          {/* CTA */}
          <div className="h-14 bg-muted animate-pulse w-full" />

          {/* Description */}
          <div className="space-y-2 pt-6 border-t border-border">
            <div className="h-3 bg-muted animate-pulse w-24 mb-3" />
            <div className="h-4 bg-muted animate-pulse w-full" />
            <div className="h-4 bg-muted animate-pulse w-5/6" />
            <div className="h-4 bg-muted animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
