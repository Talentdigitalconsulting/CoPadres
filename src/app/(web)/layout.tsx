import CabeceraPublica from "@/components/publico/Cabecera";
import PiePublico from "@/components/publico/Pie";

/** Marco de las páginas públicas (web comercial y contenidos). */
export default function LayoutWeb({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-crema-100 text-carbon flex flex-col">
      <CabeceraPublica />
      <main className="flex-1">{children}</main>
      <PiePublico />
    </div>
  );
}
