import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Card, CardBody } from '@heroui/react';
import App from "@/Layouts/App.jsx";
import ModuleSummaryWidget from "@/Components/Dashboard/ModuleSummaryWidget.jsx";
import { useHRMAC } from '@/Hooks/useHRMAC';

// Static dashboard widgets
import WelcomeWidget from '@/Widgets/Core/WelcomeWidget';
import OnboardingBanner from '@/Components/Dashboard/Admin/OnboardingBanner';
import AnnouncementsBanner from '@/Components/Dashboard/Admin/AnnouncementsBanner';
import AdminStatsCards from '@/Components/Dashboard/Admin/AdminStatsCards';
import UserActivityChart from '@/Components/Dashboard/Admin/UserActivityChart';
import AuditLogTimeline from '@/Components/Dashboard/Admin/AuditLogTimeline';
import SubscriptionCard from '@/Components/Dashboard/Admin/SubscriptionCard';
import QuickActionsPanel from '@/Components/Dashboard/Admin/QuickActionsPanel';
import SecurityOverviewCard from '@/Components/Dashboard/Admin/SecurityOverviewCard';
import StorageAnalyticsCard from '@/Components/Dashboard/Admin/StorageAnalyticsCard';
import SystemHealthCard from '@/Components/Dashboard/Admin/SystemHealthCard';
import RecentNotificationsCard from '@/Components/Dashboard/Admin/RecentNotificationsCard';
import UserSessionsCard from '@/Components/Dashboard/Admin/UserSessionsCard';

// Stagger animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const CoreDashboard = ({
    auth,
    welcomeData,
    coreStats,
    onboardingProgress,
    announcements,
    subscriptionInfo,
    quickActions,
    // Deferred props (loaded after initial render)
    securityOverview,
    storageAnalytics,
    systemHealth,
    recentAuditLog,
    recentNotifications,
    activeSessionsData,
}) => {
    const { tenant } = usePage().props;
    const { isSuperAdmin } = useHRMAC();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const deferredLoading = (prop) => prop === undefined;

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-col w-full h-full p-4 sm:p-6" role="main" aria-label="Dashboard">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6 max-w-[1600px] mx-auto w-full"
                >
                    {/* ── Onboarding (conditional) ── */}
                    {onboardingProgress && !onboardingProgress.completed && (
                        <motion.div variants={itemVariants}>
                            <OnboardingBanner progress={onboardingProgress} />
                        </motion.div>
                    )}

                    {/* ── Announcements (conditional) ── */}
                    <motion.div variants={itemVariants}>
                        <AnnouncementsBanner announcements={announcements || []} />
                    </motion.div>

                    {/* ── Welcome Widget ── */}
                    <motion.div variants={itemVariants}>
                        <WelcomeWidget data={welcomeData || {}} />
                    </motion.div>

                    {/* ── Stats Cards ── */}
                    <motion.div variants={itemVariants}>
                        <AdminStatsCards stats={coreStats} loading={!coreStats} />
                    </motion.div>

                    {/* ── Main Content — 2/3 + 1/3 grid ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                            <UserActivityChart />
                            <AuditLogTimeline
                                logs={recentAuditLog || []}
                                loading={deferredLoading(recentAuditLog)}
                            />
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-6">
                            <SubscriptionCard info={subscriptionInfo} />
                            <QuickActionsPanel actions={quickActions || []} />
                        </motion.div>
                    </div>

                    {/* ── System Info — 3 equal columns ── */}
                    <motion.div variants={itemVariants}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <SecurityOverviewCard
                                security={securityOverview}
                                loading={deferredLoading(securityOverview)}
                            />
                            <StorageAnalyticsCard
                                storage={storageAnalytics}
                                loading={deferredLoading(storageAnalytics)}
                            />
                            <SystemHealthCard
                                health={systemHealth}
                                loading={deferredLoading(systemHealth)}
                            />
                        </div>
                    </motion.div>

                    {/* ── Notifications + Sessions ── */}
                    <motion.div variants={itemVariants}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <RecentNotificationsCard
                                notifications={recentNotifications}
                                loading={deferredLoading(recentNotifications)}
                            />
                            <UserSessionsCard
                                sessions={activeSessionsData}
                                loading={deferredLoading(activeSessionsData)}
                            />
                        </div>
                    </motion.div>

                    {/* ── Module Summary ── */}
                    <motion.div variants={itemVariants}>
                        <h3 className="text-lg font-semibold mb-3">Your Modules</h3>
                        <ModuleSummaryWidget showLocked={true} maxLocked={4} />
                    </motion.div>

                    {/* ── Empty state ── */}
                    {!coreStats && (
                        <motion.div variants={itemVariants}>
                            <Card className="border border-divider border-dashed bg-content2/50">
                                <CardBody className="p-12 text-center">
                                    <SparklesIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-default-600 mb-2">
                                        Welcome to your Dashboard
                                    </h3>
                                    <p className="text-sm text-default-500 max-w-md mx-auto">
                                        Widgets will appear here based on your active modules and permissions.
                                        Enable modules to see relevant dashboard widgets.
                                    </p>
                                </CardBody>
                            </Card>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </>
    );
};

CoreDashboard.layout = (page) => <App>{page}</App>;

export default CoreDashboard;
