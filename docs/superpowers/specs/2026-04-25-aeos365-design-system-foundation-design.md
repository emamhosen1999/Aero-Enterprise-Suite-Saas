# aeos365 Design System — Foundation Pass

**Status:** Approved 2026-04-25
**Scope:** Foundation only (theme engine, app shell, navigation, agent prompt). Per-page refactors and marketing pages deferred.

---

## 1. Goal

Adopt `aeos365-design-system/` (handoff bundle from claude.ai/design) as the single architectural and visual source of truth for the aeos365 frontend. Replace the current multi-variant theme machinery with a spec-faithful engine. Existing pages render under the new tokens via a one-time compatibility shim; their per-page refactor is a follow-up.

## 2. Non-goals

- Refactoring individual page components (deferred — covered by audit checklist).
- Refactoring marketing/public pages to the new mesh-hero / bento / CTA-glass patterns (next session).
- Tenant brand-color customization (removed entirely).
- Per-tenant font/density/card-style settings (removed entirely).
- Migration off `motion-3d-*` and `aero-card` legacy classes inside individual pages (deprecated but kept inert).

## 3. Source of truth

- **Spec bundle:** `aeos365-design-system/project/`
  - `README.md` — design rationale, voice, don'ts.
  - `SKILL.md` — usage guide, locked-in rules.
  - `colors_and_type.css` — every token, every utility class, every animation.
  - `preview/*.html` — visual reference cards.
- **Authoritative rules:**
  - Dark-first. Two modes only: `aeos` and `aeos--light`.
  - Font triad: **Syne** (display), **DM Sans** (body/UI), **JetBrains Mono** (numbers/labels/code). No Inter, Roboto, Arial, or system fonts.
  - Palette: `--aeos-cyan #00E5FF`, `--aeos-amber #FFB347`, `--aeos-indigo #6366F1`, `--aeos-coral #FF6B6B`. Each has a semantic job; no new accents.
  - Borders are cyan-tinted at 6–20% alpha. White borders > 10% are forbidden.
  - Buttons: 8px radius max. No rounded pills above sm.
  - Motion: animate **borders, glow, transform (translateY)**. No `rotateX`, `translateZ`, `perspective`, no animated background colors.
  - Easing: `cubic-bezier(0.22, 1, 0.36, 1)`. Durations: 180/240/400ms.
  - Heroicons inside soft cyan tiles only. No emoji.

## 4. Architecture — the seven layers

| # | Layer | File | Action |
|---|---|---|---|
| 1 | Token sheet | `packages/aero-ui/resources/css/aeos-tokens.css` *(new)* | Copy spec verbatim. Append legacy `--theme-*` shim mapping. |
| 2 | Global CSS | `packages/aero-ui/resources/css/app.css` | Rewrite. Strip 3D motion, gradient `bg-content1` rules, dim/midnight variant blocks, `!important` walls. Keep print, reduced-motion, scrollbar-hide. Import tokens. |
| 3 | HeroUI plugin | `packages/aero-ui/resources/css/hero.ts` | Rewrite. Two themes: `aeos` (dark default) and `aeos-light`. Delete ocean/forest/sunset/purple/monochrome/cosmic/neon/warm/winter. Radius `{small:6, medium:8, large:12}`. Border `{small:1, medium:1, large:2}`. Shadows aeos-spec. |
| 4 | Theme provider | `packages/aero-ui/resources/js/Context/ThemeContext.jsx` + `theme/index.js` + `theme/themePresets.js` + `theme/cardStyles.js` + `theme/backgroundPresets.js` | Rewrite ThemeContext + index.js. Stub-export `themePresets`/`cardStyles`/`backgroundPresets` as deprecated no-ops with console warnings. New API: `{ mode, setMode, reduceMotion, setReduceMotion, isDark }`. One-shot localStorage migration. Apply `aeos` / `aeos--light` class on `<html>`. |
| 5 | App shell | `packages/aero-ui/resources/js/Layouts/App.jsx` + `Layouts/Navigation/Sidebar.jsx` + `Layouts/Navigation/Header.jsx` + `Layouts/Navigation/MenuItem3D.jsx` | Rewrite shell. Sidebar 240–280px aeos-onyx. Topbar glass. MenuItem3D internals stripped of 3D (filename kept to avoid import churn). Heroicons in cyan tiles. |
| 6 | Public layout | `packages/aero-ui/resources/js/Layouts/GuestLayout.jsx` | Light retune to aeos tokens. Marketing component refactor deferred. |
| 7 | Frontend Engineer Agent | `.claude/agents/aeos-frontend-engineer.agent.md` | Append authoritative `## DESIGN SYSTEM — aeos365 (Single Source of Truth)` section. |

