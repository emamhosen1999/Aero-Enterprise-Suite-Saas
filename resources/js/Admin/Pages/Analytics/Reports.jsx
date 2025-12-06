import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardBody, CardHeader } from "@heroui/react";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";

const Reports = ({ auth }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const getCardStyle = () => ({
        border: `var(--borderWidth, 2px) solid transparent`,
        borderRadius: `var(--borderRadius, 12px)`,
        fontFamily: `var(--fontFamily, "Inter")`,
        transform: `scale(var(--scale, 1))`,
        background: `linear-gradient(135deg, 
            var(--theme-content1, #FAFAFA) 20%, 
            var(--theme-content2, #F4F4F5) 10%, 
            var(--theme-content3, #F1F3F4) 20%)`,
    });

    const getCardHeaderStyle = () => ({
        borderBottom: `1px solid var(--theme-divider, #E4E4E7)`,
    });

    return (
        <>
            <Head title="Platform Reports" />
            <PageHeader
                title="Platform Reports"
                subtitle="Custom reports and scheduled reporting for platform admins"
                icon={<DocumentTextIcon className="w-8 h-8" />}
            />
            
            <div className="space-y-6">
                <Card 
                    className="transition-all duration-200"
                    style={getCardStyle()}
                >
                    <CardHeader style={getCardHeaderStyle()}>
                        <h3 className="text-lg font-semibold">Platform Reports</h3>
                    </CardHeader>
                    <CardBody>
                        <p className="text-default-600">
                            This module provides custom report building, scheduled reports, and an export center 
                            for platform-wide analytics and insights.
                        </p>
                        <p className="mt-4 text-sm text-default-500">
                            Report builder, scheduled reports, and export functionality coming soon.
                        </p>
                    </CardBody>
                </Card>
            </div>
        </>
    );
};

Reports.layout = (page) => <App>{page}</App>;

export default Reports;
