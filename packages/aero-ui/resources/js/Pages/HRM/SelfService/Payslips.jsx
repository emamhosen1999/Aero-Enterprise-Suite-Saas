import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import {
    Button, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
} from "@heroui/react";
import { BanknotesIcon, CalendarIcon, CurrencyDollarIcon, EllipsisVerticalIcon, EyeIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

const Payslips = ({ title, payslips: initialPayslips = [] }) => {
    useHRMAC(); // read-only self-service — no special permission gates needed
    useThemeRadius();
    const [payslips, setPayslips] = useState(initialPayslips);
    const [loading, setLoading]   = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const fetchPayslips = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('selfservice.payslips'));
            if (response.status === 200) {
                const d = response.data;
                setPayslips(Array.isArray(d) ? d : (d.data || []));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to load payslips' });
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPayslips(); }, [fetchPayslips]);

    const stats = useMemo(() => {
        const totalNetPay = payslips.reduce((sum, p) => sum + (parseFloat(p.net_pay) || 0), 0);
        const latest = payslips.length > 0 ? (payslips[0].period || '-') : '-';
        return { count: payslips.length, totalNetPay, latest };
    }, [payslips]);

    const statsData = useMemo(() => [
        { title: "Total Payslips", value: stats.count, icon: <BanknotesIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Total Net Pay", value: formatCurrency(stats.totalNetPay), icon: <CurrencyDollarIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Latest Period", value: stats.latest, icon: <CalendarIcon className="w-6 h-6" />, color: "text-secondary", iconBg: "bg-secondary/20" },
    ], [stats]);

    const statusColorMap = {
        processed: 'success',
        paid: 'success',
        pending: 'warning',
        failed: 'danger',
    };

    const columns = [
        { uid: 'period', name: 'Period' },
        { uid: 'gross_pay', name: 'Gross Pay' },
        { uid: 'deductions', name: 'Deductions' },
        { uid: 'net_pay', name: 'Net Pay' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const handleView = (payslip) => {
        try {
            window.open(route('payroll.payslip.view', payslip.id), '_blank');
        } catch {
            showToast.promise(Promise.reject('View route not available'), { error: (e) => String(e) });
        }
    };

    const handleDownload = (payslip) => {
        try {
            window.open(route('payroll.payslip.download', payslip.id), '_blank');
        } catch {
            showToast.promise(Promise.reject('Download route not available'), { error: (e) => String(e) });
        }
    };

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'gross_pay':
            case 'deductions':
            case 'net_pay':
                return formatCurrency(item[columnKey]);
            case 'status':
                return (
                    <Chip color={statusColorMap[item.status] || 'default'} size="sm" variant="flat">
                        {item.status || 'N/A'}
                    </Chip>
                );
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Payslip actions">
                            <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => handleView(item)}>
                                View Payslip
                            </DropdownItem>
                            <DropdownItem key="download" startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                onPress={() => handleDownload(item)}>
                                Download PDF
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
            <Head title={title || 'My Payslips'} />

            <StandardPageLayout
                title="My Payslips"
                subtitle="View and download your payslips"
                icon={BanknotesIcon}
                iconColorClass="text-success"
                iconBgClass="bg-success/20"
                stats={<StatsCards stats={statsData} />}
                ariaLabel="My Payslips"
            >
                {payslips.length > 0 ? (
                    <Table aria-label="Payslips" classNames={{
                        wrapper: "shadow-none border border-divider rounded-lg",
                        th: "bg-default-100 text-default-600 font-semibold",
                        td: "py-3"
                    }}>
                        <TableHeader columns={columns}>
                            {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                        </TableHeader>
                        <TableBody items={payslips}>
                            {(item) => (
                                <TableRow key={item.id}>
                                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-12 text-default-500">
                        <BanknotesIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No Payslips Available</p>
                        <p className="text-sm">Your payslips will appear here once processed.</p>
                    </div>
                )}
            </StandardPageLayout>
        </>
    );
};

Payslips.layout = (page) => <App children={page} />;
export default Payslips;
