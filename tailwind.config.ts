// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f8fafc", // slate-50
        surface: "#ffffff",
        primary: {
          DEFAULT: "#4f46e5", // indigo-600
          hover: "#4338ca", // indigo-700
          light: "#e0e7ff", // indigo-100
        },
        success: {
          DEFAULT: "#10b981", // emerald-500
          light: "#d1fae5", // emerald-100
        },
        slate: {
          850: "#152033", // Custom deep slate for dark panels if needed
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
};
export default config;