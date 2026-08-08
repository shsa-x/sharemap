/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        canvas: "#F4F6F9",
        ethan: "#F97316", 
        bengi: "#22C55E", 
        hohn: "#A855F7", 
        "accent-blue": "#2563EB", 
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
    },
  },
  plugins: [],
}
