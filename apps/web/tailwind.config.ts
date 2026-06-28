import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#3f1d78",
        },
        // NP Learning brand system: warm surfaces, deep ink, restrained accent.
        ink: {
          DEFAULT: "#17142f",
          900: "#100e22",
          800: "#1f1b3f",
          700: "#2c2752",
          600: "#403968",
        },
        cream: {
          50: "#fbfaf7",
          100: "#f5f0e8",
          200: "#ece3d6",
        },
        gold: {
          DEFAULT: "#c49a4a",
          400: "#d7b366",
          500: "#c49a4a",
          600: "#a87d2d",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
