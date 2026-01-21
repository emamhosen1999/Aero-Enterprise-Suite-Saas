import React, { useMemo, useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Card,
    CardBody,
    CardHeader,
    Input,
    Select,
    SelectItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Pagination,
} from "@heroui/react";
import {
    ClockIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const MyTimesheets = ({ title, timeEntries, stats, projects, filters }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const statsData = useMemo(() => [
        {
            title: "Total Entries",
            value: stats?.totalEntries || 0,
            icon: <CalendarDaysIcon />,
            color: "text-primary",
            iconBg: "bg-primary/20",
        },
        {
            title: "Hours This Month",
            value: stats?.hoursThisMonth || 0,
            icon: <ClockIcon />,
            color: "text-success",
            iconBg: "bg-success/20",
            suffix: "hrs",
        },
        {
            title: "Pending Approval",
            value: stats?.pendingApproval || 0,
            icon: <ExclamationCircleIcon />,
            color: "text-warning",
            iconBg: "bg-warning/20",
        },
    ], [stats]);

    const formatDuration = (minutes) => {
        if (!minutes) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const columns = [
        { uid: 'date', name: 'Date' },
        { uid: 'project', name: 'Project' },
        { uid: 'task', name: 'Task' },
        { uid: 'duration', name: 'Duration' },
        { uid: 'approved', name: 'Status' },
    ];

    const renderCell = (entry, columnKey) => {
        switch (columnKey) {
            case 'date':
                return entry.date || '-';
            case 'project':
                return entry.project?.project_name || '-';
            case 'task':
                return entry.task?.name || '-';
            case 'duration':
                return formatDuration(entry.duration_minutes);
            case 'approved':
                return (
                    <Chip
                        size="sm"
                        color={entry.approved ? 'success' : 'warning'}
                        variant="flat"
                    >
                        {entry.approved ? 'Approved' : 'Pending'}
                    </Chip>
                );
            default:
                return entry[columnKey];
        }
    };

    return (
        <>
            <Head title={title} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="My Timesheets">
                <div className="space-y-4">
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
                                background: `linear-gradient(135deg, 
                                    var(--theme-content1, #FAFAFA) 20%, 
                                    var(--theme-content2, #F4F4F5) 10%, 
                                    var(--theme-content3, #F1F3F4) 20%)`,
                            }}
                        >
                            <CardHeader
                                className="border-b p-0"
                                style={{ borderColor: `var(--theme-divider, #E4E4E7)` }}
                            >
                                <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                            style={{
                                                background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                borderRadius: `var(--borderRadius, 12px)`,
                                            }}
                                        >
                                            <ClockIcon
                                                className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                style={{ color: 'var(--theme-primary)' }}
                                            />
                                        </div>
                                        <div>
                                            <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                My Timesheets
                                            </h4>
                                            <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                Your time entries and tracked hours
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="p-6">
                                <StatsCards stats={statsData} className="mb-6" />

                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <Select
                                        placeholder="Filter by project"
                                        radius={themeRadius}
                                        classNames={{ trigger: "bg-default-100" }}
                                        className="max-w-xs"
                                    >
                                        {(projects || []).map((project) => (
                                            <SelectItem key={project.id}>{project.project_name}</SelectItem>
                                        ))}
                                    </Select>
                                    <Input
                                        type="date"
                                        label="Start Date"
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                        className="max-w-xs"
                                    />
                                    <Input
                                        type="date"
                                        label="End Date"
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                        className="max-w-xs"
                                    />
                                </div>

                                <Table
                                    aria-label="My timesheets table"
                                    classNames={{
                                        wrapper: "shadow-none border border-divider rounded-lg",
                                        th: "bg-default-100 text-default-600 font-semibold",
                                        td: "py-3",
                                    }}
                                >
                                    <TableHeader columns={columns}>
                                        {(column) => (
                                            <TableColumn key={column.uid}>{column.name}</TableColumn>
                                        )}
                                    </TableHeader>
                                    <TableBody
                                        items={timeEntries?.data || []}
                                        emptyContent="No time entries found"
                                    >
                                        {(item) => (
                                            <TableRow key={item.id}>
                                                {(columnKey) => (
                                                    <TableCell>{renderCell(item, columnKey)}</TableCell>
                                                )}
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                {timeEntries?.last_page > 1 && (
                                    <div className="flex justify-center mt-4">
                                        <Pagination
                                            total={timeEntries.last_page}
                                            page={timeEntries.current_page}
                                            radius={themeRadius}
                                        />
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

MyTimesheets.layout = (page) => <App children={page} />;
export default MyTimesheets;
