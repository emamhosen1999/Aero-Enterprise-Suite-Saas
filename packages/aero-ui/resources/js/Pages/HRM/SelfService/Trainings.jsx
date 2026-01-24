import React, { useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button, Chip, Progress, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { AcademicCapIcon, BookOpenIcon, CheckBadgeIcon, ClockIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const Trainings = ({ title, trainings = [] }) => {
    const { auth } = usePage().props;
    const { hasAccess } = useHRMAC();
    const themeRadius = useThemeRadius();
    
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const stats = useMemo(() => {
        const completed = trainings.filter(t => t.status === 'completed').length;
        const inProgress = trainings.filter(t => t.status === 'in_progress').length;
        const upcoming = trainings.filter(t => t.status === 'upcoming').length;
        return { total: trainings.length, completed, inProgress, upcoming };
    }, [trainings]);

    const statsData = useMemo(() => [
        { title: "Total Trainings", value: stats.total, icon: <AcademicCapIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Completed", value: stats.completed, icon: <CheckBadgeIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "In Progress", value: stats.inProgress, icon: <BookOpenIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Upcoming", value: stats.upcoming, icon: <ClockIcon className="w-6 h-6" />, color: "text-secondary", iconBg: "bg-secondary/20" },
    ], [stats]);

    const statusColorMap = {
        completed: 'success',
        in_progress: 'warning',
        upcoming: 'primary',
        overdue: 'danger',
    };

    const columns = [
        { uid: 'name', name: 'Training Name' },
        { uid: 'category', name: 'Category' },
        { uid: 'progress', name: 'Progress' },
        { uid: 'due_date', name: 'Due Date' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'progress':
                return (
                    <div className="w-24">
                        <Progress value={item.progress || 0} size="sm" color={item.progress === 100 ? 'success' : 'primary'} />
                        <span className="text-xs text-default-500">{item.progress || 0}%</span>
                    </div>
                );
            case 'status':
                return <Chip color={statusColorMap[item.status] || 'default'} size="sm" variant="flat">{item.status?.replace('_', ' ')}</Chip>;
            case 'actions':
                return (
                    <Button size="sm" variant="flat" color="primary" isDisabled={item.status === 'completed'}>
                        {item.status === 'completed' ? 'View Certificate' : 'Continue'}
                    </Button>
                );
            default:
                return item[columnKey] || '-';
        }
    };

    return (
        <StandardPageLayout
            title="My Trainings"
            subtitle="Track your learning and development"
            icon={AcademicCapIcon}
            iconColorClass="text-secondary"
            iconBgClass="bg-secondary/20"
            stats={statsData}
            ariaLabel="My Trainings"
        >
            {trainings.length > 0 ? (
                <Table aria-label="Trainings" classNames={{
                    wrapper: "shadow-none border border-divider rounded-lg",
                    th: "bg-default-100 text-default-600 font-semibold",
                    td: "py-3"
                }}>
                    <TableHeader columns={columns}>
                        {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                    </TableHeader>
                    <TableBody items={trainings}>
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-12 text-default-500">
                    <AcademicCapIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No Trainings Assigned</p>
                    <p className="text-sm">Your assigned trainings will appear here.</p>
                </div>
            )}
        </StandardPageLayout>
    );
};

Trainings.layout = (page) => <App children={page} />;
export default Trainings;
