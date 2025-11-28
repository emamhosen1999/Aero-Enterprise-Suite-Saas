import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { usePage } from "@inertiajs/react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Inertia } from '@inertiajs/inertia';
import { getPages } from '@/Props/pages.jsx';
import { getSettingsPages } from '@/Props/settings.jsx';
import { ScrollShadow, Divider } from "@heroui/react";
import { motion, AnimatePresence } from 'framer-motion';

import Header from "@/Layouts/Header.jsx";
import Sidebar from "@/Layouts/Sidebar.jsx";
import Breadcrumb from "@/Components/Breadcrumb.jsx";
import BottomNav from "@/Layouts/BottomNav.jsx";
import ThemeSettingDrawer from "@/Components/ThemeSettingDrawer.jsx";
import UpdateNotification from '@/Components/UpdateNotification.jsx';
import { FadeIn, SlideIn } from '@/Components/Animations/SmoothAnimations';
import { useVersionManager } from '@/Hooks/useVersionManager.js';
import AuthGuard from '@/Components/AuthGuard.jsx';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import { TranslationProvider } from '@/Contexts/TranslationContext';
import { GlobalAutoTranslator } from '@/Contexts/GlobalAutoTranslator';
import { AppStateProvider } from '@/Contexts/AppStateContext';

import '@/utils/serviceWorkerManager.js';
import axios from 'axios';

// ===== STATIC LAYOUT CONTEXT =====
// This context provides a stable API for header and sidebar to access layout state
// without causing re-renders when that state changes
const LayoutContext = React.createContext({
  sideBarOpen: false,
  toggleSideBar: () => {},
  currentUrl: '',
  pages: [],
  auth: null,
  app: null
});

// ===== COMPLETELY STATIC HEADER WRAPPER =====
// This component renders ONCE and never re-renders, regardless of any prop changes
const StaticHeaderWrapper = React.memo(() => {
  const contextValue = React.useContext(LayoutContext);
  const [mounted, setMounted] = useState(false);
  
  // Capture initial context values and freeze them
  const frozenContext = useRef(contextValue);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return (
    <Header
      url={frozenContext.current.currentUrl}
      pages={frozenContext.current.pages}
      toggleSideBar={frozenContext.current.toggleSideBar}
      sideBarOpen={frozenContext.current.sideBarOpen}
    />
  );
}, () => true); // Always return true to prevent ANY re-renders

StaticHeaderWrapper.displayName = 'StaticHeaderWrapper';

// ===== COMPLETELY STATIC SIDEBAR WRAPPER =====
// This component renders ONCE and never re-renders, regardless of any prop changes
const StaticSidebarWrapper = React.memo(() => {
  const contextValue = React.useContext(LayoutContext);
  const [mounted, setMounted] = useState(false);
  
  // Capture initial context values and freeze them
  const frozenContext = useRef(contextValue);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return (
    <Sidebar
      url={frozenContext.current.currentUrl}
      pages={frozenContext.current.pages}
      toggleSideBar={frozenContext.current.toggleSideBar}
      sideBarOpen={frozenContext.current.sideBarOpen}
    />
  );
}, () => true); // Always return true to prevent ANY re-renders

StaticSidebarWrapper.displayName = 'StaticSidebarWrapper';

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

