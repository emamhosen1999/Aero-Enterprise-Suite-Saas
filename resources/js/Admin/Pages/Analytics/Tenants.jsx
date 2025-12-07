import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardBody, CardHeader } from "@heroui/react";
import { BuildingOfficeIcon } from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const Tenants = ({ auth }) => {
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

    const tenantStats = [
        {
            title: "Total Tenants",
            value: "245",
            icon: <BuildingOfficeIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "All registered",
        },
        {
            title: "Active Tenants",
            value: "218",
            icon: <BuildingOfficeIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "Currently active",
        },
        {
            title: "Growth Rate",
            value: "+12%",
            icon: <BuildingOfficeIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "Month over month",
        },
        {
            title: "Avg Users/Tenant",
            value: "24",
            icon: <BuildingOfficeIcon className="w-6 h-6" />,
            color: "text-orange-400",
            iconBg: "bg-orange-500/20",
            description: "Platform average",
        },
    ];

    return (
        <>
            <Head title="Tenant Analytics" />
            <PageHeader
                title="Tenant Analytics"
                subtitle="Comprehensive analytics for all tenants on the platform"
                icon={<BuildingOfficeIcon className="w-8 h-8" />}
            />
            
            <div className="space-y-6">
                <StatsCards stats={tenantStats} />

                <Card 
                    className="transition-all duration-200"
                    style={getCardStyle()}
                >
                    <CardHeader style={getCardHeaderStyle()}>
                        <h3 className="text-lg font-semibold">Tenant Analytics</h3>
                    </CardHeader>
                    <CardBody>
                        <p className="text-default-600">
                            Detailed analytics on tenant growth, usage patterns, engagement metrics, 
                            and platform adoption across all tenants.
                        </p>
                        <p className="mt-4 text-sm text-default-500">
                            Advanced tenant analytics and insights coming soon.
                        </p>
                    </CardBody>
                </Card>
            </div>
        </>
    );
};

Tenants.layout = (page) => <App>{page}</App>;

export default Tenants;
