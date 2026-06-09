import { teamByCode, flagUrl } from "@/data/mundial-2026";

interface Props {
  code: string;
  showName?: boolean;
  reverse?: boolean;
  className?: string;
}

/** Bandera + nombre del equipo. Presentacional (sirve en server y client). */
export default function TeamFlag({ code, showName = true, reverse = false, className = "" }: Props) {
  const team = teamByCode(code);
  const name = team?.name ?? code.toUpperCase();

  return (
    <span
      className={`inline-flex items-center gap-2 ${reverse ? "flex-row-reverse" : ""} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={flagUrl(code, 40)}
        alt={name}
        width={26}
        height={20}
        loading="lazy"
        className="h-[18px] w-[26px] object-cover border border-black/10 shrink-0"
      />
      {showName && <span className="truncate">{name}</span>}
    </span>
  );
}
