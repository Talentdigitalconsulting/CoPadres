"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import {
  IconoInicio, IconoCalendario, IconoGastos, IconoMensajes, IconoDiario,
  IconoInformes, IconoAsistente, IconoCampana, IconoAjustes, IconoSalir, IconoHijos, IconoMenu,
} from "@/components/Iconos";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { contarPendientes } from "@/lib/offline/sinConexion";

const ENLACES = [
  { href: "/app", texto: "Inicio", Icono: IconoInicio },
  { href: "/app/calendario", texto: "Calendario", Icono: IconoCalendario },
  { href: "/app/hijos", texto: "Hijos", Icono: IconoHijos },
  { href: "/app/gastos", texto: "Gastos", Icono: IconoGastos },
  { href: "/app/mensajes", texto: "Mensajes", Icono: IconoMensajes },
  { href: "/app/diario", texto: "Diario", Icono: IconoDiario },
  { href: "/app/informes", texto: "Informes", Icono: IconoInformes },
  { href: "/app/asistente", texto: "Asistente", Icono: IconoAsistente },
];

// En móvil solo caben 5 accesos en la barra inferior; el resto va en el menú «Más».
const ENLACES_MOVIL = ENLACES.slice(0, 5);
const ENLACES_MAS = ENLACES.slice(5);

/** Navegación de la app: barra lateral en escritorio, barra inferior en móvil. */
export default function NavApp() {
  const ruta = usePathname();
  const router = useRouter();
  const [sinLeer, setSinLeer] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Cierre de sesión automático tras 60 minutos sin actividad (protege si el
  // móvil o el ordenador quedan desbloqueados al alcance de otra persona).
  useEffect(() => {
    const LIMITE = 60 * 60 * 1000;
    let ultima = Date.now();
    const marcar = () => { ultima = Date.now(); };
    const eventos = ["pointerdown", "keydown", "scroll", "touchstart", "visibilitychange"];
    eventos.forEach((e) => window.addEventListener(e, marcar, { passive: true }));
    const reloj = window.setInterval(async () => {
      if (Date.now() - ultima > LIMITE) {
        window.clearInterval(reloj);
        await crearClienteNavegador().auth.signOut();
        window.location.href = "/login?motivo=inactividad";
      }
    }, 60 * 1000);
    return () => {
      eventos.forEach((e) => window.removeEventListener(e, marcar));
      window.clearInterval(reloj);
    };
  }, []);

  // Cerrar el menú al cambiar de página.
  useEffect(() => setMenuAbierto(false), [ruta]);

  // Contar notificaciones en tiempo real. (El service worker se registra en app/layout.tsx.)
  useEffect(() => {
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
    const pendientes = await contarPendientes().catch(() => 0);
    if (
      pendientes > 0 &&
      !window.confirm(
        `Tienes ${pendientes === 1 ? "1 cambio" : `${pendientes} cambios`} sin subir (hechos sin conexión). ` +
          "Se quedan cifrados en este dispositivo y se subirán cuando vuelvas a entrar con tu cuenta y haya internet. ¿Cerrar sesión igualmente?"
      )
    )
      return;
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
          <button type="button" className="p-2" aria-label="Más opciones" aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto(!menuAbierto)}>
            <IconoMenu />
          </button>
        </div>
      </header>

      {/* ---------- Móvil: menú «Más» ---------- */}
      {menuAbierto && (
        <div className="md:hidden fixed inset-0 z-50 bg-carbon/30" onClick={() => setMenuAbierto(false)}>
          <nav onClick={(e) => e.stopPropagation()}
            className="absolute top-14 right-3 w-60 bg-white rounded-tarjeta shadow-flotante border border-carbon-linea/60 py-2">
            {ENLACES_MAS.map(({ href, texto, Icono }) => (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-4 py-3 text-sm ${
                  activo(href) ? "text-salvia-700 font-semibold bg-salvia-50" : "text-carbon"}`}>
                <Icono className="w-5 h-5" /> {texto}
              </Link>
            ))}
            <div className="border-t border-carbon-linea my-1" />
            <Link href="/app/ajustes"
              className={`flex items-center gap-3 px-4 py-3 text-sm ${activo("/app/ajustes") ? "text-salvia-700 font-semibold" : "text-carbon"}`}>
              <IconoAjustes /> Ajustes
            </Link>
            <button onClick={salir} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-carbon">
              <IconoSalir /> Salir
            </button>
          </nav>
        </div>
      )}

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
