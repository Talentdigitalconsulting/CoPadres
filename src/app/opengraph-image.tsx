import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CoPadres — Coordinaos por vuestros hijos, sin discutir";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen para compartir en redes y mensajería (Open Graph). */
export default function ImagenOG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
        background: "#303d29", color: "#faf6ee", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", position: "relative", width: 72, height: 72 }}>
            <div style={{ position: "absolute", left: 0, top: 6, width: 52, height: 52, borderRadius: 26, background: "#e6ecdf", opacity: 0.9 }} />
            <div style={{ position: "absolute", left: 22, top: 6, width: 52, height: 52, borderRadius: 26, background: "#cedac1", opacity: 0.75 }} />
          </div>
          <div style={{ fontSize: 44, fontWeight: 600 }}>CoPadres</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 72, lineHeight: 1.08, fontWeight: 600, maxWidth: 980 }}>
            Coordinaos por vuestros hijos, sin discutir
          </div>
          <div style={{ fontSize: 30, color: "#cedac1", maxWidth: 980 }}>
            Calendario de custodia · Gastos compartidos · Actividades · Mensajes con filtro de tono · Informes
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#aec29b" }}>App para padres y madres separados · 14 días gratis</div>
      </div>
    ),
    size
  );
}
