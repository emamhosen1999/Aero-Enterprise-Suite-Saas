# aeos365 Design System Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current multi-variant theme machinery with a spec-faithful aeos365 engine. Existing pages render under the new tokens via a one-time compatibility shim.

**Architecture:** Drop-in token sheet (verbatim from `aeos365-design-system/`), rewritten HeroUI plugin with two themes, simplified ThemeProvider, sleek app shell that strips 3D motion. Legacy `--theme-*` vars are shimmed to `--aeos-*` so existing pages survive.

**Tech Stack:** Tailwind v4, HeroUI (`@heroui/react`), React 18, Inertia v2, Framer Motion (kept for page transitions but stripped from menus).

**Spec:** [`docs/superpowers/specs/2026-04-25-aeos365-design-system-foundation-design.md`](../specs/2026-04-25-aeos365-design-system-foundation-design.md)

---

## Layer 1 — Token sheet

### Task 1.1: Create `aeos-tokens.css` (verbatim copy + legacy shim)

**Files:**
- Create: `packages/aero-ui/resources/css/aeos-tokens.css`

- [ ] **Step 1:** Copy the entire content of `aeos365-design-system/project/colors_and_type.css` into the new file as the upper section.
- [ ] **Step 2:** Append a `Legacy Compatibility Shim` block that maps `--theme-*` tokens to `--aeos-*` tokens for both `.aeos` and `.aeos--light` selectors (per spec §5).
- [ ] **Step 3:** Append `html.aeos { color-scheme: dark; }` and `html.aeos--light { color-scheme: light; }` so HeroUI date/scrollbar UI matches.
- [ ] **Step 4:** Commit `feat(aero-ui): add aeos365 design tokens`.

---

## Layer 2 — Global CSS

### Task 2.1: Rewrite `app.css`

**Files:**
- Modify: `packages/aero-ui/resources/css/app.css`

- [ ] **Step 1:** Replace `app.css` with: `@import "tailwindcss";`, `@plugin "./hero.ts";`, `@import "./aeos-tokens.css";`, `@source` lines (relative path, not the absolute `D:/laragon/...` one), `@custom-variant dark (&:is(.dark *));`.
- [ ] **Step 2:** Strip every block referencing `motion-3d-*`, `perspective`, `translateZ`, `rotateX`, `aero-card` (and the gradient `bg-content1.rounded-*` rules), `data-dark-variant="dim"`, `data-dark-variant="midnight"`, `text-3d-float`. Keep only: `[data-reduce-motion]`, `.scrollbar-hide`, the `Toastify__toast-container` z-index fix, and the `@media print` block.
- [ ] **Step 3:** Add a small "compat shim" block: `.aero-card { @apply rounded-xl border p-6; background: var(--aeos-graphite); border-color: rgba(0,229,255,0.08); box-shadow: var(--aeos-shadow-card); }` so legacy `.aero-card` consumers still render acceptably.
- [ ] **Step 4:** Verify Tailwind `@source` paths point inside the package (relative `../js/**/*.{js,jsx,ts,tsx}`) and pick up HeroUI's theme files via the host `node_modules`.
- [ ] **Step 5:** Commit `refactor(aero-ui): strip 3D motion CSS, adopt aeos tokens`.

---

## Layer 3 — HeroUI plugin

### Task 3.1: Rewrite `hero.ts` with two locked themes

**Files:**
- Modify: `packages/aero-ui/resources/css/hero.ts`

- [ ] **Step 1:** Delete every preset theme except `light` and `dark`. Rename `light` → `aeos-light`, `dark` → `aeos`. Set `defaultTheme: "aeos"`, `defaultExtendTheme: "dark"`.
- [ ] **Step 2:** In `aeos` theme: `primary.DEFAULT = "#00E5FF"` with `foreground: "#03040A"`; secondary = indigo `#6366F1`; success `#22C55E`; warning `#FFB347` foreground `#03040A`; danger `#FF6B6B`; `background: "#03040A"`; `foreground: "#E8EDF5"`; `divider: "rgba(255,255,255,0.06)"`; content1–4 = onyx/slate/graphite/gunmetal.
- [ ] **Step 3:** In `aeos-light` theme: primary `#00A3B8`, secondary `#6366F1`, background `#F8FAFC`, foreground `#0F172A`, content1–3 = paper/paper-2/paper-3.
- [ ] **Step 4:** Update layout: `radius {small:6, medium:8, large:12}`, `borderWidth {small:1, medium:1, large:2}`, `disabledOpacity 0.5`, `boxShadow` updated to aeos-spec card/lift values.
- [ ] **Step 5:** Commit `refactor(aero-ui): lock HeroUI to aeos and aeos-light themes`.

