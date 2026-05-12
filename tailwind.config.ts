import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#6c63ff",
          secondary: "#f8a4d8",
          ink: "#0f0f1a",
          offwhite: "#fafafa",
          border: "#e5e5ea",
        },
      },
      fontFamily: {
        display: ['"DM Sans"', "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,15,26,0.04), 0 8px 24px rgba(15,15,26,0.06)",
        lift: "0 4px 12px rgba(15,15,26,0.06), 0 24px 60px rgba(108,99,255,0.12)",
      },
      keyframes: {
        floatA: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(2deg)" },
        },
        floatB: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(10px) rotate(-2deg)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        blink: {
          "50%": { opacity: "0" },
        },
        zonePulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(108,99,255,0.25)" },
          "50%": { boxShadow: "0 0 0 6px rgba(108,99,255,0)" },
        },
        slideInLeft: {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        slideInRight: {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        floatA: "floatA 8s ease-in-out infinite",
        floatB: "floatB 9s ease-in-out infinite",
        marquee: "marquee 38s linear infinite",
        blink: "blink 1s steps(1) infinite",
        zonePulse: "zonePulse 2.4s ease-in-out infinite",
        slideInLeft: "slideInLeft 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
