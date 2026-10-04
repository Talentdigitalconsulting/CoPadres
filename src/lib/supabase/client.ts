"use client";
import { createBrowserClient } from "@supabase/ssr";
import { fetchSinConexion, limpiarDatosLocales } from "@/lib/offline/sinConexion";

let escuchandoSesion = false;

/**
 * Cliente de Supabase para componentes de cliente (navegador).
 * Usa el `fetch` del modo sin conexión: sin internet, lo registrado se guarda
 * cifrado en el dispositivo y se sube solo a Supabase al recuperar la conexión.
 */
export function crearClienteNavegador() {
  const cliente = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { fetch: fetchSinConexion },
  });
  if (!escuchandoSesion && typeof window !== "undefined") {
    escuchandoSesion = true;
    cliente.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") void limpiarDatosLocales();
    });
  }
  return cliente;
}