---

## Layer 4 — Theme provider

### Task 4.1: Rewrite `theme/index.js`

**Files:**
- Modify: `packages/aero-ui/resources/js/theme/index.js`

- [ ] **Step 1:** Replace file content with a small module exporting:
  - `VALID_MODES = ['aeos', 'aeos-light', 'system']`
  - `resolveEffectiveMode(mode)` returning `'aeos'`, `'aeos-light'`, or system-resolved.
  - `applyThemeToDocument({mode, reduceMotion})` that toggles `aeos` / `aeos--light` / `dark` classes on `<html>` and `data-reduce-motion` attribute. Does NOT set per-property CSS vars (tokens already in `aeos-tokens.css`).
- [ ] **Step 2:** Commit `refactor(aero-ui): collapse theme engine to two modes`.

### Task 4.2: Rewrite `Context/ThemeContext.jsx`

**Files:**
- Modify: `packages/aero-ui/resources/js/Context/ThemeContext.jsx`

- [ ] **Step 1:** Replace context implementation with new shape `{mode, setMode, reduceMotion, setReduceMotion, isDark}`. Persist `aeos:theme` JSON. One-shot legacy migration: if `theme.mode` exists in any legacy key (`heroui-theme-settings`, `aero-theme`, etc.), map dim/dark/midnight → `'aeos'`, light → `'aeos-light'`, system → `'system'`, write the new key, delete legacy.
- [ ] **Step 2:** Stub-export legacy names as deprecated no-ops: `CARD_STYLE_OPTIONS = []`, `THEME_PRESET_OPTIONS = []`, `BACKGROUND_PRESET_OPTIONS = []`, `FONT_OPTIONS = []`, `MODE_OPTIONS = VALID_MODES`, `FONT_SIZE_OPTIONS = []`, plus stub functions `getThemeRadius()` returning `'12px'`, `getStatusColor(name)` returning the matching `--aeos-*` token, `STATUS_COLORS = {success,warning,danger,info}` mapped to aeos tokens. Each stub function logs `console.warn` on call (only once).
- [ ] **Step 3:** Stub-export `themeSettings` shape on the provider value: `{ mode, reduceMotion, cardStyle: 'aeos', typography: {fontFamily: 'DM Sans', fontSize: 'md'}, background: {type:'color', value:'transparent'}, primaryColor: '#00E5FF', defaultRadius: 'md' }` so legacy consumers reading `themeSettings.X` don't crash.
- [ ] **Step 4:** Commit `refactor(aero-ui): simplified ThemeProvider with legacy stubs`.

### Task 4.3: Stub out preset modules

**Files:**
- Modify: `packages/aero-ui/resources/js/theme/themePresets.js`
- Modify: `packages/aero-ui/resources/js/theme/cardStyles.js`
- Modify: `packages/aero-ui/resources/js/theme/backgroundPresets.js`

- [ ] **Step 1:** Replace each file's exports with thin no-op stubs that match the previous public API surface (function names + return shapes) but always return aeos defaults. Add a top-comment "DEPRECATED — see aeos365 design system spec" with date.
- [ ] **Step 2:** Commit `refactor(aero-ui): deprecate theme preset modules`.

---

## Layer 5 — App shell

### Task 5.1: Strip 3D from `MenuItem3D.jsx`

**Files:**
- Modify: `packages/aero-ui/resources/js/Layouts/Navigation/MenuItem3D.jsx`

- [ ] **Step 1:** Remove `MODULE_ACCENTS` map and accent-color logic — items use cyan only per spec.
- [ ] **Step 2:** Remove `mousePos` state, `magnetic` parallax, `rotateX`/`translateZ` styles, shimmer sweep, gradient containers. Keep keyboard nav, expand/collapse, search highlight, active indicator.
- [ ] **Step 3:** New visuals: icon in 28×28 cyan tile (`background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.20); border-radius: 8px;`), label DM Sans, hover = `background: rgba(0,229,255,0.05); transform: translateY(-1px)` over 240ms `cubic-bezier(0.22, 1, 0.36, 1)`, active = soft cyan tile + 2px cyan left bar + glow ring on icon.
- [ ] **Step 4:** Commit `refactor(aero-ui): strip 3D from MenuItem, adopt aeos cyan motif`.

