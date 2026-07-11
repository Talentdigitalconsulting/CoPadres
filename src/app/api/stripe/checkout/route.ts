import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Crea una sesión de Stripe Checkout para el plan elegido.
 * Alternativa: si prefieres usar Payment Links del panel de Stripe, ponlos en
 * NEXT_PUBLIC_STRIPE_LINK_INDIVIDUAL / _FAMILIA y la página de precios los usará
 * directamente sin pasar por aquí.
 */
const Entrada = z.object({ plan: z.enum(["individual", "familia"]) });

export async function POST(peticion: Request) {
  const supabase = crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const cuerpo = Entrada.safeParse(await peticion.json());
  if (!cuerpo.success) return NextResponse.json({ error: "Plan no válido" }, { status: 400 });

  const precio =
    cuerpo.data.plan === "individual"
      ? process.env.STRIPE_PRICE_INDIVIDUAL
      : process.env.STRIPE_PRICE_FAMILIA;
  if (!precio || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe no está configurado todavía." }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origen = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const sesion = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: precio, quantity: 1 }],
    customer_email: user.email ?? undefined,
    client_reference_id: user.id, // Para vincular la suscripción en el webhook.
    subscription_data: { trial_period_days: 14, metadata: { usuario_id: user.id } },
    metadata: { usuario_id: user.id, plan: cuerpo.data.plan },
    success_url: `${origen}/app/ajustes?pago=ok`,
    cancel_url: `${origen}/precios?pago=cancelado`,
    locale: "es",
  });

  return NextResponse.json({ url: sesion.url });
}
