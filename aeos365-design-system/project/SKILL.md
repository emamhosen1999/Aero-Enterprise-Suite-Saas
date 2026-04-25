# aeos365 — Skill Guide

This is a **design system for an enterprise SaaS suite**. Use it when you're building HR/Payroll/Finance/Analytics-flavored interfaces, dark-first instrument-panel UIs, or marketing for a B2B platform that wants to feel modern, technical, and confident.

## When to reach for this system

✅ **Good fit**
- Marketing landing pages for B2B / enterprise platforms
- Internal dashboards: KPIs, tables, charts, approvals, ops consoles
- Multi-tenant admin tools — feels like mission control
- Data-heavy product surfaces where mono numbers + grid texture sing
- Anything that benefits from "obsidian + cyan + amber + glow"

❌ **Bad fit**
- Consumer apps that need warmth or playfulness
- Light-only marketing (it works, but the system shines in dark)
- Editorial / publication / long-reading layouts (Syne is for headlines, not body)
- Any brand that already has its own tokens — don't mix systems

## How to use it

1. **Link the stylesheet** in `<head>`:
   ```html
   <link rel="stylesheet" href="path/to/colors_and_type.css" />
   ```
2. **Apply the namespace** on `<body>` (or any root):
   ```html
   <body class="aeos">           <!-- dark, default -->
   <body class="aeos aeos--light"> <!-- light -->
   ```
3. **Compose with helper classes** — `.aeos-card`, `.aeos-glass`, `.aeos-bento`, `.aeos-btn-primary`, `.aeos-badge-cyan`, etc. Tokens (`var(--aeos-cyan)`, `var(--aeos-grad-cyan)`, …) are available everywhere.

That's it. No build step, no React dependency.

## The visual DNA — three things that must always be true

1. **Cyan is the signal color.** Use it for primary CTAs, focus, links, KPIs, gradient starts. Never decorate with cyan — it has to mean something.
2. **Numbers are mono.** Any figure a human reads as a *value* (KPI, price, count, table cell) goes in `JetBrains Mono` with `font-feature-settings: "tnum"`. Body copy and headings stay in DM Sans / Syne.
3. **Borders are cyan-tinted, never gray.** Hairlines at `rgba(0, 229, 255, 0.06–0.20)`. White borders above 10% kill the glow.

## Layout patterns to reuse

- **Marketing hero** — gradient-mesh page bg → kicker badge → display headline with one cyan word italicized → muted lead → primary + ghost CTA → mono meta-row → product mockup with two floating ambient cards.
- **Bento grid** — 4-column, mixed cell sizes (`span-2`, `row-2`), one flagship cell with stat-line, soft icon tiles inside each card, cursor-tracked highlight on hover.
- **App shell** — 240px sidebar (workspace switcher → grouped nav → user foot) + topbar (crumbs + ⌘K search + bell + plus) + content (page header → 4-up KPI row → 2:1 grid of activity feed + approvals).
- **Stat card** — mono kicker label with tiny icon → mono value → delta (▲/▼) in success/danger → optional sparkline pinned to the bottom.

## Don'ts (these will break the brand)

- ❌ Don't introduce new accent colors. Cyan/amber/indigo each has a semantic job.
- ❌ Don't use Inter, Roboto, Arial, or system fonts. The triad is locked.
- ❌ Don't use emoji. Use Heroicons (outline, 1.5–2px stroke) inside soft cyan tiles.
- ❌ Don't put shadows on cards in light mode without softening to `rgba(15,23,42,0.10)`.
- ❌ Don't animate background colors on hover. Animate borders, glow, transform.
- ❌ Don't use rounded buttons larger than 8px — the system reads sharper than typical SaaS.

## Spacing rhythm

- Buttons: 36–44px height, `r-md` (8px), `0.75rem 1.75rem` padding
- Cards: `r-xl` (16px), `1.5rem` padding
- Sections: `clamp(4rem, 8vw, 8rem)` vertical padding
- Icon tiles: 40×40 (in cards), 56×56 (in features)
- Grid texture: 48×48 background-image

## Reference files

- **`colors_and_type.css`** — the entire system in one file. Read this first.
- **`README.md`** — design rationale, token tables, voice & tone notes.
- **`preview/landing.html`** — full marketing page showing every hero pattern.
- **`preview/app-shell.html`** — full authenticated app showing sidebar + topbar + dashboard.
- **`preview/bento.html`** — marketing feature mosaic (cursor highlight pattern).
- **`preview/data-viz.html`** — KPI cards, stacked bars, donut, leaderboard, table.
- **`preview/buttons.html`**, **`cards.html`**, **`badges.html`**, **`forms.html`**, **`typography.html`**, **`colors.html`**, **`brand.html`** — atomic component references.

## Quick component cheatsheet

```html
<!-- Buttons -->
<button class="aeos-btn aeos-btn-primary">Book a demo →</button>
<button class="aeos-btn aeos-btn-ghost">Learn more</button>
<button class="aeos-btn aeos-btn-soft">Cyan-tinted</button>
<button class="aeos-btn aeos-btn-amber">Run payroll</button>

<!-- Surfaces -->
<div class="aeos-card">flat 3% wash</div>
<div class="aeos-card-elevated">graphite + shadow</div>
<div class="aeos-glass">translucent slate</div>
<div class="aeos-bento" style="--mx:50%;--my:50%;">cursor-tracked</div>
<div class="aeos-cta-glass">full-spectrum gradient panel</div>

<!-- Badges -->
<span class="aeos-badge aeos-badge-cyan">Cyan</span>
<span class="aeos-badge aeos-badge-mono aeos-badge-dot">LIVE</span>

<!-- Type -->
<h1 class="aeos-display-hero">Run the company on <em class="aeos-text-gradient-cyan">one platform</em></h1>
<p class="aeos-label-mono">/ 01 · HR CORE</p>
<div class="aeos-stat-number">12,847</div>
```

## Cursor-tracked bento — the JS

The `.aeos-bento` cells need a tiny mousemove handler — copy this verbatim:

```js
document.addEventListener('mousemove', (e) => {
  document.querySelectorAll('.aeos-bento').forEach(el => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});
```

## When you fork this system

If you're adapting aeos365 to a different brand, the levers in order of impact:
1. Swap `--aeos-cyan` (primary) and `--aeos-amber` (warm accent). Indigo can usually stay.
2. Swap the display font (Syne) — pick something with similar geometric weight (e.g. Bricolage Grotesque, Migra, Tomato Grotesk). Keep DM Sans + JetBrains Mono.
3. Re-shoot the brand glyph — keep it abstract, geometric, and gradient-filled.
4. Don't change the layout patterns or the dark-first stance — those are what make the system feel like itself.
