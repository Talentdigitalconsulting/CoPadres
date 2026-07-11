import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/**
 * Webhook de Stripe: mantiene la tabla `suscripciones` sincronizada.
 * Configúralo en Stripe > Developers > Webhooks apuntando a /api/stripe/webhook
 * con los eventos: checkout.session.completed, customer.subscription.updated,
 * customer.subscription.deleted.
 */
export async function POST(peticion: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const firma = peticion.headers.get("stripe-signature");
  const cuerpo = await peticion.text();

  let evento: Stripe.Event;
  try {
    evento = stripe.webhooks.constructEvent(cuerpo, firma!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Firma no válida" }, { status: 400 });
  }

  // Cliente administrador: el webhook no tiene sesión de usuario.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const guardar = async (
    usuarioId: string,
    datos: Partial<{
      stripe_customer_id: string; stripe_subscription_id: string;
      plan: string; estado: string; periodo_fin: string | null;
    }>
  ) => {
    await supabase.from("suscripciones").upsert(
      { usuario_id: usuarioId, ...datos, actualizado_en: new Date().toISOString() },
      { onConflict: "usuario_id" }
    );
  };

  switch (evento.type) {
    case "checkout.session.completed": {
      const sesion = evento.data.object as Stripe.Checkout.Session;
      const usuarioId = sesion.client_reference_id ?? sesion.metadata?.usuario_id;
      if (usuarioId) {
        await guardar(usuarioId, {
          stripe_customer_id: String(sesion.customer ?? ""),
          stripe_subscription_id: String(sesion.subscription ?? ""),
          plan: sesion.metadata?.plan ?? "individual",
          estado: "activa",
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = evento.data.object as Stripe.Subscription;
      const usuarioId = sub.metadata?.usuario_id;
      if (usuarioId) {
        const activa = sub.status === "active" || sub.status === "trialing";
        const finPeriodo = (sub as unknown as { current_period_end?: number }).current_period_end;
        await guardar(usuarioId, {
          stripe_subscription_id: sub.id,
          estado: evento.type === "customer.subscription.deleted" ? "cancelada" : activa ? "activa" : sub.status,
          periodo_fin: finPeriodo ? new Date(finPeriodo * 1000).toISOString() : null,
        });
      }
      break;
    }
  }

  return NextResponse.json({ recibido: true });
}
