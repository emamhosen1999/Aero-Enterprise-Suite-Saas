/**
 * HeroUI Tailwind CSS v4 Plugin Configuration — aeos365
 *
 * Single source of truth for HeroUI primitive theming. Locked to two themes:
 *   - "aeos"        (dark, default)  — obsidian + cyan signal + amber warmth
 *   - "aeos-light"  (light)          — paper surfaces + cyan-deep primary
 *
 * Color values come straight from the aeos365 design system spec. Do NOT
 * introduce new themes here — accent customization is intentionally killed.
 *
 * @see aeos365-design-system/project/colors_and_type.css
 * @see aeos365-design-system/project/README.md
 */
import { createRequire } from "module";

const require = createRequire(process.cwd() + "/");
const { heroui } = require("@heroui/react");

export default heroui({
  addCommonColors: true,
  defaultTheme: "aeos",
  defaultExtendTheme: "dark",
  layout: {
    borderWidth: {
      small: "1px",
      medium: "1px",
      large: "2px",
    },
    radius: {
      small: "6px",   // --aeos-r-sm
      medium: "8px",  // --aeos-r-md (buttons)
      large: "12px",  // --aeos-r-lg (inputs, mockup window)
    },
    fontSize: {
      tiny: "0.72rem",   // --aeos-fs-label
      small: "0.875rem", // --aeos-fs-body-sm
      medium: "1rem",    // --aeos-fs-body
      large: "1.125rem", // --aeos-fs-body-lg
    },
    lineHeight: {
      tiny: "1rem",
      small: "1.25rem",
      medium: "1.5rem",
      large: "1.75rem",
    },
    dividerWeight: "1px",
    disabledOpacity: 0.5,
    boxShadow: {
      // aeos-spec — warm-black, never gray
      small:  "0 4px 16px rgba(0, 0, 0, 0.30)",
      medium: "0 8px 32px rgba(0, 0, 0, 0.40)",   // --aeos-shadow-card
      large:  "0 16px 48px rgba(0, 0, 0, 0.55)",  // --aeos-shadow-lift
    },
    spacingUnit: 4,
  },
  themes: {
    /* ── aeos (dark, canonical) ────────────────────────────────────────── */
    aeos: {
      extend: "dark",
      colors: {
        background: "#03040A",  // --aeos-obsidian
        foreground: "#E8EDF5",  // --aeos-ink
        divider:    "rgba(255,255,255,0.06)",
        focus:      "#00E5FF",
        content1: "#070B14",  // --aeos-onyx
        content2: "#0D1120",  // --aeos-slate
        content3: "#131829",  // --aeos-graphite
        content4: "#1A1F33",  // --aeos-gunmetal

        primary: {
          50:  "#001a1d",
          100: "#003337",
          200: "#004d52",
          300: "#00666e",
          400: "#008090",
          500: "#00A3B8",
          600: "#00C5DD",
          700: "#00E5FF",
          800: "#5BEFFF",
          900: "#B0F8FF",
          DEFAULT: "#00E5FF",   // --aeos-cyan
          foreground: "#03040A",
        },
        secondary: {
          50:  "#0c0e1f",
          100: "#181c3e",
          200: "#252a5d",
          300: "#31387c",
          400: "#3e479b",
          500: "#4b55b9",
          600: "#5d63d8",
          700: "#6366F1",
          800: "#8B8FF5",
          900: "#B4B7F9",
          DEFAULT: "#6366F1",   // --aeos-indigo
          foreground: "#FFFFFF",
        },
        success: {
          50:  "#052812",
          100: "#0a4f25",
          200: "#0e7637",
          300: "#149d49",
          400: "#1ac45b",
          500: "#22C55E",
          600: "#4dd683",
          700: "#7ae6a4",
          800: "#a8f3c4",
          900: "#d6fae3",
          DEFAULT: "#22C55E",
          foreground: "#03040A",
        },
        warning: {
          50:  "#3d2810",
          100: "#5a3a17",
          200: "#7d501f",
          300: "#a36527",
          400: "#cb7c30",
          500: "#FFB347",   // --aeos-amber
          600: "#ffc572",
          700: "#ffd494",
          800: "#ffe2b8",
          900: "#fff1dc",
          DEFAULT: "#FFB347",
          foreground: "#03040A",
        },
        danger: {
          50:  "#3d1414",
          100: "#5a1d1d",
          200: "#7d2929",
          300: "#a33333",
          400: "#cb4040",
          500: "#FF6B6B",   // --aeos-coral
          600: "#ff8888",
          700: "#ffa6a6",
          800: "#ffc3c3",
          900: "#ffe1e1",
          DEFAULT: "#FF6B6B",
          foreground: "#FFFFFF",
        },
      },
    },

    /* ── aeos-light ────────────────────────────────────────────────────── */
    "aeos-light": {
      extend: "light",
      colors: {
        background: "#F8FAFC",  // --aeos-paper
        foreground: "#0F172A",  // --aeos-onyx-l
        divider:    "rgba(15,23,42,0.08)",
        focus:      "#00A3B8",
        content1: "#FFFFFF",
        content2: "#F1F5F9",  // --aeos-paper-2
        content3: "#E2E8F0",  // --aeos-paper-3
        content4: "#CBD5E1",

        primary: {
          50:  "#e0f7fa",
          100: "#b2ebf2",
          200: "#80deea",
          300: "#4dd0e1",
          400: "#26c6da",
          500: "#00bcd4",
          600: "#00acc1",
          700: "#00A3B8",   // --aeos-cyan-deep
          800: "#00838f",
          900: "#006064",
          DEFAULT: "#00A3B8",
          foreground: "#FFFFFF",
        },
        secondary: {
          50:  "#eef0fe",
          100: "#d8dcfd",
          200: "#b1b9fb",
          300: "#8a96f9",
          400: "#6c79f6",
          500: "#6366F1",
          600: "#4f53cf",
          700: "#3c40ad",
          800: "#292d8a",
          900: "#161a68",
          DEFAULT: "#6366F1",
          foreground: "#FFFFFF",
        },
        success: {
          50:  "#e8faf0",
          100: "#d1f4e0",
          200: "#a2e9c1",
          300: "#74dfa2",
          400: "#45d483",
          500: "#22C55E",
          600: "#1ca34d",
          700: "#15803d",
          800: "#0e6230",
          900: "#073f1f",
          DEFAULT: "#22C55E",
          foreground: "#FFFFFF",
        },
        warning: {
          50:  "#fff4e0",
          100: "#ffe1b8",
          200: "#ffce8a",
          300: "#ffba5d",
          400: "#ffa731",
          500: "#FFB347",
          600: "#e89530",
          700: "#b8731f",
          800: "#875212",
          900: "#523108",
          DEFAULT: "#FFB347",
          foreground: "#03040A",
        },
        danger: {
          50:  "#ffe6e6",
          100: "#ffbdbd",
          200: "#ff9494",
          300: "#FF6B6B",
          400: "#ff4242",
          500: "#e53e3e",
          600: "#c53030",
          700: "#9b2626",
          800: "#742020",
          900: "#4d1818",
          DEFAULT: "#FF6B6B",
          foreground: "#FFFFFF",
        },
      },
    },
  },
});
