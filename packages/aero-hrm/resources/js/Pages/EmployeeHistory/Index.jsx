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
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Tabs,
    Tab,
    Pagination,
    Skeleton,
    Textarea,
} from "@heroui/react";
import {
    ArrowTrendingUpIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    CurrencyDollarIcon,
    ArrowPathIcon,
    BuildingOfficeIcon,
    UserIcon,
    CalendarIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

const EmployeeHistoryIndex = ({ title, stats: initialStats, departments, designations }) => {
    const { auth } = usePage().props;

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

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [activeTab, setActiveTab] = useState('compensations');
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState(initialStats || {});
    const [filters, setFilters] = useState({ search: '', change_type: '', promotion_type: '', transfer_type: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });

    const statsData = useMemo(() => [
        { title: "Promotions This Year", value: stats.promotions_this_year || 0, icon: <ArrowTrendingUpIcon className="w-5 h-5" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Transfers This Year", value: stats.transfers_this_year || 0, icon: <ArrowPathIcon className="w-5 h-5" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Salary Changes", value: stats.compensation_changes || 0, icon: <CurrencyDollarIcon className="w-5 h-5" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Avg Increase", value: `${stats.avg_salary_increase || 0}%`, icon: <CurrencyDollarIcon className="w-5 h-5" />, color: "text-secondary", iconBg: "bg-secondary/20" },
    ], [stats]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'compensations'
                ? 'hrm.employee-history.compensations'
                : activeTab === 'promotions'
                    ? 'hrm.employee-history.promotions'
                    : 'hrm.employee-history.transfers';

            const response = await axios.get(route(endpoint), {
                params: { page: pagination.currentPage, perPage: pagination.perPage, ...filters }
            });
            if (response.status === 200) {
                setRecords(response.data.records || []);
                setPagination(prev => ({ ...prev, ...response.data.pagination }));
            }
        } catch (error) {
            showToast.error('Failed to fetch records');
        } finally {
            setLoading(false);
        }
    }, [activeTab, filters, pagination.currentPage, pagination.perPage]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleTabChange = (key) => {
        setActiveTab(key);
        setRecords([]);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Compensation columns
    const compensationColumns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'change_type', name: 'Type' },
        { uid: 'previous_salary', name: 'Previous' },
        { uid: 'new_salary', name: 'New' },
        { uid: 'change', name: 'Change' },
        { uid: 'effective_date', name: 'Effective' },
    ];

    const promotionColumns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'type', name: 'Type' },
        { uid: 'from', name: 'From' },
        { uid: 'to', name: 'To' },
        { uid: 'effective_date', name: 'Effective' },
    ];

    const transferColumns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'type', name: 'Type' },
        { uid: 'from', name: 'From' },
        { uid: 'to', name: 'To' },
        { uid: 'effective_date', name: 'Effective' },
    ];

    const renderCompensationCell = (item, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">{item.employee?.first_name} {item.employee?.last_name}</p>
                            <p className="text-xs text-default-500">{item.employee?.department?.name}</p>
                        </div>
                    </div>
                );
            case 'change_type':
                return <Chip size="sm" variant="flat">{item.change_type?.replace('_', ' ')}</Chip>;
            case 'previous_salary':
                return <span>${item.previous_salary?.toLocaleString()}</span>;
            case 'new_salary':
                return <span className="font-semibold">${item.new_salary?.toLocaleString()}</span>;
            case 'change':
                const isPositive = item.change_amount > 0;
                return (
                    <span className={isPositive ? 'text-success' : 'text-danger'}>
                        {isPositive ? '+' : ''}{item.change_percentage?.toFixed(1)}%
                    </span>
                );
            case 'effective_date':
                return <span>{new Date(item.effective_date).toLocaleDateString()}</span>;
            default:
                return item[columnKey];
        }
    };

    const renderPromotionCell = (item, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                            <ArrowTrendingUpIcon className="w-4 h-4 text-success" />
                        </div>
                        <div>
                            <p className="font-medium">{item.employee?.first_name} {item.employee?.last_name}</p>
                        </div>
                    </div>
                );
            case 'type':
                return <Chip size="sm" variant="flat" color="success">{item.promotion_type}</Chip>;
            case 'from':
                return <span className="text-default-500">{item.previous_designation?.title || '-'}</span>;
            case 'to':
                return <span className="font-medium">{item.new_designation?.title || '-'}</span>;
            case 'effective_date':
                return <span>{new Date(item.effective_date).toLocaleDateString()}</span>;
            default:
                return item[columnKey];
        }
    };

    const renderTransferCell = (item, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <ArrowPathIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">{item.employee?.first_name} {item.employee?.last_name}</p>
                        </div>
                    </div>
                );
            case 'type':
                return <Chip size="sm" variant="flat" color="primary">{item.transfer_type}</Chip>;
            case 'from':
                return <span className="text-default-500">{item.from_department?.name || item.from_location || '-'}</span>;
            case 'to':
                return <span className="font-medium">{item.to_department?.name || item.to_location || '-'}</span>;
            case 'effective_date':
                return <span>{new Date(item.effective_date).toLocaleDateString()}</span>;
            default:
                return item[columnKey];
        }
    };

    const columns = activeTab === 'compensations' ? compensationColumns : activeTab === 'promotions' ? promotionColumns : transferColumns;
    const renderCell = activeTab === 'compensations' ? renderCompensationCell : activeTab === 'promotions' ? renderPromotionCell : renderTransferCell;

    return (
        <>
            <Head title={title} />

            <div className="flex flex-col w-full h-full p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                    <Card className="transition-all duration-200" style={{
                        border: `var(--borderWidth, 2px) solid transparent`,
                        borderRadius: `var(--borderRadius, 12px)`,
                        background: `linear-gradient(135deg, var(--theme-content1, #FAFAFA) 20%, var(--theme-content2, #F4F4F5) 10%, var(--theme-content3, #F1F3F4) 20%)`,
                    }}>
                        <CardHeader className="border-b p-0" style={{ borderColor: `var(--theme-divider, #E4E4E7)` }}>
                            <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl" style={{ background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)` }}>
                                            <ArrowTrendingUpIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-bold">Employee History</h4>
                                            <p className="text-sm text-default-500">Track compensation, promotions & transfers</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardBody className="p-6">
                            <StatsCards stats={statsData} className="mb-6" />

                            {/* Tabs */}
                            <Tabs
                                selectedKey={activeTab}
                                onSelectionChange={handleTabChange}
                                className="mb-6"
                                color="primary"
                            >
                                <Tab
                                    key="compensations"
                                    title={
                                        <div className="flex items-center gap-2">
                                            <CurrencyDollarIcon className="w-4 h-4" />
                                            <span>Compensation</span>
                                        </div>
                                    }
                                />
                                <Tab
                                    key="promotions"
                                    title={
                                        <div className="flex items-center gap-2">
                                            <ArrowTrendingUpIcon className="w-4 h-4" />
                                            <span>Promotions</span>
                                        </div>
                                    }
                                />
                                <Tab
                                    key="transfers"
                                    title={
                                        <div className="flex items-center gap-2">
                                            <ArrowPathIcon className="w-4 h-4" />
                                            <span>Transfers</span>
                                        </div>
                                    }
                                />
                            </Tabs>

                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <Input placeholder="Search employees..." value={filters.search} onValueChange={(v) => handleFilterChange('search', v)}
                                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />} className="sm:max-w-xs" />

                                {activeTab === 'compensations' && (
                                    <Select placeholder="All Types" selectedKeys={filters.change_type ? [filters.change_type] : []}
                                        onSelectionChange={(keys) => handleFilterChange('change_type', Array.from(keys)[0] || '')} className="sm:max-w-xs">
                                        <SelectItem key="annual_increase">Annual Increase</SelectItem>
                                        <SelectItem key="promotion">Promotion</SelectItem>
                                        <SelectItem key="market_adjustment">Market Adjustment</SelectItem>
                                        <SelectItem key="merit_increase">Merit Increase</SelectItem>
                                        <SelectItem key="bonus">Bonus</SelectItem>
                                    </Select>
                                )}

                                {activeTab === 'promotions' && (
                                    <Select placeholder="All Types" selectedKeys={filters.promotion_type ? [filters.promotion_type] : []}
                                        onSelectionChange={(keys) => handleFilterChange('promotion_type', Array.from(keys)[0] || '')} className="sm:max-w-xs">
                                        <SelectItem key="vertical">Vertical</SelectItem>
                                        <SelectItem key="lateral">Lateral</SelectItem>
                                        <SelectItem key="dry">Dry (Title only)</SelectItem>
                                        <SelectItem key="grade">Grade</SelectItem>
                                    </Select>
                                )}

                                {activeTab === 'transfers' && (
                                    <Select placeholder="All Types" selectedKeys={filters.transfer_type ? [filters.transfer_type] : []}
                                        onSelectionChange={(keys) => handleFilterChange('transfer_type', Array.from(keys)[0] || '')} className="sm:max-w-xs">
                                        <SelectItem key="department">Department</SelectItem>
                                        <SelectItem key="location">Location</SelectItem>
                                        <SelectItem key="branch">Branch</SelectItem>
                                        <SelectItem key="international">International</SelectItem>
                                        <SelectItem key="project">Project</SelectItem>
                                    </Select>
                                )}
                            </div>

                            {loading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex gap-4">
                                            <Skeleton className="h-12 w-12 rounded-lg" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-3/4 rounded" />
                                                <Skeleton className="h-3 w-1/2 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Table aria-label={`${activeTab} History`} classNames={{ wrapper: "shadow-none border border-divider rounded-lg", th: "bg-default-100", td: "py-3" }}>
                                    <TableHeader columns={columns}>
                                        {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                                    </TableHeader>
                                    <TableBody items={records} emptyContent="No records found">
                                        {(item) => <TableRow key={item.id}>{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>}
                                    </TableBody>
                                </Table>
                            )}

                            {pagination.lastPage > 1 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination total={pagination.lastPage} page={pagination.currentPage}
                                        onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))} showControls />
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

EmployeeHistoryIndex.layout = (page) => <App children={page} />;
export default EmployeeHistoryIndex;