// ===== MAIN APP LAYOUT =====
const App = React.memo(({ children }) => {
  // ===== CORE STATE MANAGEMENT =====
  const [loading, setLoading] = useState(false);
  const [sideBarOpen, setSideBarOpen] = useState(() => {
    try {
      const stored = localStorage.getItem('sidebarOpen');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });
  const [themeDrawerOpen, setThemeDrawerOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get global page props
  const { auth, app, url, roles } = usePage().props;

  // Version manager for update notifications
  const {
    currentVersion,
    isUpdateAvailable,
    isChecking,
    forceUpdate,
    dismissUpdate
  } = useVersionManager();

  // ===== STATIC REFERENCE DATA (Never Changes After Initial Calculation) =====
  // These values are calculated ONCE and then frozen to prevent any re-renders
  const staticLayoutData = useMemo(() => {
    const currentAuth = {
      user: auth?.user,
      permissions: auth?.permissions,
      roles: auth?.roles,
      id: auth?.user?.id,
      permissionCount: auth?.permissions?.length
    };

    const permissions = currentAuth?.permissions || [];
    const roles = currentAuth?.roles || [];
    const isSettingsPage = url.startsWith('/settings') || url.includes('settings');
    const pages = isSettingsPage 
      ? getSettingsPages(permissions, currentAuth) 
      : getPages(roles, permissions, currentAuth);

    return {
      currentAuth,
      permissions,
      roles,
      pages,
      app,
      url
    };
  }, []); // Empty dependency array - calculate ONLY ONCE

  // Responsive breakpoints
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Persistent refs
  const contentRef = useRef(null);
  const mainContentRef = useRef(null);
  const layoutInitialized = useRef(false);

  // ===== STATIC HANDLERS (Never Change Reference) =====
  // These handlers maintain stable references to prevent re-renders
  const staticToggleSideBar = useCallback(() => {
    setSideBarOpen(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem('sidebarOpen', JSON.stringify(newValue));
        localStorage.setItem('sidebar_has_interacted', 'true');
      } catch (error) {
        console.warn('Failed to save sidebar state to localStorage:', error);
      }
      return newValue;
    });
  }, []); // Empty dependency array - stable reference

  const staticToggleThemeDrawer = useCallback(() => {
    setThemeDrawerOpen(prev => !prev);
  }, []); // Empty dependency array - stable reference

  const staticCloseThemeDrawer = useCallback(() => {
    setThemeDrawerOpen(false);
  }, []); // Explicit close function

  const staticHandleUpdate = useCallback(async () => {
    setIsUpdating(true);
    try {
      await forceUpdate();
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  }, [forceUpdate]);

  // ===== STATIC CONTEXT VALUE (Frozen After Initial Render) =====
  // This context value is set ONCE and never changes to prevent any re-renders
  const staticContextValue = useMemo(() => ({
    sideBarOpen: false, // Always start with false - visual state managed by components internally
    toggleSideBar: staticToggleSideBar,
    currentUrl: staticLayoutData.url,
    pages: staticLayoutData.pages,
    auth: staticLayoutData.currentAuth,
    app: staticLayoutData.app
  }), []); // Empty dependency array - freeze the context value

  // ===== EFFECTS (Same as before) =====
  // Firebase initialization
  useEffect(() => {
    if (!staticLayoutData.currentAuth?.user || layoutInitialized.current) return;
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
  }, [staticLayoutData.currentAuth?.user?.id]);

  // Theme background
  useEffect(() => {
    const savedBackground = localStorage.getItem('aero-hr-background');
    const backgroundPattern = savedBackground || 'pattern-glass-1';
    document.documentElement.setAttribute('data-background', backgroundPattern);
  }, []);

  // Responsive sidebar auto-close
  useEffect(() => {
    if (isMobile && sideBarOpen) {
      const hasInteracted = localStorage.getItem('sidebar_has_interacted');
      if (hasInteracted) {
        setSideBarOpen(false);
        try {
          localStorage.setItem('sidebarOpen', JSON.stringify(false));
        } catch (error) {
          console.warn('Failed to save responsive sidebar state:', error);
        }
      }
    }
  }, [isMobile]);

  // Session authentication is now handled by AuthGuard component
  // No need for redundant session checking here

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
    const unStart = Inertia.on('start', start);
    const unFinish = Inertia.on('finish', finish);
    return () => {
      clearTimeout(loadingTimeout);
      unStart();
      unFinish();
    };
  }, []);

  // Hide app loading screen
  useEffect(() => {
    if (staticLayoutData.currentAuth?.user && window.AppLoader) {
      const timer = setTimeout(() => {
        window.AppLoader.updateLoadingMessage('Almost ready...', 'Loading your dashboard');
        setTimeout(() => {
          window.AppLoader.hideLoading();
        }, 300);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [staticLayoutData.currentAuth?.user]);

  // ===== MEMOIZED COMPONENTS THAT CAN RE-RENDER =====
  const breadcrumbContent = useMemo(() => {
    // Show breadcrumb for all pages, not just authenticated users
    return <Breadcrumb />;
  }, [url]);

  const bottomNavContent = useMemo(() => {
    if (!staticLayoutData.currentAuth?.user || !isMobile) return null;
    return (
      <BottomNav
  
        contentRef={contentRef}
        auth={staticLayoutData.currentAuth}
        toggleSideBar={staticToggleSideBar}
        sideBarOpen={sideBarOpen}
        toggleThemeDrawer={staticToggleThemeDrawer}
      />
    );
  }, [staticLayoutData.currentAuth?.user?.id, isMobile, sideBarOpen, staticToggleSideBar, staticToggleThemeDrawer]);

  const themeDrawer = useMemo(() => (
    <ThemeSettingDrawer
      isOpen={themeDrawerOpen}
      onClose={staticCloseThemeDrawer}
    />
  ), [themeDrawerOpen, staticCloseThemeDrawer]);

  // ===== RENDER =====
  return (
    <TranslationProvider>
      <GlobalAutoTranslator>
        <AppStateProvider>
          <LayoutContext.Provider value={staticContextValue}>
            {/* Theme Settings Drawer */}
            {themeDrawer}

            <AuthGuard auth={auth} url={url}>
          <div className="relative w-full h-screen overflow-hidden">
            {/* Global Overlays and Modals */}
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

          {/* Floating Theme Settings Button - Hidden on Mobile */}
          {staticLayoutData.currentAuth?.user && !isMobile && (
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
                transition={{ delay: 0.5, duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
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
          <div className="flex h-full overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
              {isMobile && sideBarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.25,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
                  onClick={staticToggleSideBar}
                  className="fixed inset-0 bg-black/50 z-[40] lg:hidden backdrop-blur-sm"
                />
              )}
            </AnimatePresence>

            {/* Sidebar: COMPLETELY STATIC - Never re-renders */}
            <AnimatePresence mode="wait">
              {sideBarOpen && (
                <motion.aside
                  initial={isMobile ?
                    { x: "-100%", opacity: 0 } :
                    { width: 0, opacity: 0 }
                  }
                  animate={isMobile ?
                    { x: "0%", opacity: 1 } :
                    { width: "auto", opacity: 1 }
                  }
                  exit={isMobile ?
                    { x: "-100%", opacity: 0 } :
                    { width: 0, opacity: 0 }
                  }
                  transition={{
                    duration: isMobile ? 0.3 : 0.4,
                    ease: [0.4, 0.0, 0.2, 1],
                    opacity: { duration: isMobile ? 0.2 : 0.3 }
                  }}
                  className={`
                    ${isMobile 
                      ? 'fixed top-0 left-0 h-full z-[50]' 
                      : 'relative h-full'
                    }
                    border-r border-divider
                    flex-shrink-0
                    overflow-hidden
                  `}
                >
                  <StaticSidebarWrapper />
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <motion.main
              ref={contentRef}
              className="flex flex-1 flex-col h-full overflow-hidden"
             
              animate={{
                transition: { 
                  duration: 0.4, 
                  ease: [0.4, 0.0, 0.2, 1]
                }
              }}
            >
              {/* Header: COMPLETELY STATIC - Never re-renders */}
              <header className="sticky top-0 z-[30] border-b border-divider">
                <StaticHeaderWrapper />
                <Divider />
                {breadcrumbContent}
              </header>

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

              {/* Bottom Navigation */}
              <footer className="sticky bottom-0 z-[30] border-t border-divider">
                {bottomNavContent}
                <Divider />
              </footer>
              {}
            </motion.main>
          </div>
        </div>
      </AuthGuard>
    </LayoutContext.Provider>
        </AppStateProvider>
      </GlobalAutoTranslator>
    </TranslationProvider>
  );
});

App.displayName = 'App';

export default App;