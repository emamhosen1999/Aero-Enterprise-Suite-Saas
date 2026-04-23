import React, { useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from "@heroui/react";
import { HeartIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const STATUS_COLOR = {
    active: 'success',
    pending: 'warning',
    expired: 'danger',
    enrolled: 'primary',
};

const OpenEnrollment = ({ title, employee, active_period, available_plans = [], current_enrollments = [], can_submit }) => {
    const themeRadius = useThemeRadius();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const statsData = useMemo(() => [
        {
            title: 'Available Plans',
            value: available_plans.length,
            icon: <HeartIcon className="w-5 h-5" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
        },
        {
            title: 'Enrolled',
            value: current_enrollments.filter((e) => e.status === 'active').length,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
        },
        {
            title: 'Pending',
            value: current_enrollments.filter((e) => e.status === 'pending').length,
            icon: <ClockIcon className="w-5 h-5" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
        },
    ], [available_plans, current_enrollments]);

    const planColumns = [
        { uid: 'name', name: 'Plan Name' },
        { uid: 'type', name: 'Type' },
        { uid: 'provider', name: 'Provider' },
        { uid: 'cost', name: 'Employee Cost' },
        { uid: 'status', name: 'Status' },
    ];

    const renderPlanCell = (plan, columnKey) => {
        switch (columnKey) {
            case 'name':
                return <span className="font-medium text-sm">{plan.name}</span>;
            case 'type':
                return <span className="text-sm text-default-600">{plan.type}</span>;
            case 'provider':
                return <span className="text-sm text-default-500">{plan.provider ?? '—'}</span>;
            case 'cost':
                return (
                    <span className="text-sm">
                        {plan.employee_cost != null ? `$${Number(plan.employee_cost).toFixed(2)}/mo` : '—'}
                    </span>
                );
            case 'status':
                return (
                    <Chip size="sm" color={STATUS_COLOR[plan.status] ?? 'default'} variant="flat">
                        {plan.status ?? 'available'}
                    </Chip>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={title || 'Benefits Open Enrollment'} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Benefits Open Enrollment">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg,
                                        var(--theme-content1, #FAFAFA) 20%,
                                        var(--theme-content2, #F4F4F5) 10%,
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                <CardHeader
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg,
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%,
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <HeartIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Benefits Open Enrollment
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        {employee?.full_name ?? 'Your'} benefits enrollment portal
                                                    </p>
                                                </div>
                                            </div>

                                            {active_period && (
                                                <div className="flex items-center gap-2">
                                                    <Chip color="success" variant="flat" size="sm">
                                                        Enrollment Open
                                                    </Chip>
                                                    <span className="text-xs text-default-400">
                                                        Ends: {active_period.end_date ?? '—'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" />

                                    {!active_period && (
                                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                                            <XCircleIcon className="w-12 h-12 text-default-300" />
                                            <p className="text-lg font-semibold text-default-500">No Active Enrollment Period</p>
                                            <p className="text-sm text-default-400">
                                                Open enrollment is not currently available. Please check back later or contact HR.
                                            </p>
                                        </div>
                                    )}

                                    {active_period && available_plans.length > 0 && (
                                        <>
                                            <h5 className="text-base font-semibold mb-3">Available Benefit Plans</h5>
                                            <Table
                                                aria-label="Available benefit plans"
                                                isHeaderSticky
                                                classNames={{
                                                    wrapper: 'shadow-none border border-divider rounded-lg',
                                                    th: 'bg-default-100 text-default-600 font-semibold',
                                                    td: 'py-3',
                                                }}
                                            >
                                                <TableHeader columns={planColumns}>
                                                    {(col) => <TableColumn key={col.uid}>{col.name}</TableColumn>}
                                                </TableHeader>
                                                <TableBody items={available_plans} emptyContent="No plans available">
                                                    {(plan) => (
                                                        <TableRow key={plan.id}>
                                                            {(colKey) => <TableCell>{renderPlanCell(plan, colKey)}</TableCell>}
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </>
                                    )}

                                    {current_enrollments.length > 0 && (
                                        <div className="mt-6">
                                            <h5 className="text-base font-semibold mb-3">Current Enrollments</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {current_enrollments.map((enrollment) => (
                                                    <Chip
                                                        key={enrollment.id ?? enrollment.benefit_id}
                                                        color={STATUS_COLOR[enrollment.status] ?? 'default'}
                                                        variant="flat"
                                                        size="sm"
                                                    >
                                                        {enrollment.benefit_name ?? enrollment.name ?? 'Benefit'}
                                                    </Chip>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

OpenEnrollment.layout = (page) => <App children={page} />;
export default OpenEnrollment;
