import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Button, Chip } from "@heroui/react";
import { CircleStackIcon, TrashIcon } from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const Cache = ({ auth }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const getThemeRadius = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'full';
    };

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

    const cacheStats = [
        {
            title: "Cache Size",
            value: "142 MB",
            icon: <CircleStackIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "Total cache size",
        },
        {
            title: "Hit Rate",
            value: "94.5%",
            icon: <CircleStackIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "Cache effectiveness",
        },
        {
            title: "Entries",
            value: "2,458",
            icon: <CircleStackIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "Cached items",
        },
        {
            title: "Memory Usage",
            value: "68%",
            icon: <CircleStackIcon className="w-6 h-6" />,
            color: "text-orange-400",
            iconBg: "bg-orange-500/20",
            description: "Of allocated",
        },
    ];

    return (
        <>
            <Head title="Cache Management" />
            <PageHeader
                title="Cache Management"
                subtitle="Monitor and manage application cache"
                icon={<CircleStackIcon className="w-8 h-8" />}
            />
            
            <div className="space-y-6">
                <StatsCards stats={cacheStats} />

                <Card 
                    className="transition-all duration-200"
                    style={getCardStyle()}
                >
                    <CardHeader style={getCardHeaderStyle()}>
                        <div className="flex justify-between items-center w-full">
                            <h3 className="text-lg font-semibold">Cache Stores</h3>
                            <Button 
                                size="sm" 
                                color="danger" 
                                variant="flat"
                                startContent={<TrashIcon className="w-4 h-4" />}
                                radius={getThemeRadius()}
                            >
                                Clear All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {[
                                { name: 'Application Cache', size: '45 MB', status: 'active' },
                                { name: 'Route Cache', size: '2.3 MB', status: 'active' },
                                { name: 'Config Cache', size: '512 KB', status: 'active' },
                                { name: 'View Cache', size: '18 MB', status: 'active' },
                            ].map((store) => (
                                <div key={store.name} className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{store.name}</p>
                                        <p className="text-xs text-default-500">{store.size}</p>
                                    </div>
                                    <Chip size="sm" color="success" variant="flat">{store.status}</Chip>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                <Card 
                    className="transition-all duration-200"
                    style={getCardStyle()}
                >
                    <CardHeader style={getCardHeaderStyle()}>
                        <h3 className="text-lg font-semibold">Cache Management</h3>
                    </CardHeader>
                    <CardBody>
                        <p className="text-default-600">
                            Monitor cache performance, clear specific cache stores, and optimize cache configuration.
                        </p>
                        <p className="mt-4 text-sm text-default-500">
                            Advanced cache analytics and management tools coming soon.
                        </p>
                    </CardBody>
                </Card>
            </div>
        </>
    );
};

Cache.layout = (page) => <App>{page}</App>;

export default Cache;
