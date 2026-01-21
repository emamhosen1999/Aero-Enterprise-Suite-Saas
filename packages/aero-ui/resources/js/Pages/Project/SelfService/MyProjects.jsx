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
    Progress,
    Pagination,
    Spinner,
} from "@heroui/react";
import {
    FolderIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const MyProjects = ({ title, projects, stats, filters, statusOptions }) => {
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
            title: "My Projects",
            value: stats?.total || 0,
            icon: <FolderIcon />,
            color: "text-primary",
            iconBg: "bg-primary/20",
        },
        {
            title: "Active",
            value: stats?.active || 0,
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
    ], [stats]);

    const statusColorMap = {
        not_started: 'default',
        in_progress: 'primary',
        on_hold: 'warning',
        completed: 'success',
        cancelled: 'danger',
    };

    const columns = [
        { uid: 'project_name', name: 'Project' },
        { uid: 'status', name: 'Status' },
        { uid: 'progress', name: 'Progress' },
        { uid: 'start_date', name: 'Start Date' },
        { uid: 'end_date', name: 'End Date' },
    ];

    const renderCell = (project, columnKey) => {
        switch (columnKey) {
            case 'project_name':
                return (
                    <div>
                        <p className="font-medium">{project.project_name}</p>
                        <p className="text-xs text-default-400">{project.project_code}</p>
                    </div>
                );
            case 'status':
                return (
                    <Chip
                        size="sm"
                        color={statusColorMap[project.status] || 'default'}
                        variant="flat"
                    >
                        {project.status?.replace('_', ' ')}
                    </Chip>
                );
            case 'progress':
                return (
                    <div className="flex items-center gap-2">
                        <Progress
                            size="sm"
                            value={project.progress || 0}
                            color={project.progress >= 80 ? 'success' : project.progress >= 50 ? 'primary' : 'warning'}
                            className="max-w-24"
                        />
                        <span className="text-xs">{project.progress || 0}%</span>
                    </div>
                );
            case 'start_date':
            case 'end_date':
                return project[columnKey] || '-';
            default:
                return project[columnKey];
        }
    };

    return (
        <>
            <Head title={title} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="My Projects">
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
                                            <FolderIcon
                                                className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                style={{ color: 'var(--theme-primary)' }}
                                            />
                                        </div>
                                        <div>
                                            <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                My Projects
                                            </h4>
                                            <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                Projects you are assigned to or leading
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="p-6">
                                <StatsCards stats={statsData} className="mb-6" />

                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <Input
                                        placeholder="Search projects..."
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
                                        {(statusOptions || []).map((status) => (
                                            <SelectItem key={status.id}>{status.name}</SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <Table
                                    aria-label="My projects table"
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
                                        items={projects?.data || []}
                                        emptyContent="No projects found"
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

                                {projects?.last_page > 1 && (
                                    <div className="flex justify-center mt-4">
                                        <Pagination
                                            total={projects.last_page}
                                            page={projects.current_page}
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

MyProjects.layout = (page) => <App children={page} />;
export default MyProjects;
