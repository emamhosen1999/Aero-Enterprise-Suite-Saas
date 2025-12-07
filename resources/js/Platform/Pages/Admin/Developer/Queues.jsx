import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { QueueListIcon } from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const Queues = ({ auth }) => {
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

    const queueStats = [
        {
            title: "Pending Jobs",
            value: "12",
            icon: <QueueListIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "In queue",
        },
        {
            title: "Processing",
            value: "3",
            icon: <QueueListIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "Currently running",
        },
        {
            title: "Completed Today",
            value: "245",
            icon: <QueueListIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "Successfully processed",
        },
        {
            title: "Failed",
            value: "2",
            icon: <QueueListIcon className="w-6 h-6" />,
            color: "text-red-400",
            iconBg: "bg-red-500/20",
            description: "Needs attention",
        },
    ];

    return (
        <>
            <Head title="Queue Monitoring" />
            <PageHeader
                title="Queue Monitoring"
                subtitle="Monitor background jobs and queue workers"
                icon={<QueueListIcon className="w-8 h-8" />}
            />
            
            <div className="space-y-6">
                <StatsCards stats={queueStats} />

                <Card 
                    className="transition-all duration-200"
                    style={getCardStyle()}
                >
                    <CardHeader style={getCardHeaderStyle()}>
                        <h3 className="text-lg font-semibold">Queue Workers</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {['default', 'emails', 'exports', 'reports'].map((queue) => (
                                <div key={queue} className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{queue}</span>
                                    <Chip size="sm" color="success" variant="flat">Active</Chip>
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
                        <h3 className="text-lg font-semibold">Queue Management</h3>
                    </CardHeader>
                    <CardBody>
                        <p className="text-default-600">
                            Monitor queue workers, view job details, retry failed jobs, and manage queue performance.
                        </p>
                        <p className="mt-4 text-sm text-default-500">
                            Advanced queue management features coming soon.
                        </p>
                    </CardBody>
                </Card>
            </div>
        </>
    );
};

Queues.layout = (page) => <App>{page}</App>;

export default Queues;