### Task 5.2: Refactor `Sidebar.jsx`

**Files:**
- Modify: `packages/aero-ui/resources/js/Layouts/Navigation/Sidebar.jsx`

- [ ] **Step 1:** Replace `SidebarHeader` gradient + glow effects with: `background: var(--aeos-onyx)`, bottom border `1px solid rgba(0,229,255,0.08)`. Logo + workspace name in DM Sans + Syne for the brand.
- [ ] **Step 2:** Replace search input wrapper styling with `aeos-input`-style classes (cyan focus ring, 4% white wash).
- [ ] **Step 3:** Section group titles use `.aeos-label-mono` (uppercase mono, +0.15em).
- [ ] **Step 4:** Replace footer container background gradient with `var(--aeos-onyx)` + top divider `rgba(0,229,255,0.08)`.
- [ ] **Step 5:** Sidebar root container: `background: var(--aeos-onyx)`, right border `1px solid rgba(0,229,255,0.08)`. Width 264px expanded, 64px collapsed.
- [ ] **Step 6:** Remove every `motion3DConfig` prop and `whileHover={{rotateX,...}}` style from this file.
- [ ] **Step 7:** Commit `refactor(aero-ui): aeos sidebar - obsidian + cyan, no 3D`.

### Task 5.3: Refactor `Header.jsx`

**Files:**
- Modify: `packages/aero-ui/resources/js/Layouts/Navigation/Header.jsx`

- [ ] **Step 1:** Remove `headerKeyframes` injected styles (shimmer, accent strip, glow). Replace with simple `aeos-glass` surface.
- [ ] **Step 2:** Header root: `background: var(--aeos-glass-bg); border-bottom: 1px solid var(--aeos-glass-border); backdrop-filter: blur(16px);` height 56–64px.
- [ ] **Step 3:** Search trigger uses cyan tinted `aeos-input` shape; `Kbd` keyboard hint visible. ⌘K shortcut handler unchanged.
- [ ] **Step 4:** Notification bell: cyan dot for unread, no shimmer animation. Pulse uses `aeos-anim-pulse-glow` only when there are unread notifications.
- [ ] **Step 5:** Right-side primary "+" button uses `solid` HeroUI variant on `primary` color (i.e., aeos cyan).
- [ ] **Step 6:** Strip every `whileHover` with rotation/Z transforms.
- [ ] **Step 7:** Commit `refactor(aero-ui): aeos topbar - glass, cyan signal`.

### Task 5.4: Refactor `App.jsx` shell wiring

**Files:**
- Modify: `packages/aero-ui/resources/js/Layouts/App.jsx`

- [ ] **Step 1:** Remove `useBranding`-driven page background gradients on the main content frame. Set `background: var(--aeos-obsidian)` on the root frame, with optional `.aeos-grid-bg` class on the inner content wrapper for the spec's grid texture.
- [ ] **Step 2:** Keep `PageContent` Framer Motion fade — that's a page transition, not menu motion. Tune duration to 240ms with `aeos-ease-out` curve.
- [ ] **Step 3:** Strip any `applyThemeToDocument` calls that pass legacy `themeSettings`. The simplified `ThemeContext` now applies the document classes directly.
- [ ] **Step 4:** Commit `refactor(aero-ui): aeos app shell wiring`.

---

## Layer 6 — Public/guest layout retune

### Task 6.1: GuestLayout token swap

**Files:**
- Modify: `packages/aero-ui/resources/js/Layouts/GuestLayout.jsx`

- [ ] **Step 1:** Open the file, replace any `bg-gradient-to-*` and arbitrary color classes with aeos-token references via inline `style={{ background: 'var(--aeos-grad-mesh)' }}` on the body wrapper or `className="aeos-grid-bg"`.
- [ ] **Step 2:** Apply `.aeos-cta-glass` to the central card if there's a hero/auth card.
- [ ] **Step 3:** Commit `refactor(aero-ui): GuestLayout adopts aeos tokens`.

---

## Layer 7 — ThemeSettingDrawer simplification

### Task 7.1: Replace drawer contents

