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

import { ScrollShadow, Divider, Button } from "@heroui/react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from 'framer-motion';

import { NavigationProvider, Sidebar, Header, useNavigation } from "@/Layouts/Navigation";
import Breadcrumb from "@/Components/UI/Breadcrumb";
import BottomNav from "@/Layouts/BottomNav.jsx";
import ThemeSettingDrawer from "@/Components/Theme/ThemeSettingDrawer";
import UpdateNotification from '@/Components/Feedback/UpdateNotification';
import ImpersonationBanner from '@/Components/Admin/ImpersonationBanner.jsx';
import SubscriptionAlertBanner from '@/Components/Platform/SubscriptionAlertBanner.jsx';
import CommandPalette from '@/Components/Navigation/CommandPalette.jsx';
import MaintenanceModeBanner from '@/Components/Platform/MaintenanceModeBanner.jsx';
import { useVersionManager } from '@/Hooks/utils/useVersionManager';
import { useMediaQuery } from '@/Hooks/utils/useMediaQuery';
import { useKeyboardNavigation } from '@/Hooks/navigation/useKeyboardNavigation';
import { useAINavigation } from '@/Hooks/navigation/useAINavigation';
import { TranslationProvider } from '@/Context/TranslationContext';
import { GlobalAutoTranslator } from '@/Context/GlobalAutoTranslator';
import { AppStateProvider } from '@/Context/AppStateContext';
import { useTheme } from '@/Context/ThemeContext';
import { useBranding } from '@/Hooks/theme/useBranding';
import { resolveEffectiveMode } from '@/theme/index';

import '@/utils/service-worker/serviceWorkerManager.js';

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
      <header className="sticky top-0 z-[30] w-full overflow-hidden print:hidden">
        <ImpersonationBanner />
        <SubscriptionAlertBanner />
        <Header showNav={!sidebarOpen} />
      </header>
      
      {/* Breadcrumb */}
      <div className="px-3 pt-2 print:hidden">
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
        <footer className="sticky bottom-0 z-[30] border-t border-divider print:hidden">
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
  const { themeSettings } = useTheme();

  const effectiveMode = resolveEffectiveMode(themeSettings?.mode || 'system');
  const isDarkAppearance = effectiveMode !== null;
  const activeBackgroundType = themeSettings?.background?.type || 'color';
  const usesDocumentBackground = ['pattern', 'image', 'texture'].includes(activeBackgroundType);

  // Version manager for update notifications
  const {
    currentVersion,
    isUpdateAvailable,
    isChecking,
    forceUpdate,
    dismissUpdate
  } = useVersionManager();

  // Auto-track page visits for AI navigation personalization
  useAINavigation();

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
        const { initFirebase } = await import("@/utils/analytics/firebaseInit.js");
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

  // Theme background is initialized by ThemeProvider via applyThemeToDocument()
  // No manual fallback needed — ThemeContext handles all CSS variable setup

  // Command Palette keyboard shortcut (⌘K / Ctrl+K)
  useKeyboardNavigation({ onCommandPalette: staticToggleCommandPalette });

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
    />
  ), [commandPaletteOpen, staticCloseCommandPalette]);

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
                  theme={isDarkAppearance ? 'dark' : 'light'}
                />

                {/* Floating Theme Settings Button - Desktop Only */}
                {authData?.user && !isMobile && (
                  <motion.div
                    className="fixed bottom-8 right-8 z-50 print:hidden"
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
                    <Button
                      isIconOnly
                      color="primary"
                      variant="shadow"
                      size="lg"
                      radius="full"
                      onPress={staticToggleThemeDrawer}
                      className="w-16 h-16 border-3 border-primary-200"
                      aria-label="Theme settings"
                    >
                      <Cog6ToothIcon className="w-6 h-6" />
                    </Button>
                  </motion.div>
                )}

                {/* Main Application Layout */}
                <div 
                  className="flex h-full overflow-hidden"
                  style={{
                    background: usesDocumentBackground
                      ? 'transparent'
                      : `var(--theme-background, var(--background, #F4F4F5))`,
                    color: 'var(--theme-foreground, #11181C)',
                    fontFamily: 'var(--fontFamily, "Inter")',
                  }}
                >
                  {/* Sidebar - Desktop visible, Mobile drawer */}
                  <div className="print:hidden">
                    <Sidebar />
                  </div>

                  {/* Main Content Area */}
                  <MainContentArea
                    url={url}
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