## 5. Token compatibility shim

Existing components reference `var(--theme-primary)`, `var(--theme-content1)`, etc. Without a shim, every page de-themes. Inside `aeos-tokens.css`:

```css
.aeos {
  /* Map legacy --theme-* names onto new aeos tokens */
  --theme-primary:    var(--aeos-cyan);
  --theme-secondary:  var(--aeos-indigo);
  --theme-success:    var(--aeos-success);
  --theme-warning:    var(--aeos-amber);
  --theme-danger:     var(--aeos-coral);
  --theme-background: var(--aeos-obsidian);
  --theme-foreground: var(--aeos-ink);
  --theme-content1:   var(--aeos-onyx);
  --theme-content2:   var(--aeos-slate);
  --theme-content3:   var(--aeos-graphite);
  --theme-content4:   var(--aeos-gunmetal);
  --theme-divider:    var(--aeos-divider);
  --borderRadius:     var(--aeos-r-lg);
  --borderWidth:      1px;
  --fontFamily:       var(--aeos-font-body);
}
.aeos--light {
  --theme-primary:    var(--aeos-cyan-deep);
  --theme-background: var(--aeos-paper);
  --theme-foreground: var(--aeos-onyx-l);
  --theme-content1:   var(--aeos-paper);
  --theme-content2:   var(--aeos-paper-2);
  --theme-content3:   var(--aeos-paper-3);
  --theme-divider:    var(--aeos-divider-l);
}
```

The shim is **explicitly marked deprecated**; new code uses `var(--aeos-*)` directly.

## 6. Theme provider — new API

```js
import { useTheme } from '@/Context/ThemeContext';

const { mode, setMode, reduceMotion, setReduceMotion, isDark } = useTheme();
// mode ∈ { 'aeos', 'aeos-light', 'system' }
// isDark resolves 'system' against prefers-color-scheme
```

**Storage key:** `aeos:theme` (JSON `{mode, reduceMotion}`).
**Migration:** On first load, if legacy keys exist, read `theme.mode`. Map `dim|dark|midnight` → `'aeos'`, `light` → `'aeos-light'`, `system` → `'system'`. Write new key, delete legacy keys.
**Document side-effects:** add `aeos` class always; add `aeos--light` when light; toggle `dark` class for HeroUI; set `data-reduce-motion` when reduceMotion is on.

**Deprecated exports** (kept for one release, console.warn on access):
`CARD_STYLE_OPTIONS`, `THEME_PRESET_OPTIONS`, `BACKGROUND_PRESET_OPTIONS`, `FONT_OPTIONS`, `FONT_SIZE_OPTIONS`, `getThemeRadius`, `applyThemePreset`, `getCardStyle`, etc.

**`ThemeSettingDrawer`** — keep file, replace contents with simple Mode + Reduce Motion controls. Old controls behind `?legacy_theme=1` query string for one release; otherwise hidden behind a banner explaining the simplification.

## 7. App shell

### Sidebar (`Layouts/Navigation/Sidebar.jsx`)
- Width: 240–280px (collapsible to 64px icon-only).
- Surface: `--aeos-onyx`, right border `1px solid rgba(0, 229, 255, 0.08)`.
- **Top:** workspace switcher — current tenant logo + name + chevron, opens popover for switching workspaces.
- **Middle:** grouped nav. Group headers use `.aeos-label-mono` (UPPERCASE mono kicker). Items: 28×28 cyan tile holding Heroicon (1.5px stroke) + DM Sans label. Active item = soft cyan background (`rgba(0,229,255,0.08)`) + cyan-tinted left bar + `--aeos-glow-cyan` ring on icon tile. **No rotateX, no translateZ.**
- **Foot:** user chip — avatar + name + role badge, dropdown trigger.

### Topbar (`Layouts/Navigation/Header.jsx`)
- Sticky. Surface: `.aeos-glass` (translucent slate, backdrop-blur 16px).
- **Left:** breadcrumb in `.aeos-label-mono`.
- **Right:** ⌘K search trigger (existing CommandPalette stays), notification bell (cyan dot when unread), primary `+` action via `.aeos-btn-primary`.

