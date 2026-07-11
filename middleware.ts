import { type NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/middleware";

export async function middleware(peticion: NextRequest) {
  return actualizarSesion(peticion);
}

export const config = {
  matcher: [
    // Todo excepto estáticos e imágenes
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icono-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
