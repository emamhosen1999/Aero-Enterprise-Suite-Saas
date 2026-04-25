# aeos365 Design Drift Audit — 2026-04-25

**Status:** Foundation pass landed. This audit catalogues the remaining
visual/architectural drift in `packages/aero-ui/resources/js/**` for follow-up
sessions. Per-page refactors are explicitly out of scope of the foundation pass.

**Spec:** [`docs/superpowers/specs/2026-04-25-aeos365-design-system-foundation-design.md`](../specs/2026-04-25-aeos365-design-system-foundation-design.md)

---

## Headline numbers

| Drift dimension | Count | Status |
|---|---:|---|
| `var(--theme-*)` token consumers | **1949 occurrences across ~200 files** | Shimmed. Migrate to `var(--aeos-*)` lazily. |
| `motion-3d-*` / `text-3d-float` consumers | 0 in pages, 2 in nav utility files | Inert (CSS removed). Cleanup next. |
| `rotateX(`, `translateZ(`, `perspective(` literals | 2 files (`navigationUtils.jsx`, `Config/motionDepthSystem.js`) | Inert; remove in cleanup. |
| `whileHover={{ rotate / scale / rotateX / rotateY }}` | ~50 files | Spec violation. P1. |
| Hardcoded font (`Inter` / `Roboto` / `Arial`) | 3 files | P2. |
| Hardcoded hex colors in style props (e.g. `#006FEE`) | many | P3 (covered by token migration). |

---

## P0 — Foundation broken / inert

### `packages/aero-ui/resources/js/Layouts/Navigation/navigationUtils.jsx`
- Contains `motion-3d-*` references and likely 3D motion config exports.
- **Action:** Strip `motion3DConfig` and any `rotateX|translateZ|perspective` references. The Sidebar no longer imports `motion3DConfig`, so this should be a clean delete or stub.

### `packages/aero-ui/resources/js/Config/motionDepthSystem.js`
- Per-grep: contains `rotateX(`, `translateZ(`, `perspective(` literals AND `var(--theme-*)` (7 occurrences).
- **Action:** Delete the file (or stub with empty exports). It is a remnant of the legacy 3D motion system. Audit imports first.

---

## P1 — Spec violations in active components

