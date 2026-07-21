import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Nana Forex palette (matches the existing site's CSS variables)
        primary: "#0a2540",
        secondary: "#00c896",
        gold: "#f5b700",
        "gold-premium": "#ffc857",
        dark: "#081120",
        "bg-dark": "#050a16",
        "profit-green": "#00ff88",
        danger: "#ff4d4d",
        "card-bg": "#0e1726",
        border: {
          DEFAULT: "rgba(255,255,255,0.08)",
          soft: "rgba(255,255,255,0.06)",
        },
        muted: "rgba(255,255,255,0.55)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        "green-glow": "0 0 30px rgba(0,200,150,0.2)",
        "gold-glow": "0 0 30px rgba(245,183,0,0.2)",
        "elevated": "0 25px 50px rgba(0,0,0,0.35)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #00c896, #00ff88)",
        "gradient-gold": "linear-gradient(135deg, #f5b700, #ffc857)",
      },
      animation: {
        "float": "float 15s ease-in-out infinite",
        "shine": "shine 6s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(22px,-26px) scale(1.08)" },
        },
        shine: {
          to: { backgroundPosition: "200% center" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
