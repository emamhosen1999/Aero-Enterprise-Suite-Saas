import React, { useEffect, useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Spinner } from '@heroui/react';

/**
 * Global Authentication Guard
 * 
 * This component ensures that no authenticated content is rendered
 * when the user is not authenticated or session has expired.
 * It provides a seamless loading experience while checking auth status.
 */
const AuthGuard = ({ children, auth, url }) => {
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const hasInitialized = useRef(false);

    // List of routes that don't require authentication
    const publicRoutes = [
        '/login',
        '/register', 
        '/forgot-password',
        '/reset-password',
        '/verify-email'
    ];

    // Check if current route is public
    const isPublicRoute = publicRoutes.some(route => 
        url === route || url.startsWith(route + '/')
    );

    useEffect(() => {
        // If it's a public route, allow access immediately
        if (isPublicRoute) {
            setIsAuthenticated(true);
            setIsCheckingAuth(false);
            hasInitialized.current = true;
            return;
        }

        // For protected routes, trust the server-provided auth data
        // No async verification needed - server already verified via middleware
        if (auth?.isAuthenticated && auth?.user?.id) {
            setIsAuthenticated(true);
            setIsCheckingAuth(false);
            hasInitialized.current = true;
            return;
        }

        // If no auth data from server on protected route, redirect immediately
        if (!auth?.user) {
            router.visit('/login', {
                method: 'get',
                preserveState: false,
                preserveScroll: false,
                replace: true
            });
            return;
        }

        setIsCheckingAuth(false);
    }, [auth?.user?.id, auth?.isAuthenticated, url, isPublicRoute]);

    // Simplified: No loading screen needed since server already verified auth
    // Just render immediately or redirect - no async verification delays

    // If authenticated or public route, render children
    if (isAuthenticated || isPublicRoute) {
        return children;
    }

    // Fallback loading state (should rarely be seen)
    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-900">
            <Spinner size="lg" color="primary" />
        </div>
    );
};

export default AuthGuard;
