import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Pagination, Spinner } from "@heroui/react";
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, EllipsisVerticalIcon, CloudIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const WeatherLogsIndex = ({ title }) => {
    const { auth } = usePage().props;
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
    // Theme radius helper
    const themeRadius = useThemeRadius();
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

    // State management
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [filters, setFilters] = useState({ 
        search: '', 
        weather_condition: 'all', 
        work_impact: 'all',
        date_from: '',
        date_to: ''
    });
    const [pagination, setPagination] = useState({ 
        perPage: 30, 
        currentPage: 1,
        total: 0,
        lastPage: 1
    });
    const [stats, setStats] = useState({ 
        total: 0, 
        suitableDays: 0, 
        minorDelays: 0, 
        majorDelays: 0, 
        workStopped: 0,
        avgTemp: 0
    });

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Logs", 
            value: stats.total, 
            icon: <CloudIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Work Suitable", 
            value: stats.suitableDays, 
            icon: <CloudIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Minor Delays", 
            value: stats.minorDelays, 
            icon: <CloudIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Major Delays", 
            value: stats.majorDelays, 
            icon: <CloudIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
        { 
            title: "Work Stopped", 
            value: stats.workStopped, 
            icon: <CloudIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
        { 
            title: "Avg Temperature", 
            value: `${stats.avgTemp.toFixed(1)}°C`, 
            icon: <CloudIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // Permission checks
    // Permissions using HRMAC
    // TODO: Update with correct HRMAC path once module hierarchy is defined for RFI
    const canCreateWeather = canCreate("rfi.weather-logs") || isSuperAdmin();
    const canEditWeather = canUpdate("rfi.weather-logs") || isSuperAdmin();
    const canDeleteWeather = canDelete("rfi.weather-logs") || isSuperAdmin();

    // Data fetching
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('rfi.weather-logs.index'), {
                params: {
                    page: pagination.currentPage,
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            
            if (response.status === 200) {
                setLogs(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
                
                // Update stats
                const data = response.data.data || [];
                setStats({
                    total: response.data.total || 0,
                    suitableDays: data.filter(log => log.work_impact === 'no_impact').length,
                    minorDelays: data.filter(log => log.work_impact === 'minor_delay').length,
                    majorDelays: data.filter(log => log.work_impact === 'major_delay').length,
                    workStopped: data.filter(log => log.work_impact === 'work_stopped').length,
                    avgTemp: data.length > 0 
                        ? data.reduce((sum, log) => sum + (parseFloat(log.temperature) || 0), 0) / data.length 
                        : 0
                });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch weather logs'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    // Action handlers
    const handleEdit = (log) => {
        console.log('Edit log:', log);
    };

    const handleDelete = async (log) => {
        if (!confirm(`Are you sure you want to delete weather log from ${new Date(log.log_date).toLocaleDateString()}?`)) return;
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('rfi.weather-logs.destroy', log.id));
                if (response.status === 200) {
                    await fetchLogs();
                    resolve([response.data.message || 'Weather log deleted successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete weather log']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting weather log...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Impact color map
    const impactColorMap = {
        no_impact: "success",
        minor_delay: "warning",
        major_delay: "danger",
        work_stopped: "danger"
    };

    // Table columns
    const columns = [
        { name: "DATE", uid: "date" },
        { name: "WEATHER", uid: "weather" },
        { name: "TEMPERATURE", uid: "temperature" },
        { name: "HUMIDITY", uid: "humidity" },
        { name: "WIND SPEED", uid: "wind" },
        { name: "PRECIPITATION", uid: "precipitation" },
        { name: "WORK IMPACT", uid: "impact" },
        { name: "ACTIONS", uid: "actions" },
    ];

    // Cell renderer
    const renderCell = useCallback((log, columnKey) => {
        const cellValue = log[columnKey];

        switch (columnKey) {
            case "date":
                return (
                    <span className="text-sm font-semibold">
                        {new Date(log.log_date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                        })}
                    </span>
                );
            case "weather":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm font-semibold capitalize">{log.weather_condition || '-'}</p>
                        {log.notes && (
                            <p className="text-xs text-default-500 truncate max-w-[150px]">{log.notes}</p>
                        )}
                    </div>
                );
            case "temperature":
                const temp = parseFloat(log.temperature || 0);
                return (
                    <span className="text-sm font-semibold">
                        {temp.toFixed(1)}°C
                    </span>
                );
            case "humidity":
                return (
                    <span className="text-sm">
                        {log.humidity ? `${log.humidity}%` : '-'}
                    </span>
                );
            case "wind":
                return (
                    <span className="text-sm">
                        {log.wind_speed ? `${log.wind_speed} km/h` : '-'}
                    </span>
                );
            case "precipitation":
                return (
                    <span className="text-sm">
                        {log.precipitation ? `${log.precipitation} mm` : '0 mm'}
                    </span>
                );
            case "impact":
                return (
                    <Chip
                        color={impactColorMap[log.work_impact] || 'default'}
                        size="sm"
                        variant="flat"
                    >
                        {log.work_impact ? log.work_impact.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                    </Chip>
                );
            case "actions":
                return (
                    <div className="flex items-center gap-2">
                        <Dropdown>
                            <DropdownTrigger>
                                <Button 
                                    isIconOnly 
                                    size="sm" 
                                    variant="light"
                                >
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Weather log actions">
                                {canEditWeather && (
                                    <DropdownItem 
                                        key="edit"
                                        startContent={<PencilIcon className="w-4 h-4" />}
                                        onPress={() => handleEdit(log)}
                                    >
                                        Edit
                                    </DropdownItem>
                                )}
                                {canDeleteWeather && (
                                    <DropdownItem 
                                        key="delete"
                                        className="text-danger" 
                                        color="danger"
                                        startContent={<TrashIcon className="w-4 h-4" />}
                                        onPress={() => handleDelete(log)}
                                    >
                                        Delete
                                    </DropdownItem>
                                )}
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return cellValue;
        }
    }, [canEdit, canDelete]);

    return (
        <>
            <Head title={title || "Weather Logs"} />
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Weather Logs Management">
                <div className="space-y-4">
                    <div className="w-full">
                        {/* Animated Card wrapper */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Main Card with theme styling */}
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
                                {/* Card Header with title + action buttons */}
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
                                            {/* Title Section with icon */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <CloudIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Weather Logs
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Track weather conditions and work impact
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateWeather && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => console.log('Add Weather Log')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Add Log
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
                                    {/* Filter Section */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Select
                                            label="Weather Condition"
                                            placeholder="All Conditions"
                                            selectedKeys={filters.weather_condition !== 'all' ? [filters.weather_condition] : []}
                                            onSelectionChange={(keys) => handleFilterChange('weather_condition', Array.from(keys)[0] || 'all')}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            classNames={{ trigger: "bg-default-100" }}
                                        >
                                            <SelectItem key="all">All Conditions</SelectItem>
                                            <SelectItem key="sunny">Sunny</SelectItem>
                                            <SelectItem key="cloudy">Cloudy</SelectItem>
                                            <SelectItem key="rainy">Rainy</SelectItem>
                                            <SelectItem key="stormy">Stormy</SelectItem>
                                            <SelectItem key="foggy">Foggy</SelectItem>
                                            <SelectItem key="snowy">Snowy</SelectItem>
                                        </Select>
                                        
                                        <Select
                                            label="Work Impact"
                                            placeholder="All Impact"
                                            selectedKeys={filters.work_impact !== 'all' ? [filters.work_impact] : []}
                                            onSelectionChange={(keys) => handleFilterChange('work_impact', Array.from(keys)[0] || 'all')}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            classNames={{ trigger: "bg-default-100" }}
                                        >
                                            <SelectItem key="all">All Impact</SelectItem>
                                            <SelectItem key="no_impact">No Impact</SelectItem>
                                            <SelectItem key="minor_delay">Minor Delay</SelectItem>
                                            <SelectItem key="major_delay">Major Delay</SelectItem>
                                            <SelectItem key="work_stopped">Work Stopped</SelectItem>
                                        </Select>
                                    </div>
                                    
                                    {/* Data Table */}
                                    {loading ? (
                                        <div className="flex justify-center py-10">
                                            <Spinner size="lg" />
                                        </div>
                                    ) : (
                                        <Table
                                            aria-label="Weather logs table"
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
                                                items={logs} 
                                                emptyContent="No weather logs found"
                                            >
                                                {(item) => (
                                                    <TableRow key={item.id}>
                                                        {(columnKey) => (
                                                            <TableCell>
                                                                {renderCell(item, columnKey)}
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    )}
                                    
                                    {/* Pagination */}
                                    {pagination.lastPage > 1 && (
                                        <div className="flex justify-center mt-6">
                                            <Pagination
                                                total={pagination.lastPage}
                                                page={pagination.currentPage}
                                                onChange={handlePageChange}
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

// Use App layout wrapper
WeatherLogsIndex.layout = (page) => <App children={page} />;
export default WeatherLogsIndex;
