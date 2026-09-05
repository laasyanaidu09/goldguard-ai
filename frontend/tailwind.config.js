/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0B0D",      // rich near-black
        card: "#12141C",            // deep charcoal
        cardHover: "#1B1E29",
        border: "#202530",          // dark border slate
        gold: {
          light: "#F3E5AB",
          DEFAULT: "#D4AF37",       // metallic gold
          dark: "#AA771C",
          bright: "#FFDF00",
        },
        mutedText: "#8A94A6",
        goldText: "#E5C158",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
