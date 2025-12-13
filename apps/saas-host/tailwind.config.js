import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.js",
    "./resources/**/*.jsx",
    // Include package resources (via vendor symlinks)
    "./vendor/aero/platform/resources/**/*.{js,jsx,ts,tsx,blade.php}",
    "./vendor/aero/core/resources/**/*.{js,jsx,ts,tsx,blade.php}",
    "./vendor/aero/hrm/resources/**/*.{js,jsx,ts,tsx,blade.php}",
    // HeroUI
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Nunito"', 'sans-serif'],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      addCommonColors: true,
      defaultTheme: "light",
      defaultExtendTheme: "light",
      layout: {
        borderWidth: {
          small: "1px",
          medium: "2px",
          large: "3px",
        },
        radius: {
          small: "6px",
          medium: "8px",
          large: "12px",
        },
        fontSize: {
          tiny: "0.75rem",
          small: "0.875rem",
          medium: "1rem",
          large: "1.125rem",
        },
      },
      themes: {
        light: {
          layout: {
            hoverOpacity: 0.8,
          },
        },
      },
    }),
  ],
};
