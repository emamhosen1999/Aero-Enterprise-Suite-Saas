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
    ClipboardDocumentCheckIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const MyTasks = ({ title, tasks, stats, filters, error }) => {
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
            title: "Total Tasks",
            value: stats?.total || 0,
            icon: <ClipboardDocumentCheckIcon />,
            color: "text-primary",
            iconBg: "bg-primary/20",
        },
        {
            title: "In Progress",
            value: stats?.in_progress || 0,
            icon: <ClockIcon />,
            color: "text-warning",
            iconBg: "bg-warning/20",
        },
        {
            title: "Completed",
            value: stats?.completed || 0,
            icon: <CheckCircleIcon />,
            color: "text-success",
            iconBg: "bg-success/20",
        },
        {
            title: "Pending",
            value: stats?.pending || 0,
            icon: <ExclamationCircleIcon />,
            color: "text-default",
            iconBg: "bg-default/20",
        },
    ], [stats]);

    const statusColorMap = {
        pending: 'default',
        in_progress: 'primary',
        completed: 'success',
        cancelled: 'danger',
        on_hold: 'warning',
    };

    const priorityColorMap = {
        low: 'success',
        medium: 'warning',
        high: 'danger',
        critical: 'danger',
    };

    const columns = [
        { uid: 'name', name: 'Task' },
        { uid: 'project', name: 'Project' },
        { uid: 'status', name: 'Status' },
        { uid: 'priority', name: 'Priority' },
        { uid: 'due_date', name: 'Due Date' },
    ];

    const taskItems = Array.isArray(tasks) ? tasks : (tasks?.data || []);

    const renderCell = (task, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div>
                        <p className="font-medium">{task.name || task.title}</p>
                        <p className="text-xs text-default-400">{task.description?.substring(0, 50)}...</p>
                    </div>
                );
            case 'project':
                return task.project?.project_name || task.project_name || '-';
            case 'status':
                return (
                    <Chip
                        size="sm"
                        color={statusColorMap[task.status] || 'default'}
                        variant="flat"
                    >
                        {task.status?.replace('_', ' ')}
                    </Chip>
                );
            case 'priority':
                return (
                    <Chip
                        size="sm"
                        color={priorityColorMap[task.priority] || 'default'}
                        variant="dot"
                    >
                        {task.priority}
                    </Chip>
                );
            case 'due_date':
                return task.due_date || '-';
            default:
                return task[columnKey];
        }
    };

    return (
        <>
            <Head title={title} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="My Tasks">
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
                                            <ClipboardDocumentCheckIcon
                                                className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                style={{ color: 'var(--theme-primary)' }}
                                            />
                                        </div>
                                        <div>
                                            <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                My Tasks
                                            </h4>
                                            <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                Tasks assigned to you
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="p-6">
                                {error && (
                                    <div className="mb-4 p-3 bg-danger-50 text-danger rounded-lg">
                                        {error}
                                    </div>
                                )}

                                <StatsCards stats={statsData} className="mb-6" />

                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <Input
                                        placeholder="Search tasks..."
                                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                        className="max-w-xs"
                                    />
                                    <Select
                                        placeholder="Filter by status"
                                        radius={themeRadius}
                                        classNames={{ trigger: "bg-default-100" }}
                                        className="max-w-xs"
                                    >
                                        <SelectItem key="pending">Pending</SelectItem>
                                        <SelectItem key="in_progress">In Progress</SelectItem>
                                        <SelectItem key="completed">Completed</SelectItem>
                                    </Select>
                                </div>

                                <Table
                                    aria-label="My tasks table"
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
                                        items={taskItems}
                                        emptyContent="No tasks assigned to you"
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
                            </CardBody>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

MyTasks.layout = (page) => <App children={page} />;
export default MyTasks;
