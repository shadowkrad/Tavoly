import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "var(--brand-50, #eff6ff)",
          100: "var(--brand-100, #dbeafe)",
          500: "var(--brand-primary, #2563eb)",
          600: "var(--brand-primary-hover, #1d4ed8)",
          700: "var(--brand-primary-dark, #1e40af)",
          accent: "var(--brand-accent, #f97316)",
        },
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
      },
      borderRadius: {
        "2xl": "1rem",
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
