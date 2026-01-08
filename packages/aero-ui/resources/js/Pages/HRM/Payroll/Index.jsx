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
import StatsCards from '@/Components/StatsCards.jsx';

const PayrollIndex = ({ title, payrolls, stats }) => {
    const { auth } = usePage().props;

    // Theme radius helper
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

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

    // Permission checks
    const canCreate = auth.permissions?.includes('hrm.payroll.create') || auth.permissions?.includes('hrm.payroll') || true;
    const canEdit = auth.permissions?.includes('hrm.payroll.update') || auth.permissions?.includes('hrm.payroll') || true;

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
                            {canEdit && (
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
    }, [canEdit]);

    return (
        <>
            <Head title={title || 'Payroll Management'} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Payroll Management">
                <div className="space-y-4">
                    <div className="w-full">
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
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, 
                                        var(--theme-content1, #FAFAFA) 20%, 
                                        var(--theme-content2, #F4F4F5) 10%, 
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                <CardHeader
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <CurrencyDollarIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Payroll Management
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage employee payroll and salary processing
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 flex-wrap">
                                                {canCreate && (
                                                    <Button
                                                        color="primary"
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        size={isMobile ? "sm" : "md"}
                                                        as="a"
                                                        href={route('payroll.create')}
                                                    >
                                                        Generate Payroll
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} className="mb-6" />

                                    {/* Filters */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            placeholder="Search by employee name or email..."
                                            value={filters.search}
                                            onValueChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            className="flex-1"
                                            radius={getThemeRadius()}
                                            classNames={{
                                                inputWrapper: "bg-default-100"
                                            }}
                                        />
                                        <Select
                                            placeholder="Filter by status"
                                            selectedKeys={[filters.status]}
                                            onSelectionChange={(keys) => setFilters(prev => ({ ...prev, status: Array.from(keys)[0] || 'all' }))}
                                            className="w-full sm:w-48"
                                            radius={getThemeRadius()}
                                            classNames={{
                                                trigger: "bg-default-100"
                                            }}
                                        >
                                            <SelectItem key="all">All Status</SelectItem>
                                            <SelectItem key="draft">Draft</SelectItem>
                                            <SelectItem key="processed">Processed</SelectItem>
                                            <SelectItem key="cancelled">Cancelled</SelectItem>
                                        </Select>
                                    </div>

                                    {/* Table */}
                                    <Table
                                        aria-label="Payroll table"
                                        isHeaderSticky
                                        classNames={{
                                            wrapper: "shadow-none border border-divider rounded-lg",
                                            th: "bg-default-100 text-default-600 font-semibold",
                                            td: "py-3"
                                        }}
                                    >
                                        <TableHeader columns={columns}>
                                            {(column) => (
                                                <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
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
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

PayrollIndex.layout = (page) => <App children={page} />;
export default PayrollIndex;
