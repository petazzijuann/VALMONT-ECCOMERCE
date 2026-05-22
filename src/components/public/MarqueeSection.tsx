"use client";

const TEXT = "VALMONT · NUEVA COLECCIÓN · URBANO ELEGANTE · MADE IN ARGENTINA · ";

export default function MarqueeSection() {
  return (
    <div className="bg-[#fafafa] border-y border-border overflow-hidden py-4" aria-hidden="true">
      <div
        className="flex whitespace-nowrap"
        style={{ animation: "marquee 20s linear infinite" }}
      >
        {[0, 1].map((i) => (
          <span
            key={i}
            className="font-bebas text-3xl text-brand-green tracking-widest px-4 shrink-0"
          >
            {TEXT.repeat(4)}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="marquee"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
