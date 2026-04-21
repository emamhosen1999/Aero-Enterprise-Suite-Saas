import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { Button, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { BanknotesIcon, ArrowDownTrayIcon, CalendarIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const Payslips = ({ title, payslips: initialPayslips = [] }) => {
    const { hasAccess } = useHRMAC();
    const themeRadius = useThemeRadius();
    const [payslips, setPayslips] = useState(initialPayslips);
    const [loading, setLoading]   = useState(false);

    const fetchPayslips = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.self-service.payslips'));
            if (response.status === 200) {
                const d = response.data;
                setPayslips(Array.isArray(d) ? d : (d.data || []));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to load payslips' });
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPayslips(); }, [fetchPayslips]);
    
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const stats = useMemo(() => {
        const totalEarnings = payslips.reduce((sum, p) => sum + (p.gross_amount || 0), 0);
        const totalDeductions = payslips.reduce((sum, p) => sum + (p.deductions || 0), 0);
        const netPay = totalEarnings - totalDeductions;
        return { 
            count: payslips.length, 
            totalEarnings: totalEarnings.toLocaleString(),
            totalDeductions: totalDeductions.toLocaleString(),
            netPay: netPay.toLocaleString()
        };
    }, [payslips]);

    const statsData = useMemo(() => [
        { title: "Total Payslips", value: stats.count, icon: <BanknotesIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Total Earnings", value: `$${stats.totalEarnings}`, icon: <CurrencyDollarIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Total Deductions", value: `$${stats.totalDeductions}`, icon: <CurrencyDollarIcon className="w-6 h-6" />, color: "text-danger", iconBg: "bg-danger/20" },
        { title: "Net Pay", value: `$${stats.netPay}`, icon: <CurrencyDollarIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
    ], [stats]);

    const columns = [
        { uid: 'period', name: 'Pay Period' },
        { uid: 'pay_date', name: 'Pay Date' },
        { uid: 'gross_amount', name: 'Gross Amount' },
        { uid: 'deductions', name: 'Deductions' },
        { uid: 'net_amount', name: 'Net Amount' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'gross_amount':
            case 'deductions':
            case 'net_amount':
                return `$${(item[columnKey] || 0).toLocaleString()}`;
            case 'actions':
                return (
                    <Button size="sm" variant="flat" color="primary"
                        startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                        onPress={() => window.open(route('hrm.self-service.payslips.download', item.id), '_blank')}>
                        Download
                    </Button>
                );
            default:
                return item[columnKey] || '-';
        }
    };

    return (
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
    );
};

Payslips.layout = (page) => <App children={page} />;
export default Payslips;
