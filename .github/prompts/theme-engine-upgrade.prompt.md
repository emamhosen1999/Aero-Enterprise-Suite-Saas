---
description: "Upgrade the AEOS theme engine for 100% dark/light mode consistency, eliminate hardcoded colors, migrate all components to semantic theme tokens, and ensure every surface/text respects the active theme."
agent: "AEOS Frontend Engineer"
---

# Theme Engine Upgrade — Full Consistency & Dark/Light Mode Compliance

## Objective

Upgrade the AEOS theme engine across `packages/aero-ui/` to achieve **100% theme compliance**: every component, page, form, table, modal, and layout must derive its colors, backgrounds, fonts, and radii exclusively from the theme system. Zero hardcoded colors. Zero dark-mode-blind surfaces. Every pixel must respond to the active card style, mode (light/dark/system), and typography settings.

---

## Current Architecture (DO NOT break these)

The theme engine already has strong foundations — **extend, don't replace**:

| Layer | File | Role |
|-------|------|------|
| **ThemeContext** | `Context/ThemeContext.jsx` | React context providing `theme`, `updateTheme`, `toggleMode`, `colors`, `layout` |
| **Theme applicator** | `theme/index.js` (`applyThemeToDocument`) | Sets CSS variables on `:root` — `--theme-primary`, `--theme-content1..4`, `--theme-foreground`, `--theme-background`, `--theme-divider`, `--borderRadius`, `--fontFamily`, `--borderWidth` |
| **Card styles** | `theme/cardStyles.js` | 10 preset card styles (modern, glass, neo, etc.) with full color palettes + dark mode overrides |
| **Theme presets** | `theme/themePresets.js` | Bundled combos of cardStyle + typography + background |
| **Safe storage** | `utils/safeTheme.js` | LocalStorage persistence with migration from legacy keys, v2 schema |
| **CSS foundation** | `resources/css/app.css` | `.aero-card`, `.aero-card-header`, `.dark .aero-card` classes |
| **ThemedCard** | `Components/UI/ThemedCard.jsx` | React wrappers: `<ThemedCard>`, `<ThemedCardHeader>`, `<ThemedCardBody>` |
| **Theme utils** | `utils/themeUtils.js` | `getThemeRadius()`, `getStandardCardStyle()`, `getStandardCardHeaderStyle()`, `isDarkMode()`, `STATUS_COLORS` |
| **Radius hook** | `Hooks/useThemeRadius.js` | `useThemeRadius()` — memoized HeroUI radius token from `--borderRadius` |
| **Contrast validation** | `theme/cardStyles.js` | WCAG AA contrast ratio validation utilities |

---

## Gap Analysis (Verified by Audit)

### GAP 1 — Inline Card Gradient Duplication (~30 files)

**Problem**: ~30 page files paste the card gradient inline instead of using `.aero-card` or `<ThemedCard>`:
```jsx
// BAD — duplicated in 30+ files
<Card style={{
  background: `linear-gradient(135deg, var(--theme-content1, #FAFAFA) 20%, ...`,
  border: `var(--borderWidth, 2px) solid transparent`,
  borderRadius: `var(--borderRadius, 12px)`,
  fontFamily: `var(--fontFamily, "Inter")`,
}}>
```

**Fix**: Replace every inline-styled `<Card>` with `<Card className="aero-card">` or `<ThemedCard>`. The `.aero-card` CSS class in `app.css` already provides the exact same gradient + dark mode support.

**Files to migrate** (non-exhaustive — grep for `--theme-content1` in JSX `style=` attributes):
- `Pages/Shared/UsersList.jsx`
- `Pages/Shared/RoleManagement.jsx`
- `Pages/Shared/ModuleManagement.jsx`
- `Pages/Settings/LeaveSettings.jsx`
- `Pages/Settings/HRMSettings.jsx`
- `Pages/Settings/AttendanceSettings.jsx`
- `Pages/Settings/NotificationSettings.jsx`
- `Pages/Settings/DomainManager.jsx`
- `Pages/Auth/Login.jsx`, `ResetPassword.jsx`, `VerifyEmail.jsx`, `ForgotPassword.jsx`, `AdminSetup.jsx`, `AcceptInvitation.jsx`
- `Pages/Project/Rfis/`, `BoqItems/`, `BoqMeasurements/`, `Risks/`, `Sprints/`
- `Pages/Core/Roles/Index.jsx`, `Modules/Index.jsx`
- `Pages/Blockchain/WalletsManagement.jsx`, `TransactionsManagement.jsx`, `TokensManagement.jsx`

### GAP 2 — Hardcoded Tailwind Gray Classes (~120 occurrences)

**Problem**: Components use `text-gray-600`, `text-gray-700`, `text-gray-900`, `bg-gray-50`, `bg-gray-100`, `bg-gray-200` which are static Tailwind colors that **do not respond to dark mode or theme changes**.

**Fix**: Replace with HeroUI semantic color classes:

| Hardcoded (remove) | Semantic replacement |
|---------------------|---------------------|
| `text-gray-900` | `text-foreground` |
| `text-gray-700`, `text-gray-800` | `text-default-700` or `text-default-800` |
| `text-gray-600` | `text-default-600` |
| `text-gray-500` | `text-default-500` |
| `text-gray-400` | `text-default-400` |
| `bg-gray-50` | `bg-default-50` |
| `bg-gray-100` | `bg-default-100` |
| `bg-gray-200` | `bg-default-200` |
| `bg-white` (on surfaces) | `bg-background` or `bg-content1` |
| `border-gray-200` | `border-divider` |
| `border-gray-300` | `border-default-300` |

**Worst offenders** (prioritize these):
- `Components/Quality/QualityAnalytics.jsx` — 15+ hardcoded grays, zero dark support
- `Pages/Platform/Public/CmsPage.jsx` — `bg-gray-50`, `text-gray-600/800` throughout
- `Pages/Events/Registrations/PrintToken.jsx` — `bg-gray-100/200`, `text-gray-600/800`
- `Components/ProfileMenu.jsx` — `bg-gray-200 text-gray-700`

### GAP 3 — `bg-white` Without Dark Counterpart (~15 instances)

**Problem**: Elements use `bg-white` with no `dark:bg-content1` or `dark:bg-background`, creating bright white boxes in dark mode.

**Fix**: Replace `bg-white` on surface elements with `bg-background` or `bg-content1` (HeroUI semantic classes that auto-switch). For glass effects (`bg-white/80`), replace with `bg-background/80 dark:bg-content1/80`.

**Files**:
- `Components/Auth/TwoFactorSettings.jsx` — `bg-white rounded-lg`
- `Pages/Platform/Admin/Tenants/components/TenantForm.jsx` — `bg-white/80`
- `Layouts/PublicLayout.jsx` — `bg-white/95`, `bg-white/70`
- `Pages/Platform/Public/Careers.jsx` — `bg-white border`
- `Pages/Platform/Public/Blog.jsx` — same pattern
- `Pages/Platform/Public/About.jsx` — multiple `bg-white` conditionals

### GAP 4 — CMS Blocks Use Hardcoded Color Constants

**Problem**: `Blocks/CodeBlock.jsx`, `Blocks/Timeline.jsx`, `Blocks/Divider.jsx` use hardcoded hex colors (`#FAFAFA`, `#F4F4F5`, `#E4E4E7`) instead of CSS variables. These CMS blocks will look wrong in dark mode or themed card styles.

