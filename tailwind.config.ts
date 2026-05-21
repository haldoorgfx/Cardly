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
        // Brand — reads from CSS vars (injected by ThemeProvider); hardcoded values are fallbacks
        primary:        "var(--theme-primary,     #1F4D3A)",
        "primary-dark": "var(--theme-primary-dark,#163828)",
        "primary-soft": "var(--theme-primary-soft,#E8EFEB)",
        accent:         "var(--theme-accent,      #E8C57E)",
        "accent-dark":  "var(--theme-accent-dark, #C9A45E)",
        // Neutral
        ink:            "var(--theme-ink,         #0F1F18)",
        "ink-soft":     "var(--theme-ink-soft,    #3A4A42)",
        muted:          "var(--theme-muted,        #6B7A72)",
        cream:          "var(--theme-cream,        #FAF6EE)",
        // Static — not theme-able
        surface:        "#FFFFFF",
        border:         "#E5E0D4",
        "border-strong":"#C9C3B1",
        // Functional
        success:        "#2D7A4F",
        warning:        "#C97A2D",
        danger:         "#B8423C",
        info:           "#3A6B8C",
      },
      fontFamily: {
        display: ['"DM Sans"', "system-ui", "sans-serif"],
        sans:    ["Inter", "system-ui", "sans-serif"],
        mono:    ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        soft:  "0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)",
        lift:  "0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.12)",
        focus: "0 0 0 3px rgba(31,77,58,0.15)",
      },
      keyframes: {
        floatA: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%":      { transform: "translateY(-10px) rotate(2deg)" },
        },
        floatB: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%":      { transform: "translateY(10px) rotate(-2deg)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
        blink: {
          "50%": { opacity: "0" },
        },
        zonePulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(31,77,58,0.25)" },
          "50%":      { boxShadow: "0 0 0 6px rgba(31,77,58,0)" },
        },
        slideInLeft: {
          from: { transform: "translateX(-100%)" },
          to:   { transform: "translateX(0)" },
        },
        slideInRight: {
          from: { transform: "translateX(100%)" },
          to:   { transform: "translateX(0)" },
        },
      },
      animation: {
        floatA:      "floatA 8s ease-in-out infinite",
        floatB:      "floatB 9s ease-in-out infinite",
        marquee:     "marquee 38s linear infinite",
        blink:       "blink 1s steps(1) infinite",
        zonePulse:   "zonePulse 2.4s ease-in-out infinite",
        slideInLeft: "slideInLeft 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
