import { NextResponse } from "next/server";
import Stripe from "stripe";
import { crearClienteServidor } from "@/lib/supabase/server";

/** Abre el portal de cliente de Stripe (facturas, cambiar tarjeta, cancelar). */
export async function POST() {
  const supabase = crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: suscripcion } = await supabase
    .from("suscripciones").select("stripe_customer_id").eq("usuario_id", user.id).maybeSingle();

  if (!suscripcion?.stripe_customer_id || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Sin suscripción" }, { status: 404 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sesion = await stripe.billingPortal.sessions.create({
    customer: suscripcion.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/app/ajustes`,
  });

  return NextResponse.json({ url: sesion.url });
}
