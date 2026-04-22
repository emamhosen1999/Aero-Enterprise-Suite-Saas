import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import {
    Button, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
} from "@heroui/react";
import { AcademicCapIcon, BookOpenIcon, CheckBadgeIcon, ClockIcon, EllipsisVerticalIcon, EyeIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const Trainings = ({ title, trainings = [] }) => {
    useThemeRadius();
    const { canCreate, isSuperAdmin } = useHRMAC();
    const canBrowseCatalog = canCreate('hrm.self-service.trainings') || isSuperAdmin();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const stats = useMemo(() => {
        const completed = trainings.filter(t => t.status === 'completed' || t.status === 'passed').length;
        const inProgress = trainings.filter(t => t.status === 'in_progress').length;
        const scored = trainings.filter(t => t.score !== null && t.score !== undefined);
        const avgScore = scored.length > 0
            ? (scored.reduce((sum, t) => sum + parseFloat(t.score || 0), 0) / scored.length).toFixed(1)
            : 'N/A';
        return { total: trainings.length, completed, inProgress, avgScore };
    }, [trainings]);

    const statsData = useMemo(() => [
        { title: "Total Enrolled", value: stats.total, icon: <AcademicCapIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Completed", value: stats.completed, icon: <CheckBadgeIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "In Progress", value: stats.inProgress, icon: <BookOpenIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Avg Score", value: stats.avgScore === 'N/A' ? 'N/A' : `${stats.avgScore}%`, icon: <ClockIcon className="w-6 h-6" />, color: "text-secondary", iconBg: "bg-secondary/20" },
    ], [stats]);

    const statusColorMap = {
        completed: 'success',
        passed: 'success',
        in_progress: 'primary',
        enrolled: 'warning',
        failed: 'danger',
    };

    const columns = [
        { uid: 'name', name: 'Training Name' },
        { uid: 'category', name: 'Category' },
        { uid: 'status', name: 'Status' },
        { uid: 'start_date', name: 'Start Date' },
        { uid: 'end_date', name: 'End Date' },
        { uid: 'score', name: 'Score' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'status':
                return (
                    <Chip color={statusColorMap[item.status] || 'default'} size="sm" variant="flat">
                        {item.status?.replace('_', ' ') || '-'}
                    </Chip>
                );
            case 'score':
                return item.score !== null && item.score !== undefined ? `${item.score}%` : 'N/A';
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Training actions">
                            <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => router.visit('/hrm/training/' + item.id)}>
                                View Training
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return item[columnKey] || '-';
        }
    };

    return (
        <>
            <Head title={title || 'My Trainings'} />

            <StandardPageLayout
                title="My Trainings"
                subtitle="Track your learning and development"
                icon={AcademicCapIcon}
                iconColorClass="text-secondary"
                iconBgClass="bg-secondary/20"
                stats={<StatsCards stats={statsData} />}
                actions={canBrowseCatalog && (
                    <Button color="primary" variant="shadow" startContent={<BookOpenIcon className="w-4 h-4" />}
                        size={isMobile ? 'sm' : 'md'}
                        onPress={() => router.visit(route('hrm.training.index'))}>
                        Browse Training Catalog
                    </Button>
                )}
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
        </>
    );
};

Trainings.layout = (page) => <App children={page} />;
export default Trainings;
