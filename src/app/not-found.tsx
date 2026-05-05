import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-green-dark flex flex-col items-center justify-center px-4 text-center">
      <p
        aria-hidden
        className="font-bebas text-[clamp(120px,20vw,200px)] text-brand-cream/10 leading-none select-none"
      >
        404
      </p>
      <h1 className="font-bebas text-4xl text-brand-cream -mt-4 mb-3">
        PÁGINA NO ENCONTRADA
      </h1>
      <p className="text-cream-dark text-sm mb-10 max-w-xs">
        Lo que buscás no existe o fue removido.
      </p>
      <Link
        href="/tienda"
        className="inline-block bg-brand-cream text-brand-green px-10 py-4 font-bold tracking-widest text-sm hover:bg-white transition-colors"
      >
        IR A LA TIENDA
      </Link>
    </div>
  );
}
