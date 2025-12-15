import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import App from '@/Layouts/App';
import StatsCards from '@/Components/Common/StatsCards';
import {
    Select,
    SelectItem,
    Card,
    CardBody,
    CardHeader,
    Button
} from "@heroui/react";
import {
    ChartBarIcon,
    UserGroupIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const Analytics = ({ auth, event, analytics }) => {
    const [timeRange, setTimeRange] = React.useState('7');

    const statsData = useMemo(() => [
        {
            title: 'Total Registrations',
            value: analytics.total_registrations || 0,
            icon: <UserGroupIcon />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            description: 'All registrations'
        },
        {
            title: 'Approved',
            value: analytics.approved_count || 0,
            icon: <CheckCircleIcon />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Confirmed attendees'
        },
        {
            title: 'Pending',
            value: analytics.pending_count || 0,
            icon: <ClockIcon />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: 'Awaiting approval'
        },
        {
            title: 'Rejected',
            value: analytics.rejected_count || 0,
            icon: <XCircleIcon />,
            color: 'text-danger',
            iconBg: 'bg-danger/20',
            description: 'Not approved'
        }
    ], [analytics]);

    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

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

    // Colors for charts
    const COLORS = {
        approved: '#17C964',
        pending: '#F5A524',
        rejected: '#F31260',
        male: '#0070F0',
        female: '#F31260',
        other: '#9333EA',
        verified: '#17C964',
        pending_payment: '#F5A524',
        no_proof: '#9CA3AF'
    };

    // Gender distribution data
    const genderData = analytics.gender_distribution ? [
        { name: 'Male', value: analytics.gender_distribution.male || 0, color: COLORS.male },
        { name: 'Female', value: analytics.gender_distribution.female || 0, color: COLORS.female },
        { name: 'Other', value: analytics.gender_distribution.other || 0, color: COLORS.other }
    ].filter(item => item.value > 0) : [];

    // Status distribution data
    const statusData = [
        { name: 'Approved', value: analytics.approved_count || 0, color: COLORS.approved },
        { name: 'Pending', value: analytics.pending_count || 0, color: COLORS.pending },
        { name: 'Rejected', value: analytics.rejected_count || 0, color: COLORS.rejected }
    ].filter(item => item.value > 0);

    // Payment status data
    const paymentData = analytics.payment_stats ? [
        { name: 'Verified', value: analytics.payment_stats.verified || 0, color: COLORS.verified },
        { name: 'Pending', value: analytics.payment_stats.pending || 0, color: COLORS.pending_payment },
        { name: 'No Proof', value: analytics.payment_stats.no_proof || 0, color: COLORS.no_proof }
    ].filter(item => item.value > 0) : [];

    // Sub-events popularity
    const subEventsData = analytics.sub_events_popularity || [];

    // Registration timeline
    const timelineData = analytics.registration_timeline || [];

    // Custom label for pie charts
    const renderCustomLabel = ({ name, value, percent }) => {
        return `${name}: ${value} (${(percent * 100).toFixed(0)}%)`;
    };

    return (
        <>
            <Head title={`Analytics - ${event.title}`} />
            
            <div className="min-h-screen bg-background">
                <div className="max-w-[1600px] mx-auto">
                    <div className="p-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="bg-content1/50 backdrop-blur-md border border-divider/30" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                <CardHeader className="pb-0">
                                    <div className="w-full">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 pb-2">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-xl bg-primary/20">
                                                    <ChartBarIcon className="w-6 h-6 text-primary" />
                                                </div>
                                                <div>
                                                    <h1 className="text-2xl font-bold text-foreground">Event Analytics</h1>
                                                    <p className="text-sm text-default-500 mt-1">{event.title}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="flat"
                                                onPress={() => router.get(route('events.show', event.id))}
                                                startContent={<ArrowLeftIcon className="w-5 h-5" />}
                                                radius={getThemeRadius()}
                                            >
                                                Back to Event
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
            
                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" />

                                    {/* Charts Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Registration Timeline */}
                                        <Card className="lg:col-span-2 bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                            <CardBody>
                                                <div className="flex items-center justify-between mb-6">
                                                    <h2 className="text-xl font-semibold">Registration Timeline</h2>
                                                    <Select
                                                        size="sm"
                                                        className="w-48"
                                                        defaultSelectedKeys={[timeRange]}
                                                        onChange={(e) => setTimeRange(e.target.value)}
                                                        radius={getThemeRadius()}
                                                    >
                                                        <SelectItem key="7" value="7">Last 7 Days</SelectItem>
                                                        <SelectItem key="30" value="30">Last 30 Days</SelectItem>
                                                        <SelectItem key="90" value="90">Last 3 Months</SelectItem>
                                                        <SelectItem key="all" value="all">All Time</SelectItem>
                                                    </Select>
                                                </div>
                    {timelineData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={timelineData}>
                                <defs>
                                    <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0070F0" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0070F0" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#71717A"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis 
                                    stroke="#71717A"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'white', 
                                        border: '1px solid #E4E4E7',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#0070F0" 
                                    strokeWidth={2}
                                    fillOpacity={1} 
                                    fill="url(#colorRegistrations)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                                                ) : (
                                                    <div className="h-[300px] flex items-center justify-center text-default-400">
                                                        No registration data available
                                                    </div>
                                                )}
                                            </CardBody>
                                        </Card>

                                        {/* Status Distribution */}
                                        <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                            <CardBody>
                                                <h2 className="text-xl font-semibold mb-6">Status Distribution</h2>
                    {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomLabel}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                                                ) : (
                                                    <div className="h-[300px] flex items-center justify-center text-default-400">
                                                        No status data available
                                                    </div>
                                                )}
                                            </CardBody>
                                        </Card>

                                        {/* Gender Distribution */}
                                        {genderData.length > 0 && (
                                            <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                <CardBody>
                                                    <h2 className="text-xl font-semibold mb-6">Gender Distribution</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={genderData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomLabel}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {genderData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </CardBody>
                                        </Card>
                                        )}

                                        {/* Payment Status */}
                                        {paymentData.length > 0 && (
                                            <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                <CardBody>
                                                    <h2 className="text-xl font-semibold mb-6">Payment Status</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={paymentData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="#71717A"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis 
                                    stroke="#71717A"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'white', 
                                        border: '1px solid #E4E4E7',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {paymentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </CardBody>
                                        </Card>
                                        )}

                                        {/* Sub-Events Popularity */}
                                        {subEventsData.length > 0 && (
                                            <Card className="lg:col-span-2 bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                <CardBody>
                                                    <h2 className="text-xl font-semibold mb-6">Sub-Events Popularity</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={subEventsData} layout="horizontal">
                                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                                <XAxis 
                                    type="number" 
                                    stroke="#71717A"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis 
                                    dataKey="title" 
                                    type="category" 
                                    width={150}
                                    stroke="#71717A"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'white', 
                                        border: '1px solid #E4E4E7',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar 
                                    dataKey="registrations" 
                                    fill="#0070F0" 
                                    radius={[0, 8, 8, 0]}
                                />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </CardBody>
                                        </Card>
                                        )}
                                    </div>

                                    {/* Additional Stats Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                                        <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                            <CardBody className="p-4">
                                                <p className="text-sm text-default-500 mb-1">Total Capacity</p>
                                                <p className="text-2xl font-bold">{event.max_participants || 'Unlimited'}</p>
                                            </CardBody>
                                        </Card>
                                        
                                        <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                            <CardBody className="p-4">
                                                <p className="text-sm text-default-500 mb-1">Available Slots</p>
                                                <p className="text-2xl font-bold">
                                                    {event.max_participants 
                                                        ? Math.max(0, event.max_participants - analytics.total_registrations)
                                                        : 'Unlimited'
                                                    }
                                                </p>
                                            </CardBody>
                                        </Card>
                                        
                                        <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                            <CardBody className="p-4">
                                                <p className="text-sm text-default-500 mb-1">Approval Rate</p>
                                                <p className="text-2xl font-bold">
                                                    {analytics.total_registrations > 0 
                                                        ? ((analytics.approved_count / analytics.total_registrations) * 100).toFixed(1)
                                                        : 0
                                                    }%
                                                </p>
                                            </CardBody>
                                        </Card>
                                        
                                        <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                            <CardBody className="p-4">
                                                <p className="text-sm text-default-500 mb-1">Sub-Events</p>
                                                <p className="text-2xl font-bold">{event.sub_events_count || 0}</p>
                                            </CardBody>
                                        </Card>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

Analytics.layout = (page) => <App>{page}</App>;

export default Analytics;
