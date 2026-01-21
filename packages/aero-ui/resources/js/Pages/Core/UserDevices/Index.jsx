import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import App from "@/Layouts/App";
import { Head } from '@inertiajs/react';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

export default function UserDevicesIndex({ auth }) {
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
    // Manual responsive state management (HRMAC pattern)
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);
    
    return (
        <App user={auth?.user}>
            <Head title="User Devices" />
            <div className="p-6">
                <h1 className="text-2xl font-semibold mb-4">User Devices</h1>
                <p>This page is under development.</p>
            </div>
        </App>
    );
}
