import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Card, CardBody } from '@heroui/react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const RfiSummary = ({ title = 'RFI Summary' }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, hasAccess, isSuperAdmin } = useHRMAC();
    
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

    const canViewSummary = hasAccess('project.rfi') || hasAccess('rfi') || isSuperAdmin();

    return (
        <>
            <Head title={title} />

            <StandardPageLayout
                title="RFI Summary"
                subtitle="Summary overview"
                icon={<DocumentTextIcon />}
                ariaLabel="RFI Summary"
            >
                <Card className="aero-card">
                    <CardBody>
                        {!canViewSummary ? (
                            <div className="text-default-500">
                                You do not have permission to view this summary.
                            </div>
                        ) : (
                            <div className="text-default-500">
                                No summary data available.
                            </div>
                        )}
                    </CardBody>
                </Card>
            </StandardPageLayout>
        </>
    );
};

RfiSummary.layout = (page) => <App children={page} />;
export default RfiSummary;
