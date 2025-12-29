import React, { useEffect, useState } from 'react';
import { usePage } from "@inertiajs/react";
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import MobileSidebar from './MobileSidebar';
import DesktopSidebar from './DesktopSidebar';

/**
 * Sidebar - Main sidebar wrapper component
 * Renders MobileSidebar or DesktopSidebar based on device type
 */
const Sidebar = React.memo(({ toggleSideBar, pages, url, sideBarOpen }) => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const { auth, app } = usePage().props;

  // Choose sidebar type based on device
  const SidebarComponent = isMobile ? MobileSidebar : DesktopSidebar;

  return (
    <SidebarComponent
      toggleSideBar={toggleSideBar}
      pages={pages}
      url={url}
      sideBarOpen={sideBarOpen}
      app={app}
      auth={auth}
    />
  );
});

// Add display name for debugging
Sidebar.displayName = 'Sidebar';

export default Sidebar;
