/** Logotipo de CoPadres: dos formas que se solapan (los dos hogares del menor). */
export default function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
        <circle cx="13" cy="15" r="9" fill={claro ? "#e6ecdf" : "#557043"} opacity="0.9" />
        <circle cx="21" cy="15" r="9" fill={claro ? "#cedac1" : "#8ca876"} opacity="0.75" />
        <circle cx="17" cy="22" r="7" fill={claro ? "#faf6ee" : "#38482f"} opacity="0.9" />
      </svg>
      <span
        className={`font-display text-xl tracking-tight ${claro ? "text-crema-50" : "text-carbon"}`}
      >
        CoPadres
      </span>
    </span>
  );
}
