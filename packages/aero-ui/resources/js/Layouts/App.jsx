/**
 * App Layout - Main application layout with new navigation system
 * 
 * Features:
 * - 3D styled navigation with Framer Motion
 * - Responsive design (mobile drawer / desktop sidebar)
 * - Collapsible sidebar
 * - Centralized navigation state via NavigationProvider
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { usePage, router } from "@inertiajs/react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ScrollShadow, Divider } from "@heroui/react";
import { motion, AnimatePresence } from 'framer-motion';

import { NavigationProvider, Sidebar, Header, useNavigation } from "@/Layouts/Navigation";
import Breadcrumb from "@/Components/Breadcrumb.jsx";
import BottomNav from "@/Layouts/BottomNav.jsx";
import ThemeSettingDrawer from "@/Components/ThemeSettingDrawer.jsx";
import UpdateNotification from '@/Components/UpdateNotification.jsx';
import ImpersonationBanner from '@/Components/Admin/ImpersonationBanner.jsx';
import CommandPalette from '@/Components/Navigation/CommandPalette.jsx';
import MaintenanceModeBanner from '@/Components/Platform/MaintenanceModeBanner.jsx';
import { useVersionManager } from '@/Hooks/useVersionManager.js';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import { TranslationProvider } from '@/Context/TranslationContext';
import { GlobalAutoTranslator } from '@/Context/GlobalAutoTranslator';
import { AppStateProvider } from '@/Context/AppStateContext';
import { useBranding } from '@/Hooks/useBranding';
import { useLegacyPages } from '@/Configs/navigationUtils.jsx';

import '@/utils/serviceWorkerManager.js';

// ===== MEMOIZED PAGE CONTENT =====
const PageContent = React.memo(({ children, url }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={url}
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.3,
          ease: "easeOut"
        }
      }}
      exit={{
        opacity: 0,
        y: -10,
        transition: {
          duration: 0.2,
          ease: "easeIn"
        }
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  </AnimatePresence>
));
PageContent.displayName = 'PageContent';

// ===== MAIN CONTENT WRAPPER =====
// This component uses the NavigationProvider context
const MainContentArea = React.memo(({ 
  children, 
  url, 
  pages,
  onToggleThemeDrawer,
  auth 
}) => {
  const { isMobile, sidebarOpen } = useNavigation();
  const contentRef = useRef(null);
  const mainContentRef = useRef(null);
  
  // Breadcrumb content
  const breadcrumbContent = useMemo(() => (
    <Breadcrumb />
  ), [url]);
  
  // Bottom navigation for mobile
  const bottomNavContent = useMemo(() => {
    if (!auth?.user || !isMobile) return null;
    return (
      <BottomNav
        contentRef={contentRef}
        auth={auth}
        toggleThemeDrawer={onToggleThemeDrawer}
      />
    );
  }, [auth?.user?.id, isMobile, onToggleThemeDrawer]);
  
  return (
    <motion.main
      ref={contentRef}
      className="flex flex-1 flex-col h-full overflow-hidden w-full min-w-0"
      animate={{
        transition: { 
          duration: 0.4, 
          ease: [0.4, 0.0, 0.2, 1]
        }
      }}
    >
      {/* Header with integrated navigation */}
      <header className="sticky top-0 z-[30] w-full overflow-hidden">
        <ImpersonationBanner />
        <Header pages={pages} showNav={!sidebarOpen} />
      </header>
      
      {/* Breadcrumb */}
      <div className="px-3 pt-2">
        {breadcrumbContent}
      </div>

      {/* Page Content */}
      <section 
        ref={mainContentRef}
        className="flex-1 overflow-auto"
        role="main"
        aria-label="Main content"
      >
        <ScrollShadow 
          className="h-full"
          hideScrollBar={false}
          size={40}
        >
          <div className="min-h-full">
            <PageContent url={url}>
              {children}
            </PageContent>
          </div>
        </ScrollShadow>
      </section>

      {/* Bottom Navigation for Mobile */}
      {bottomNavContent && (
        <footer className="sticky bottom-0 z-[30] border-t border-divider">
          {bottomNavContent}
        </footer>
      )}
    </motion.main>
  );
});
MainContentArea.displayName = 'MainContentArea';

