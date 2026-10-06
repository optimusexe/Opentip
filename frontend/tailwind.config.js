/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: { lg: "0.25rem", md: "0.25rem", sm: "2px" },
      fontFamily: { serif: ["var(--font-fraunces)"], mono: ["var(--font-plex-mono)"] },
      // Named layers. Values live on :root in app/globals.css.
      zIndex: {
        sticky: "var(--z-sticky)",
        header: "var(--z-header)",
        dropdown: "var(--z-dropdown)",
        overlay: "var(--z-overlay)",
        "overlay-control": "var(--z-overlay-control)",
        modal: "var(--z-modal)",
        toast: "var(--z-toast)",
        skip: "var(--z-skip)",
      },
    },
  },
  plugins: []
};
