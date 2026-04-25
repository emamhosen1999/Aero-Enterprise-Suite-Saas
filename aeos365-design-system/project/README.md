# aeos365 — Design System

> **The modular enterprise platform built for scale, security, and sovereignty.**
> Every module. Every tenant. One coherent system.

aeos365 is a multi-tenant enterprise suite that unifies HR, Payroll, Analytics, and Operations. This design system documents the visual language used across both the public marketing site and the authenticated platform.

---

## Brand essence

| | |
|---|---|
| **Name** | aeos365 |
| **Wordmark** | lowercase, `Syne` 700 weight |
| **Tagline** | Enterprise software that scales with you |
| **Subline** | `ENTERPRISE SUITE` — JetBrains Mono, +0.18em tracking |
| **Voice** | Confident, technical, calm. Speaks to architects and operators. Never cute. |
| **Vibe** | Obsidian dark + cyan signal + amber warmth. Glass, grid, glow. Mission-control panel for an enterprise. |

**The brand glyph** is a diamond rotated 45° with a small filled center, on a cyan→indigo gradient tile. It reads as a node, a portal, a unit of compute — abstract enough to scale from favicon to footer signature.

---

## Color

The palette is **dark-first**. Light mode exists and is supported, but dark is the canonical canvas — interfaces feel like instruments lit from within.

### Brand
| Token | Hex | Use |
|---|---|---|
| `--aeos-cyan` | `#00E5FF` | **Primary signal.** Links, focus rings, glow, gradient start, KPIs. |
| `--aeos-cyan-deep` | `#00A3B8` | Cyan in light mode (passes contrast). |
| `--aeos-amber` | `#FFB347` | Money & warmth. Payroll figures, warnings, secondary CTAs. |
| `--aeos-indigo` | `#6366F1` | Cool accent. Analytics, gradient end, chart series 2. |
| `--aeos-coral` | `#FF6B6B` | Reserved for destructive / danger. |

### Status
`--aeos-success #22C55E` · `--aeos-warning #FFB347` · `--aeos-danger #FF6B6B` · `--aeos-info #00E5FF`

### Surfaces (dark, in order of depth)
`--aeos-obsidian #03040A` (page) → `--aeos-onyx #070B14` (app) → `--aeos-slate #0D1120` (glass) → `--aeos-graphite #131829` (cards) → `--aeos-gunmetal #1A1F33` (modals)

### Surfaces (light)
`--aeos-paper #F8FAFC` → `--aeos-paper-2 #F1F5F9` → `--aeos-paper-3 #E2E8F0`

### Ink
Dark: `--aeos-ink #E8EDF5` · `--aeos-ink-muted #8892A4` · `--aeos-ink-faint #4A5468`
Light: `--aeos-onyx-l #0F172A` · `--aeos-graphite-l #475569` · `--aeos-ink-l-muted #64748B`

### Gradients (load-bearing)
- **Cyan** `#00E5FF → #6366F1` — primary CTAs, headline accents, KPI numbers
- **Amber** `#FFB347 → #FF6B6B` — payroll/finance accents, secondary headlines
- **Full** `#00E5FF → #6366F1 → #FFB347` — hero / brand reveal
- **Mesh** — three radial blobs (cyan top, amber right, indigo bottom-left) on hero/CTA backdrops

---

## Type

A three-voice system. Don't mix outside it.

| Family | Role | Notes |
|---|---|---|
| **Syne** | Display (h1/h2/h3) | Geometric, slightly architectural. Always 700–800. Tight tracking (`-0.025em` to `-0.03em`). |
| **DM Sans** | Body, UI | Optical-size variable. Workhorse for paragraphs, buttons, nav. |
| **JetBrains Mono** | Numbers, labels, code | KPIs, table figures, kicker labels (`+0.15em`, UPPERCASE). Tabular figures. |

### Scale
- `aeos-display-hero` — `clamp(2.8rem, 7vw, 5.5rem)`, 800wt, `-0.03em`
- `aeos-display-section` — `clamp(2rem, 4vw, 3.2rem)`, 700wt, `-0.025em`
- `aeos-display-sm` — `clamp(1.5rem, 2.5vw, 2.25rem)`, 700wt
- `aeos-h3` — `1.5rem`, 600wt (Syne)
- `aeos-h4` — `1.25rem`, 600wt (DM Sans)
- `aeos-body-lg` — `1.125rem`, regular
- `aeos-body` — `1rem`, regular, 1.6 leading
- `aeos-label-mono` — `0.72rem`, JetBrains Mono, +0.15em, UPPERCASE
- `aeos-stat-number` — `clamp(2.4rem, 5vw, 4rem)`, mono 600, white→cyan gradient

---

## Surfaces & elevation

The system has **five depth registers** — pick the one that matches information weight.

