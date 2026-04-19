import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader, Skeleton } from "@heroui/react";
import { HomeIcon } from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from '@/Components/StatsCards.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import { useHRMAC } from '@/Hooks/useHRMAC';
import DynamicWidgetRenderer from '@/Components/DynamicWidgets/DynamicWidgetRenderer';

// Dashboard sub-components
import WelcomeBanner from '@/Components/EmployeeDashboard/WelcomeBanner';
import AlertsBar from '@/Components/EmployeeDashboard/AlertsBar';
import QuickActionsGrid from '@/Components/EmployeeDashboard/QuickActionsGrid';
import AttendanceCard from '@/Components/EmployeeDashboard/AttendanceCard';
import LeaveCard from '@/Components/EmployeeDashboard/LeaveCard';
import PerformanceCard from '@/Components/EmployeeDashboard/PerformanceCard';
import TrainingCard from '@/Components/EmployeeDashboard/TrainingCard';
import PayrollCard from '@/Components/EmployeeDashboard/PayrollCard';
import ExpensesCard from '@/Components/EmployeeDashboard/ExpensesCard';
import TeamCard from '@/Components/EmployeeDashboard/TeamCard';
import MyAssetsCard from '@/Components/EmployeeDashboard/MyAssetsCard';
import DocumentsCard from '@/Components/EmployeeDashboard/DocumentsCard';
import CareerPathCard from '@/Components/EmployeeDashboard/CareerPathCard';
import FeedbackCard from '@/Components/EmployeeDashboard/FeedbackCard';
import SurveysCard from '@/Components/EmployeeDashboard/SurveysCard';
import BenefitsCard from '@/Components/EmployeeDashboard/BenefitsCard';
import OnboardingProgressCard from '@/Components/EmployeeDashboard/OnboardingProgressCard';

