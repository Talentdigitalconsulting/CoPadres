import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type ListaCookies = { name: string; value: string; options?: CookieOptions }[];

/** Cliente de Supabase para Server Components y Route Handlers. */
export function crearClienteServidor() {
  const almacen = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll: (lista: ListaCookies) => {
          try {
            lista.forEach(({ name, value, options }) => almacen.set(name, value, options));
          } catch {
            // Ignorable: llamado desde un Server Component sin respuesta mutable.
          }
        },
      },
    }
  );
}
