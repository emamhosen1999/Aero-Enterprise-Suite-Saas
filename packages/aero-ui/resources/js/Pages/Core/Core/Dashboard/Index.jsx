import { Head } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button } from '@heroui/react';
import { UsersIcon, ShieldCheckIcon, CogIcon, HomeIcon, ArrowRightIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const CoreDashboard = ({ auth, stats }) => {
    const [themeRadius, setThemeRadius] = useState('lg');
    const statsCards = [
        { title: 'Total Users', value: stats?.totalUsers || 0, icon: <UsersIcon className="w-5 h-5" />, color: 'text-blue-400', iconBg: 'bg-blue-500/20', description: 'All users' },
        { title: 'Active Users', value: stats?.activeUsers || 0, icon: <CheckCircleIcon className="w-5 h-5" />, color: 'text-green-400', iconBg: 'bg-green-500/20', description: 'Currently active' },
        { title: 'Inactive Users', value: stats?.inactiveUsers || 0, icon: <XCircleIcon className="w-5 h-5" />, color: 'text-red-400', iconBg: 'bg-red-500/20', description: 'Inactive accounts' },
        { title: 'Total Roles', value: stats?.totalRoles || 0, icon: <ShieldCheckIcon className="w-5 h-5" />, color: 'text-purple-400', iconBg: 'bg-purple-500/20', description: 'Role diversity' },
        { title: 'New This Month', value: stats?.usersThisMonth || 0, icon: <ClockIcon className="w-5 h-5" />, color: 'text-cyan-400', iconBg: 'bg-cyan-500/20', description: 'Recent signups' }
    ];
    const quickActions = [
        { title: 'Manage Users', href: route('core.users.index'), icon: UsersIcon },
        { title: 'Manage Roles', href: route('core.roles.index'), icon: ShieldCheckIcon },
        { title: 'Settings', href: route('core.settings.system.index'), icon: CogIcon },
    ];
    return (<><Head title="Dashboard" /><div className="flex flex-col w-full h-full p-4"><div className="space-y-4"><Card><CardHeader className="border-b p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-primary/10 border-2 border-primary/20"><HomeIcon className="w-6 h-6 text-primary" /></div><div><h4 className="text-xl font-bold">Welcome back, {auth?.user?.name || 'User'}!</h4><p className="text-sm text-default-500">Here's an overview of your system</p></div></div></CardHeader><CardBody className="p-6"><StatsCards stats={statsCards} className="mb-6" /><Card className="border"><CardHeader className="border-b p-4"><h2 className="text-lg font-semibold">Quick Actions</h2></CardHeader><CardBody className="p-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-3">{quickActions.map((action, idx) => { const IconComponent = action.icon; return (<Button key={idx} variant="flat" className="h-auto py-4 justify-start" startContent={<IconComponent className="w-5 h-5" />} endContent={<ArrowRightIcon className="w-4 h-4 ml-auto" />} onPress={() => router.visit(action.href)} radius={themeRadius}>{action.title}</Button>); })}</div></CardBody></Card></CardBody></Card></div></div></>);
};
CoreDashboard.layout = (page) => <App>{page}</App>;
export default CoreDashboard;
