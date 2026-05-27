/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        bch7al: {
          blue: '#2563EB',
          navy: '#0F172A',
          green: '#22C55E',
          red: '#EF4444',
          white: '#FFFFFF',
          lightgray: '#F8FAFC',
          darkgray: '#1E293B',
        }
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
