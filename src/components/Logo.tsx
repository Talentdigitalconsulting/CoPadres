import Image from "next/image";

/**
 * Logotipo de CoPadres: icono (dos progenitores y el hijo en el centro, formando
 * un corazón) + nombre con la tipografía de la marca: «Co» en turquesa con la
 * sonrisa debajo y «Padres» en azul marino (o blanco sobre fondos oscuros).
 */
export default function Logo({ claro = false, tamano = "md" }: { claro?: boolean; tamano?: "md" | "lg" }) {
  const alto = tamano === "lg" ? 44 : 34;
  return (
    <span className="inline-flex items-center gap-2 select-none" aria-label="CoPadres">
      <span className={`shrink-0 inline-flex ${claro ? "bg-white rounded-xl p-1" : ""}`}>
        <Image src="/marca/copadres-icono.png" alt="" width={alto} height={alto} priority
          style={{ width: claro ? alto - 8 : alto, height: "auto" }} />
      </span>
      <Nombre claro={claro} className={tamano === "lg" ? "text-3xl" : "text-[1.6rem]"} />
    </span>
  );
}

/** Solo el nombre «CoPadres» con el estilo del logotipo (para títulos). */
export function Nombre({ claro = false, className = "" }: { claro?: boolean; className?: string }) {
  return (
    <span className={`font-marca font-semibold leading-none tracking-tight inline-flex items-baseline ${className}`} aria-hidden>
      <span className="relative inline-block">
        <span className={claro ? "text-[#3fd0c5]" : "bg-gradient-to-b from-[#16b8b0] to-[#0a8f9c] bg-clip-text text-transparent"}>Co</span>
        {/* La sonrisa del logotipo bajo «Co» */}
        <svg viewBox="0 0 40 10" className="absolute left-[8%] -bottom-[0.32em] w-[84%]" aria-hidden>
          <path d="M3 3 Q20 12 37 3" fill="none" stroke={claro ? "#3fd0c5" : "#0ea5a3"} strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      </span>
      <span className={claro ? "text-white" : "text-[#0b2559]"}>Padres</span>
    </span>
  );
}