**Fix**: Replace hardcoded defaults with `var(--theme-*)` CSS variables:
```jsx
// BAD
const lightTheme = { bg: '#FAFAFA', headerBg: '#F4F4F5', border: '#E4E4E7' };

// GOOD
const lightTheme = {
  bg: 'var(--theme-content1, #FAFAFA)',
  headerBg: 'var(--theme-content2, #F4F4F5)',
  border: 'var(--theme-divider, #E4E4E7)',
};
```

### GAP 5 — ThemedCard Adoption is Minimal (Only 3 files)

**Problem**: `<ThemedCard>` exists but only 3 files use it. The component was built to be THE standard, but pages still use raw `<Card>` with inline styles.

**Fix**: For pages that need full control of CardHeader/CardBody (most admin pages), the `.aero-card` CSS class approach is simpler. For simpler cards (settings sections, sidebar cards, dashboard widgets), prefer `<ThemedCard>`.

**Decision rule**:
- Full admin page with CardHeader → `<Card className="aero-card">`
- Simple content card → `<ThemedCard>`
- Both approaches auto-get dark mode, theme gradients, and radius from CSS

### GAP 6 — Font Color Not Fully Theme-Aware

**Problem**: ~10 files use inline `style={{ color: ... }}` with non-theme values. The `--theme-foreground` variable exists and is applied to `:root`, but some components bypass it.

**Fix**: Ensure all text uses either:
1. HeroUI semantic classes: `text-foreground`, `text-default-500`, etc.
2. CSS variable: `style={{ color: 'var(--theme-foreground)' }}`
3. Never: `style={{ color: '#333' }}` or `className="text-black"`

---

## Implementation Protocol

### Phase 1 — CSS Foundation Enhancement (Do First)

1. **Extend `app.css`** with additional semantic utility classes:
```css
/* Text color utilities that respond to theme */
.aero-text-primary { color: var(--theme-foreground) !important; }
.aero-text-secondary { color: var(--theme-foreground-secondary, var(--theme-foreground)) !important; }
.aero-text-muted { color: color-mix(in srgb, var(--theme-foreground) 60%, transparent) !important; }

/* Surface utilities */
.aero-surface { background: var(--theme-content1) !important; }
.aero-surface-raised { background: var(--theme-content2) !important; }
.aero-surface-sunken { background: var(--theme-background) !important; }
```

2. **Add missing dark mode overrides** in `app.css` for the `.dark` scope:
```css
.dark .aero-card-header {
    border-color: var(--theme-divider, #27272A) !important;
}
```

3. **Verify `applyThemeToDocument()`** sets `--theme-foreground` correctly for both modes:
   - Light: `--theme-foreground: #11181C` (or from card style)
   - Dark: `--theme-foreground: #ECEDEE` (or from dark override)

### Phase 2 — Systematic Inline Style Removal (~30 files)

For every file with inline card gradient styles:

1. Remove the `style={{ background: 'linear-gradient...' }}` prop from the `<Card>`
2. Add `className="aero-card"` (or replace existing Card with `<ThemedCard>`)
3. Remove inline `style` from `<CardHeader>` — add `className="aero-card-header"` instead
4. **Test in both light and dark mode** after each file

**Regex to find all offenders**:
```
style=\{[\s\S]*?--theme-content1[\s\S]*?\}
```

### Phase 3 — Semantic Color Migration (~120 replacements)

Run systematic replacement across all `.jsx` files:

1. **Search and replace** each hardcoded Tailwind color class with its semantic equivalent (see GAP 2 table)
2. **Do NOT blindly replace** — verify context:
   - `text-gray-500` on a subtitle → `text-default-500` ✓
   - `bg-gray-100` on an input wrapper → `bg-default-100` ✓
   - `bg-gray-900` intentionally dark → check if it should be `bg-foreground` or stay
3. After each file, visually verify in both light and dark mode

### Phase 4 — Dark Mode Completeness Audit