// ===== MAIN APP LAYOUT =====
const App = React.memo(({ children }) => {
  // ===== CORE STATE MANAGEMENT =====
  const [loading, setLoading] = useState(false);
  const [themeDrawerOpen, setThemeDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get global page props
  const { auth, app, url, roles, context: domainContext = 'tenant' } = usePage().props;
  
  // Get domain-aware branding
  const { favicon, siteName } = useBranding();

  // Get navigation pages (from config-driven navigation system)
  const pages = useLegacyPages();

  // Version manager for update notifications
  const {
    currentVersion,
    isUpdateAvailable,
    isChecking,
    forceUpdate,
    dismissUpdate
  } = useVersionManager();

  // Responsive breakpoints
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Refs
  const layoutInitialized = useRef(false);

  // ===== NAVIGATION DATA =====
  const authData = useMemo(() => ({
    user: auth?.user,
    permissions: auth?.permissions,
    roles: auth?.roles,
    id: auth?.user?.id,
    permissionCount: auth?.permissions?.length,
    isPlatformSuperAdmin: auth?.isPlatformSuperAdmin ?? false,
    isTenantSuperAdmin: auth?.isTenantSuperAdmin ?? false,
    isSuperAdmin: auth?.isSuperAdmin ?? false,
    isAdmin: auth?.isAdmin ?? false,
  }), [
    auth?.user?.id,
    auth?.isPlatformSuperAdmin,
    auth?.isTenantSuperAdmin,
    auth?.isSuperAdmin,
    auth?.isAdmin,
    auth?.permissions,
    auth?.roles,
  ]);

  // ===== STATIC HANDLERS (Stable References) =====
  const staticToggleThemeDrawer = useCallback(() => {
    setThemeDrawerOpen(prev => !prev);
  }, []);

  const staticCloseThemeDrawer = useCallback(() => {
    setThemeDrawerOpen(false);
  }, []);

  const staticToggleCommandPalette = useCallback(() => {
    setCommandPaletteOpen(prev => !prev);
  }, []);

  const staticCloseCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

  const staticHandleUpdate = useCallback(async () => {
    setIsUpdating(true);
    try {
      await forceUpdate();
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  }, [forceUpdate]);

  // ===== EFFECTS =====
  // Firebase initialization
  useEffect(() => {
    if (!authData?.user || layoutInitialized.current) return;
    let mounted = true;
    const loadFirebase = async () => {
      try {
        const { initFirebase } = await import("@/utils/firebaseInit.js");
        if (mounted) {
          await initFirebase();
          layoutInitialized.current = true;
        }
      } catch (error) {
        console.warn('Firebase initialization failed:', error);
      }
    };
    loadFirebase();
    return () => { mounted = false; };
  }, [authData?.user?.id]);

  // Initialize theme background from theme system
  useEffect(() => {
    // The ThemeProvider will handle background initialization
    // This effect is just to ensure CSS variable fallback is available
    if (typeof window !== 'undefined' && !document.documentElement.style.getPropertyValue('--theme-background')) {
      document.documentElement.style.setProperty('--theme-background', '#F4F4F5');
    }
  }, []);

  // Command Palette keyboard shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        staticToggleCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [staticToggleCommandPalette]);

  // Inertia loading state
  useEffect(() => {
    let loadingTimeout;
    const start = () => {
      loadingTimeout = setTimeout(() => setLoading(true), 250);
    };
    const finish = () => {
      clearTimeout(loadingTimeout);
      setLoading(false);
    };
    const unStart = router.on('start', start);
    const unFinish = router.on('finish', finish);
    return () => {
      clearTimeout(loadingTimeout);
      unStart();
      unFinish();
    };
  }, []);

  // Hide app loading screen
  useEffect(() => {
    if (authData?.user && window.AppLoader) {
      const timer = setTimeout(() => {
        window.AppLoader.updateLoadingMessage('Almost ready...', 'Loading your dashboard');
        setTimeout(() => {
          window.AppLoader.hideLoading();
        }, 300);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [authData?.user]);

  // ===== MEMOIZED COMPONENTS =====
  const themeDrawer = useMemo(() => (
    <ThemeSettingDrawer
      isOpen={themeDrawerOpen}
      onClose={staticCloseThemeDrawer}
    />
  ), [themeDrawerOpen, staticCloseThemeDrawer]);

  const commandPalette = useMemo(() => (
    <CommandPalette
      isOpen={commandPaletteOpen}
      onClose={staticCloseCommandPalette}
      pages={pages}
    />
  ), [commandPaletteOpen, staticCloseCommandPalette, pages]);

  // ===== RENDER =====
  return (
    <>
      <TranslationProvider>
        <GlobalAutoTranslator>
          <AppStateProvider>
            {/* NavigationProvider wraps entire layout for centralized nav state */}
            <NavigationProvider 
              user={auth?.user} 
              activePath={url}
            >
              {/* Theme Settings Drawer */}
              {themeDrawer}

              {/* Command Palette (⌘K / Ctrl+K) */}
              {commandPalette}

              <div className="relative w-full h-screen overflow-hidden">
                {/* Global Overlays */}
                <UpdateNotification
                  isVisible={isUpdateAvailable}
                  onUpdate={staticHandleUpdate}
                  onDismiss={dismissUpdate}
                  isUpdating={isUpdating}
                  version={currentVersion}
                />

                <ToastContainer
                  position="top-center"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="colored"
                />

                {/* Floating Theme Settings Button - Desktop Only */}
                {authData?.user && !isMobile && (
                  <div className="fixed bottom-8 right-8 z-50">
                    <motion.button
                      onClick={staticToggleThemeDrawer}
                      className="
                        flex items-center justify-center
                        w-16 h-16 
                        bg-primary text-primary-foreground
                        rounded-full shadow-xl hover:shadow-2xl
                        transition-all duration-300 ease-out
                        hover:scale-110 active:scale-95
                        border-3 border-primary-200
                        backdrop-blur-sm
                        relative
                      "
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: 0.5, 
                        duration: 0.4, 
                        type: "spring", 
                        stiffness: 260, 
                        damping: 20 
                      }}
                    >
                      <svg 
                        className="w-6 h-6" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                        />
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                        />
                      </svg>
                    </motion.button>
                  </div>
                )}

                {/* Main Application Layout */}
                <div 
                  className="flex h-full overflow-hidden"
                  style={{
                    background: `var(--theme-background, var(--background, #F4F4F5))`,
                  }}
                >
                  {/* Sidebar - Desktop visible, Mobile drawer */}
                  <Sidebar pages={pages} />

                  {/* Main Content Area */}
                  <MainContentArea
                    url={url}
                    pages={pages}
                    onToggleThemeDrawer={staticToggleThemeDrawer}
                    auth={authData}
                  >
                    {children}
                  </MainContentArea>
                </div>
              </div>
            </NavigationProvider>
          </AppStateProvider>
        </GlobalAutoTranslator>
      </TranslationProvider>
      
      {/* Maintenance/Debug Mode Indicator */}
      <MaintenanceModeBanner position="bottom-right" />
    </>
  );
});

App.displayName = 'App';

export default App;
