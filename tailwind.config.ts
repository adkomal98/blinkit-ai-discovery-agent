import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Blinkit brand palette
        blinkit: {
          50: "#fef9e7",
          100: "#fdf0c2",
          200: "#fbe49a",
          300: "#f8cb46", // Blinkit yellow
          400: "#f5b800",
          500: "#0C831F", // Blinkit green
          600: "#0a6e1a",
          700: "#085a15",
          ink: "#282C3F",  // dark text
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