1. Toggle dark mode on
2. Navigate every page in the app
3. Flag any surface that stays white, any text that becomes invisible, any border that disappears
4. Fix using HeroUI semantic classes (NOT `dark:` overrides for every element — use semantic classes that auto-switch)

### Phase 5 — CMS Blocks & Edge Cases

1. Update `CodeBlock.jsx`, `Timeline.jsx`, `Divider.jsx` to use CSS variables
2. Update `Checkbox.jsx` to use theme variables instead of legacy `glassTheme.palette` references
3. Update `AttendanceAdminTable.jsx` status colors to use `STATUS_COLORS` from themeUtils

### Phase 6 — Create `useThemeColors` Hook (New)

Create a new hook that provides computed theme colors for complex components:
```jsx
// Hooks/useThemeColors.js
export const useThemeColors = () => {
  const { colors, isDark } = useTheme();
  return useMemo(() => ({
    primary: getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim(),
    foreground: getComputedStyle(document.documentElement).getPropertyValue('--theme-foreground').trim(),
    background: getComputedStyle(document.documentElement).getPropertyValue('--theme-background').trim(),
    content1: getComputedStyle(document.documentElement).getPropertyValue('--theme-content1').trim(),
    divider: getComputedStyle(document.documentElement).getPropertyValue('--theme-divider').trim(),
    isDark,
  }), [colors, isDark]);
};
```

This gives components that need JavaScript color values (charts, canvas, SVG) access to the current theme palette without hardcoding.

---

## Validation Checklist

After all changes, verify:

- [ ] **Zero `bg-white` without dark counterpart** — `grep -r "bg-white" --include="*.jsx" | grep -v "dark:" | grep -v "bg-white/"` returns zero matches on surface elements
- [ ] **Zero hardcoded gray classes** — `grep -rE "text-gray-[0-9]|bg-gray-[0-9]" --include="*.jsx"` returns zero matches (excluding intentional cases in comments)
- [ ] **Zero inline card gradients** — `grep -r "theme-content1" --include="*.jsx" | grep "style="` returns zero matches outside of theme definition files
- [ ] **All Cards themed** — Every `<Card>` has either `className="aero-card"` or is wrapped in `<ThemedCard>`
- [ ] **Dark mode visual audit** — Every page visited in dark mode, no white flashes, no invisible text, no missing borders
- [ ] **Light mode visual audit** — No regressions from the migration, all text readable, all borders visible
- [ ] **Theme preset switching** — Changing card style preset in settings updates every card, header, and surface across the app
- [ ] **Font switching** — Changing font family in theme settings applies to all text (check `--fontFamily` propagation)
- [ ] **WCAG AA contrast** — Run `validateThemeContrast()` in dev mode for each card style preset in both light and dark modes
- [ ] **Build passes** — `npm run build` completes with zero errors
- [ ] **No visual regressions** — Compare before/after screenshots of key pages (Dashboard, UsersList, EmployeeList, LeavesAdmin)

---

### Phase 7 — Recharts / Chart Theme Integration (21 files)

**Problem**: 21 files use recharts. ~12 of them have 100% hardcoded hex colors for strokes, fills, and pie chart palettes. No centralized chart color system exists.

**Step 1 — Create `utils/chartColors.js`** (new file):
```jsx
// utils/chartColors.js
/**
 * Centralized chart color palette derived from CSS theme variables.
 * All recharts components MUST use these instead of hardcoded hex values.
 */

/**
 * Get a single theme color from CSS variable with fallback
 */
export const getChartColor = (variable, fallback) => {
  if (typeof window === 'undefined') return fallback;
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)?.trim() || fallback;
};

/**
 * Standard chart color palette — use for multi-series charts and pie charts
 * References CSS variables so they update with theme changes
 */
export const CHART_COLORS = [
  'var(--theme-primary, #006FEE)',
  'var(--theme-success, #17C964)',
  'var(--theme-warning, #F5A524)',
  'var(--theme-danger, #F31260)',
  'var(--theme-secondary, #9353D3)',
  'var(--chart-color-6, #0EA5E9)',
  'var(--chart-color-7, #EC4899)',
  'var(--chart-color-8, #F97316)',
];

/**
 * Semantic chart colors — use for specific data meanings
 */
export const CHART_SEMANTIC = {
  primary: 'var(--theme-primary, #006FEE)',
  success: 'var(--theme-success, #17C964)',
  warning: 'var(--theme-warning, #F5A524)',
  danger: 'var(--theme-danger, #F31260)',
  info: 'var(--theme-secondary, #9353D3)',
  muted: 'var(--theme-default-400, #A1A1AA)',
};

/**
 * Chart axis/grid colors — derived from theme divider
 */
export const CHART_AXIS = {
  grid: 'var(--theme-divider, #E4E4E7)',
  tick: 'var(--theme-default-500, #71717A)',
  label: 'var(--theme-foreground, #11181C)',
};

/**
 * Get computed hex values (needed for canvas/gradient operations where CSS vars don't work)
 */
export const getComputedChartColors = () => {
  if (typeof window === 'undefined') {
    return ['#006FEE', '#17C964', '#F5A524', '#F31260', '#9353D3', '#0EA5E9', '#EC4899', '#F97316'];
  }
  const root = getComputedStyle(document.documentElement);
  return [
    root.getPropertyValue('--theme-primary')?.trim() || '#006FEE',
    root.getPropertyValue('--theme-success')?.trim() || '#17C964',
    root.getPropertyValue('--theme-warning')?.trim() || '#F5A524',
    root.getPropertyValue('--theme-danger')?.trim() || '#F31260',
    root.getPropertyValue('--theme-secondary')?.trim() || '#9353D3',
    root.getPropertyValue('--chart-color-6')?.trim() || '#0EA5E9',
    root.getPropertyValue('--chart-color-7')?.trim() || '#EC4899',
    root.getPropertyValue('--chart-color-8')?.trim() || '#F97316',
  ];
};
```

