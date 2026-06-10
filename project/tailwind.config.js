/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Pulled from the Figma design tokens (CASE-STUDY copy).
        bg: "#030304", // page background (near-black)
        rail: "#0B1622", // left nav sidebar
        panel: "#0F1A28", // table / card panels
        surface: "#1F2937", // header rows, inputs, dropdowns (background-elevate-1)
        line: "#262626", // dividers / borders
        brand: "#2D7FF9", // blue accent (active tab, links, brand)
        cashin: "#00D55C", // money in / positive (Green)
        cashinSoft: "#34C759", // Accents/Green
        cashout: "#FF383C", // money out / negative (Accents/Red)
        muted: "#8A94A6", // secondary / label text
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
