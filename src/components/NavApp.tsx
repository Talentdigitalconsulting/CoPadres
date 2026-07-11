"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import {
  IconoInicio, IconoCalendario, IconoGastos, IconoMensajes, IconoDiario,
  IconoInformes, IconoAsistente, IconoCampana, IconoAjustes, IconoSalir,
} from "@/components/Iconos";
import { crearClienteNavegador } from "@/lib/supabase/client";

const ENLACES = [
  { href: "/app", texto: "Inicio", Icono: IconoInicio },
  { href: "/app/calendario", texto: "Calendario", Icono: IconoCalendario },
  { href: "/app/gastos", texto: "Gastos", Icono: IconoGastos },
  { href: "/app/mensajes", texto: "Mensajes", Icono: IconoMensajes },
  { href: "/app/diario", texto: "Diario", Icono: IconoDiario },
  { href: "/app/informes", texto: "Informes", Icono: IconoInformes },
  { href: "/app/asistente", texto: "Asistente", Icono: IconoAsistente },
];

// En móvil solo caben 5 accesos en la barra inferior.
const ENLACES_MOVIL = ENLACES.slice(0, 5);

/** Navegación de la app: barra lateral en escritorio, barra inferior en móvil. */
export default function NavApp() {
  const ruta = usePathname();
  const router = useRouter();
  const [sinLeer, setSinLeer] = useState(0);

  // Registrar el service worker (PWA) y contar notificaciones en tiempo real.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const supabase = crearClienteNavegador();
    let canal: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const contar = async () => {
        const { count } = await supabase
          .from("notificaciones")
          .select("id", { count: "exact", head: true })
          .eq("usuario_id", user.id)
          .eq("leida", false);
        setSinLeer(count ?? 0);
      };
      await contar();
      canal = supabase
        .channel("notificaciones-nav")
        .on("postgres_changes",
          { event: "*", schema: "public", table: "notificaciones", filter: `usuario_id=eq.${user.id}` },
          contar)
        .subscribe();
    })();

    return () => {
      if (canal) crearClienteNavegador().removeChannel(canal);
    };
  }, []);

  const salir = async () => {
    await crearClienteNavegador().auth.signOut();
    router.push("/");
    router.refresh();
  };

  const activo = (href: string) =>
    href === "/app" ? ruta === "/app" : ruta.startsWith(href);

  return (
    <>
      {/* ---------- Escritorio: barra lateral ---------- */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col bg-salvia-900 text-crema-100 px-4 py-6 z-40">
        <Link href="/app" className="px-2 mb-8"><Logo claro /></Link>
        <nav className="flex-1 space-y-1">
          {ENLACES.map(({ href, texto, Icono }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                activo(href)
                  ? "bg-salvia-700 text-crema-50 font-semibold"
                  : "text-salvia-200 hover:bg-salvia-800 hover:text-crema-100"
              }`}>
              <Icono className="w-5 h-5" />
              {texto}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-salvia-800 pt-4">
          <Link href="/app/notificaciones"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
              activo("/app/notificaciones") ? "bg-salvia-700 text-crema-50" : "text-salvia-200 hover:bg-salvia-800"
            }`}>
            <span className="relative">
              <IconoCampana />
              {sinLeer > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-arcilla text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                  {sinLeer > 9 ? "9+" : sinLeer}
                </span>
              )}
            </span>
            Notificaciones
          </Link>
          <Link href="/app/ajustes"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
              activo("/app/ajustes") ? "bg-salvia-700 text-crema-50" : "text-salvia-200 hover:bg-salvia-800"
            }`}>
            <IconoAjustes /> Ajustes
          </Link>
          <button onClick={salir}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-salvia-200 hover:bg-salvia-800">
            <IconoSalir /> Salir
          </button>
        </div>
      </aside>

      {/* ---------- Móvil: cabecera ---------- */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-salvia-900 text-crema-100 flex items-center justify-between px-4 z-40">
        <Link href="/app"><Logo claro /></Link>
        <div className="flex items-center gap-1">
          <Link href="/app/notificaciones" className="relative p-2">
            <IconoCampana />
            {sinLeer > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-arcilla text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                {sinLeer > 9 ? "9+" : sinLeer}
              </span>
            )}
          </Link>
          <Link href="/app/ajustes" className="p-2"><IconoAjustes /></Link>
        </div>
      </header>

      {/* ---------- Móvil: barra inferior ---------- */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-carbon-linea flex z-40 pb-[env(safe-area-inset-bottom)]">
        {ENLACES_MOVIL.map(({ href, texto, Icono }) => (
          <Link key={href} href={href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] ${
              activo(href) ? "text-salvia-700 font-semibold" : "text-carbon-suave"
            }`}>
            <Icono className="w-5 h-5" />
            {texto}
          </Link>
        ))}
      </nav>
    </>
  );
}
