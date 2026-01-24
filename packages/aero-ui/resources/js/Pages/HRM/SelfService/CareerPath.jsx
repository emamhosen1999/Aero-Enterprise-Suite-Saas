import React, { useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Chip, Progress, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { AcademicCapIcon, ArrowTrendingUpIcon, BriefcaseIcon, StarIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const CareerPath = ({ title, careerPaths = [] }) => {
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
        const currentLevel = careerPaths.find(p => p.is_current)?.level || 'N/A';
        const nextLevel = careerPaths.find(p => p.is_next)?.title || 'Not defined';
        const completedMilestones = careerPaths.filter(p => p.completed).length;
        const totalMilestones = careerPaths.length;
        const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
        
        return { currentLevel, nextLevel, completedMilestones, totalMilestones, progressPercent };
    }, [careerPaths]);

    const statsData = useMemo(() => [
        { title: "Current Position", value: stats.currentLevel, icon: <BriefcaseIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Next Level", value: stats.nextLevel, icon: <ArrowTrendingUpIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Milestones", value: `${stats.completedMilestones}/${stats.totalMilestones}`, icon: <StarIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Progress", value: `${stats.progressPercent}%`, icon: <AcademicCapIcon className="w-6 h-6" />, color: "text-secondary", iconBg: "bg-secondary/20" },
    ], [stats]);

    const statusColorMap = {
        completed: 'success',
        in_progress: 'primary',
        not_started: 'default',
        on_hold: 'warning',
    };

    const columns = [
        { uid: 'title', name: 'Career Stage' },
        { uid: 'level', name: 'Level' },
        { uid: 'skills_required', name: 'Skills Required' },
        { uid: 'estimated_time', name: 'Est. Time' },
        { uid: 'status', name: 'Status' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'skills_required':
                if (!item.skills_required || item.skills_required.length === 0) return '-';
                return (
                    <div className="flex flex-wrap gap-1">
                        {item.skills_required.slice(0, 3).map((skill, idx) => (
                            <Chip key={idx} size="sm" variant="flat" color="primary">{skill}</Chip>
                        ))}
                        {item.skills_required.length > 3 && (
                            <Chip size="sm" variant="flat" color="default">+{item.skills_required.length - 3}</Chip>
                        )}
                    </div>
                );
            case 'status':
                return <Chip color={statusColorMap[item.status] || 'default'} size="sm" variant="flat">{item.status?.replace('_', ' ') || 'Not Started'}</Chip>;
            default:
                return item[columnKey] || '-';
        }
    };

    return (
        <StandardPageLayout
            title="My Career Path"
            subtitle="Explore your career growth and development opportunities"
            icon={ArrowTrendingUpIcon}
            iconColorClass="text-success"
            iconBgClass="bg-success/20"
            stats={<StatsCards stats={statsData} />}
            ariaLabel="My Career Path"
        >
            {careerPaths.length > 0 ? (
                <Table aria-label="Career Path" classNames={{
                    wrapper: "shadow-none border border-divider rounded-lg",
                    th: "bg-default-100 text-default-600 font-semibold",
                    td: "py-3"
                }}>
                    <TableHeader columns={columns}>
                        {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                    </TableHeader>
                    <TableBody items={careerPaths}>
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-12 text-default-500">
                    <ArrowTrendingUpIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No Career Path Defined</p>
                    <p className="text-sm">Your career development path will appear here once configured by HR.</p>
                </div>
            )}
        </StandardPageLayout>
    );
};

CareerPath.layout = (page) => <App children={page} />;
export default CareerPath;
