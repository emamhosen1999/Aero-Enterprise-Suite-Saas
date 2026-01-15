import React, { useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Chip, Progress, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { AcademicCapIcon, BookOpenIcon, CheckBadgeIcon, ClockIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard.jsx';

const Trainings = ({ title, trainings = [] }) => {
    const { auth } = usePage().props;
    
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
        <>
            <Head title={title || "My Trainings"} />
            
            <div className="flex flex-col w-full h-full p-4" role="main">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                            <Card className="transition-all duration-200" style={getThemedCardStyle()}>
                                <CardHeader className="border-b p-0" style={{
                                    borderColor: `var(--theme-divider, #E4E4E7)`,
                                    background: `linear-gradient(135deg, color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                }}>
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`} style={{
                                                    background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}>
                                                    <AcademicCapIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>My Trainings</h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>Track your learning and development</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
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
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

Trainings.layout = (page) => <App children={page} />;
export default Trainings;
