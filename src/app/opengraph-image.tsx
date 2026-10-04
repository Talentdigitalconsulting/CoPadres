import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "CoPadres — Coordinaos por vuestros hijos, sin discutir";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen para compartir en redes y mensajería (Open Graph). */
export default async function ImagenOG() {
  const png = await readFile(join(process.cwd(), "public/marca/copadres-logo.png"));
  const icono = `data:image/png;base64,${png.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
        background: "#ffffff", color: "#0b2559", padding: 72 }}>
        <div style={{ display: "flex" }}>
          {/* Logotipo completo: icono + nombre con la tipografía de la marca */}
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={icono} width={248} height={185} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 60, lineHeight: 1.1, fontWeight: 700, maxWidth: 1000 }}>
            Coordinaos por vuestros hijos, sin discutir
          </div>
          <div style={{ fontSize: 30, color: "#3d4f78", maxWidth: 1000 }}>
            Calendario de custodia · Gastos compartidos · Actividades · Mensajes con filtro de tono · Informes
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#f08a0c" }}>App para padres y madres separados · 14 días gratis</div>
      </div>
    ),
    size
  );
}
