import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link, router } from '@inertiajs/react';
import Header from "@/Layouts/Header.jsx";
import Breadcrumb from "@/Components/Breadcrumb.jsx";
import BottomNav from "@/Layouts/BottomNav.jsx";
import { usePage } from "@inertiajs/react";
import { useTheme } from '@/Context/ThemeContext.jsx';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../css/theme-transitions.css';
import Sidebar from "@/Layouts/Sidebar.jsx";
import { getDynamicPages } from '@/Props/dynamicNavigation.jsx';
import { getSettingsPages } from '@/Props/settings.jsx';
import { HeroUIProvider, Button } from "@heroui/react";
import SessionExpiredModal from '@/Components/SessionExpiredModal.jsx';
import { onMessageListener, requestNotificationPermission } from "@/firebase-config.js";
import ThemeSettingDrawer from "@/Components/ThemeSettingDrawer.jsx";


import axios from 'axios';





function App({ children }) {
    const [sessionExpired, setSessionExpired] = useState(false);
    let appRenderCount = 0;
    let { auth, url, csrfToken } = usePage().props;
    auth = useMemo(() => auth, [JSON.stringify(auth)]);
    const appLoader = useCallback(() => {
        let unsubscribeOnMessage = null;

        const initializeFirebase = async () => {
            try {
                // Request notification permission and get token
                const token = await requestNotificationPermission();
                if (token) {
                    try {
                        const response = await axios.post(route('updateFcmToken'), { fcm_token: token });
                        if (response.status === 200) {
                            console.log('FCM Token Updated:', response.data.fcm_token);
                        }
                    } catch (error) {
                        console.error('Failed to update FCM token:', error);
                    }
                } else {
                    console.warn('Notification permission denied or no token retrieved.');
                }

                // Listen for foreground messages
                unsubscribeOnMessage = onMessageListener()
                    .then(payload => {
                        console.log('Message received:', payload);
                        const { title, body, icon } = payload.notification;

                        // Display desktop notification
                        if (Notification.permission === 'granted') {
                            new Notification(title, { body, icon });
                        }

                        // Also show in-app alert (optional)
                        alert(`${title}: ${body}`);
                    })
                    .catch(err => console.error('onMessageListener error:', err));
            } catch (err) {
                console.error('Firebase initialization error:', err);
            }
        };

        initializeFirebase();

        // Signal that React app is ready
        if (window.AppLoader) {
            const timer = setTimeout(() => {
                window.AppLoader.hideLoading();
            }, 200);
            return () => clearTimeout(timer);
        }

        // Cleanup on unmount
        return () => {
            if (unsubscribeOnMessage && typeof unsubscribeOnMessage === 'function') {
                unsubscribeOnMessage(); // Firebase unsubscribe (if using Firebase v9+ with listeners)
            }
        };  
    }, [auth]);


    const permissions = auth?.permissions || [];

    
    // Initialize sidebar state with localStorage
    const [sideBarOpen, setSideBarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebar-open');
        return saved !== null ? JSON.parse(saved) : false;
    });
    
    // Initialize theme state with localStorage
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
    const [themeId, setThemeId] = useState(() => localStorage.getItem('themeId') || 'default');
    const [themeDrawerOpen, setThemeDrawerOpen] = useState(false);

    const contentRef = useRef(null);
    const [bottomNavHeight, setBottomNavHeight] = useState(0);
    const [loading, setLoading] = useState(false);

    // Memoize pages to avoid unnecessary recalculations
    // Navigation is now driven by the Module Permission Registry via auth.accessibleModules
    const pages = useMemo(() => {
        // Check if the current URL is specifically a settings page
        const isSettingsPage = url.startsWith('/settings') || 
                              url.includes('settings') || 
                              url === '/settings';
        
        // For settings pages, use the settings navigation
        // For all other pages, use dynamic navigation from Module Permission Registry
        return isSettingsPage ? getSettingsPages(permissions, auth) : getDynamicPages(auth);
    }, [url, permissions, auth?.accessibleModules]);

    // Theme and media query
    const theme = useTheme(darkMode ? 'dark' : 'light', themeId);
    const isMobile = useMediaQuery('(max-width: 768px)');    // Persist darkMode, themeColor, and sidebar state
    
    

    // Memoize toggle handlers to prevent unnecessary re-renders
    const toggleDarkMode = useCallback(() => {
        setDarkMode(prev => {
            const newValue = !prev;
            localStorage.setItem('darkMode', newValue);
            return newValue;
        });
    }, []);
    
    const handleSetThemeId = useCallback((id) => {
        setThemeId(id);
        localStorage.setItem('themeId', id);
    }, []);

    const toggleThemeDrawer = useCallback(() => {
        setThemeDrawerOpen(prev => !prev);
    }, []);

    const closeThemeDrawer = useCallback(() => {
        setThemeDrawerOpen(false);
    }, []);
    
    const toggleSideBar = useCallback(() => {
        // Use requestAnimationFrame for smoother animation start
        requestAnimationFrame(() => {
            setSideBarOpen(prev => !prev);
        });
    }, []);

    // Memoize sidebar content to prevent re-renders
    const sidebarContent = useMemo(() => (
        <Sidebar 
            url={url} 
            pages={pages} 
            toggleSideBar={toggleSideBar}
            sideBarOpen={sideBarOpen}
        />
    ), [pages, toggleSideBar, sideBarOpen]);


    

    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        localStorage.setItem('themeId', themeId);
        localStorage.setItem('sidebar-open', JSON.stringify(sideBarOpen));
        
     
    }, [darkMode, themeId, sideBarOpen]);

    useEffect(() => {
        if (!auth.user) {
            return;
        }

        const interval = setInterval(async () => {
            try {
                const response = await axios.get('/session-check');
                if (!response.data.authenticated) {
                    setSessionExpired(true);
                    clearInterval(interval);
                }
            } catch (error) {
                console.error('Session check failed:', error);
                setSessionExpired(true);
                clearInterval(interval);
            }
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [auth.user]);
    
  
    useEffect(() => {
        if (csrfToken) {
            document.querySelector('meta[name="csrf-token"]')?.setAttribute('content', csrfToken);
            axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
        }
    }, [csrfToken]);

    useEffect(() => {
        appLoader();
    }, [appLoader]);

    // Inertia loading state
    useEffect(() => {
        const start = () => setLoading(true);
        const finish = () => setLoading(false);
        const unStart = router.on('start', start);
        const unFinish = router.on('finish', finish);
        return () => {
            unStart();
            unFinish();
        };
    }, []);

    appRenderCount++;
  

            
return (
        <HeroUIProvider>
            {sessionExpired && <SessionExpiredModal setSessionExpired={setSessionExpired}/>}
            <ThemeSettingDrawer
                themeId={themeId}
                setThemeId={handleSetThemeId}
                darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    themeDrawerOpen={themeDrawerOpen}
                    toggleThemeDrawer={toggleThemeDrawer}
                />
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme={darkMode ? "dark" : "light"}
                />
                <main id="app-main" className={darkMode ? "dark" : "light"}>
                    <div className="flex h-screen overflow-hidden">
                        {/* Overlay for mobile sidebar */}
                        {isMobile && (
                            <div
                                onClick={toggleSideBar}
                                className={`
                                    fixed top-0 left-0 right-0 bottom-0 
                                    bg-black/50 z-[1199]
                                    transition-opacity duration-200
                                    ${sideBarOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}
                                `}
                            />
                        )}
                        {/* Desktop Sidebar Area */}
                        {auth.user && (
                            <div
                                className={`
                                    fixed top-0 left-0 h-screen z-[1200] w-[280px]
                                    transition-transform duration-200 ease-out
                                    overflow-y-auto overflow-x-hidden
                                    ${sideBarOpen ? 'translate-x-0' : '-translate-x-full'}
                                `}
                                style={{
                                    willChange: 'transform',
                                    backfaceVisibility: 'hidden',
                                }}
                            >
                                {sidebarContent}
                            </div>
                        )}
                        {/* Main Content Area */}
                        <div
                            ref={contentRef}
                            className={`
                                flex flex-1 flex-col h-screen overflow-auto
                                transition-all duration-300 ease-out
                                ${isMobile ? 'ml-0 w-full' : sideBarOpen ? 'ml-[280px] w-[calc(100%-280px)]' : 'ml-0 w-full'}
                                min-w-0
                            `}
                            style={{
                                paddingBottom: `${bottomNavHeight}px`,
                                willChange: 'margin',
                            }}
                        >
                            {auth.user && (
                                <Header
                                    url={url}
                                    pages={pages}
                                    darkMode={darkMode}
                                    toggleDarkMode={toggleDarkMode}
                                    toggleThemeDrawer={toggleThemeDrawer}
                                    sideBarOpen={sideBarOpen}
                                    toggleSideBar={toggleSideBar}
                                    themeDrawerOpen={themeDrawerOpen}
                                />
                            )}
                            {auth.user && <Breadcrumb />}
                            {children}
                            {auth.user && isMobile && (
                                <BottomNav
                                    setBottomNavHeight={setBottomNavHeight}
                                    contentRef={contentRef}
                                    auth={auth}
                                    toggleSideBar={toggleSideBar}
                                    sideBarOpen={sideBarOpen}
                                />
                            )}
                        </div>
                    </div>
                </main>
            </HeroUIProvider>
    );
}

export default App;
