import { Head, usePage } from '@inertiajs/react';
import React from 'react';
import { motion } from 'framer-motion';
import { 
    Card, 
    CardBody, 
    CardHeader,
    Divider,
    Button
} from '@heroui/react';
import {
    UsersIcon,
    ShieldCheckIcon,
    CogIcon,
    HomeIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import App from "@/Layouts/App.jsx";

/**
 * Core Dashboard - Standalone Dashboard for aero-core
 * 
 * This dashboard provides an overview of the core system:
 * - User statistics
 * - Role statistics  
 * - Quick actions
 * - System status
 * 
 * Module-specific dashboards (HRM, CRM, etc.) should be 
 * in their respective module packages.
 */
export default function CoreDashboard({ auth }) {
    const { props } = usePage();
    const stats = props.stats || {};
    
    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.4,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.3 }
        }
    };

    const statCards = [
        {
            title: 'Total Users',
            value: stats.totalUsers || 0,
            icon: UsersIcon,
            color: 'primary',
            href: '/users'
        },
        {
            title: 'Active Users',
            value: stats.activeUsers || 0,
            icon: UsersIcon,
            color: 'success',
            href: '/users?status=active'
        },
        {
            title: 'Roles',
            value: stats.totalRoles || 0,
            icon: ShieldCheckIcon,
            color: 'secondary',
            href: '/roles'
        },
        {
            title: 'Permissions',
            value: stats.totalPermissions || 0,
            icon: CogIcon,
            color: 'warning',
            href: '/roles'
        }
    ];

    const quickActions = [
        { title: 'Manage Users', href: '/users', icon: UsersIcon },
        { title: 'Manage Roles', href: '/roles', icon: ShieldCheckIcon },
        { title: 'Settings', href: '/settings', icon: CogIcon },
    ];

    return (
        <App>
            <Head title="Dashboard" />
            
            <motion.div
                className="p-6 space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Welcome Header */}
                <motion.div variants={itemVariants}>
                    <Card 
                        className="bg-gradient-to-r from-primary-500 to-primary-600"
                        style={{
                            borderRadius: 'var(--borderRadius, 12px)',
                        }}
                    >
                        <CardBody className="py-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-full">
                                    <HomeIcon className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        Welcome back, {auth?.user?.name || 'User'}!
                                    </h1>
                                    <p className="text-white/80">
                                        Here's an overview of your system
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>

                {/* Stats Cards */}
                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                    variants={itemVariants}
                >
                    {statCards.map((stat, index) => (
                        <Card 
                            key={index}
                            className="transition-all duration-200 hover:shadow-lg"
                            style={{
                                border: 'var(--borderWidth, 2px) solid transparent',
                                borderRadius: 'var(--borderRadius, 12px)',
                                background: `linear-gradient(135deg, 
                                    var(--theme-content1, #FAFAFA) 20%, 
                                    var(--theme-content2, #F4F4F5) 10%, 
                                    var(--theme-content3, #F1F3F4) 20%)`,
                            }}
                        >
                            <CardBody className="flex flex-row items-center gap-4">
                                <div className={`p-3 rounded-lg bg-${stat.color}/10`}>
                                    <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-default-500">{stat.title}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </motion.div>

                {/* Quick Actions */}
                <motion.div variants={itemVariants}>
                    <Card
                        style={{
                            border: 'var(--borderWidth, 2px) solid transparent',
                            borderRadius: 'var(--borderRadius, 12px)',
                            background: `linear-gradient(135deg, 
                                var(--theme-content1, #FAFAFA) 20%, 
                                var(--theme-content2, #F4F4F5) 10%, 
                                var(--theme-content3, #F1F3F4) 20%)`,
                        }}
                    >
                        <CardHeader
                            style={{
                                borderBottom: '1px solid var(--theme-divider, #E4E4E7)',
                            }}
                        >
                            <h2 className="text-lg font-semibold">Quick Actions</h2>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {quickActions.map((action, index) => (
                                    <Button
                                        key={index}
                                        as="a"
                                        href={action.href}
                                        variant="flat"
                                        className="h-auto py-4 justify-start"
                                        startContent={<action.icon className="w-5 h-5" />}
                                        endContent={<ArrowRightIcon className="w-4 h-4 ml-auto" />}
                                    >
                                        {action.title}
                                    </Button>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>

                {/* System Info */}
                <motion.div variants={itemVariants}>
                    <Card
                        style={{
                            border: 'var(--borderWidth, 2px) solid transparent',
                            borderRadius: 'var(--borderRadius, 12px)',
                            background: `linear-gradient(135deg, 
                                var(--theme-content1, #FAFAFA) 20%, 
                                var(--theme-content2, #F4F4F5) 10%, 
                                var(--theme-content3, #F1F3F4) 20%)`,
                        }}
                    >
                        <CardHeader
                            style={{
                                borderBottom: '1px solid var(--theme-divider, #E4E4E7)',
                            }}
                        >
                            <h2 className="text-lg font-semibold">System Information</h2>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-default-500">Package</p>
                                    <p className="font-medium">aero/core</p>
                                </div>
                                <div>
                                    <p className="text-default-500">Status</p>
                                    <p className="font-medium text-success">Active</p>
                                </div>
                                <div>
                                    <p className="text-default-500">Environment</p>
                                    <p className="font-medium">{props.app?.env || 'production'}</p>
                                </div>
                                <div>
                                    <p className="text-default-500">Version</p>
                                    <p className="font-medium">1.0.0</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            </motion.div>
        </App>
    );
}