**Step 2 — Add chart CSS variables** to `resources/css/app.css`:
```css
:root {
  /* Extended chart palette (beyond semantic theme colors) */
  --chart-color-6: #0EA5E9;
  --chart-color-7: #EC4899;
  --chart-color-8: #F97316;
}

.dark {
  --chart-color-6: #38BDF8;
  --chart-color-7: #F472B6;
  --chart-color-8: #FB923C;
}
```

**Step 3 — Migrate chart files** (replace hardcoded hex with `CHART_COLORS` / `CHART_SEMANTIC`):

**Reference pattern** (from `Charts/TransactionVolumeChart.jsx` — already correct):
```jsx
<Area stroke="var(--theme-primary, #3B82F6)" fill="url(#colorGradient)" />
<CartesianGrid stroke="var(--theme-divider, #E4E4E7)" strokeDasharray="3 3" />
<XAxis tick={{ fill: 'var(--theme-default-500, #6B7280)' }} />
```

**Files to migrate** (with specific hardcoded values to replace):

| File | Replace | With |
|------|---------|------|
| `Analytics/AttendanceWidget.jsx` | `stroke="#17c964"`, `fill="#17c964"` | `CHART_SEMANTIC.success` |
| `Analytics/AttendanceWidget.jsx` | `stroke="#f31260"`, `fill="#f31260"` | `CHART_SEMANTIC.danger` |
| `Analytics/TurnoverWidget.jsx` | `stroke="#f31260"`, `fill="#f31260"` | `CHART_SEMANTIC.danger` |
| `Analytics/PayrollWidget.jsx` | `stroke="#f5a524"`, `fill="#f5a524"` | `CHART_SEMANTIC.warning` |
| `Analytics/RecruitmentWidget.jsx` | `COLORS = ['#0088FE','#00C49F','#FFBB28','#FF8042','#8884d8']` | `CHART_COLORS.slice(0, 5)` |
| `Analytics/RecruitmentWidget.jsx` | `stroke="#9353d3"`, `stroke="#17c964"` | `CHART_SEMANTIC.info`, `CHART_SEMANTIC.success` |
| `Analytics/HeadcountWidget.jsx` | `COLORS = ['#0088FE','#00C49F',...]` | `CHART_COLORS` |
| `Analytics/HeadcountWidget.jsx` | `fill="#0ea5e9"`, `fill="#8884d8"` | `CHART_SEMANTIC.primary`, `CHART_SEMANTIC.info` |
| `HRM/OnboardingAnalyticsDashboard.jsx` | `COLORS = ['#0088FE','#00C49F','#FFBB28','#FF8042']` | `CHART_COLORS.slice(0, 4)` |
| `HRM/OnboardingAnalyticsDashboard.jsx` | `stroke="#10B981"`, `stroke="#3B82F6"` | `CHART_SEMANTIC.success`, `CHART_SEMANTIC.primary` |
| `Events/Analytics.jsx` | `'#17C964'`, `'#F5A524'`, `'#F31260'`, `'#0070F0'`, `'#9333EA'` | `CHART_SEMANTIC` equivalents |
| `Events/Analytics.jsx` | `stroke="#E4E4E7"`, `stroke="#71717A"` | `CHART_AXIS.grid`, `CHART_AXIS.tick` |
| `Admin/Analytics/Index.jsx` | `colors = ['#3b82f6','#a855f7','#f97316','#10b981','#6366f1']` | `CHART_COLORS.slice(0, 5)` |
| `Admin/Analytics/Revenue.jsx` | `colors = ['#2563eb','#a855f7','#ec4899','#f97316']` | `CHART_COLORS.slice(0, 4)` |
| `Admin/Analytics/Usage.jsx` | `stroke="#0ea5e9"` | `CHART_SEMANTIC.primary` |
| `TokenAnalyticsChart.jsx` | `fill="#8884d8"` (one remaining) | `CHART_SEMANTIC.info` |

**Also remove 6 duplicate widget files** (root `Components/` mirrors `Components/Analytics/`):
- `Components/AttendanceWidget.jsx` → duplicate of `Components/Analytics/AttendanceWidget.jsx`
- `Components/TurnoverWidget.jsx` → duplicate of `Components/Analytics/TurnoverWidget.jsx`
- `Components/PayrollWidget.jsx` → duplicate of `Components/Analytics/PayrollWidget.jsx`
- `Components/RecruitmentWidget.jsx` → duplicate of `Components/Analytics/RecruitmentWidget.jsx`
- `Components/HeadcountWidget.jsx` → duplicate of `Components/Analytics/HeadcountWidget.jsx`
(Verify imports before removing — update any file that imports from the root path to use `Analytics/` path instead)

---

### Phase 8 — Platform/Public Pages Theme Compliance

**Context**: Public marketing pages (`Pages/Platform/Public/`) use a deliberate `slate-*` / `bg-white` light palette with `isDarkMode` ternaries for dark mode. This is an intentional marketing design, **not the same as the tenant app theme system**. The approach is acceptable but needs these fixes:

**8A — CmsPage.jsx (Critical — zero dark mode support)**:
Replace all hardcoded `gray-*` classes:
```jsx
// BAD (current)
<h1 className="text-gray-800">
<p className="text-gray-600">
<div className="bg-gray-50">
<span className="text-gray-500">
<div className="bg-gray-100">

// GOOD
<h1 className="text-foreground">
<p className="text-default-600">
<div className="bg-default-50">
<span className="text-default-500">
<div className="bg-default-100">
```