const EmployeeDashboard = ({ title = 'My Dashboard' }) => {
    const {
        employee,
        quickActions = [],
        dynamicWidgets = [],
        // Immediate props
        todayAttendance,
        attendanceStats,
        weeklyAttendance,
        leaveBalances,
        pendingLeaves,
        recentLeaves,
        upcomingApprovedLeaves,
        upcomingHolidays,
        companyEvents,
        // Deferred props
        payrollData,
        performanceData,
        trainingData,
        expenseData,
        assetData,
        documentData,
        careerData,
        feedbackData,
        onboardingData,
        teamData,
        overtimeData,
        grievanceData,
        surveyData,
        benefitData,
        managerApprovals,
    } = usePage().props;

    const themeRadius = useThemeRadius();
    const { hasAccess } = useHRMAC();

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

    // Build alerts from deferred data
    const alerts = useMemo(() => {
        const items = [];
        // Document alerts
        (documentData?.documentAlerts ?? []).forEach(doc => {
            items.push({
                type: 'document_expiry',
                title: 'Document Expiring',
                message: `${doc.name} expires in ${doc.days_until_expiry} days`,
                severity: doc.days_until_expiry <= 7 ? 'danger' : 'warning',
            });
        });
        // Certification alerts
        (trainingData?.certifications ?? []).forEach(cert => {
            if (cert.is_expired) {
                items.push({ type: 'cert_expired', title: 'Certification Expired', message: `${cert.name} has expired`, severity: 'danger' });
            } else if (cert.is_expiring_soon) {
                items.push({ type: 'cert_expiring', title: 'Certification Expiring', message: `${cert.name} is expiring soon`, severity: 'warning' });
            }
        });
        // Pending feedback
        if ((feedbackData?.pendingFeedbackRequests?.length ?? 0) > 0) {
            items.push({ type: 'feedback', title: 'Feedback Pending', message: `You have ${feedbackData.pendingFeedbackRequests.length} pending feedback request(s)`, severity: 'primary' });
        }
        // Onboarding
        if (onboardingData?.onboardingProgress?.is_onboarding) {
            const pending = onboardingData.onboardingProgress.pending_tasks?.length ?? 0;
            if (pending > 0) items.push({ type: 'onboarding', title: 'Onboarding Tasks', message: `${pending} pending onboarding task(s)`, severity: 'primary' });
        }
        // Manager approvals
        if (managerApprovals) {
            const total = (managerApprovals.pending_leaves ?? 0) + (managerApprovals.pending_expenses ?? 0) + (managerApprovals.pending_overtime ?? 0);
            if (total > 0) items.push({ type: 'approvals', title: 'Pending Approvals', message: `You have ${total} item(s) awaiting approval`, severity: 'warning' });
        }
        return items.slice(0, 10);
    }, [documentData, trainingData, feedbackData, onboardingData, managerApprovals]);

    // Stats cards data
    const statsData = useMemo(() => {
        const totalLeaveBalance = (leaveBalances ?? []).reduce((sum, b) => sum + (b.remaining ?? b.balance ?? 0), 0);
        const pendingCount = (pendingLeaves?.length ?? 0) + (expenseData?.expenseSummary?.pending_count ?? 0) + (overtimeData?.overtimeSummary?.pending_requests ?? 0);

        return [
            {
                title: 'Attendance',
                value: `${attendanceStats?.attendance_percentage ?? 0}%`,
                icon: <HomeIcon className="w-5 h-5" />,
                color: 'text-primary',
                iconBg: 'bg-primary/20',
            },
            {
                title: 'Leave Balance',
                value: totalLeaveBalance,
                icon: <HomeIcon className="w-5 h-5" />,
                color: 'text-success',
                iconBg: 'bg-success/20',
            },
            {
                title: 'Pending Requests',
                value: pendingCount,
                icon: <HomeIcon className="w-5 h-5" />,
                color: 'text-warning',
                iconBg: 'bg-warning/20',
            },
            {
                title: 'Overtime (YTD)',
                value: `${overtimeData?.overtimeSummary?.total_overtime_ytd_hours ?? 0}h`,
                icon: <HomeIcon className="w-5 h-5" />,
                color: 'text-secondary',
                iconBg: 'bg-secondary/20',
            },
        ];
    }, [leaveBalances, pendingLeaves, attendanceStats, expenseData, overtimeData]);

    // Group dynamic widgets by position
    const widgetsByPosition = useMemo(() => {
        const positions = { welcome: [], stats_row: [], main_left: [], main_right: [], sidebar: [], full_width: [] };
        dynamicWidgets.forEach(widget => {
            const pos = widget.position || 'full_width';
            (positions[pos] || positions.full_width).push(widget);
        });
        Object.values(positions).forEach(arr => arr.sort((a, b) => (a.order || 0) - (b.order || 0)));
        return positions;
    }, [dynamicWidgets]);

    if (!employee) {
        return (
            <>
                <Head title={title} />
                <div className="flex flex-col items-center justify-center h-full p-8">
                    <HomeIcon className="w-16 h-16 text-default-300 mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Welcome to Your Dashboard</h3>
                    <p className="text-default-500">Your employee profile is not set up yet. Please contact HR.</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={title} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Employee Dashboard">
                <div className="space-y-6">

                    {/* Welcome Banner */}
                    <WelcomeBanner employee={employee} todayAttendance={todayAttendance} />

                    {/* Onboarding Progress (shown only for onboarding employees) */}
                    <OnboardingProgressCard onboardingData={onboardingData} />

                    {/* Alerts Bar */}
                    {alerts.length > 0 && <AlertsBar alerts={alerts} />}

                    {/* Quick Actions */}
                    <QuickActionsGrid quickActions={quickActions} isMobile={isMobile} />

                    {/* Stats Row */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <StatsCards stats={statsData} />
                    </motion.div>

                    {/* Dynamic Widgets - Stats Row Position */}
                    {widgetsByPosition.stats_row.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {widgetsByPosition.stats_row.map(w => (
                                <DynamicWidgetRenderer key={w.key} widgets={[w]} />
                            ))}
                        </div>
                    )}

                    {/* Main Content: 2/3 + 1/3 Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            <AttendanceCard
                                todayAttendance={todayAttendance}
                                attendanceStats={attendanceStats}
                                weeklyAttendance={weeklyAttendance}
                            />

                            <LeaveCard
                                leaveBalances={leaveBalances}
                                pendingLeaves={pendingLeaves}
                                upcomingApprovedLeaves={upcomingApprovedLeaves}
                            />

                            <PerformanceCard performanceData={performanceData} />

                            <PayrollCard payrollData={payrollData} />

                            <ExpensesCard expenseData={expenseData} />

                            <TrainingCard trainingData={trainingData} />

                            {/* Dynamic Widgets - Main Left Position */}
                            {widgetsByPosition.main_left.map(w => (
                                <DynamicWidgetRenderer key={w.key} widgets={[w]} />
                            ))}
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="space-y-6">
                            <TeamCard teamData={teamData} />

                            <DocumentsCard documentData={documentData} />

                            <MyAssetsCard assetData={assetData} />

                            <CareerPathCard careerData={careerData} />

                            <FeedbackCard feedbackData={feedbackData} />

                            <SurveysCard surveyData={surveyData} />

                            <BenefitsCard benefitData={benefitData} />

                            {/* Dynamic Widgets - Sidebar Position */}
                            {widgetsByPosition.sidebar.map(w => (
                                <DynamicWidgetRenderer key={w.key} widgets={[w]} />
                            ))}
                            {widgetsByPosition.main_right.map(w => (
                                <DynamicWidgetRenderer key={w.key} widgets={[w]} />
                            ))}
                        </div>
                    </div>

                    {/* Full Width Dynamic Widgets */}
                    {widgetsByPosition.full_width.length > 0 && (
                        <div className="space-y-4">
                            {widgetsByPosition.full_width.map(w => (
                                <DynamicWidgetRenderer key={w.key} widgets={[w]} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

EmployeeDashboard.layout = (page) => <App>{page}</App>;
export default EmployeeDashboard;
