import { Head } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import { 
    Card, 
    CardBody, 
    CardHeader, 
    Button, 
    Progress, 
    Chip, 
    Divider,
    Avatar,
    Tooltip,
    Skeleton
} from '@heroui/react';
import { 
    UsersIcon, 
    ShieldCheckIcon, 
    CogIcon, 
    HomeIcon, 
    ArrowRightIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon,
    ChartBarIcon,
    BellAlertIcon,
    CubeIcon,
    ServerIcon,
    ExclamationTriangleIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    FolderIcon,
    ShoppingCartIcon,
    TruckIcon,
    InformationCircleIcon,
    LockClosedIcon,
    CircleStackIcon,
    SignalIcon,
    KeyIcon,
    DevicePhoneMobileIcon,
    UserCircleIcon,
    CalendarDaysIcon,
    PencilSquareIcon,
    DocumentTextIcon,
    EnvelopeIcon,
    UserPlusIcon,
    ShieldExclamationIcon,
    MegaphoneIcon
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import App from "@/Layouts/App.jsx";

// Icon mapping for dynamic icon rendering
const iconMap = {
    HomeIcon, UsersIcon, ShieldCheckIcon, CogIcon, UserGroupIcon, 
    CurrencyDollarIcon, FolderIcon, CubeIcon, ShoppingCartIcon, TruckIcon,
    EnvelopeIcon, UserPlusIcon, ShieldExclamationIcon, KeyIcon, UserCircleIcon
};

// Simple mini chart component
const MiniBarChart = ({ data, color = '#3b82f6' }) => {
    const maxValue = Math.max(...data.map(d => d.activity), 1);
    return (
        <div className="flex items-end gap-1 h-16">
            {data.map((item, idx) => (
                <Tooltip key={idx} content={`${item.date}: ${item.activity} activities`}>
                    <div className="flex-1 flex flex-col items-center gap-1">
                        <div 
                            className="w-full rounded-t transition-all hover:opacity-80"
                            style={{ 
                                height: `${(item.activity / maxValue) * 100}%`,
                                minHeight: '4px',
                                backgroundColor: color 
                            }}
                        />
                        <span className="text-[10px] text-default-400">{item.day}</span>
                    </div>
                </Tooltip>
            ))}
        </div>
    );
};

// Role distribution bar
const RoleDistributionBar = ({ roles }) => {
    const total = roles.reduce((sum, r) => sum + r.count, 0);
    if (total === 0) return <div className="text-default-400 text-sm">No users assigned</div>;
    
    return (
        <div className="space-y-3">
            <div className="flex h-3 rounded-full overflow-hidden bg-default-100">
                {roles.map((role, idx) => (
                    <Tooltip key={idx} content={`${role.name}: ${role.count} users`}>
                        <div 
                            className="h-full transition-all hover:opacity-80"
                            style={{ 
                                width: `${(role.count / total) * 100}%`,
                                backgroundColor: role.color 
                            }}
                        />
                    </Tooltip>
                ))}
            </div>
            <div className="flex flex-wrap gap-2">
                {roles.slice(0, 5).map((role, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }} />
                        <span className="text-default-600">{role.name}</span>
                        <span className="text-default-400">({role.count})</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CoreDashboard = ({ 
    auth, 
    welcomeData,
    stats, 
    recentActivity,
    pendingActions,
    usersByRole,
    activeModules,
    securityOverview,
    systemHealth,
    announcements,
    activityChart
}) => {
    const [themeRadius, setThemeRadius] = useState('lg');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Get dynamic icon component
    const getIcon = (iconName) => {
        const IconComponent = iconMap[iconName];
        return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
    };

    // Main stat cards configuration
    const mainStats = [
        { 
            title: 'Total Users', 
            value: stats?.totalUsers || 0, 
            icon: <UsersIcon className="w-5 h-5" />, 
            color: 'primary',
            bgColor: 'bg-primary/10',
            textColor: 'text-primary',
            trend: stats?.userGrowth || 0,
            subtitle: 'All registered users'
        },
        { 
            title: 'Active Users', 
            value: stats?.activeUsers || 0, 
            icon: <CheckCircleIcon className="w-5 h-5" />, 
            color: 'success',
            bgColor: 'bg-success/10',
            textColor: 'text-success',
            percentage: stats?.activePercentage || 0,
            subtitle: `${stats?.activePercentage || 0}% of total`
        },
        { 
            title: 'Active Sessions', 
            value: stats?.activeSessions || 0, 
            icon: <SignalIcon className="w-5 h-5" />, 
            color: 'secondary',
            bgColor: 'bg-secondary/10',
            textColor: 'text-secondary',
            subtitle: 'Currently online'
        },
        { 
            title: 'Storage Used', 
            value: stats?.storageUsedFormatted || '0 B', 
            icon: <CircleStackIcon className="w-5 h-5" />, 
            color: 'warning',
            bgColor: 'bg-warning/10',
            textColor: 'text-warning',
            percentage: stats?.storagePercentage || 0,
            subtitle: `of ${stats?.storageLimitFormatted || '10 GB'}`
        }
    ];

    // Quick actions configuration
    const quickActions = [
        { title: 'Manage Users', href: route('core.users.index'), icon: UsersIcon, color: 'primary' },
        { title: 'Roles & Permissions', href: route('core.roles.index'), icon: ShieldCheckIcon, color: 'secondary' },
        { title: 'View Audit Logs', href: route('core.audit-logs.index'), icon: DocumentTextIcon, color: 'success' },
        { title: 'System Settings', href: route('core.settings.system.index'), icon: CogIcon, color: 'warning' },
    ];

    // Get priority color for pending actions
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'danger': return 'danger';
            case 'warning': return 'warning';
            default: return 'primary';
        }
    };

    // Get action icon based on type
    const getActionIcon = (action) => {
        switch (action.type) {
            case 'invitation': return <EnvelopeIcon className="w-5 h-5" />;
            case 'approval': return <UserPlusIcon className="w-5 h-5" />;
            case 'security': return <ShieldExclamationIcon className="w-5 h-5" />;
            case 'password': return <KeyIcon className="w-5 h-5" />;
            default: return <BellAlertIcon className="w-5 h-5" />;
        }
    };

    // Get module icon
    const getModuleIcon = (iconName) => {
        const icons = {
            HomeIcon: <HomeIcon className="w-5 h-5" />,
            UserGroupIcon: <UserGroupIcon className="w-5 h-5" />,
            CurrencyDollarIcon: <CurrencyDollarIcon className="w-5 h-5" />,
            UserCircleIcon: <UserCircleIcon className="w-5 h-5" />,
            FolderIcon: <FolderIcon className="w-5 h-5" />,
            CubeIcon: <CubeIcon className="w-5 h-5" />,
            ShoppingCartIcon: <ShoppingCartIcon className="w-5 h-5" />,
            TruckIcon: <TruckIcon className="w-5 h-5" />,
        };
        return icons[iconName] || <CubeIcon className="w-5 h-5" />;
    };

    // Get activity icon based on action
    const getActivityIcon = (action) => {
        switch (action?.toLowerCase()) {
            case 'create': case 'created': return <PencilSquareIcon className="w-4 h-4 text-success" />;
            case 'update': case 'updated': return <DocumentTextIcon className="w-4 h-4 text-primary" />;
            case 'delete': case 'deleted': return <XCircleIcon className="w-4 h-4 text-danger" />;
            case 'login': return <ArrowRightIcon className="w-4 h-4 text-success" />;
            case 'logout': return <ArrowRightIcon className="w-4 h-4 text-default-400 rotate-180" />;
            default: return <ChartBarIcon className="w-4 h-4 text-default-500" />;
        }
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-col w-full min-h-full p-4 md:p-6 space-y-6">
                
                {/* Welcome Header */}
                <Card className="border border-divider">
                    <CardBody className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-primary/10 border-2 border-primary/20">
                                    <HomeIcon className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">
                                        {welcomeData?.greeting || 'Welcome'}, {welcomeData?.userName || auth?.user?.name || 'User'}!
                                    </h1>
                                    <div className="flex items-center gap-3 text-default-500 text-sm mt-1">
                                        <span className="flex items-center gap-1">
                                            <CalendarDaysIcon className="w-4 h-4" />
                                            {welcomeData?.currentDate || new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                        {welcomeData?.lastLogin && (
                                            <span className="flex items-center gap-1">
                                                <ClockIcon className="w-4 h-4" />
                                                Last login: {welcomeData.lastLogin}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    color="primary" 
                                    variant="flat"
                                    startContent={<UsersIcon className="w-4 h-4" />}
                                    onPress={() => router.visit(route('core.users.create'))}
                                    radius={themeRadius}
                                >
                                    Add User
                                </Button>
                                <Button 
                                    color="default" 
                                    variant="flat"
                                    startContent={<CogIcon className="w-4 h-4" />}
                                    onPress={() => router.visit(route('core.settings.system.index'))}
                                    radius={themeRadius}
                                >
                                    Settings
                                </Button>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Announcements Banner */}
                {announcements?.length > 0 && (
                    <Card className="border border-primary/20 bg-primary/5">
                        <CardBody className="p-4">
                            <div className="flex items-start gap-3">
                                <MegaphoneIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-primary">{announcements[0].title}</h4>
                                    <p className="text-sm text-default-600 mt-0.5">{announcements[0].message}</p>
                                </div>
                                <Chip size="sm" variant="flat" color="primary">{announcements[0].date}</Chip>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {mainStats.map((stat, idx) => (
                        <Card key={idx} className="border border-divider">
                            <CardBody className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                                        <span className={stat.textColor}>{stat.icon}</span>
                                    </div>
                                    {stat.trend !== undefined && stat.trend !== 0 && (
                                        <Chip 
                                            size="sm" 
                                            variant="flat" 
                                            color={stat.trend > 0 ? 'success' : 'danger'}
                                            startContent={stat.trend > 0 ? 
                                                <ArrowTrendingUpIcon className="w-3 h-3" /> : 
                                                <ArrowTrendingDownIcon className="w-3 h-3" />
                                            }
                                        >
                                            {Math.abs(stat.trend)}%
                                        </Chip>
                                    )}
                                </div>
                                <div className="mt-3">
                                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                    <p className="text-sm text-default-500 mt-0.5">{stat.title}</p>
                                </div>
                                {stat.percentage !== undefined && (
                                    <div className="mt-3">
                                        <Progress 
                                            value={stat.percentage} 
                                            size="sm" 
                                            color={stat.color}
                                            className="max-w-full"
                                        />
                                        <p className="text-xs text-default-400 mt-1">{stat.subtitle}</p>
                                    </div>
                                )}
                                {stat.subtitle && !stat.percentage && (
                                    <p className="text-xs text-default-400 mt-2">{stat.subtitle}</p>
                                )}
                            </CardBody>
                        </Card>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column - 2/3 width */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Activity Chart */}
                        <Card className="border border-divider">
                            <CardHeader className="border-b border-divider p-4">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <ChartBarIcon className="w-5 h-5 text-primary" />
                                        <h2 className="text-lg font-semibold">Activity Overview</h2>
                                    </div>
                                    <Chip size="sm" variant="flat">Last 7 days</Chip>
                                </div>
                            </CardHeader>
                            <CardBody className="p-4">
                                {activityChart?.length > 0 ? (
                                    <MiniBarChart data={activityChart} color="#3b82f6" />
                                ) : (
                                    <div className="h-20 flex items-center justify-center text-default-400">
                                        No activity data available
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {/* Users by Role */}
                        <Card className="border border-divider">
                            <CardHeader className="border-b border-divider p-4">
                                <div className="flex items-center gap-2">
                                    <UserGroupIcon className="w-5 h-5 text-secondary" />
                                    <h2 className="text-lg font-semibold">Users by Role</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="p-4">
                                {usersByRole?.length > 0 ? (
                                    <RoleDistributionBar roles={usersByRole} />
                                ) : (
                                    <div className="text-default-400 text-sm">No role data available</div>
                                )}
                            </CardBody>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="border border-divider">
                            <CardHeader className="border-b border-divider p-4">
                                <div className="flex items-center gap-2">
                                    <ArrowRightIcon className="w-5 h-5 text-success" />
                                    <h2 className="text-lg font-semibold">Quick Actions</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {quickActions.map((action, idx) => {
                                        const IconComponent = action.icon;
                                        return (
                                            <Button
                                                key={idx}
                                                variant="flat"
                                                color={action.color}
                                                className="h-auto py-4 flex-col gap-2"
                                                onPress={() => router.visit(action.href)}
                                                radius={themeRadius}
                                            >
                                                <IconComponent className="w-6 h-6" />
                                                <span className="text-xs font-medium">{action.title}</span>
                                            </Button>
                                        );
                                    })}
                                </div>
                            </CardBody>
                        </Card>

                        {/* Active Modules */}
                        <Card className="border border-divider">
                            <CardHeader className="border-b border-divider p-4">
                                <div className="flex items-center gap-2">
                                    <CubeIcon className="w-5 h-5 text-warning" />
                                    <h2 className="text-lg font-semibold">Available Modules</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {activeModules?.map((module, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                                                module.enabled 
                                                    ? 'border-success/30 bg-success/5' 
                                                    : 'border-divider bg-default-50 opacity-60'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-lg ${module.enabled ? 'bg-success/10' : 'bg-default-100'}`}>
                                                {getModuleIcon(module.icon)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{module.name}</p>
                                                <Chip 
                                                    size="sm" 
                                                    variant="flat" 
                                                    color={module.enabled ? 'success' : 'default'}
                                                    className="mt-1"
                                                >
                                                    {module.enabled ? 'Active' : 'Inactive'}
                                                </Chip>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Right Column - 1/3 width */}
                    <div className="space-y-6">
                        
                        {/* Pending Actions */}
                        <Card className="border border-divider">
                            <CardHeader className="border-b border-divider p-4">
                                <div className="flex items-center gap-2">
                                    <BellAlertIcon className="w-5 h-5 text-warning" />
                                    <h2 className="text-lg font-semibold">Pending Actions</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="p-4">
                                {pendingActions?.length > 0 ? (
                                    <div className="space-y-3">
                                        {pendingActions.map((action, idx) => (
                                            <div 
                                                key={idx} 
                                                className="flex items-center gap-3 p-3 rounded-lg bg-default-50 hover:bg-default-100 transition-colors cursor-pointer"
                                                onClick={() => action.route && router.visit(route(action.route))}
                                            >
                                                <div className={`p-2 rounded-lg bg-${getPriorityColor(action.priority)}/10`}>
                                                    <span className={`text-${getPriorityColor(action.priority)}`}>
                                                        {getActionIcon(action)}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-lg font-bold">{action.count}</span>
                                                    <p className="text-sm text-default-500">{action.label}</p>
                                                </div>
                                                <ArrowRightIcon className="w-4 h-4 text-default-400" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <CheckCircleIcon className="w-10 h-10 text-success mx-auto mb-2" />
                                        <p className="text-default-500">All caught up!</p>
                                        <p className="text-xs text-default-400">No pending actions</p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {/* Recent Activity */}
                        <Card className="border border-divider">
                            <CardHeader className="border-b border-divider p-4">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="w-5 h-5 text-primary" />
                                        <h2 className="text-lg font-semibold">Recent Activity</h2>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant="light" 
                                        onPress={() => router.visit(route('core.audit-logs.index'))}
                                    >
                                        View All
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardBody className="p-4">
                                {recentActivity?.length > 0 ? (
                                    <div className="space-y-3">
                                        {recentActivity.map((activity, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <div className="p-1.5 rounded-full bg-default-100 mt-0.5">
                                                    {getActivityIcon(activity.action)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {activity.description || `${activity.action} ${activity.modelType}`}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-default-400 mt-0.5">
                                                        <span>{activity.userName}</span>
                                                        <span>•</span>
                                                        <span>{activity.timeAgo}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-default-400">
                                        <ClockIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No recent activity</p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {/* Security Overview */}
                        <Card className="border border-divider">
                            <CardHeader className="border-b border-divider p-4">
                                <div className="flex items-center gap-2">
                                    <ShieldCheckIcon className="w-5 h-5 text-success" />
                                    <h2 className="text-lg font-semibold">Security</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="p-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <LockClosedIcon className="w-4 h-4 text-default-500" />
                                            <span className="text-sm">2FA Enabled</span>
                                        </div>
                                        <Chip size="sm" variant="flat" color="success">
                                            {securityOverview?.twoFactorPercentage || 0}%
                                        </Chip>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <DevicePhoneMobileIcon className="w-4 h-4 text-default-500" />
                                            <span className="text-sm">Active Sessions</span>
                                        </div>
                                        <span className="font-medium">{securityOverview?.activeSessions || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ExclamationTriangleIcon className="w-4 h-4 text-default-500" />
                                            <span className="text-sm">Failed Logins (24h)</span>
                                        </div>
                                        <Chip 
                                            size="sm" 
                                            variant="flat" 
                                            color={securityOverview?.failedLogins24h > 10 ? 'danger' : 'success'}
                                        >
                                            {securityOverview?.failedLogins24h || 0}
                                        </Chip>
                                    </div>
                                    {securityOverview?.lockedAccounts > 0 && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <XCircleIcon className="w-4 h-4 text-danger" />
                                                <span className="text-sm text-danger">Locked Accounts</span>
                                            </div>
                                            <Chip size="sm" variant="flat" color="danger">
                                                {securityOverview.lockedAccounts}
                                            </Chip>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>

                        {/* System Health */}
                        <Card className="border border-divider">
                            <CardHeader className="border-b border-divider p-4">
                                <div className="flex items-center gap-2">
                                    <ServerIcon className="w-5 h-5 text-primary" />
                                    <h2 className="text-lg font-semibold">System Health</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="p-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-default-600">Server Status</span>
                                        <Chip 
                                            size="sm" 
                                            variant="dot" 
                                            color={systemHealth?.serverStatus === 'online' ? 'success' : 'danger'}
                                        >
                                            {systemHealth?.serverStatus || 'Unknown'}
                                        </Chip>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-default-600">Database</span>
                                        <Chip 
                                            size="sm" 
                                            variant="dot" 
                                            color={systemHealth?.databaseStatus === 'healthy' ? 'success' : 'danger'}
                                        >
                                            {systemHealth?.databaseLatency || 0}ms
                                        </Chip>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-default-600">Cache</span>
                                        <Chip 
                                            size="sm" 
                                            variant="dot" 
                                            color={systemHealth?.cacheStatus === 'healthy' ? 'success' : 'warning'}
                                        >
                                            {systemHealth?.cacheStatus || 'Unknown'}
                                        </Chip>
                                    </div>
                                    {systemHealth?.pendingJobs > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-default-600">Pending Jobs</span>
                                            <span className="font-medium">{systemHealth.pendingJobs}</span>
                                        </div>
                                    )}
                                    {systemHealth?.failedJobs > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-danger">Failed Jobs</span>
                                            <Chip size="sm" variant="flat" color="danger">
                                                {systemHealth.failedJobs}
                                            </Chip>
                                        </div>
                                    )}
                                    <Divider className="my-2" />
                                    <div className="text-xs text-default-400 space-y-1">
                                        <p>PHP {systemHealth?.phpVersion}</p>
                                        <p>Laravel {systemHealth?.laravelVersion}</p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

CoreDashboard.layout = (page) => <App>{page}</App>;
export default CoreDashboard;