### Whole-panel `whileHover={{ rotate, scale }}` transforms (~50 files)
The aeos365 spec explicitly bans rotate/scale on container surfaces ("animate
borders, glow, transform/translateY"). Translate-only hovers are fine.

Top-priority files (high traffic):
- `packages/aero-ui/resources/js/Layouts/Navigation/Header.jsx` (chevron rotate is OK as a single-trigger icon transform; check action buttons)
- `packages/aero-ui/resources/js/Components/EmployeeDashboard/*` — many cards use `whileHover={{ scale }}`
- `packages/aero-ui/resources/js/Components/Dashboard/Admin/*`
- `packages/aero-ui/resources/js/Components/Recruitment/CandidateCard.jsx`, `KanbanColumn.jsx`
- `packages/aero-ui/resources/js/Components/HRM/BulkLeave/BulkCalendar.jsx`
- `packages/aero-ui/resources/js/Pages/HRM/UserProfile.jsx`
- `packages/aero-ui/resources/js/Pages/HRM/Recruitment/*`
- `packages/aero-ui/resources/js/Components/Charts/TokenAnalyticsChart.jsx`, `TransactionVolumeChart.jsx`

**Action per file:** replace `whileHover={{ scale: 1.02 }}` and similar with `whileHover={{ y: -1 }}` plus border/glow tween, OR remove the `whileHover` altogether and let the HeroUI primitive's default focus/hover styles do the work.

### Hardcoded fonts
- `packages/aero-ui/resources/js/Pages/Settings/AttendanceSettings.jsx`
- `packages/aero-ui/resources/js/Components/Location/UserLocationsCardContent.jsx`
- `packages/aero-ui/resources/js/Components/HRM/HR/PayslipModal.jsx`

**Action:** swap inline `font-family: 'Inter'/'Arial'` for `var(--aeos-font-body)` (DM Sans) or `var(--aeos-font-mono)` for numeric content.

---

## P2 — Token migration (lazy, opportunistic)

`var(--theme-*)` is shimmed to `var(--aeos-*)` in `aeos-tokens.css`, so existing
pages render on-brand without any code change. **Migration is desirable but not
urgent.** When you touch any of these files for any reason, swap the names.

Top 20 most-affected files (by occurrence count):

| Count | File |
|---:|---|
| 75 | `Components/Dashboard/PunchStatusCard.jsx` |
| 62 | `Pages/Shared/Auth/Login.jsx` |
| 46 | `Pages/HRM/LeavesEmployee.jsx` |
| 41 | `Pages/HRM/Employees/Index.jsx` |
| 39 | `Forms/HRM/ProfileForm.jsx` |
| 35 | `Components/HRM/BulkLeave/BulkCalendar.jsx` |
| 34 | `Pages/Shared/Auth/ResetPassword.jsx` |
| 33 | `Forms/HRM/HolidayForm.jsx` |
| 33 | `Components/HRM/BulkLeave/BulkValidationPreview.jsx` |
| 33 | `Pages/Shared/Auth/VerifyEmail.jsx` |
| 31 | `Pages/Shared/Auth/ForgotPassword.jsx` |
| 30 | `Pages/Settings/DomainManager.jsx` |
| 26 | `Components/TimeSheet/AbsentUsersInlineCard.jsx` |
| 25 | `Forms/HRM/SalaryInformationForm.jsx` |
| 23 | `Pages/Settings/LeaveSettings.jsx` |
| 23 | `Components/HRM/BulkDelete/BulkDeleteModal.jsx` |
| 22 | `Pages/Shared/UsersList.jsx` |
| 22 | `Pages/Core/Modules/Index.jsx` |
| 22 | `Pages/Shared/ModuleManagement.jsx` |
| 21 | `Tables/HRM/UsersTable.jsx` |

(Full enumeration in `git grep`.)

**Search/replace mapping:**
```
var(--theme-primary)        → var(--aeos-cyan)         (or --aeos-cyan-deep in light contexts)
var(--theme-secondary)      → var(--aeos-indigo)
var(--theme-success)        → var(--aeos-success)
var(--theme-warning)        → var(--aeos-amber)
var(--theme-danger)         → var(--aeos-coral)
var(--theme-background)     → var(--aeos-obsidian)
var(--theme-foreground)     → var(--aeos-ink)
var(--theme-content1)       → var(--aeos-onyx)
var(--theme-content2)       → var(--aeos-slate)
var(--theme-content3)       → var(--aeos-graphite)
var(--theme-content4)       → var(--aeos-gunmetal)
var(--theme-divider)        → var(--aeos-divider)
var(--borderRadius)         → var(--aeos-r-lg)
var(--fontFamily)           → var(--aeos-font-body)
```

---

## P3 — Cleanup

### Theme infrastructure remnants
- `Hooks/theme/useCardStyle.js` — still imports `getCardStyle` from `theme/cardStyles.js` (now stubbed). Either delete the hook or leave as a thin compat layer.
- `Hooks/theme/useThemeColors.js`, `useIsDark.js`, `useBranding.js` — verify they read sensible aeos values from the new ThemeContext. Likely fine, but worth a smoke pass.
- `utils/theme/themeUtils.js` — reads `--borderRadius` and `--theme-primary`; both shimmed. OK to leave.
- `utils/theme/glassyStyles.js` — produces ad-hoc glass styles. Consider replacing call sites with `.aeos-glass`/`.aeos-glass-strong` classes.
- `utils/theme/safeTheme.js` — provided storage migration helpers for the legacy theme shape. Now unused by ThemeContext. Audit imports; likely safe to delete.

### Doc files referencing the legacy system
- `packages/aero-ui/resources/js/docs/THEME_SYSTEM_REFACTOR_PLAN.md` — outdated; either archive under `docs/archive/` or rewrite to point at the new spec.
- `packages/aero-ui/resources/js/docs/3D_NAVIGATION_IMPLEMENTATION.md` — outdated. Same treatment.

### `Components/Theme/` directory
After replacing `ThemeSettingDrawer`, audit other files in `Components/Theme/` for legacy preset selectors that no longer have a backing API.

---

## Suggested follow-up sessions

1. **P0 cleanup** (1 session): delete/stub `motionDepthSystem.js`, strip 3D refs from `navigationUtils.jsx`. Verify build still green.
2. **P1 motion sweep** (2–3 sessions): batch refactor `whileHover={{ scale/rotate }}` to spec-compliant motion across the ~50 files. Reasonable to dispatch per-folder subagents.
3. **Marketing pages refactor** (separate scope): Public pages under `Pages/Platform/Public/**` are the natural next target — they have their own `PublicLayout.jsx`, `HeroSection.jsx`, `PricingPlans.jsx`, etc., and the aeos365 spec ships explicit marketing patterns (mesh hero, bento, CTA glass) that would shine here.
4. **Token migration** (ongoing, lazy): just-in-time when files are edited for any other reason.
5. **Doc archival** (15min): move outdated theme docs to `docs/archive/`.

---

## How this audit was generated

```bash
# Token consumers
grep -r --include='*.jsx' --include='*.js' 'var(--theme-' packages/aero-ui/resources/js | wc -l

# 3D motion remnants
grep -r --include='*.jsx' --include='*.js' -E 'motion-3d-|text-3d-float|rotateX\(|translateZ\(|perspective\(' packages/aero-ui/resources/js

# whileHover spec violations
grep -r --include='*.jsx' -E 'whileHover=\{\{[^}]*(rotateX|rotateY|rotate:|scale:[^}]*\})' packages/aero-ui/resources/js

# Forbidden fonts
grep -r --include='*.jsx' --include='*.js' -E "font-family:.*['\"]?(Inter|Roboto|Arial)" packages/aero-ui/resources/js
```
