import React from 'react';
import App from '@/Layouts/App';

/**
 * SidebarShell — sidebar-driven app layout (the canonical authenticated shell).
 *
 *   <SidebarShell>{children}</SidebarShell>
 *
 * Wraps the existing App layout. Use this for tenant/workspace pages.
 *
 * @see aeos365-design-system/project/preview/app-shell.html
 */
const SidebarShell = ({ children }) => <App>{children}</App>;
export default SidebarShell;
