/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      /* ─────────────────────────────────────────────
       * COLOR TOKENS — Cognitive Concierge Design System
       * Surface hierarchy, semantic colors, and tonal palette
       * ───────────────────────────────────────────── */
      colors: {
        /* ── Surface Hierarchy (Atmospheric Depth) ── */
        "surface":                    "#f7fafc",
        "surface-dim":                "#d7dadc",
        "surface-bright":             "#f7fafc",
        "surface-container-lowest":   "#ffffff",
        "surface-container-low":      "#f1f4f6",
        "surface-container":          "#ebeef0",
        "surface-container-high":     "#e5e9eb",
        "surface-container-highest":  "#e0e3e5",
        "surface-variant":            "#e0e3e5",
        "surface-tint":               "#006398",

        /* ── Primary (Professional Blue — LinkedIn-evolved) ── */
        "primary":                    "#005d8f",
        "primary-container":          "#0077b5",
        "primary-fixed":              "#cde5ff",
        "primary-fixed-dim":          "#93ccff",
        "on-primary":                 "#ffffff",
        "on-primary-container":       "#f3f7ff",
        "on-primary-fixed":           "#001d32",
        "on-primary-fixed-variant":   "#004b74",
        "inverse-primary":            "#93ccff",

        /* ── Secondary (Emerald Green — Signal Color) ── */
        "secondary":                  "#006d36",
        "secondary-container":        "#83fba5",
        "secondary-fixed":            "#83fba5",
        "secondary-fixed-dim":        "#66dd8b",
        "on-secondary":               "#ffffff",
        "on-secondary-container":     "#00743a",
        "on-secondary-fixed":         "#00210c",
        "on-secondary-fixed-variant": "#005227",

        /* ── Tertiary (Coral — Signal Color) ── */
        "tertiary":                   "#9d370c",
        "tertiary-container":         "#be4f24",
        "tertiary-fixed":             "#ffdbcf",
        "tertiary-fixed-dim":         "#ffb59c",
        "on-tertiary":                "#ffffff",
        "on-tertiary-container":      "#fff5f2",
        "on-tertiary-fixed":          "#380c00",
        "on-tertiary-fixed-variant":  "#822800",

        /* ── Neutral / On-Surface ── */
        "on-surface":                 "#181c1e",
        "on-surface-variant":         "#404850",
        "on-background":              "#181c1e",
        "background":                 "#f7fafc",
        "inverse-surface":            "#2d3133",
        "inverse-on-surface":         "#eef1f3",

        /* ── Outline ── */
        "outline":                    "#707881",
        "outline-variant":            "#bfc7d1",

        /* ── Error ── */
        "error":                      "#ba1a1a",
        "error-container":            "#ffdad6",
        "on-error":                   "#ffffff",
        "on-error-container":         "#93000a",
      },

      /* ─────────────────────────────────────────────
       * TYPOGRAPHY — Dual-Font Strategy
       * Manrope: Editorial authority (headlines)
       * Inter: Technical precision (UI & data)
       * ───────────────────────────────────────────── */
      fontFamily: {
        headline: ["Manrope", "system-ui", "sans-serif"],
        body:     ["Inter", "system-ui", "sans-serif"],
        label:    ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        /* Display (Manrope) */
        "display-lg": ["3.5625rem",  { lineHeight: "1.12", letterSpacing: "-0.02em", fontWeight: "800" }],
        "display-md": ["2.75rem",    { lineHeight: "1.16", letterSpacing: "-0.02em", fontWeight: "800" }],
        "display-sm": ["2.25rem",    { lineHeight: "1.22", letterSpacing: "-0.01em", fontWeight: "700" }],
        /* Headline (Manrope) */
        "headline-lg": ["2rem",      { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-md": ["1.75rem",   { lineHeight: "1.29", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-sm": ["1.5rem",    { lineHeight: "1.33", fontWeight: "700" }],
        /* Title (Inter) */
        "title-lg": ["1.375rem",     { lineHeight: "1.27", fontWeight: "600" }],
        "title-md": ["1rem",         { lineHeight: "1.5",  letterSpacing: "0.01em", fontWeight: "600" }],
        "title-sm": ["0.875rem",     { lineHeight: "1.43", letterSpacing: "0.01em", fontWeight: "600" }],
        /* Body (Inter) */
        "body-lg":  ["1rem",         { lineHeight: "1.5",  letterSpacing: "0.01em", fontWeight: "400" }],
        "body-md":  ["0.875rem",     { lineHeight: "1.43", letterSpacing: "0.02em", fontWeight: "400" }],
        "body-sm":  ["0.75rem",      { lineHeight: "1.33", letterSpacing: "0.03em", fontWeight: "400" }],
        /* Label (Inter) */
        "label-lg": ["0.875rem",     { lineHeight: "1.43", letterSpacing: "0.01em", fontWeight: "600" }],
        "label-md": ["0.75rem",      { lineHeight: "1.33", letterSpacing: "0.04em", fontWeight: "600" }],
        "label-sm": ["0.6875rem",    { lineHeight: "1.45", letterSpacing: "0.05em", fontWeight: "600" }],
      },

      /* ─────────────────────────────────────────────
       * SHAPE — Soft, approachable curves
       * ───────────────────────────────────────────── */
      borderRadius: {
        "none": "0",
        "sm":   "0.25rem",
        DEFAULT: "0.5rem",
        "md":   "0.75rem",
        "lg":   "1rem",
        "xl":   "1.5rem",
        "full": "9999px",
      },

      /* ─────────────────────────────────────────────
       * ELEVATION — Ambient Diffusion (no harsh shadows)
       * ───────────────────────────────────────────── */
      boxShadow: {
        "ambient-sm":  "0px 4px 12px -2px rgba(24, 28, 30, 0.04)",
        "ambient-md":  "0px 8px 24px -4px rgba(24, 28, 30, 0.05)",
        "ambient-lg":  "0px 12px 32px -4px rgba(24, 28, 30, 0.06)",
        "ambient-xl":  "0px 16px 48px -8px rgba(24, 28, 30, 0.08)",
        "inner-glow":  "inset 0px 1px 4px 0px rgba(205, 229, 255, 0.3)",
        "none":        "none",
      },

      /* ─────────────────────────────────────────────
       * SPACING — Asymmetric editorial spacing scale
       * ───────────────────────────────────────────── */
      spacing: {
        "0.5": "0.125rem",
        "1":   "0.25rem",
        "1.5": "0.375rem",
        "2":   "0.5rem",
        "3":   "0.75rem",
        "4":   "1rem",
        "5":   "1.25rem",
        "6":   "1.5rem",
        "8":   "2rem",
        "10":  "2.5rem",
        "12":  "3rem",
        "16":  "4rem",
      },

      /* ─────────────────────────────────────────────
       * BACKDROP BLUR — Glassmorphism tokens
       * ───────────────────────────────────────────── */
      backdropBlur: {
        "glass":    "20px",
        "glass-sm": "12px",
      },

      /* ─────────────────────────────────────────────
       * TRANSITIONS — Smooth micro-interactions
       * ───────────────────────────────────────────── */
      transitionDuration: {
        "fast":    "150ms",
        "normal":  "250ms",
        "slow":    "400ms",
      },
      transitionTimingFunction: {
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
