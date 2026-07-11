import Link from "next/link";
import Logo from "@/components/Logo";

/** Marco común de las páginas legales. */
export default function LayoutLegal({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-crema-100">
      <header className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link href="/"><Logo /></Link>
        <nav className="flex gap-4 text-xs text-carbon-suave">
          <Link href="/legal/privacidad" className="hover:text-carbon">Privacidad</Link>
          <Link href="/legal/terminos" className="hover:text-carbon">Términos</Link>
          <Link href="/legal/cookies" className="hover:text-carbon">Cookies</Link>
        </nav>
      </header>
      <main className="max-w-3xl mx-auto px-4 pb-16">
        <article className="tarjeta p-7 md:p-10 prose-legal text-sm leading-relaxed text-carbon-claro space-y-4
          [&_h1]:font-display [&_h1]:text-3xl [&_h1]:text-carbon [&_h1]:mb-2
          [&_h2]:font-display [&_h2]:text-lg [&_h2]:text-carbon [&_h2]:mt-6
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          {children}
        </article>
      </main>
    </div>
  );
}
