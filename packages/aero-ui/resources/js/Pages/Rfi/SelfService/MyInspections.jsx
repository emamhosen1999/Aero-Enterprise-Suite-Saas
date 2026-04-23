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
    MagnifyingGlassCircleIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const MyInspections = ({ title, inspections, stats, filters, inspectionResults }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const statsData = useMemo(() => [
        {
            title: "Total Inspections",
            value: stats?.total || 0,
            icon: <MagnifyingGlassCircleIcon />,
            color: "text-primary",
            iconBg: "bg-primary/20",
        },
        {
            title: "Passed",
            value: stats?.passed || 0,
            icon: <CheckCircleIcon />,
            color: "text-success",
            iconBg: "bg-success/20",
        },
        {
            title: "Failed",
            value: stats?.failed || 0,
            icon: <XCircleIcon />,
            color: "text-danger",
            iconBg: "bg-danger/20",
        },
        {
            title: "On Hold",
            value: stats?.on_hold || 0,
            icon: <ClockIcon />,
            color: "text-warning",
            iconBg: "bg-warning/20",
        },
    ], [stats]);

    const resultColorMap = {
        passed: 'success',
        failed: 'danger',
        on_hold: 'warning',
        pending: 'default',
    };

    const columns = [
        { uid: 'rfi_number', name: 'RFI Number' },
        { uid: 'work_location', name: 'Location' },
        { uid: 'inspection_result', name: 'Result' },
        { uid: 'inspection_date', name: 'Inspection Date' },
    ];

    const renderCell = (inspection, columnKey) => {
        switch (columnKey) {
            case 'rfi_number':
                return (
                    <div>
                        <p className="font-medium">{inspection.rfi_number}</p>
                        <p className="text-xs text-default-400">{inspection.type}</p>
                    </div>
                );
            case 'work_location':
                return inspection.work_location?.name || inspection.workLocation?.name || '-';
            case 'inspection_result':
                return (
                    <Chip
                        size="sm"
                        color={resultColorMap[inspection.inspection_result] || 'default'}
                        variant="flat"
                    >
                        {inspection.inspection_result?.replace('_', ' ')}
                    </Chip>
                );
            case 'inspection_date':
                return inspection.inspection_date 
                    ? new Date(inspection.inspection_date).toLocaleDateString() 
                    : '-';
            default:
                return inspection[columnKey];
        }
    };

    return (
        <>
            <Head title={title} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="My Inspections">
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
                                            <MagnifyingGlassCircleIcon
                                                className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                style={{ color: 'var(--theme-primary)' }}
                                            />
                                        </div>
                                        <div>
                                            <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                My Inspections
                                            </h4>
                                            <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                Inspections you have performed
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="p-6">
                                <StatsCards stats={statsData} className="mb-6" />

                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <Input
                                        placeholder="Search inspections..."
                                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                        className="max-w-xs"
                                    />
                                    <Select
                                        placeholder="Filter by result"
                                        radius={themeRadius}
                                        classNames={{ trigger: "bg-default-100" }}
                                        className="max-w-xs"
                                    >
                                        {Object.entries(inspectionResults || {}).map(([key, value]) => (
                                            <SelectItem key={key}>{value}</SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <Table
                                    aria-label="My inspections table"
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
                                        items={inspections?.data || []}
                                        emptyContent="No inspections found"
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

                                {inspections?.last_page > 1 && (
                                    <div className="flex justify-center mt-4">
                                        <Pagination
                                            total={inspections.last_page}
                                            page={inspections.current_page}
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

MyInspections.layout = (page) => <App children={page} />;
export default MyInspections;
