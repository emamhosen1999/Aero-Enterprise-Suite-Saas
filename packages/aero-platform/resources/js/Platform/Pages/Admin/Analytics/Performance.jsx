import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Progress } from "@heroui/react";
import { BoltIcon } from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const Performance = ({ auth }) => {
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

    const performanceStats = [
        {
            title: "Avg Response Time",
            value: "125ms",
            icon: <BoltIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "Platform average",
        },
        {
            title: "Uptime",
            value: "99.95%",
            icon: <BoltIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "Last 30 days",
        },
        {
            title: "Error Rate",
            value: "0.12%",
            icon: <BoltIcon className="w-6 h-6" />,
            color: "text-orange-400",
            iconBg: "bg-orange-500/20",
            description: "Of all requests",
        },
        {
            title: "Throughput",
            value: "1.2K/min",
            icon: <BoltIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "Requests per minute",
        },
    ];

    return (
        <>
            <Head title="Performance Metrics" />
            <PageHeader
                title="Performance Metrics"
                subtitle="Platform performance monitoring and optimization insights"
                icon={<BoltIcon className="w-8 h-8" />}
            />
            
            <div className="space-y-6">
                <StatsCards stats={performanceStats} />

                <Card 
                    className="transition-all duration-200"
                    style={getCardStyle()}
                >
                    <CardHeader style={getCardHeaderStyle()}>
                        <h3 className="text-lg font-semibold">Performance Metrics</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm">API Response Time</span>
                                    <span className="text-sm text-default-500">125ms</span>
                                </div>
                                <Progress value={88} color="success" size="sm" />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm">Database Query Time</span>
                                    <span className="text-sm text-default-500">45ms</span>
                                </div>
                                <Progress value={95} color="primary" size="sm" />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm">Cache Hit Rate</span>
                                    <span className="text-sm text-default-500">94.5%</span>
                                </div>
                                <Progress value={94.5} color="success" size="sm" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card 
                    className="transition-all duration-200"
                    style={getCardStyle()}
                >
                    <CardHeader style={getCardHeaderStyle()}>
                        <h3 className="text-lg font-semibold">Performance Analytics</h3>
                    </CardHeader>
                    <CardBody>
                        <p className="text-default-600">
                            Detailed performance monitoring with response time analysis, throughput metrics, 
                            and optimization recommendations.
                        </p>
                        <p className="mt-4 text-sm text-default-500">
                            Advanced performance analytics and APM features coming soon.
                        </p>
                    </CardBody>
                </Card>
            </div>
        </>
    );
};

Performance.layout = (page) => <App>{page}</App>;

export default Performance;