### MenuItem (`Layouts/Navigation/MenuItem3D.jsx` — internals only)
- Strip all `motion-3d-*`, `rotateX`, `translateZ`, `perspective`.
- Hover: border glow + `translateY(-1px)` + soft cyan background fade-in over 240ms `--aeos-ease-out`.
- Active: cyan tile + glow ring on icon. Keyboard navigation preserved.

### Mobile (out of scope for visual rewrite, but tokens flow through)
- `MobileHeader.jsx`, `BottomNav.jsx` — render under `.aeos`, pick up new tokens automatically. No structural changes this pass.

## 8. Frontend Engineer Agent — appended section

Goes after the existing `## Enterprise UI Constraints (CRITICAL)` block in `.claude/agents/aeos-frontend-engineer.agent.md`.

Heading: `## DESIGN SYSTEM — aeos365 (Single Source of Truth)`

Body covers:
1. Pointer to `aeos365-design-system/project/` and the four key files.
2. Locked rules: fonts, palette, borders, radii, motion, Heroicons.
3. Token usage: prefer `var(--aeos-*)`. `var(--theme-*)` is shim-only.
4. Component primitives reference: `.aeos-btn-primary|ghost|soft|amber`, `.aeos-card|card-elevated|glass|glass-strong|bento|cta-glass`, `.aeos-badge-cyan|amber|indigo|success|danger|mono|dot`, `.aeos-text-gradient-cyan|amber|full`, `.aeos-stat-number`, `.aeos-label-mono`, `.aeos-grid-bg`, `.aeos-divider-glow`, `.aeos-glow-ring-cyan|amber`.
5. HeroUI rule: keep using HeroUI primitives; do not override their styles with `!important`. The aeos `hero.ts` plugin does the theming.
6. Don'ts (verbatim): no Inter/Roboto/Arial; no new accent colors; no white borders > 10%; no rounded buttons > 8px; no emoji; no animated background colors; no `rotateX`/`translateZ`/`perspective`.

## 9. Migration order (one logical commit per layer)

1. Add `aeos-tokens.css` (additive, breaks nothing).
2. Rewrite `hero.ts` (HeroUI gets aeos themes).
3. Rewrite `app.css` (strip 3D + gradient cards + variants; import tokens).
4. Rewrite `ThemeContext.jsx` + `theme/index.js`. Stub deprecated exports. Add storage migration.
5. Rewrite `App.jsx` shell + `Sidebar.jsx` + `Header.jsx` + `MenuItem3D.jsx` internals.
6. Append agent prompt section.
7. Write audit checklist (`docs/superpowers/audits/2026-04-25-aeos365-design-drift-audit.md`) — list every file using `motion-3d-*`, `aero-card`, `--theme-*` directly, gradient backgrounds in pages, etc., for follow-up sessions.

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| `ThemeSettingDrawer` breaks for tenants who relied on color presets | Replace with simplified drawer (mode + reduce-motion). Banner explains the change. Old controls behind `?legacy_theme=1` for one release. |
| Pages using `motion-3d-*` classes go inert (no animations) | Acceptable — design system mandates removal. Audit checklist tracks them. |
| Pages using direct `var(--theme-*)` get aeos colors via shim — may surprise tenant admins expecting their custom palette | Desired outcome: aeos365 is the single brand. Communication note in changelog. |
| Tailwind v4 `@source` paths in `app.css` reference an absolute Windows path | Audit + fix to relative path during the rewrite. |

## 11. Backout

Each layer lands in a self-contained commit. `git revert <commit>` restores prior behavior with no data migration concerns (theme state is localStorage and the migration is one-shot but reversible by clearing the `aeos:theme` key).

## 12. Acceptance

Foundation pass is "done" when:
- Build succeeds (`npm run build` from app root).
- Dev server boots and renders at least one authenticated page (e.g. dashboard) with cyan-on-obsidian look — no broken styles.
- A representative public page (login or landing) renders cleanly under `.aeos--light` if requested.
- `useTheme()` returns the new shape; `ThemeSettingDrawer` no longer crashes.
- `.claude/agents/aeos-frontend-engineer.agent.md` contains the new design-system section.
- The audit checklist exists and lists at least the high-traffic offenders for follow-up.
