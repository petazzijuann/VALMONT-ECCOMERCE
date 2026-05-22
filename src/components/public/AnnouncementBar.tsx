"use client";

const TEXT = "🚚 Envíos a todo el país  ★  Pagos con transferencia  ★  ";

export default function AnnouncementBar() {
  return (
    <div className="w-full bg-white border-b border-border overflow-hidden py-1.5" aria-hidden="true">
      <div
        className="flex whitespace-nowrap"
        style={{ animation: "announcement 18s linear infinite" }}
      >
        {[0, 1].map((i) => (
          <span
            key={i}
            className="text-[#c1440e] text-[11px] font-medium tracking-widest px-4 shrink-0"
          >
            {TEXT.repeat(6)}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes announcement {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="announcement"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
