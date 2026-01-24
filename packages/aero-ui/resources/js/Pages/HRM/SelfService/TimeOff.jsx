import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button, Card, CardBody, CardHeader, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { CalendarDaysIcon, CheckCircleIcon, ClockIcon, PlusIcon, XCircleIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const TimeOff = ({ title, requests = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { hasAccess, isSuperAdmin } = useHRMAC();
    
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const stats = useMemo(() => {
        const pending = requests.filter(r => r.status === 'pending').length;
        const approved = requests.filter(r => r.status === 'approved').length;
        const rejected = requests.filter(r => r.status === 'rejected').length;
        return { total: requests.length, pending, approved, rejected };
    }, [requests]);

    const statsData = useMemo(() => [
        { title: "Total Requests", value: stats.total, icon: <CalendarDaysIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Pending", value: stats.pending, icon: <ClockIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Approved", value: stats.approved, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Rejected", value: stats.rejected, icon: <XCircleIcon className="w-6 h-6" />, color: "text-danger", iconBg: "bg-danger/20" },
    ], [stats]);

    const statusColorMap = {
        pending: 'warning',
        approved: 'success',
        rejected: 'danger',
    };

    const columns = [
        { uid: 'type', name: 'Leave Type' },
        { uid: 'start_date', name: 'Start Date' },
        { uid: 'end_date', name: 'End Date' },
        { uid: 'days', name: 'Days' },
        { uid: 'status', name: 'Status' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'status':
                return <Chip color={statusColorMap[item.status] || 'default'} size="sm" variant="flat">{item.status}</Chip>;
            default:
                return item[columnKey] || '-';
        }
    };

    return (
        <StandardPageLayout
            title="My Time-Off"
            subtitle="Request and track your time-off"
            icon={<CalendarDaysIcon className="w-6 h-6" />}
            iconColorClass="text-primary"
            iconBgClass="bg-primary/20"
            stats={<StatsCards stats={statsData} />}
            actions={
                <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} size={isMobile ? "sm" : "md"}>
                    Request Time-Off
                </Button>
            }
            ariaLabel="My Time-Off"
        >
            {requests.length > 0 ? (
                <Table aria-label="Time-off requests" classNames={{
                    wrapper: "shadow-none border border-divider rounded-lg",
                    th: "bg-default-100 text-default-600 font-semibold",
                    td: "py-3"
                }}>
                    <TableHeader columns={columns}>
                        {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                    </TableHeader>
                    <TableBody items={requests}>
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-12 text-default-500">
                    <CalendarDaysIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No Time-Off Requests</p>
                    <p className="text-sm">You haven't submitted any time-off requests yet.</p>
                </div>
            )}
        </StandardPageLayout>
    );
};

TimeOff.layout = (page) => <App children={page} />;
export default TimeOff;