**8B — Public pages `bg-white` → semantic classes** (where ternary pattern exists):
For pages already using `isDarkMode ? darkClass : lightClass`:
```jsx
// CURRENT (scattered across Landing, Pricing, Features, About, etc.)
className={isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200'}

// BETTER (simpler, auto-switches)
className="bg-content1 border border-divider"
```
**Only migrate if the visual result is equivalent.** Some glass effects with `backdrop-blur-xl` are intentional and should keep the ternary pattern.

**8C — Landing.jsx hardcoded hex gradient**:
```jsx
// BAD (Lines 193-194)
background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'

// GOOD
background: 'linear-gradient(135deg, var(--theme-primary, #3b82f6) 0%, var(--theme-secondary, #8b5cf6) 100%)'
```

**8D — `text-slate-*` migration for public pages**:
| Hardcoded | Semantic replacement |
|-----------|---------------------|
| `text-slate-900` | `text-foreground` |
| `text-slate-700` | `text-default-700` |
| `text-slate-600` | `text-default-600` |
| `text-slate-500` | `text-default-500` |
| `text-slate-400` | `text-default-400` |
| `bg-slate-50` | `bg-default-50` |
| `bg-slate-100` | `bg-default-100` |
| `bg-slate-200` | `bg-default-200` |
| `bg-slate-900` | `bg-foreground` |

**Files to migrate** (all in `Pages/Platform/Public/`):
- `Landing.jsx` — heaviest usage (~20+ slate classes, hardcoded hex gradients)
- `Pricing.jsx`, `Features.jsx`, `About.jsx`, `Careers.jsx`, `Blog.jsx`
- `Docs.jsx`, `Demo.jsx`, `Resources.jsx`, `Status.jsx`, `Support.jsx`, `Standalone.jsx`, `Contact.jsx`
- `Legal/Terms.jsx`, `Legal/Privacy.jsx`, `Legal/Security.jsx`, `Legal/Cookies.jsx`, `Legal/Index.jsx`
- `CmsPage.jsx` (uses gray-* instead of slate-*)
- `Events/Index.jsx`, `Events/Show.jsx`

---

### Phase 9 — Theme Drawer Redesign (Advanced & Novel)

**File**: `Components/ThemeSettingDrawer.jsx` (complete rewrite)

**Current State**: The drawer is a basic HeroUI Modal with 2 tabs ("Card Styles" grid + "Preferences" with dark toggle, font select, background color swatches). It works but feels like a settings form, not a modern design studio.

**Target State**: A polished, immersive theme customization experience with real-time live preview, granular controls, and novel interactions — matching the quality of tools like Notion, Linear, or Vercel's theme pickers.

#### 9A — Convert from Modal to Sliding Drawer Panel

Replace the `<Modal>` with a **right-edge sliding drawer** using HeroUI's `Drawer` component (or a custom `framer-motion` slide panel). The drawer should:
- Slide in from the right edge of the screen (not overlay the center)
- Have a narrow width (~400px) so the main page remains visible as a live preview
- Include a translucent backdrop that lets the page content show through
- Smoothly animate open/close with `framer-motion`

```jsx
import { motion, AnimatePresence } from 'framer-motion';

// Drawer shell
<AnimatePresence>
  {isOpen && (
    <>
      {/* Translucent backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Drawer panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-0 right-0 h-full w-[420px] bg-content1 border-l border-divider shadow-2xl z-50 overflow-y-auto"
      >
        {/* Drawer content */}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

#### 9B — Multi-Section Vertical Layout (Replace Tabs)

Instead of 2 tabs, use a **single scrollable panel** with collapsible sections (accordion-style). This is more discoverable and lets users see all options at once:

**Section order (top to bottom)**:

1. **🌓 Appearance Mode** — Light / Dark / System toggle (tri-state segmented control, not a basic Switch)
2. **🎨 Card Style** — The existing 10-preset grid, but upgraded (see 9C)
3. **🖌️ Accent Color** — NEW: Custom primary color picker (see 9D)
4. **🔤 Typography** — Font family + font size + font weight controls
5. **📐 Layout** — Border radius slider + border width slider + spacing density
6. **🖼️ Background** — Solid / gradient / pattern picker (existing but upgraded)
7. **♿ Accessibility** — High contrast toggle + reduced motion toggle + font scaling
8. **⏪ Reset & Export** — Reset to default + export/import theme as JSON

Each section uses a `Disclosure`/`Accordion` pattern:
```jsx
import { Accordion, AccordionItem } from "@heroui/react";

<Accordion selectionMode="multiple" defaultExpandedKeys={["appearance", "card-style"]}>
  <AccordionItem key="appearance" title="Appearance" startContent={<MoonIcon />}>
    {/* Section content */}
  </AccordionItem>
  <AccordionItem key="card-style" title="Card Style" startContent={<SwatchIcon />}>
    {/* Section content */}
  </AccordionItem>
  {/* ... */}
</Accordion>
```

#### 9C — Upgraded Card Style Selector

Replace the flat 2-column grid with a **carousel/slider of live-rendered mini-cards**:

- Each preset renders as a small card (~180x120px) showing an actual mini-dashboard mockup with the preset's colors applied
- The selected preset has a glowing border pulse animation
- On hover, the main page behind the drawer temporarily previews that style (live preview on hover)
- Clicking confirms the selection
- Add a "Compact" vs "Expanded" view toggle for the grid

```jsx
// Live preview on hover (temporary, reverts on mouse leave)
const handlePreviewOnHover = (styleKey) => {
  // Save current settings
  previewRef.current = themeSettings.cardStyle;
  // Temporarily apply preview
  applyThemeToDocument({ ...themeSettings, cardStyle: styleKey });
};

