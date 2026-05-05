export default function ProductCardSkeleton() {
  return (
    <div className="block">
      <div className="relative aspect-[3/4] bg-muted animate-pulse mb-3" />
      <div className="h-5 bg-muted animate-pulse mb-2 w-3/4" />
      <div className="h-4 bg-muted animate-pulse w-1/3" />
    </div>
  );
}
