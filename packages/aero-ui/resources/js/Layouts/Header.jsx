import * as React from 'react';
import { usePage, router } from '@inertiajs/react';
import { useState, useCallback, useEffect } from 'react';

import { useScrollTrigger } from '@/Hooks/useScrollTrigger.js';
import { useBranding } from '@/Hooks/useBranding';
import { useTheme } from '@/Context/ThemeContext';

// Import separated header components for optimization
import MobileHeader from './MobileHeader';
import DesktopHeader from './DesktopHeader';

/**
 * Custom hook for responsive device type detection
 * Optimized for ERP system layout adaptations
 */
const useDeviceType = () => {
  const [deviceState, setDeviceState] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false
  });

  const updateDeviceType = useCallback(() => {
    const width = window.innerWidth;
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileUserAgent = /android|iphone|ipad|ipod/i.test(userAgent);

    const newState = {
      isMobile: width <= 768 || isMobileUserAgent,
      isTablet: width > 768 && width <= 1024,
      isDesktop: width > 1024
    };

    setDeviceState(prevState => {
      if (JSON.stringify(prevState) !== JSON.stringify(newState)) {
        return newState;
      }
      return prevState;
    });
  }, []);

  useEffect(() => {
    updateDeviceType();
    const debouncedUpdate = debounce(updateDeviceType, 150);
    window.addEventListener('resize', debouncedUpdate);
    return () => window.removeEventListener('resize', debouncedUpdate);
  }, [updateDeviceType]);

  return deviceState;
};

/**
 * Utility function for debouncing resize events
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Main Header Component
 * Enterprise-grade header with optimized mobile/desktop split
 * 
 * Key Features:
 * - Separate mobile and desktop components for code splitting
 * - Static rendering with internal state management
 * - Responsive design for mobile, tablet, and desktop
 * - ERP-specific navigation and tools
 * - Performance optimized with memoization
 * - Accessibility compliant
 * 
 * @author Emam Hosen - Final Year CSE Project
 */
const Header = React.memo(({ 
  toggleSideBar, 
  url, 
  pages,
  sideBarOpen 
}) => {
  // Get theme context for reactive theme updates
  const { mode, themeSettings } = useTheme();
  
  // ===== INTERNAL STATE MANAGEMENT =====
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(sideBarOpen);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [currentPages, setCurrentPages] = useState(pages);
  
  // Get static page props once
  const { auth, app } = usePage().props;
  
  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group('=== Header.jsx: Auth Debug ===');
      console.log('auth:', auth);
      console.log('auth?.user:', auth?.user);
      console.groupEnd();
    }
  }, [auth]);

  // Early return if no authenticated user
  if (!auth?.user) {
    console.warn('Header: No authenticated user, returning null');
    return null;
  }

  const { isMobile, isTablet, isDesktop } = useDeviceType();
  const trigger = useScrollTrigger();
  
  // Get logo from backend branding settings
  const { logo, siteName } = useBranding();

  // ===== INTERNAL HANDLERS (Stable References) =====
  const handleInternalToggle = useCallback(() => {
    setInternalSidebarOpen(prev => !prev);
    if (toggleSideBar) {
      toggleSideBar();
    }
  }, [toggleSideBar]);

  const handleNavigation = useCallback((route, method = 'get') => {
    router.visit(route, {
      method,
      preserveState: false,
      preserveScroll: false
    });
  }, []);

  // ===== SYNC WITH EXTERNAL STATE =====
  useEffect(() => {
    const syncExternalState = () => {
      try {
        const stored = localStorage.getItem('sidebarOpen');
        const newState = stored ? JSON.parse(stored) : false;
        setInternalSidebarOpen(newState);
      } catch (error) {
        console.warn('Failed to sync sidebar state:', error);
      }
    };

    window.addEventListener('storage', syncExternalState);
    setCurrentUrl(url);
    setCurrentPages(pages);
    
    const pollInterval = setInterval(syncExternalState, 100);

    return () => {
      window.removeEventListener('storage', syncExternalState);
      clearInterval(pollInterval);
    };
  }, [url, pages]);

  // ===== RENDER DECISION =====
  // Render mobile or desktop header based on device type
  if (isMobile) {
    return (
      <MobileHeader
        internalSidebarOpen={internalSidebarOpen}
        handleInternalToggle={handleInternalToggle}
        handleNavigation={handleNavigation}
        auth={auth}
        app={app}
        logo={logo}
      />
    );
  }

  return (
    <DesktopHeader
      internalSidebarOpen={internalSidebarOpen}
      handleInternalToggle={handleInternalToggle}
      handleNavigation={handleNavigation}
      currentPages={currentPages}
      currentUrl={currentUrl}
      isTablet={isTablet}
      trigger={trigger}
      auth={auth}
      app={app}
      logo={logo}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.url === nextProps.url &&
    prevProps.pages === nextProps.pages &&
    prevProps.toggleSideBar === nextProps.toggleSideBar &&
    prevProps.sideBarOpen === nextProps.sideBarOpen
  );
});

Header.displayName = 'Header';

export default Header;

/**
 * =========================
 * IMPLEMENTATION NOTES
 * =========================
 * 
 * This header component is redesigned with separated mobile and desktop components:
 * 
 * 1. **Code Splitting**:
 *    - MobileHeader.jsx - Optimized for touch and smaller screens
 *    - DesktopHeader.jsx - Full-featured with navigation dropdowns
 *    - Reduces bundle size for each device type
 * 
 * 2. **Performance Optimization**:
 *    - Static rendering to prevent unnecessary re-renders
 *    - Memoized components and callbacks
 *    - Efficient device type detection with debouncing
 * 
 * 3. **3D Effects**:
 *    - Consistent 3D border effects on all interactive elements
 *    - Motion system integration for depth and elevation
 *    - Smooth hover and press animations
 * 
 * 4. **Responsive Design**:
 *    - Mobile-first approach with progressive enhancement
 *    - Tablet-specific optimizations
 *    - Desktop full-feature experience
 */
