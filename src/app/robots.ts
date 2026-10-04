import type { MetadataRoute } from "next";
import { urlSitio } from "@/lib/legal";

/** Zonas privadas que no deben aparecer en buscadores. */
const PRIVADAS = ["/app/", "/api/", "/auth/", "/onboarding", "/invitacion", "/restablecer"];

/**
 * Buscadores y asistentes de IA a los que permitimos explícitamente rastrear la web pública
 * (para que CoPadres aparezca en Google, Bing, ChatGPT, Claude, Perplexity, Gemini, Copilot…).
 */
const BOTS_IA = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User", "anthropic-ai",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "GoogleOther", "Googlebot",
  "Bingbot", "Applebot", "Applebot-Extended",
  "Meta-ExternalAgent", "meta-externalfetcher", "Amazonbot", "DuckAssistBot",
  "cohere-ai", "MistralAI-User", "YouBot", "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  const url = urlSitio();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVADAS },
      { userAgent: BOTS_IA, allow: "/", disallow: PRIVADAS },
    ],
    sitemap: `${url}/sitemap.xml`,
    host: url,
  };
}
