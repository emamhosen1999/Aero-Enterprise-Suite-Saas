import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Chip, Progress } from "@heroui/react";
import { 
    ServerStackIcon, 
    CircleStackIcon, 
    CpuChipIcon, 
    SignalIcon 
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const SystemHealth = ({ auth, systemMetrics }) => {
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

    const healthStats = [
        {
            title: "Server Status",
            value: "Online",
            icon: <ServerStackIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "All systems operational",
        },
        {
            title: "Database",
            value: "Healthy",
            icon: <CircleStackIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "Connections stable",
        },
        {
            title: "CPU Usage",
            value: "45%",
            icon: <CpuChipIcon className="w-6 h-6" />,
            color: "text-orange-400",
            iconBg: "bg-orange-500/20",
            description: "Normal load",
        },
        {
            title: "Response Time",
            value: "125ms",
            icon: <SignalIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "Avg response time",
        },
    ];

    return (
        <>
            <Head title="System Health" />
            <PageHeader
                title="System Health"
                subtitle="Monitor system resources, performance, and service status"
                icon={<ServerStackIcon className="w-8 h-8" />}
            />
            
            <div className="space-y-6">
                <StatsCards stats={healthStats} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card 
                        className="transition-all duration-200"
                        style={getCardStyle()}
                    >
                        <CardHeader style={getCardHeaderStyle()}>
                            <h3 className="text-lg font-semibold">System Resources</h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm">CPU Usage</span>
                                        <span className="text-sm text-default-500">45%</span>
                                    </div>
                                    <Progress value={45} color="primary" size="sm" />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm">Memory Usage</span>
                                        <span className="text-sm text-default-500">62%</span>
                                    </div>
                                    <Progress value={62} color="warning" size="sm" />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm">Disk Usage</span>
                                        <span className="text-sm text-default-500">38%</span>
                                    </div>
                                    <Progress value={38} color="success" size="sm" />
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card 
                        className="transition-all duration-200"
                        style={getCardStyle()}
                    >
                        <CardHeader style={getCardHeaderStyle()}>
                            <h3 className="text-lg font-semibold">Service Status</h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {['Web Server', 'Database', 'Queue Worker', 'Cache Server', 'Email Service'].map((service) => (
                                    <div key={service} className="flex items-center justify-between">
                                        <span className="text-sm">{service}</span>
                                        <Chip size="sm" color="success" variant="flat">Running</Chip>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <Card 
                    className="transition-all duration-200"
                    style={getCardStyle()}
                >
                    <CardHeader style={getCardHeaderStyle()}>
                        <h3 className="text-lg font-semibold">Health Monitoring</h3>
                    </CardHeader>
                    <CardBody>
                        <p className="text-default-600">
                            Real-time system health monitoring with automated alerts and service restart capabilities.
                        </p>
                        <p className="mt-4 text-sm text-default-500">
                            Advanced monitoring features and automated remediation coming soon.
                        </p>
                    </CardBody>
                </Card>
            </div>
        </>
    );
};

SystemHealth.layout = (page) => <App>{page}</App>;

export default SystemHealth;
