import { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Progress,
} from "@heroui/react";
import {
    UsersIcon,
    TrophyIcon,
    CurrencyDollarIcon,
    PhoneIcon,
    UserPlusIcon,
    EnvelopeIcon,
    CalendarIcon,
    ChartBarIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const CRMDashboard = ({ stats = {}, recentLeads = [], deals = [], activities = [], auth, permissions = [] }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('month');

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
            setIsLargeScreen(window.innerWidth >= 1280);
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

    const hasPermission = (permission) => {
        return permissions?.includes(permission) || auth?.user?.isPlatformSuperAdmin;
    };

    const dashboardStats = useMemo(() => [
        {
            title: "Total Leads",
            value: stats?.totalLeads || 0,
            icon: <UserPlusIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "Active leads"
        },
        {
            title: "Active Deals",
            value: stats?.activeDeals || 0,
            icon: <TrophyIcon className="w-6 h-6" />,
            color: "text-yellow-400",
            iconBg: "bg-yellow-500/20",
            description: "In pipeline"
        },
        {
            title: "Conversion Rate",
            value: `${stats?.conversionRate || 0}%`,
            icon: <ChartBarIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "Lead to customer"
        },
        {
            title: "Revenue Pipeline",
            value: `$${(stats?.revenuePipeline || 0).toLocaleString()}`,
            icon: <CurrencyDollarIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "Potential revenue"
        },
    ], [stats]);

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

    const getStageColor = (stage) => {
        const colors = {
            'new': 'primary',
            'contacted': 'warning',
            'qualified': 'success',
            'proposal': 'secondary',
            'negotiation': 'warning',
            'won': 'success',
            'lost': 'danger',
        };
        return colors[stage?.toLowerCase()] || 'default';
    };

    const getLeadStatusColor = (status) => {
        const colors = {
            'new': 'primary',
            'contacted': 'warning',
            'qualified': 'success',
            'unqualified': 'danger',
        };
        return colors[status?.toLowerCase()] || 'default';
    };

    const sampleRecentLeads = recentLeads?.length > 0 ? recentLeads : [
        { id: 1, name: 'Acme Corporation', contact: 'John Smith', email: 'john@acme.com', status: 'new', source: 'Website', value: 50000, createdAt: '2 hours ago' },
        { id: 2, name: 'Tech Solutions Inc', contact: 'Sarah Johnson', email: 'sarah@techsol.com', status: 'contacted', source: 'Referral', value: 75000, createdAt: '5 hours ago' },
        { id: 3, name: 'Global Enterprises', contact: 'Mike Davis', email: 'mike@global.com', status: 'qualified', source: 'Cold Call', value: 120000, createdAt: '1 day ago' },
    ];

    const sampleDeals = deals?.length > 0 ? deals : [
        { id: 1, name: 'Enterprise Software Deal', company: 'Acme Corp', stage: 'proposal', value: 150000, probability: 60, closingDate: '2024-01-15' },
        { id: 2, name: 'Cloud Migration Project', company: 'Tech Solutions', stage: 'negotiation', value: 95000, probability: 75, closingDate: '2024-01-20' },
        { id: 3, name: 'Consulting Services', company: 'Global Ent', stage: 'qualified', value: 45000, probability: 40, closingDate: '2024-02-01' },
    ];

    const sampleActivities = activities?.length > 0 ? activities : [
        { id: 1, type: 'call', description: 'Follow-up call with Acme Corp', contact: 'John Smith', time: '10 mins ago', status: 'completed' },
        { id: 2, type: 'email', description: 'Sent proposal to Tech Solutions', contact: 'Sarah Johnson', time: '1 hour ago', status: 'completed' },
        { id: 3, type: 'meeting', description: 'Demo scheduled with Global Ent', contact: 'Mike Davis', time: 'Today 2:00 PM', status: 'scheduled' },
    ];

    return (
        <App>
            <Head title="CRM Dashboard" />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground dark:text-white">
                            CRM Dashboard
                        </h1>
                        <p className="text-sm text-default-500 dark:text-gray-400 mt-1">
                            Customer relationship management overview
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant={selectedPeriod === 'month' ? 'solid' : 'flat'}
                            color={selectedPeriod === 'month' ? 'primary' : 'default'}
                            radius={getThemeRadius()}
                            onPress={() => setSelectedPeriod('month')}
                        >
                            Month
                        </Button>
                        <Button
                            size="sm"
                            variant={selectedPeriod === 'year' ? 'solid' : 'flat'}
                            color={selectedPeriod === 'year' ? 'primary' : 'default'}
                            radius={getThemeRadius()}
                            onPress={() => setSelectedPeriod('year')}
                        >
                            Year
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="mb-6">
                    <StatsCards stats={dashboardStats} />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Recent Leads */}
                    <Card className="transition-all duration-200" style={getCardStyle()}>
                        <CardHeader style={getCardHeaderStyle()}>
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <UserPlusIcon className="w-5 h-5 text-primary" />
                                    <h3 className="text-lg font-semibold">Recent Leads</h3>
                                </div>
                                {hasPermission('crm.leads.view') && (
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="primary"
                                        radius={getThemeRadius()}
                                        onPress={() => router.visit(route('crm.leads.index'))}
                                    >
                                        View All
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {sampleRecentLeads.map((lead) => (
                                    <div key={lead.id} className="flex items-start gap-3 p-3 rounded-lg bg-default-50 dark:bg-default-100/10">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <h4 className="font-semibold text-sm truncate">{lead.name}</h4>
                                                <Chip size="sm" color={getLeadStatusColor(lead.status)} variant="flat">
                                                    {lead.status}
                                                </Chip>
                                            </div>
                                            <p className="text-xs text-default-500 truncate">{lead.contact} • {lead.email}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-default-400">{lead.source}</span>
                                                <span className="text-xs font-medium text-success">${lead.value.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Pipeline Deals */}
                    <Card className="transition-all duration-200" style={getCardStyle()}>
                        <CardHeader style={getCardHeaderStyle()}>
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <TrophyIcon className="w-5 h-5 text-warning" />
                                    <h3 className="text-lg font-semibold">Active Deals</h3>
                                </div>
                                {hasPermission('crm.deals.view') && (
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="primary"
                                        radius={getThemeRadius()}
                                        onPress={() => router.visit(route('crm.deals.index'))}
                                    >
                                        View Pipeline
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {sampleDeals.map((deal) => (
                                    <div key={deal.id} className="p-3 rounded-lg bg-default-50 dark:bg-default-100/10">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-sm truncate">{deal.name}</h4>
                                                <p className="text-xs text-default-500">{deal.company}</p>
                                            </div>
                                            <Chip size="sm" color={getStageColor(deal.stage)} variant="flat">
                                                {deal.stage}
                                            </Chip>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-default-500">Value</span>
                                                <span className="font-medium">${deal.value.toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-default-500">Probability</span>
                                                    <span className="font-medium">{deal.probability}%</span>
                                                </div>
                                                <Progress 
                                                    value={deal.probability} 
                                                    size="sm"
                                                    color={deal.probability >= 70 ? 'success' : deal.probability >= 50 ? 'warning' : 'primary'}
                                                    className="max-w-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Recent Activities */}
                <Card className="transition-all duration-200" style={getCardStyle()}>
                    <CardHeader style={getCardHeaderStyle()}>
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-secondary" />
                                <h3 className="text-lg font-semibold">Recent Activities</h3>
                            </div>
                            {hasPermission('crm.activities.view') && (
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    radius={getThemeRadius()}
                                    onPress={() => router.visit(route('crm.activities.index'))}
                                >
                                    View All
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {sampleActivities.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-default-50 dark:bg-default-100/10">
                                    <div className={`p-2 rounded-lg ${
                                        activity.type === 'call' ? 'bg-blue-500/20' :
                                        activity.type === 'email' ? 'bg-purple-500/20' :
                                        'bg-green-500/20'
                                    }`}>
                                        {activity.type === 'call' ? (
                                            <PhoneIcon className="w-4 h-4 text-blue-500" />
                                        ) : activity.type === 'email' ? (
                                            <EnvelopeIcon className="w-4 h-4 text-purple-500" />
                                        ) : (
                                            <CalendarIcon className="w-4 h-4 text-green-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{activity.description}</p>
                                        <p className="text-xs text-default-500">{activity.contact}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-xs text-default-400">{activity.time}</span>
                                            <Chip 
                                                size="sm" 
                                                color={activity.status === 'completed' ? 'success' : 'warning'} 
                                                variant="flat"
                                            >
                                                {activity.status}
                                            </Chip>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </motion.div>
        </App>
    );
};

export default CRMDashboard;
