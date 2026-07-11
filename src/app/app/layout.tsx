import { redirect } from "next/navigation";
import NavApp from "@/components/NavApp";
import { crearClienteServidor } from "@/lib/supabase/server";

/** Estructura protegida de la aplicación (requiere sesión). */
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const supabase = crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Si aún no pertenece a ninguna familia, pasa por el onboarding.
  const { data: miembro } = await supabase
    .from("miembros_familia")
    .select("id")
    .eq("usuario_id", user.id)
    .maybeSingle();
  if (!miembro) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-crema-100">
      <NavApp />
      <main className="md:pl-60 pt-14 md:pt-0 pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">{children}</div>
      </main>
    </div>
  );
}
