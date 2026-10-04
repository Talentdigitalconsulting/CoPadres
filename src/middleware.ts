import { type NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/middleware";

export async function middleware(peticion: NextRequest) {
  return actualizarSesion(peticion);
}

export const config = {
  matcher: [
    {
      // Todo excepto estáticos, imágenes y ficheros públicos de rastreo (robots, sitemap, llms.txt…)
      source:
        "/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html|manifest.webmanifest|icons/|robots.txt|sitemap.xml|llms.txt|\\.well-known|marca/|icono-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
      // Las precargas de Next no necesitan CSP propia
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
