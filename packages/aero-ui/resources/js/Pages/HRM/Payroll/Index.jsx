import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Chip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Pagination,
} from "@heroui/react";
import {
    PlusIcon,
    MagnifyingGlassIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    ClockIcon,
    ChartBarIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import { useHRMAC } from '@/Hooks/useHRMAC';

const PayrollIndex = ({ title, payrolls, stats }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();

    // HRMAC permissions - TODO: Update with actual module hierarchy paths once defined
    const { canCreate, canUpdate, hasAccess, isSuperAdmin } = useHRMAC();
    const canViewPayroll = hasAccess('hrm.payroll') || isSuperAdmin();
    const canCreatePayroll = canCreate('hrm.payroll') || isSuperAdmin();
    const canEditPayroll = canUpdate('hrm.payroll') || isSuperAdmin();

    // Responsive breakpoints
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // State
    const [filters, setFilters] = useState({ search: '', status: 'all' });
    const [page, setPage] = useState(1);

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        {
            title: "Total Payrolls",
            value: stats?.total_payrolls || 0,
            icon: <DocumentTextIcon className="w-5 h-5" />,
            color: "text-primary",
            iconBg: "bg-primary/20"
        },
        {
            title: "This Month",
            value: stats?.current_month_payrolls || 0,
            icon: <ClockIcon className="w-5 h-5" />,
            color: "text-warning",
            iconBg: "bg-warning/20"
        },
        {
            title: "Processed",
            value: stats?.processed_payrolls || 0,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: "text-success",
            iconBg: "bg-success/20"
        },
        {
            title: "Total Payout",
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats?.total_payout || 0),
            icon: <CurrencyDollarIcon className="w-5 h-5" />,
            color: "text-secondary",
            iconBg: "bg-secondary/20"
        },
    ], [stats]);

    // Action buttons for StandardPageLayout
    const actionButtons = useMemo(() => (
        <>
            {canCreatePayroll && (
                <Button
                    color="primary"
                    variant="shadow"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    size={isMobile ? "sm" : "md"}
                >
                    Create Payroll
                </Button>
            )}
        </>
    ), [canCreatePayroll, isMobile]);

    // Filters section for StandardPageLayout
    const filtersSection = useMemo(() => (
        <div className="flex flex-col sm:flex-row gap-4">
            <Input
                label="Search Payrolls"
                placeholder="Search by employee name or email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                variant="bordered"
                size="sm"
                radius={themeRadius}
                classNames={{ input: "text-sm" }}
            />
            <Select
                label="Status"
                placeholder="All Status"
                selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0];
                    setFilters(prev => ({ ...prev, status: value || 'all' }));
                }}
                variant="bordered"
                size="sm"
                radius={themeRadius}
                className="sm:w-48"
            >
                <SelectItem key="all">All Status</SelectItem>
                <SelectItem key="draft">Draft</SelectItem>
                <SelectItem key="pending">Pending</SelectItem>
                <SelectItem key="processed">Processed</SelectItem>
                <SelectItem key="cancelled">Cancelled</SelectItem>
            </Select>
        </div>
    ), [filters, themeRadius]);

    // Table columns
    const columns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'pay_period', name: 'Pay Period' },
        { uid: 'basic_salary', name: 'Basic Salary' },
        { uid: 'net_salary', name: 'Net Salary' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    // Status color mapping
    const statusColorMap = {
        'processed': 'success',
        'draft': 'warning',
        'cancelled': 'danger',
        'pending': 'primary',
    };

    // Filter payrolls
    const filteredPayrolls = useMemo(() => {
        if (!payrolls?.data) return [];
        let data = [...payrolls.data];

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            data = data.filter(p =>
                p.employee?.name?.toLowerCase().includes(searchLower) ||
                p.employee?.email?.toLowerCase().includes(searchLower)
            );
        }

        if (filters.status !== 'all') {
            data = data.filter(p => p.status === filters.status);
        }

        return data;
    }, [payrolls, filters]);

    // Render table cell
    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{item.employee?.name || 'N/A'}</span>
                        <span className="text-sm text-default-500">{item.employee?.email || ''}</span>
                    </div>
                );
            case 'pay_period':
                return (
                    <div className="flex flex-col">
                        <span className="text-sm">
                            {item.pay_period_start ? new Date(item.pay_period_start).toLocaleDateString() : ''} -
                        </span>
                        <span className="text-sm">
                            {item.pay_period_end ? new Date(item.pay_period_end).toLocaleDateString() : ''}
                        </span>
                    </div>
                );
            case 'basic_salary':
                return (
                    <span className="font-mono">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.basic_salary || 0)}
                    </span>
                );
            case 'net_salary':
                return (
                    <span className="font-mono font-semibold text-success">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.net_salary || 0)}
                    </span>
                );
            case 'status':
                return (
                    <Chip
                        color={statusColorMap[item.status] || 'default'}
                        size="sm"
                        variant="flat"
                    >
                        {item.status?.charAt(0).toUpperCase() + item.status?.slice(1) || 'N/A'}
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
                        <DropdownMenu aria-label="Actions">
                            <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />}>
                                View Details
                            </DropdownItem>
                            {canEditPayroll && (
                                <DropdownItem key="edit" startContent={<PencilIcon className="w-4 h-4" />}>
                                    Edit
                                </DropdownItem>
                            )}
                            <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<TrashIcon className="w-4 h-4" />}
                            >
                                Delete
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return item[columnKey];
        }
    }, [canEditPayroll]);

    return (
        <>
            <Head title={title || 'Payroll Management'} />

            <StandardPageLayout
                title="Payroll Management"
                subtitle="Manage employee payroll and salary processing"
                icon={<CurrencyDollarIcon />}
                actions={actionButtons}
                stats={<StatsCards stats={statsData} />}
                filters={filtersSection}
                ariaLabel="Payroll Management"
            >
                {/* Payroll Table */}
                <Table
                    aria-label="Payroll records"
                    isHeaderSticky
                    classNames={{
                        wrapper: "shadow-none border border-divider rounded-lg",
                        th: "bg-default-100 text-default-600 font-semibold",
                        td: "py-3"
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn key={column.uid}>
                                {column.name}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody
                        items={filteredPayrolls}
                        emptyContent="No payroll records found"
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

                {/* Pagination */}
                {payrolls?.last_page > 1 && (
                    <div className="flex justify-center mt-4">
                        <Pagination
                            total={payrolls.last_page}
                            page={payrolls.current_page}
                            onChange={setPage}
                            showControls
                            color="primary"
                        />
                    </div>
                )}
            </StandardPageLayout>
        </>
    );
};

PayrollIndex.layout = (page) => <App children={page} />;
export default PayrollIndex;