**Files:**
- Modify: `packages/aero-ui/resources/js/Components/Theme/ThemeSettingDrawer.jsx`

- [ ] **Step 1:** Detect file location; replace internal controls with two simple toggles:
  - Mode (segmented): Dark · Light · System
  - Reduce motion (switch)
- [ ] **Step 2:** Add an info banner: "Theme customization simplified to mode + accessibility. The aeos365 design system locks brand colors and typography."
- [ ] **Step 3:** Behind `?legacy_theme=1`, optionally render a "Legacy controls (deprecated)" collapsible block that includes the original sliders/pickers — purely so a tenant admin can flip back briefly during transition. Otherwise omit.
- [ ] **Step 4:** Commit `refactor(aero-ui): simplified theme drawer`.

---

## Layer 8 — Frontend Engineer Agent prompt update

### Task 8.1: Append design-system section

**Files:**
- Modify: `.claude/agents/aeos-frontend-engineer.agent.md`

- [ ] **Step 1:** After the existing `## Enterprise UI Constraints (CRITICAL)` block, insert a new top-level section: `## DESIGN SYSTEM — aeos365 (Single Source of Truth)`.
- [ ] **Step 2:** Body covers (per spec §8): pointer to `aeos365-design-system/project/`, locked rules, token usage policy (`var(--aeos-*)` preferred, `var(--theme-*)` shim-only), helper class catalogue, HeroUI rule, don'ts.
- [ ] **Step 3:** Add a "Refusal triggers" sub-block: instruct the agent to refuse and ask for clarification if a request demands a non-spec accent color, a forbidden font, a 3D rotateX/translateZ effect, or a button radius > 8px.
- [ ] **Step 4:** Commit `docs(agents): frontend engineer adopts aeos365 design system`.

---

## Layer 9 — Audit checklist

### Task 9.1: Generate drift audit doc

**Files:**
- Create: `docs/superpowers/audits/2026-04-25-aeos365-design-drift-audit.md`

- [ ] **Step 1:** Run `Grep` for `motion-3d-`, `text-3d-float`, `rotateX(`, `translateZ(`, `perspective(` across `packages/aero-ui/resources/js/**`. Record offenders with line numbers.
- [ ] **Step 2:** Run `Grep` for `var(--theme-` across the same paths. Record consumers (these need migration to `var(--aeos-*)`).
- [ ] **Step 3:** Run `Grep` for `bg-gradient-to-`, hard-coded hex colors (`#[0-9A-Fa-f]{6}`), `Inter`, `Roboto`, `Arial` in JSX style props.
- [ ] **Step 4:** Run `Grep` for emoji unicode in JSX/JS strings (rough pattern: `[\u{1F300}-\u{1FAFF}]`).
- [ ] **Step 5:** Compile findings into prioritized buckets in the audit doc: P0 (broken/inert), P1 (visual drift), P2 (token migration), P3 (cleanup).
- [ ] **Step 6:** Commit `docs(audits): aeos365 design drift audit`.

---

## Layer 10 — Verification

### Task 10.1: Build + smoke check

- [ ] **Step 1:** From the host app root, run `npm run build` (or the project's equivalent). Expected: build succeeds. Capture warnings.
- [ ] **Step 2:** Start dev server (`npm run dev`); load login page. Expected: cyan-on-obsidian theme, no broken styles.
- [ ] **Step 3:** Toggle mode in ThemeSettingDrawer: dark → light → system. Expected: page swaps cleanly.
- [ ] **Step 4:** Navigate to a representative authenticated page (dashboard). Expected: sidebar/topbar render in aeos style; menu items show cyan tile + DM Sans label; no console errors from deprecated stubs (warnings ok).
- [ ] **Step 5:** Document anything broken in the audit doc as a follow-up task; do not stretch this foundation pass to fix per-page issues.

---

## Self-review

- ✅ Spec coverage: all 7 layers from §4 covered (tokens, app.css, hero.ts, theme provider, app shell, guest layout, agent prompt) + audit + verification.
- ✅ No placeholders.
- ✅ Type/name consistency: `aeos` / `aeos-light` / `system` modes used uniformly; legacy-stub function names match what `index.js` exported previously (`getThemeRadius`, `getStatusColor`, `STATUS_COLORS`).
- ✅ DRY: shim is defined once in tokens; no duplicated color literals.
