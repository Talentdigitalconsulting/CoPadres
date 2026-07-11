# CoPadres

**La app de coordinación para padres separados.** Calendario de custodia auditado, gastos con
comprobante y reparto automático, mensajería con filtro de tono IA, diario del menor e informes
PDF para abogados y juzgados.

Construida con **Next.js 14 (App Router) + Tailwind CSS + Supabase + Stripe + Claude API**,
como PWA móvil-primero, interfaz 100 % en español.

## Puesta en marcha rápida

1. Lee **TUTORIAL.md** — contiene la guía completa paso a paso (Supabase, Google, Stripe, Claude, Vercel).
2. `cp .env.example .env.local` y rellena las claves.
3. Ejecuta `supabase/schema.sql` completo en el SQL Editor de tu proyecto Supabase.
4. `npm install && npm run dev` → http://localhost:3000

## Estructura

```
supabase/schema.sql   ← Base de datos completa: tablas, RLS, triggers, auditoría
src/app/              ← Páginas (landing, auth, /app privada, /api)
src/components/       ← Navegación, logo, banner de cookies, iconos
src/lib/              ← Clientes de Supabase, tipos, utilidades, hook useFamilia
public/sw.js          ← Service worker (PWA + push)
```

## Seguridad

- Row Level Security en **todas** las tablas: cada dato solo lo ven los miembros de su familia.
- Mensajes y registro de auditoría **inmutables** (triggers que bloquean UPDATE/DELETE).
- Ninguna clave secreta en el cliente; validación de entradas con Zod en el servidor.
