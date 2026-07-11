import type { Config } from "tailwindcss";

/**
 * Paleta CoPadres: salvia + crema + carbón.
 * Sobria, cálida y neutral — pensada para reducir tensión entre progenitores.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        salvia: {
          50: "#f4f6f1",
          100: "#e6ecdf",
          200: "#cedac1",
          300: "#aec29b",
          400: "#8ca876",
          500: "#6e8d58",
          600: "#557043",
          700: "#445937",
          800: "#38482f",
          900: "#303d29",
          950: "#182013",
        },
        crema: {
          50: "#fdfbf7",
          100: "#faf6ee",
          200: "#f3ecdc",
          300: "#e9dfc6",
          400: "#dccca6",
        },
        carbon: {
          DEFAULT: "#26251f",
          claro: "#4a4940",
          suave: "#6f6e63",
          linea: "#e4e0d3",
        },
        arcilla: "#c1794f",
        vino: "#a05446",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        tarjeta: "0 1px 2px rgba(38,37,31,0.05), 0 4px 16px rgba(38,37,31,0.06)",
        flotante: "0 8px 32px rgba(38,37,31,0.14)",
      },
      borderRadius: {
        tarjeta: "1.1rem",
      },
    },
  },
  plugins: [],
};
export default config;