1. **Page** — flat obsidian, optional grid texture (`.aeos-grid-bg`) at 30% opacity, optional radial mesh.
2. **Card** (`.aeos-card`) — 3% white wash, 6% white hairline border. Workhorse container.
3. **Glass** (`.aeos-glass`) — 70% slate translucent, cyan 12% border, 16px backdrop-blur. Use over textured backgrounds.
4. **Bento** (`.aeos-bento`) — 80% slate, with a CSS variable `--mx/--my` driven cursor highlight. Use for marketing feature grids.
5. **CTA glass** (`.aeos-cta-glass`) — full-spectrum gradient wash. Reserved for hero CTAs.

**Borders are mostly cyan-tinted** at 8–20% alpha. Avoid white borders > 10% — they kill the glow.

**Shadows** are warm-black, never gray. Standard card: `0 8px 32px rgba(0,0,0,0.40)`. Mockup-grade: triple-stack with cyan glow ring.

---

## Iconography

Use **Heroicons** (outline 1.5–2px stroke, 24×24) — that's what the platform ships. Place them inside soft tinted tiles (`rgba(0,229,255,0.08)` bg + matching border) at 40×40 → 56×56 to brand them.

Decorative SVG marks (the diamond logo, arrow markers) sit on cyan/indigo gradient tiles with the dark obsidian color punched through — never solid color icons.

---

## Motion

| Motion | When |
|---|---|
| `aeos-anim-float` 7s | Hero mockups, badges floating around interactive panels |
| `aeos-anim-pulse-glow` 3s | Live status indicators, primary CTAs at rest |
| `aeos-anim-shimmer` 2s | Skeleton loading states |
| Scroll-linked parallax | Hero text/mockup, narrative sections — Framer Motion `useScroll` |
| Mouse parallax | Hero gradient mesh + floating orbs — `useMouseParallax` (60ms damp, 18 stiffness) |
| Counter count-up | Stats sections — easeOut 1.6s |

**Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` is the house curve. Springs: `(0.34, 1.56, 0.64, 1)` for delightful pop on small UI.

**Durations:** 180ms / 240ms / 400ms — keep transitions snappy. Marketing pieces can stretch to 800ms for reveals.

---

## Layout

- **Marketing max-width:** `max-w-screen-xl` (1280px) for content, `max-w-screen-2xl` (1536px) for chrome (header/footer).
- **Section padding:** `clamp(4rem, 8vw, 8rem)` vertical.
- **App max-width:** fluid; sidebar 240–280px, main fills.
- **Grid texture** on dark surfaces at 48px×48px — background-image not table grid.

---

## Components inventory

The platform is built on **HeroUI** (NextUI fork) for primitives — Cards, Inputs, Buttons, Modals, Dropdowns, Tabs — with aeos-tokens applied. Marketing pages drop HeroUI in favor of hand-tailored compositions in Tailwind + Framer Motion.

Core building blocks documented in this system:

- **Brand** — logo lockup, glyph, wordmark variations
- **Color** — tokens, swatches, light/dark
- **Type** — scale, gradient text, mono numbers
- **Buttons** — primary, ghost, soft, amber, sizes
- **Form controls** — inputs, labels, toggles, select
- **Cards** — flat, elevated, glass, glass-strong, bento
- **Badges** — cyan, amber, indigo, success, danger, mono kicker, dot
- **KPI tiles** — number + label + delta + sparkline
- **Hero composition** — gradient mesh, mockup window, floating badges
- **App shell** — sidebar nav, KPI row, chart area, activity feed

---

## Files in this system

- **`colors_and_type.css`** — single import. All design tokens, base classes, animations.
- **`preview/*.html`** — visual reference cards, each demonstrating one slice of the system. Open the project's Design System tab to browse them.
- **`SKILL.md`** — instructions for re-using this system in derived design projects.

To use: link `colors_and_type.css` in `<head>` and add `class="aeos"` to `<body>` (or `aeos aeos--light` for light mode). All `--aeos-*` tokens and helper classes are then available.

---

## Don'ts

- ❌ Don't use Inter, Roboto, or Arial. The triad is fixed.
- ❌ Don't introduce new accent colors — the cyan/amber/indigo trio is doing real semantic work (signal/warmth/depth).
- ❌ Don't use pure-black borders or pure-white borders > 10% alpha. Kill the glow.
- ❌ Don't use rounded `.btn` larger than 8px. The system reads sharper than typical "friendly" SaaS.
- ❌ Don't use emoji. Use Heroicons or custom SVG.
- ❌ Don't drop shadows on cards in light mode without softening — light mode uses subtler `rgba(15,23,42,0.10)` shadows.
- ❌ Don't animate background colors or large gradients on hover — animate borders, glow, transform.
