/**
 * Shell registry — pick the shell that matches the page's information density.
 *
 *   import { SidebarShell, TopNavShell, CenteredShell, DashboardShell } from '@/Layouts/Shells';
 *
 *   - SidebarShell:    canonical authenticated app — 240px sidebar + topbar + content
 *   - TopNavShell:     marketing / public / docs — full-width top nav, centered content
 *   - CenteredShell:   auth / onboarding / single-task — centred glass card on mesh
 *   - DashboardShell:  SidebarShell + opinionated dashboard scaffold (kicker + KPI row)
 */
export { default as SidebarShell } from './SidebarShell';
export { default as TopNavShell } from './TopNavShell';
export { default as CenteredShell } from './CenteredShell';
export { default as DashboardShell } from './DashboardShell';