const handlePreviewLeave = () => {
  // Revert to actual settings
  if (previewRef.current) {
    applyThemeToDocument(themeSettings);
    previewRef.current = null;
  }
};
```

Each card preview should include:
- A mini header bar with colored dots (like a macOS window)
- 2-3 small content lines (skeleton bars in preset colors)
- A mini button in the preset's primary color
- The preset name below
- A color palette strip showing primary, secondary, success, warning, danger

#### 9D — Accent Color Picker (NEW Feature)

Add a custom primary color override that lets users fine-tune beyond the 10 presets:

```jsx
// Custom color picker section
<div className="space-y-3">
  <p className="text-sm font-medium text-foreground">Accent Color</p>
  <p className="text-xs text-default-500">Override the primary color from any card style</p>
  
  {/* Preset color swatches */}
  <div className="flex flex-wrap gap-2">
    {ACCENT_PRESETS.map(color => (
      <button
        key={color.hex}
        onClick={() => updateTheme({ accentColor: color.hex })}
        className={`w-8 h-8 rounded-full border-2 transition-all ${
          currentAccent === color.hex ? 'border-foreground scale-110 shadow-lg' : 'border-transparent'
        }`}
        style={{ background: color.hex }}
        title={color.name}
      />
    ))}
  </div>
  
  {/* Custom hex input */}
  <div className="flex gap-2">
    <Input
      type="color"
      value={currentAccent}
      onChange={(e) => updateTheme({ accentColor: e.target.value })}
      className="w-10 h-10 p-0 border-0"
    />
    <Input
      size="sm"
      value={currentAccent}
      onValueChange={(val) => {
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          updateTheme({ accentColor: val });
        }
      }}
      placeholder="#006FEE"
      startContent={<span className="text-default-400 text-xs">#</span>}
    />
  </div>
  
  {/* WCAG contrast warning */}
  {contrastWarning && (
    <div className="text-xs text-warning flex items-center gap-1">
      <ExclamationTriangleIcon className="w-3 h-3" />
      Low contrast: {contrastRatio}:1 (needs 4.5:1)
    </div>
  )}
</div>
```

**Accent color presets** (curated palette):
```jsx
const ACCENT_PRESETS = [
  { name: 'Blue', hex: '#006FEE' },
  { name: 'Purple', hex: '#7828C8' },
  { name: 'Green', hex: '#17C964' },
  { name: 'Pink', hex: '#F31260' },
  { name: 'Orange', hex: '#F5A524' },
  { name: 'Teal', hex: '#06B6D4' },
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Rose', hex: '#E11D48' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Amber', hex: '#D97706' },
  { name: 'Cyan', hex: '#0891B2' },
  { name: 'Violet', hex: '#7C3AED' },
];
```

**Backend for accent color**: Extend `ThemeContext.updateTheme()` to accept `accentColor`, and in `applyThemeToDocument()`, override `--theme-primary` with the custom accent if set. Also generate derived shades (primary-50 through primary-900) using a color lightness function.

#### 9E — Typography Controls (Enhanced)

Upgrade from a single font-family dropdown to a rich typography section:

```jsx
<div className="space-y-4">
  {/* Font Family — with preview text */}
  <Select
    label="Font Family"
    selectedKeys={[currentFont]}
    onSelectionChange={handleFontChange}
    renderValue={(items) => (
      <span style={{ fontFamily: items[0]?.textValue }}>{items[0]?.textValue}</span>
    )}
  >
    {fontFamilies.map(font => (
      <SelectItem key={font.name} textValue={font.name}>
        <span style={{ fontFamily: font.value }}>{font.name} — The quick brown fox</span>
      </SelectItem>
    ))}
  </Select>
  
  {/* Font Size — segmented control */}
  <div>
    <p className="text-xs text-default-500 mb-2">Interface Scale</p>
    <div className="flex gap-1">
      {['compact', 'default', 'comfortable'].map(size => (
        <Button
          key={size}
          size="sm"
          variant={currentDensity === size ? 'solid' : 'flat'}
          color={currentDensity === size ? 'primary' : 'default'}
          className="flex-1 capitalize"
          onPress={() => updateTheme({ density: size })}
        >
          {size}
        </Button>
      ))}
    </div>
  </div>
</div>
```

#### 9F — Layout Controls (NEW)

```jsx
<div className="space-y-4">
  {/* Border Radius — visual slider */}
  <div>
    <div className="flex justify-between mb-1">
      <p className="text-xs text-default-500">Border Radius</p>
      <p className="text-xs font-mono text-default-400">{radiusValue}px</p>
    </div>
    <Slider
      size="sm"
      step={2}
      minValue={0}
      maxValue={24}
      value={radiusValue}
      onChange={(val) => updateTheme({ layout: { borderRadius: `${val}px` } })}
      className="max-w-full"
      renderThumb={(props) => (
        <div {...props} className="w-5 h-5 bg-primary rounded-full shadow-md cursor-grab" />
      )}
    />
    {/* Visual indicator row */}
    <div className="flex justify-between mt-1">
      <div className="w-6 h-6 bg-default-200 rounded-none" title="Sharp" />
      <div className="w-6 h-6 bg-default-200 rounded-sm" title="Subtle" />
      <div className="w-6 h-6 bg-default-200 rounded-md" title="Medium" />
      <div className="w-6 h-6 bg-default-200 rounded-lg" title="Round" />
      <div className="w-6 h-6 bg-default-200 rounded-full" title="Full" />
    </div>
  </div>
  
  {/* Border Width */}
  <div>
    <div className="flex justify-between mb-1">
      <p className="text-xs text-default-500">Border Width</p>
      <p className="text-xs font-mono text-default-400">{borderWidth}px</p>
    </div>
    <Slider
      size="sm"
      step={1}
      minValue={0}
      maxValue={3}
      value={borderWidth}
      onChange={(val) => updateTheme({ layout: { borderWidth: `${val}px` } })}
      className="max-w-full"
    />
  </div>
</div>
```

#### 9G — Accessibility Section (NEW)

```jsx
<div className="space-y-3">
  {/* High Contrast Mode */}
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-foreground">High Contrast</p>
      <p className="text-xs text-default-500">Increase text/background contrast for readability</p>
    </div>
    <Switch
      size="sm"
      isSelected={themeSettings.accessibility?.highContrast}
      onValueChange={(val) => updateTheme({ accessibility: { ...themeSettings.accessibility, highContrast: val } })}
    />
  </div>
  
  {/* Reduced Motion */}
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-foreground">Reduce Motion</p>
      <p className="text-xs text-default-500">Disable animations and transitions</p>
    </div>
    <Switch
      size="sm"
      isSelected={themeSettings.accessibility?.reduceMotion}
      onValueChange={(val) => updateTheme({ accessibility: { ...themeSettings.accessibility, reduceMotion: val } })}
    />
  </div>
  
  {/* Font Scaling */}
  <div>
    <div className="flex justify-between mb-1">
      <p className="text-xs text-default-500">Text Size</p>
      <p className="text-xs font-mono text-default-400">{fontScale}%</p>
    </div>
    <Slider
      size="sm"
      step={5}
      minValue={85}
      maxValue={130}
      value={fontScale}
      onChange={(val) => updateTheme({ accessibility: { ...themeSettings.accessibility, fontScale: val } })}
      marks={[
        { value: 85, label: 'S' },
        { value: 100, label: 'M' },
        { value: 115, label: 'L' },
        { value: 130, label: 'XL' },
      ]}
    />
  </div>
</div>
```

#### 9H — Theme Export / Import & Reset (NEW)

```jsx
<div className="space-y-3">
  {/* Export theme */}
  <Button
    variant="flat"
    color="primary"
    fullWidth
    startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
    onPress={() => {
      const blob = new Blob([JSON.stringify(themeSettings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aeos-theme-${themeSettings.cardStyle}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }}
  >
    Export Theme
  </Button>
  
  {/* Import theme */}
  <Button
    variant="flat"
    color="secondary"
    fullWidth
    startContent={<ArrowUpTrayIcon className="w-4 h-4" />}
    onPress={() => fileInputRef.current?.click()}
  >
    Import Theme
  </Button>
  <input
    ref={fileInputRef}
    type="file"
    accept=".json"
    className="hidden"
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (validateTheme(imported)) {
          updateTheme(imported);
          showToast.success('Theme imported successfully');
        } else {
          showToast.error('Invalid theme file');
        }
      } catch {
        showToast.error('Failed to read theme file');
      }
    }}
  />
  
  {/* Reset */}
  <Button
    variant="flat"
    color="danger"
    fullWidth
    startContent={<ArrowPathIcon className="w-4 h-4" />}
    onPress={() => {
      if (confirm('Reset to default theme?')) resetTheme();
    }}
  >
    Reset to Default
  </Button>
</div>
```

#### 9I — Live Preview Bar (Sticky at Drawer Top)

Add a sticky mini-preview bar at the top of the drawer that shows the current theme in real-time as users adjust settings:

```jsx
{/* Sticky preview bar */}
<div className="sticky top-0 z-10 bg-content1 border-b border-divider p-3">
  <div className="flex items-center gap-3">
    {/* Mini card preview */}
    <div 
      className="w-16 h-12 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm"
      style={{
        background: `var(--theme-content1)`,
        border: `var(--borderWidth) solid var(--theme-divider)`,
        borderRadius: `var(--borderRadius)`,
        color: `var(--theme-foreground)`,
        fontFamily: `var(--fontFamily)`,
      }}
    >
      Aa
    </div>
    
    {/* Color dots */}
    <div className="flex gap-1.5">
      <div className="w-4 h-4 rounded-full" style={{ background: 'var(--theme-primary)' }} />
      <div className="w-4 h-4 rounded-full" style={{ background: 'var(--theme-success)' }} />
      <div className="w-4 h-4 rounded-full" style={{ background: 'var(--theme-warning)' }} />
      <div className="w-4 h-4 rounded-full" style={{ background: 'var(--theme-danger)' }} />
    </div>
    
    {/* Current style name */}
    <div className="ml-auto text-right">
      <p className="text-xs font-semibold text-foreground capitalize">{themeSettings.cardStyle}</p>
      <p className="text-[10px] text-default-400">{themeSettings.mode} · {themeSettings.typography?.fontFamily}</p>
    </div>
  </div>
</div>
```

#### 9J — Appearance Mode Tri-State Control

Replace the basic dark mode `Switch` with a polished segmented control:

```jsx
import { Tabs, Tab } from "@heroui/react";

<Tabs
  selectedKey={themeSettings.mode}
  onSelectionChange={(key) => setMode(key)}
  variant="bordered"
  fullWidth
  classNames={{
    tabList: "bg-default-100 p-1",
    cursor: "bg-primary shadow-sm",
    tab: "h-9",
    tabContent: "group-data-[selected=true]:text-primary-foreground text-default-500 font-medium text-sm"
  }}
>
  <Tab
    key="light"
    title={
      <div className="flex items-center gap-1.5">
        <SunIcon className="w-4 h-4" />
        <span>Light</span>
      </div>
    }
  />
  <Tab
    key="dark"
    title={
      <div className="flex items-center gap-1.5">
        <MoonIcon className="w-4 h-4" />
        <span>Dark</span>
      </div>
    }
  />
  <Tab
    key="system"
    title={
      <div className="flex items-center gap-1.5">
        <ComputerDesktopIcon className="w-4 h-4" />
        <span>System</span>
      </div>
    }
  />
</Tabs>
```

#### 9K — ThemeContext Extensions Required

To support the new drawer features, extend `ThemeContext.jsx` and `safeTheme.js`:

1. **Add to theme schema** in `safeTheme.js`:
```js
const DEFAULT_THEME = {
  version: '2.1',       // bump version
  mode: 'light',
  cardStyle: 'modern',
  accentColor: null,     // NEW — custom primary override (null = use card style default)
  typography: {
    fontFamily: 'Inter',
    fontSize: 'base',    // existing
  },
  layout: {              // NEW — granular layout overrides
    borderRadius: null,  // null = use card style default
    borderWidth: null,
  },
  density: 'default',   // NEW — compact | default | comfortable
  background: {
    type: 'color',
    value: '',
  },
  accessibility: {       // NEW section
    highContrast: false,
    reduceMotion: false,
    fontScale: 100,
  },
};
```

2. **In `applyThemeToDocument()`** (`theme/index.js`):
- If `accentColor` is set, override `--theme-primary` with it
- If `accessibility.reduceMotion` is true, add `[data-reduce-motion]` attribute to `<html>` and define `[data-reduce-motion] * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }`
- If `accessibility.fontScale` is not 100, set `font-size: ${fontScale}%` on `<html>`
- If `accessibility.highContrast` is true, boost `--theme-foreground` to pure black/white and increase border widths
- If `density` is `compact`, reduce default padding CSS variables; if `comfortable`, increase them
- If `layout.borderRadius` is set, use it instead of card style's default

3. **Migration**: `normalizeTheme()` in `safeTheme.js` must handle missing new keys gracefully with defaults (it already does partial normalization, just extend the default shape).

---

## Validation Checklist

After all changes, verify:

- [ ] **Zero `bg-white` without dark counterpart** — `grep -r "bg-white" --include="*.jsx" | grep -v "dark:" | grep -v "bg-white/"` returns zero on surface elements
- [ ] **Zero hardcoded gray/slate classes** — `grep -rE "text-gray-[0-9]|bg-gray-[0-9]|text-slate-[0-9]|bg-slate-[0-9]" --include="*.jsx"` returns zero (excluding intentional cases)
- [ ] **Zero inline card gradients** — `grep -r "theme-content1" --include="*.jsx" | grep "style="` returns zero outside theme definition files
- [ ] **All Cards themed** — Every `<Card>` has either `className="aero-card"` or is `<ThemedCard>`
- [ ] **Zero hardcoded chart hex colors** — `grep -rE "fill=\"#|stroke=\"#" --include="*.jsx"` returns zero outside theme definitions
- [ ] **Chart colors from centralized palette** — Every recharts component imports from `utils/chartColors.js`
- [ ] **Dark mode visual audit** — Every page visited in dark mode, no white flashes, no invisible text, no missing borders
- [ ] **Light mode visual audit** — No regressions, all text readable, all borders visible
- [ ] **Chart dark mode** — Charts have readable axes, grid lines, and tooltips in dark mode
- [ ] **Public pages dark mode** — Landing, Pricing, Features work in both modes
- [ ] **Theme preset switching** — Changing card style preset updates every card, header, chart, and surface
- [ ] **Font switching** — Changing font family applies everywhere (`--fontFamily` propagation)
- [ ] **WCAG AA contrast** — `validateThemeContrast()` passes for all card styles × both modes
- [ ] **Theme drawer** — Slides in from right, all sections work, accordion expand/collapse, accent picker updates preview live
- [ ] **Accent color override** — Custom accent overrides card style primary, reverts when cleared
- [ ] **Accessibility controls** — Reduce motion disables animations, font scale adjusts text, high contrast boosts readability
- [ ] **Theme export/import** — Exported JSON reimports correctly, invalid files show error toast
- [ ] **Layout sliders** — Border radius and border width sliders update live, values persist on reload
- [ ] **Build passes** — `npm run build` completes with zero errors
- [ ] **No visual regressions** — Before/after screenshots of: Dashboard, UsersList, EmployeeList, LeavesAdmin, Landing, Pricing, Events/Analytics

---

## Rules

1. **Never remove CSS variables** — Only add new ones or replace hardcoded values with existing ones
2. **Never break existing theme presets** — All 10 card styles must continue working
3. **Prefer `.aero-card` CSS class** over `<ThemedCard>` for admin pages with CardHeader/CardBody structure
4. **Prefer HeroUI semantic classes** (`text-foreground`, `bg-content1`, `border-divider`) over `dark:` overrides
5. **Test every file in BOTH modes** before moving to the next
6. **Do not refactor ThemeContext.jsx** — Only extend with new keys, keep existing API intact
7. **All changes in `packages/aero-ui/`** — Never modify host app files (`aeos365/resources/`)
8. **Chart colors must use `utils/chartColors.js`** — Never hardcode hex in recharts components
9. **Public pages may keep ternary dark mode pattern** for glass/blur effects — but replace `slate-*`/`gray-*` with HeroUI semantic classes where possible
10. **Remove duplicate widget files** only after verifying no imports reference the root path
11. **Theme drawer must be a sliding panel** — Not a center modal. Use `framer-motion` for entrance animation
12. **Accent color must validate contrast** — Show WCAG warning when chosen color fails AA ratio against the current background
13. **New theme schema fields must be backward-compatible** — `normalizeTheme()` must fill missing keys with safe defaults so existing stored themes don't break
