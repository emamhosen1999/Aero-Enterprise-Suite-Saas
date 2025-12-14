import React, {useCallback, useMemo, useState} from 'react';
import {Head, router} from '@inertiajs/react';
import {route} from 'ziggy-js';
import {motion} from 'framer-motion';
import {
    AdjustmentsHorizontalIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentArrowDownIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    PresentationChartLineIcon,
    UserGroupIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Input,
    Pagination,
    Progress,
    ScrollShadow,
    Select,
    SelectItem,
    Skeleton,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Tabs
} from "@heroui/react";
import StatsCards from "@/Components/StatsCards.jsx";
import LeaveAnalytics from "@/Components/Leave/LeaveAnalytics.jsx";
import {useTheme} from '@/Context/ThemeContext.jsx';
import {useMediaQuery} from '@/Hooks/useMediaQuery.js';
import App from "@/Layouts/App.jsx";
import axios from 'axios';

const LeaveSummary = ({ title, summaryData }) => {
    const { theme } = useTheme();
    const isMobile = useMediaQuery('(max-width: 640px)');
    const isLargeScreen = useMediaQuery('(min-width: 1025px)');
    const isMediumScreen = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
    
    // Theme radius helper function (matching DailyWorksTable)
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        
        const radiusValue = parseInt(getComputedStyle(document.documentElement)
            .getPropertyValue('--borderRadius')?.trim() || '12');
        
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };
    
    // Destructure summary data
    const {
        users = [],
        departments = [],
        leave_types = [],
        columns = [],
        data = [],
        department_summary = [],
        stats = {},
        year = new Date().getFullYear(),
        filters: initialFilters = {}
    } = summaryData || {};

    // State management
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedTab, setSelectedTab] = useState('employee');
    const [searchValue, setSearchValue] = useState('');
    const [currentFilters, setCurrentFilters] = useState({
        year: year,
        department_id: '',
        status: '',
        ...initialFilters
    });
    const [filters, setFilters] = useState({
        employee_name: '',
        department: [],
        start_date: '',
        end_date: '',
        ...initialFilters
    });
    
    // Pagination
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    // Filter data based on search
    const filteredData = useMemo(() => {
        let filtered = data;
        
        if (searchValue) {
            filtered = filtered.filter(row => 
                row.employee_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
                row.department?.toLowerCase().includes(searchValue.toLowerCase())
            );
        }
        
        if (filters.department && filters.department.length > 0) {
            filtered = filtered.filter(row => 
                filters.department.includes(row.department)
            );
        }
        
        return filtered;
    }, [data, searchValue, filters.department]);

    // Paginated data
    const paginatedData = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredData.slice(start, end);
    }, [filteredData, page, rowsPerPage]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    // Statistics data for cards
    const statsData = useMemo(() => [
        {
            title: 'Total Employees',
            value: stats.total_employees || 0,
            icon: <UserGroupIcon className="w-5 h-5" />,
            color: 'text-blue-400',
            iconBg: 'bg-blue-500/20',
            description: 'Active employees'
        },
        {
            title: 'Approved Leaves',
            value: stats.total_approved_leaves || 0,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: 'text-green-400',
            iconBg: 'bg-green-500/20',
            description: 'Total approved days'
        },
        {
            title: 'Pending Leaves',
            value: stats.total_pending_leaves || 0,
            icon: <ClockIcon className="w-5 h-5" />,
            color: 'text-orange-400',
            iconBg: 'bg-orange-500/20',
            description: 'Awaiting approval'
        },
        {
            title: 'Departments',
            value: stats.departments_count || 0,
            icon: <BuildingOfficeIcon className="w-5 h-5" />,
            color: 'text-purple-400',
            iconBg: 'bg-purple-500/20',
            description: 'Active departments'
        }
    ], [stats]);

    // Handle filter changes
    const handleFilterChange = useCallback((key, value) => {
        const newFilters = { ...currentFilters, [key]: value };
        setCurrentFilters(newFilters);
        fetchSummaryData(newFilters);
    }, [currentFilters]);

    const fetchSummaryData = useCallback((filters) => {
        setLoading(true);
        router.get(window.location.pathname, filters, {
            preserveState: true,
            replace: true,
            onFinish: () => setLoading(false),
        });
    }, []);

    const clearFilters = useCallback(() => {
        const defaultFilters = { year: new Date().getFullYear() };
        setCurrentFilters(defaultFilters);
        setSearchValue('');
        fetchSummaryData(defaultFilters);
    }, []);

    // Export functions
    const exportExcel = useCallback(async () => {
        setDownloading('excel');
        try {
            const response = await axios.get(route('leave.summary.exportExcel'), {
                params: currentFilters,
                responseType: 'blob'
            });
            
            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `Leave_Summary_${currentFilters.year || year}.xlsx`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setDownloading('');
        } catch (error) {
            console.error('Error downloading Excel:', error);
            alert('Failed to download leave summary excel.');
            setDownloading('');
        }
    }, [currentFilters, year]);

    const exportPDF = useCallback(async () => {
        setDownloading('pdf');
        try {
            const response = await axios.get(route('leave.summary.exportPdf'), {
                params: currentFilters,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `Leave_Summary_${currentFilters.year || year}.pdf`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setDownloading('');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Failed to download leave summary PDF.');
            setDownloading('');
        }
    }, [currentFilters, year]);

    // Enhanced Loading Skeleton for Tables
    const TableLoadingSkeleton = ({ rows = 8, columns = 6 }) => {
        return (
            <div className="space-y-3">
                {/* Table header skeleton */}
                <div className="bg-default-100/80 backdrop-blur-md border-b border-divider rounded-t-lg">
                    <div className="flex p-3">
                        {Array.from({ length: columns }).map((_, index) => (
                            <div key={index} className="flex-1 px-3">
                                <Skeleton className="w-20 h-4 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Table body skeleton */}
                <div className="divide-y divide-divider border rounded-b-lg">
                    {Array.from({ length: rows }).map((_, index) => (
                        <div key={index} className="flex hover:bg-default-50/50 transition-colors p-3">
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <div key={colIndex} className="flex-1 px-3">
                                    <Skeleton className="w-full h-4 rounded" />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render employee cell content
    const renderEmployeeCell = useCallback((employee, columnKey) => {
      
        const cellValue = employee[columnKey];

        switch (columnKey) {
            case "employee_name":
                return (
                    <div className="flex items-center gap-2 min-w-0 whitespace-nowrap" style={{ maxWidth: "200px", width: "200px" }}>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-medium text-foreground truncate whitespace-nowrap" title={employee.employee_name}>
                                {employee.employee_name}
                            </span>
                            {employee.department && (
                                <span className="text-xs text-default-400 truncate whitespace-nowrap" title={employee.department}>
                                    {employee.department}
                                </span>
                            )}
                        </div>
                    </div>
                );
            
            case "total_approved":
            case "total_pending":
            case "total_rejected":
                const colorMap = {
                    total_approved: 'success',
                    total_pending: 'warning',
                    total_rejected: 'danger'
                };
                return cellValue > 0 ? (
                    <Chip
                        size="sm"
                        variant="flat"
                        color={colorMap[columnKey]}
                        className="min-w-12"
                    >
                        {cellValue}
                    </Chip>
                ) : '';

            case "usage_percentage":
                const percentage = cellValue || 0;
                const color = percentage > 80 ? 'danger' : percentage > 60 ? 'warning' : 'success';
                return (
                    <div className="flex flex-col items-center gap-1">
                        <Progress
                            size="sm"
                            value={percentage}
                            color={color}
                            className="w-16"
                            aria-label={`Leave usage percentage: ${percentage}%`}
                        />
                        <span className="text-tiny">{percentage}%</span>
                    </div>
                );

            case "total_balance":
                return (
                    <div className="text-center">
                        <span className={cellValue < 5 ? 'text-danger' : 'text-foreground'}>
                            {cellValue}
                        </span>
                    </div>
                );

            default:
                // Handle leave type used/remaining columns
                if (columnKey.endsWith('_used')) {
                    return cellValue > 0 ? (
                        <Chip
                            size="sm"
                            variant="flat"
                            color="success"
                            className="min-w-10"
                        >
                            {cellValue}
                        </Chip>
                    ) : '';
                }
                
                if (columnKey.endsWith('_remaining')) {
                    return cellValue > 0 ? (
                        <Chip
                            size="sm"
                            variant="flat"
                            color="primary"
                            className="min-w-10"
                        >
                            {cellValue}
                        </Chip>
                    ) : (
                        <span className="text-xs text-danger">0</span>
                    );
                }
                
                return cellValue !== undefined && cellValue !== null && cellValue !== '' ? cellValue : '';
        }
    }, []);

    // Generate years for dropdown
    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 10 }, (_, i) => currentYear - i);
    }, []);

    return (
        <>
            <Head title={title} />
            
            <div 
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Leave Summary"
            >
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
                                        <div className="flex flex-col space-y-4">
                                            {/* Main Header Content */}
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                {/* Title Section */}
                                                <div className="flex items-center gap-3 lg:gap-4">
                                                    <div 
                                                        className={`
                                                            ${!isMobile ? 'p-3' : 'p-2'} 
                                                            rounded-xl flex items-center justify-center
                                                        `}
                                                        style={{
                                                            background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                            borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                            borderWidth: `var(--borderWidth, 2px)`,
                                                            borderRadius: `var(--borderRadius, 12px)`,
                                                        }}
                                                    >
                                                        <PresentationChartLineIcon 
                                                            className={`
                                                                ${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}
                                                            `}
                                                            style={{ color: 'var(--theme-primary)' }}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 
                                                            className={`
                                                                ${!isMobile ? 'text-2xl' : 'text-xl'}
                                                                font-bold text-foreground
                                                                ${isMobile ? 'truncate' : ''}
                                                            `}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Leave Summary
                                                        </h4>
                                                        <p 
                                                            className={`
                                                                ${!isMobile ? 'text-sm' : 'text-xs'} 
                                                                text-default-500
                                                                ${isMobile ? 'truncate' : ''}
                                                            `}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Employee leave analytics and reporting
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {/* Action Buttons */}
                                                <div className="flex gap-2 flex-wrap">
                                                   
                                                    
                                                    {/* Export Buttons */}
                                                    <Button
                                                        color="success"
                                                        variant="flat"
                                                        onPress={exportExcel}
                                                        startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                                        size={isMobile ? "sm" : "md"}
                                                        radius={getThemeRadius()}
                                                        isDisabled={loading || filteredData.length === 0 || downloading !== ''}
                                                        isLoading={downloading === 'excel'}
                                                        className="font-semibold"
                                                        aria-label="Export leave summary as Excel file"
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        {isMobile ? 'XLS' : 'Excel'}
                                                    </Button>
                                                    <Button
                                                        color="danger"
                                                        variant="flat"
                                                        onPress={exportPDF}
                                                        startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                                        size={isMobile ? "sm" : "md"}
                                                        radius={getThemeRadius()}
                                                        isDisabled={loading || filteredData.length === 0 || downloading !== ''}
                                                        isLoading={downloading === 'pdf'}
                                                        className="font-semibold"
                                                        aria-label="Export leave summary as PDF file"
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        PDF
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Enhanced Stats */}
                                    <StatsCards stats={statsData} className="mb-6" isLoading={loading} />
                                        
                                    {/* Enhanced Filters Section - Compact and Consistent */}
                                    <div className="space-y-3 mb-6">
                                        {/* Search Bar */}
                                        <div className="flex flex-col lg:flex-row gap-3">
                                            <div className="flex-1">
                                                <Input
                                                    label="Search Employees"
                                                    placeholder="Search by name or department..."
                                                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                                    value={searchValue}
                                                    onChange={(e) => setSearchValue(e.target.value)}
                                                    variant="bordered"
                                                    size="sm"
                                                    radius={getThemeRadius()}
                                                    aria-label="Search employees by name or department"
                                                    classNames={{
                                                        base: "max-w-full",
                                                        mainWrapper: "h-full",
                                                        input: "text-xs",
                                                        inputWrapper: "h-10 font-normal text-default-500 bg-default-50/50 border-default-200 hover:border-default-300 focus-within:border-primary-500 transition-colors",
                                                        label: "text-xs text-default-600 font-medium",
                                                    }}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                />
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <div className="hidden lg:flex items-center gap-2 px-2 py-1 text-default-500">
                                                    <FunnelIcon className="w-3 h-3" />
                                                    <span className="text-xs font-medium">Quick Filters:</span>
                                                </div>
                                                <Button
                                                    color={showFilters ? 'primary' : 'default'}
                                                    variant={showFilters ? 'flat' : 'bordered'}
                                                    onPress={() => setShowFilters(!showFilters)}
                                                    startContent={<AdjustmentsHorizontalIcon className="w-3 h-3" />}
                                                    size="sm"
                                                    radius={getThemeRadius()}
                                                    aria-label={showFilters ? 'Hide filters panel' : 'Show filters panel'}
                                                    className={showFilters 
                                                        ? 'bg-primary-50 border-primary-200 text-primary-700 font-medium h-10 text-xs' 
                                                        : 'bg-default-50 border-default-200 text-default-600 hover:bg-default-100 font-medium h-10 text-xs'
                                                    }
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                >
                                                    {isMobile ? '' : 'Filters'}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Advanced Filters Panel */}
                                        {showFilters && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0, y: -10 }}
                                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                                exit={{ opacity: 0, height: 0, y: -10 }}
                                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-default-50/50 backdrop-blur-sm border border-default-200 p-4 space-y-4" 
                                                     style={{ borderRadius: `var(--borderRadius, 8px)` }}>
                                                    {/* Filter Grid */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        <Select
                                                            label="Year"
                                                            placeholder="Select year"
                                                            variant="bordered"
                                                            size="sm"
                                                            radius={getThemeRadius()}
                                                            selectedKeys={[String(currentFilters.year || year)]}
                                                            onSelectionChange={(keys) => {
                                                                const selectedYear = Array.from(keys)[0];
                                                                if (selectedYear) {
                                                                    handleFilterChange('year', parseInt(selectedYear));
                                                                }
                                                            }}
                                                            aria-label="Filter by year"
                                                            classNames={{
                                                                base: "max-w-full",
                                                                trigger: "h-9 bg-default-50/50 border-default-200 hover:border-default-300 focus:border-primary-500 transition-colors",
                                                                label: "text-xs text-default-600 font-medium",
                                                                value: "text-xs text-default-700 font-medium",
                                                                popoverContent: "bg-background/95 backdrop-blur-lg border-default-200 shadow-sm",
                                                                listbox: "text-xs",
                                                            }}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            {years.map((yr) => (
                                                                <SelectItem key={yr} value={yr} textValue={String(yr)} className="text-xs font-medium">
                                                                    {yr}
                                                                </SelectItem>
                                                            ))}
                                                        </Select>

                                                        <Select
                                                            label="Department"
                                                            placeholder="Select department"
                                                            variant="bordered"
                                                            size="sm"
                                                            radius={getThemeRadius()}
                                                            selectedKeys={currentFilters.department_id ? [String(currentFilters.department_id)] : []}
                                                            onSelectionChange={(keys) => {
                                                                const deptId = Array.from(keys)[0];
                                                                handleFilterChange('department_id', deptId || null);
                                                            }}
                                                            aria-label="Filter by department"
                                                            classNames={{
                                                                base: "max-w-full",
                                                                trigger: "h-9 bg-default-50/50 border-default-200 hover:border-default-300 focus:border-primary-500 transition-colors",
                                                                label: "text-xs text-default-600 font-medium",
                                                                value: "text-xs text-default-700 font-medium",
                                                                popoverContent: "bg-background/95 backdrop-blur-lg border-default-200 shadow-sm",
                                                                listbox: "text-xs",
                                                            }}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            <SelectItem key="" value="" textValue="All Departments" className="text-xs font-medium">
                                                                All Departments
                                                            </SelectItem>
                                                            {departments.map((dept) => (
                                                                <SelectItem key={dept.id} value={dept.id} textValue={dept.name} className="text-xs font-medium">
                                                                    {dept.name}
                                                                </SelectItem>
                                                            ))}
                                                        </Select>

                                                        <Select
                                                            label="Leave Status"
                                                            placeholder="Select status"
                                                            variant="bordered"
                                                            size="sm"
                                                            radius={getThemeRadius()}
                                                            selectedKeys={currentFilters.status ? [currentFilters.status] : []}
                                                            onSelectionChange={(keys) => {
                                                                const status = Array.from(keys)[0];
                                                                handleFilterChange('status', status || null);
                                                            }}
                                                            aria-label="Filter by leave status"
                                                            classNames={{
                                                                base: "max-w-full",
                                                                trigger: "h-9 bg-default-50/50 border-default-200 hover:border-default-300 focus:border-primary-500 transition-colors",
                                                                label: "text-xs text-default-600 font-medium",
                                                                value: "text-xs text-default-700 font-medium",
                                                                popoverContent: "bg-background/95 backdrop-blur-lg border-default-200 shadow-sm",
                                                                listbox: "text-xs",
                                                            }}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            <SelectItem key="" value="" textValue="All Status" className="text-xs font-medium">All Status</SelectItem>
                                                            <SelectItem key="Approved" value="Approved" textValue="Approved" className="text-xs font-medium">Approved</SelectItem>
                                                            <SelectItem key="Pending" value="Pending" textValue="Pending" className="text-xs font-medium">Pending</SelectItem>
                                                            <SelectItem key="Declined" value="Declined" textValue="Declined" className="text-xs font-medium">Declined</SelectItem>
                                                        </Select>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex justify-between items-center pt-3 border-t border-default-200">
                                                        <div className="text-xs text-default-500 font-medium">
                                                            Showing filtered results for {String(currentFilters.year || year)}
                                                        </div>
                                                        <Button
                                                            color="primary"
                                                            variant="flat"
                                                            onPress={clearFilters}
                                                            size="sm"
                                                            radius={getThemeRadius()}
                                                            startContent={<XCircleIcon className="w-3 h-3" />}
                                                            className="bg-primary-50 text-primary-700 border-primary-200 font-medium hover:bg-primary-100 h-8 text-xs"
                                                            aria-label="Clear all applied filters"
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Clear Filters
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Tab Navigation and Content */}
                                    <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-6" style={{
                                        border: `var(--borderWidth, 1px) solid var(--theme-divider, rgba(255, 255, 255, 0.1))`,
                                        borderRadius: `var(--borderRadius, 12px)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        {/* Tab Navigation */}
                                        <div className="mb-6">
                                            <Tabs
                                                selectedKey={selectedTab}
                                                onSelectionChange={setSelectedTab}
                                                variant="underlined"
                                                radius={getThemeRadius()}
                                                aria-label="Leave summary view options"
                                                classNames={{
                                                    tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                                                    cursor: "w-full bg-primary",
                                                    tab: "max-w-fit px-0 h-12",
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            >
                                                <Tab
                                                    key="employee"
                                                    title={
                                                        <div className="flex items-center space-x-2">
                                                            <UserGroupIcon className="w-4 h-4" />
                                                            <span>Employee Summary</span>
                                                        </div>
                                                    }
                                                />
                                                <Tab
                                                    key="department"
                                                    title={
                                                        <div className="flex items-center space-x-2">
                                                            <BuildingOfficeIcon className="w-4 h-4" />
                                                            <span>Department Summary</span>
                                                        </div>
                                                    }
                                                />
                                                <Tab
                                                    key="analytics"
                                                    title={
                                                        <div className="flex items-center space-x-2">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                                            </svg>
                                                            <span>Analytics</span>
                                                        </div>
                                                    }
                                                />
                                            </Tabs>
                                        </div>

                                        {/* Content based on selected tab */}
                                        {selectedTab === 'analytics' ? (
                                            <div className="mt-4">
                                                <LeaveAnalytics
                                                    year={year}
                                                    departmentId={currentFilters.department_id}
                                                    departments={departments}
                                                />
                                            </div>
                                        ) : selectedTab === 'employee' ? (
                                            <div className="space-y-4">
                                                {/* Results count */}
                                                <div className="flex justify-between items-center">
                                                    <span className="text-default-400 text-small">
                                                        Total {filteredData.length} employees
                                                        {searchValue && ` (filtered from ${data.length})`}
                                                    </span>
                                                    <div className="flex gap-2 items-center">
                                                        <span className="text-tiny text-default-400">Rows per page:</span>
                                                        <Select
                                                            size="sm"
                                                            selectedKeys={[String(rowsPerPage)]}
                                                            onSelectionChange={(keys) => {
                                                                const newRowsPerPage = Number(Array.from(keys)[0]);
                                                                setRowsPerPage(newRowsPerPage);
                                                                setPage(1);
                                                            }}
                                                            className="w-20"
                                                            classNames={{
                                                                trigger: "bg-white/10 backdrop-blur-md border-white/20",
                                                            }}
                                                        >
                                                            <SelectItem key="10" value="10" textValue="10">10</SelectItem>
                                                            <SelectItem key="15" value="15" textValue="15">15</SelectItem>
                                                            <SelectItem key="25" value="25" textValue="25">25</SelectItem>
                                                            <SelectItem key="50" value="50" textValue="50">50</SelectItem>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {/* Employee Summary Table */}
                                                {loading ? (
                                                    <TableLoadingSkeleton rows={10} columns={17} />
                                                ) : filteredData.length > 0 ? (
                                                    <>
                                                        <ScrollShadow className="max-h-[70vh]">
                                                            <Table
                                                                selectionMode="none"
                                                                isCompact
                                                                removeWrapper
                                                                isStriped
                                                                aria-label="Employee leave summary table"
                                                                isHeaderSticky
                                                                radius={getThemeRadius()}
                                                            classNames={{
                                                                base: "max-h-[520px] overflow-auto",
                                                                table: "min-h-[200px] w-full table-fixed border border-default-200",
                                                                thead: "z-10",
                                                                tbody: "overflow-y-auto",
                                                                th: "bg-default-100 text-default-700 font-semibold text-xs whitespace-nowrap border-b border-r border-default-200",
                                                                td: "text-default-600 text-xs whitespace-nowrap px-2 py-1 border-b border-r border-default-200",
                                                                tr: "hover:bg-default-50/50 transition-colors h-10",
                                                            }}
                                                            style={{
                                                                borderRadius: `var(--borderRadius, 12px)`,
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            <TableHeader>
                                                                <TableColumn 
                                                                    key="employee_name" 
                                                                    align="start"
                                                                    className="bg-default-100/80 backdrop-blur-md"
                                                                    style={{ minWidth: "200px", maxWidth: "200px", width: "200px" }}
                                                                >
                                                                    <div className="flex items-center gap-1 justify-start">
                                                                        <UserGroupIcon className="w-3 h-3" />
                                                                        <span className="text-xs font-semibold">Employee</span>
                                                                    </div>
                                                                </TableColumn>
                                                                <TableColumn key="JAN" align="center" className="bg-default-100/80 backdrop-blur-md" style={{ minWidth: "60px", maxWidth: "60px", width: "60px" }}>
                                                                    <span className="text-xs font-semibold">JAN</span>
                                                                </TableColumn>
                                                                <TableColumn key="FEB" align="center" className="bg-default-100/80 backdrop-blur-md" style={{ minWidth: "60px", maxWidth: "60px", width: "60px" }}>
                                                                    <span className="text-xs font-semibold">FEB</span>
                                                                </TableColumn>
                                                                <TableColumn key="MAR" align="center" className="bg-default-100/80 backdrop-blur-md" style={{ minWidth: "60px", maxWidth: "60px", width: "60px" }}>
                                                                    <span className="text-xs font-semibold">MAR</span>
                                                                </TableColumn>
                                                                <TableColumn key="APR" align="center" className="bg-default-100/80 backdrop-blur-md" style={{ minWidth: "60px", maxWidth: "60px", width: "60px" }}>
                                                                    <span className="text-xs font-semibold">APR</span>
                                                                </TableColumn>
                                                                <TableColumn key="MAY" align="center" className="bg-default-100/80 backdrop-blur-md" style={{ minWidth: "60px", maxWidth: "60px", width: "60px" }}>
                                                                    <span className="text-xs font-semibold">MAY</span>
                                                                </TableColumn>
                                                                <TableColumn key="JUN" align="center" className="bg-default-100/80 backdrop-blur-md" style={{ minWidth: "60px", maxWidth: "60px", width: "60px" }}>
                                                                    <span className="text-xs font-semibold">JUN</span>
                                                                </TableColumn>
                                                                <TableColumn key="JUL" align="center" className="bg-default-100/80 backdrop-blur-md" style={{ minWidth: "60px", maxWidth: "60px", width: "60px" }}>
                                                                    <span className="text-xs font-semibold">JUL</span>
                                                                </TableColumn>
                                                                <TableColumn key="AUG" align="center" className="bg-default-100/80 backdrop-blur-md" style={{ minWidth: "60px", maxWidth: "60px", width: "60px" }}>
                                                                    <span className="text-xs font-semibold">AUG</span>
                                                                </TableColumn>
                                                                <TableColumn key="SEP" align="center" className="bg-default-100/80 backdrop-blur-md" style={{ minWidth: "60px", maxWidth: "60px", width: "60px" }}>
                                                                    <span className="text-xs font-semibold">SEP</span>
                                                                </TableColumn>
                                                                <TableColumn key="OCT" align="center" className="bg-default-100/80 backdrop-blur-md" style={{ minWidth: "60px", maxWidth: "60px", width: "60px" }}>
                                                                    <span className="text-xs font-semibold">OCT</span>
                                                                </TableColumn>
                                                                <TableColumn key="NOV" align="center" className="bg-default-100/80 backdrop-blur-md" style={{ minWidth: "60px", maxWidth: "60px", width: "60px" }}>
                                                                    <span className="text-xs font-semibold">NOV</span>
                                                                </TableColumn>
                                                                <TableColumn key="DEC" align="center" className="bg-default-100/80 backdrop-blur-md" style={{ minWidth: "60px", maxWidth: "60px", width: "60px" }}>
                                                                    <span className="text-xs font-semibold">DEC</span>
                                                                </TableColumn>
                                                                <TableColumn key="total_approved" align="center" className="bg-default-100/80 backdrop-blur-md" style={{ minWidth: "80px", maxWidth: "80px", width: "80px" }}>
                                                                    <div className="flex items-center gap-1 justify-center">
                                                                        <CheckCircleIcon className="w-3 h-3" />
                                                                        <span className="text-xs font-semibold">Approved</span>
                                                                    </div>
                                                                </TableColumn>
                                                                <TableColumn key="total_pending" align="center" className="bg-default-100/80 backdrop-blur-md" style={{ minWidth: "80px", maxWidth: "80px", width: "80px" }}>
                                                                    <div className="flex items-center gap-1 justify-center">
                                                                        <ClockIcon className="w-3 h-3" />
                                                                        <span className="text-xs font-semibold">Pending</span>
                                                                    </div>
                                                                </TableColumn>
                                                                {/* Dynamic Leave Type Columns */}
                                                                {leave_types.map((leaveType) => (
                                                                    <React.Fragment key={leaveType.id}>
                                                                        <TableColumn 
                                                                            key={`${leaveType.type}_used`} 
                                                                            align="center" 
                                                                            className="bg-default-100/80 backdrop-blur-md" 
                                                                            style={{ minWidth: "70px", maxWidth: "70px", width: "70px" }}
                                                                        >
                                                                            <div className="flex flex-col items-center gap-0">
                                                                                <span className="text-xs font-semibold">{leaveType.type}</span>
                                                                                <span className="text-xs text-success">Used</span>
                                                                            </div>
                                                                        </TableColumn>
                                                                        <TableColumn 
                                                                            key={`${leaveType.type}_remaining`} 
                                                                            align="center" 
                                                                            className="bg-default-100/80 backdrop-blur-md" 
                                                                            style={{ minWidth: "70px", maxWidth: "70px", width: "70px" }}
                                                                        >
                                                                            <div className="flex flex-col items-center gap-0">
                                                                                <span className="text-xs font-semibold">{leaveType.type}</span>
                                                                                <span className="text-xs text-primary">Remaining</span>
                                                                            </div>
                                                                        </TableColumn>
                                                                    </React.Fragment>
                                                                ))}
                                                                <TableColumn key="total_balance" align="center" className="bg-default-100/80 backdrop-blur-md" style={{ minWidth: "80px", maxWidth: "80px", width: "80px" }}>
                                                                    <span className="text-xs font-semibold">Balance</span>
                                                                </TableColumn>
                                                                <TableColumn key="usage_percentage" align="center" className="bg-default-100/80 backdrop-blur-md" style={{ minWidth: "80px", maxWidth: "80px", width: "80px" }}>
                                                                    <span className="text-xs font-semibold">Usage</span>
                                                                </TableColumn>
                                                            </TableHeader>
                                                            <TableBody items={paginatedData}>
                                                                {(item) => (
                                                                    <TableRow key={item.id}>
                                                                        {(columnKey) => (
                                                                            <TableCell className="whitespace-nowrap">
                                                                                {renderEmployeeCell(item, columnKey)}
                                                                            </TableCell>
                                                                        )}
                                                                    </TableRow>
                                                                )}
                                                            </TableBody>
                                                        </Table>

                                                        {/* Pagination */}
                                                        {totalPages > 1 && (
                                                            <div className="py-4 flex justify-center">
                                                                <Pagination
                                                                    showControls
                                                                    showShadow
                                                                    color="primary"
                                                                    variant="bordered"
                                                                    page={page}
                                                                    total={totalPages}
                                                                    onChange={setPage}
                                                                    size={isMobile ? "sm" : "md"}
                                                                    radius={getThemeRadius()}
                                                                    aria-label={`Pagination navigation for leave summary, page ${page} of ${totalPages}`}
                                                                    classNames={{
                                                                        wrapper: "bg-content1/80 backdrop-blur-md border-divider/50",
                                                                        item: "bg-content1/50 border-divider/30",
                                                                        cursor: "bg-primary/20 backdrop-blur-md"
                                                                    }}
                                                                    style={{
                                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                        </ScrollShadow>
                                                    </>
                                                ) : (
                                                    <Card 
                                                        className="bg-white/5 backdrop-blur-md border-white/10"
                                                        radius={getThemeRadius()}
                                                        style={{
                                                            border: `var(--borderWidth, 1px) solid var(--theme-divider, rgba(255, 255, 255, 0.1))`,
                                                            borderRadius: `var(--borderRadius, 12px)`,
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        <CardBody className="text-center py-12">
                                                            <PresentationChartLineIcon className="w-16 h-16 mx-auto mb-4 text-default-300" />
                                                            <h3 className="text-xl font-semibold mb-2 text-foreground" style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}>
                                                                No Leave Data Found
                                                            </h3>
                                                            <p className="text-default-500" style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}>
                                                                {searchValue 
                                                                    ? `No employees found matching "${searchValue}"`
                                                                    : `No leave summary data available for ${currentFilters.year || year}.`
                                                                }
                                                            </p>
                                                        </CardBody>
                                                    </Card>
                                                )}
                                            </div>
                                        ) : (
                                            /* Department Summary Tab */
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-semibold mb-4 text-white">
                                                    Department-wise Leave Summary
                                                </h3>
                                                
                                                {loading ? (
                                                    <TableLoadingSkeleton rows={6} columns={6} />
                                                ) : department_summary.length > 0 ? (
                                                    <ScrollShadow className="max-h-[70vh]">
                                                        <Table
                                                        selectionMode="none"
                                                        isCompact
                                                        removeWrapper
                                                        isStriped
                                                        aria-label="Department leave summary table"
                                                        isHeaderSticky
                                                        radius={getThemeRadius()}
                                                        classNames={{
                                                            base: "max-h-[520px] overflow-auto",
                                                            table: "min-h-[200px] w-full table-fixed border border-default-200",
                                                            thead: "z-10",
                                                            tbody: "overflow-y-auto",
                                                            th: "bg-default-100 text-default-700 font-semibold text-xs whitespace-nowrap border-b border-r border-default-200",
                                                            td: "text-default-600 text-xs whitespace-nowrap px-2 py-1 border-b border-r border-default-200",
                                                            tr: "hover:bg-default-50/50 transition-colors h-10",
                                                        }}
                                                        style={{
                                                            borderRadius: `var(--borderRadius, 12px)`,
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        <TableHeader>
                                                            <TableColumn 
                                                                align="start"
                                                                className="bg-default-100/80 backdrop-blur-md"
                                                                style={{ minWidth: "150px", maxWidth: "150px", width: "150px" }}
                                                            >
                                                                <div className="flex items-center gap-1 justify-start">
                                                                    <BuildingOfficeIcon className="w-3 h-3" />
                                                                    <span className="text-xs font-semibold">Department</span>
                                                                </div>
                                                            </TableColumn>
                                                            <TableColumn 
                                                                align="center"
                                                                className="bg-default-100/80 backdrop-blur-md"
                                                                style={{ minWidth: "80px", maxWidth: "80px", width: "80px" }}
                                                            >
                                                                <div className="flex items-center gap-1 justify-center">
                                                                    <UserGroupIcon className="w-3 h-3" />
                                                                    <span className="text-xs font-semibold">Employees</span>
                                                                </div>
                                                            </TableColumn>
                                                            <TableColumn 
                                                                align="center"
                                                                className="bg-default-100/80 backdrop-blur-md"
                                                                style={{ minWidth: "80px", maxWidth: "80px", width: "80px" }}
                                                            >
                                                                <span className="text-xs font-semibold">Total Leaves</span>
                                                            </TableColumn>
                                                            <TableColumn 
                                                                align="center"
                                                                className="bg-default-100/80 backdrop-blur-md"
                                                                style={{ minWidth: "80px", maxWidth: "80px", width: "80px" }}
                                                            >
                                                                <div className="flex items-center gap-1 justify-center">
                                                                    <CheckCircleIcon className="w-3 h-3" />
                                                                    <span className="text-xs font-semibold">Approved</span>
                                                                </div>
                                                            </TableColumn>
                                                            <TableColumn 
                                                                align="center"
                                                                className="bg-default-100/80 backdrop-blur-md"
                                                                style={{ minWidth: "80px", maxWidth: "80px", width: "80px" }}
                                                            >
                                                                <div className="flex items-center gap-1 justify-center">
                                                                    <ClockIcon className="w-3 h-3" />
                                                                    <span className="text-xs font-semibold">Pending</span>
                                                                </div>
                                                            </TableColumn>
                                                            <TableColumn 
                                                                align="center"
                                                                className="bg-default-100/80 backdrop-blur-md"
                                                                style={{ minWidth: "100px", maxWidth: "100px", width: "100px" }}
                                                            >
                                                                <span className="text-xs font-semibold">Avg per Employee</span>
                                                            </TableColumn>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {department_summary.map((dept, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-2 min-w-0" style={{ maxWidth: "150px" }}>
                                                                            <BuildingOfficeIcon className="w-3 h-3 text-default-400 flex-shrink-0" />
                                                                            <span className="text-sm font-medium truncate" title={dept.department}>
                                                                                {dept.department}
                                                                            </span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        <Chip size="sm" variant="flat" color="default">
                                                                            {dept.employee_count}
                                                                        </Chip>
                                                                    </TableCell>
                                                                    <TableCell className="text-center">{dept.total_leaves}</TableCell>
                                                                    <TableCell className="text-center">
                                                                        <Chip size="sm" variant="flat" color="success">
                                                                            {dept.total_approved}
                                                                        </Chip>
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        <Chip size="sm" variant="flat" color="warning">
                                                                            {dept.total_pending}
                                                                        </Chip>
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        {dept.avg_leaves_per_employee}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                    </ScrollShadow>
                                                ) : (
                                                    <Card className="bg-white/5 backdrop-blur-md border-white/10">
                                                        <CardBody className="text-center py-8">
                                                            <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-4 text-default-300" />
                                                            <p className="text-default-500" style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}>
                                                                No department data available
                                                            </p>
                                                        </CardBody>
                                                    </Card>
                                                )}
                                            </div>
                                        )}
                                    </div>
                         
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

LeaveSummary.layout = (page) => <App>{page}</App>;

export default LeaveSummary;
