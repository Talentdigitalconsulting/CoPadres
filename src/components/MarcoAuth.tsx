import Link from "next/link";
import Logo from "@/components/Logo";

/** Marco visual compartido por todas las pantallas de autenticación. */
export default function MarcoAuth({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-crema-100">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <div className="w-full max-w-md tarjeta p-7 md:p-9">
        <h1 className="font-display text-2xl text-carbon mb-1">{titulo}</h1>
        {subtitulo && <p className="text-sm text-carbon-suave mb-6">{subtitulo}</p>}
        {children}
      </div>
      <p className="mt-6 text-xs text-carbon-suave max-w-md text-center">
        Al continuar aceptas los{" "}
        <Link href="/legal/terminos" className="underline hover:text-carbon">
          Términos de uso
        </Link>{" "}
        y la{" "}
        <Link href="/legal/privacidad" className="underline hover:text-carbon">
          Política de privacidad
        </Link>
        .
      </p>
    </main>
  );
}
