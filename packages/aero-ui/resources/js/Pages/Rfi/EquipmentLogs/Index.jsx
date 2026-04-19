import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Pagination, Spinner, Progress } from "@heroui/react";
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, EllipsisVerticalIcon, TruckIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const EquipmentLogsIndex = ({ title }) => {
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
        equipment_type: 'all', 
        status: 'all',
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
        totalHours: 0, 
        idleHours: 0, 
        breakdownHours: 0, 
        fuelConsumed: 0,
        avgUtilization: 0
    });

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Logs", 
            value: stats.total, 
            icon: <TruckIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Working Hours", 
            value: `${stats.totalHours.toFixed(1)}h`, 
            icon: <TruckIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Idle Hours", 
            value: `${stats.idleHours.toFixed(1)}h`, 
            icon: <TruckIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Breakdown Hours", 
            value: `${stats.breakdownHours.toFixed(1)}h`, 
            icon: <TruckIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
        { 
            title: "Fuel Consumed", 
            value: `${stats.fuelConsumed.toFixed(1)}L`, 
            icon: <TruckIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
        { 
            title: "Avg Utilization", 
            value: `${stats.avgUtilization.toFixed(1)}%`, 
            icon: <TruckIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
    ], [stats]);

    // Permission checks
    // Permissions using HRMAC
    // TODO: Update with correct HRMAC path once module hierarchy is defined for RFI
    const canCreateLog = canCreate("rfi.equipment-logs") || isSuperAdmin();
    const canEditLog = canUpdate("rfi.equipment-logs") || isSuperAdmin();
    const canDeleteLog = canDelete("rfi.equipment-logs") || isSuperAdmin();

    // Data fetching
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('rfi.equipment-logs.index'), {
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
                    totalHours: data.reduce((sum, log) => sum + (parseFloat(log.working_hours) || 0), 0),
                    idleHours: data.reduce((sum, log) => sum + (parseFloat(log.idle_hours) || 0), 0),
                    breakdownHours: data.reduce((sum, log) => sum + (parseFloat(log.breakdown_hours) || 0), 0),
                    fuelConsumed: data.reduce((sum, log) => sum + (parseFloat(log.fuel_consumed) || 0), 0),
                    avgUtilization: data.length > 0 
                        ? data.reduce((sum, log) => sum + (parseFloat(log.utilization_percentage) || 0), 0) / data.length 
                        : 0
                });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch equipment logs'
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
        // Navigate to edit page or open edit modal
        console.log('Edit log:', log);
    };

    const handleDelete = async (log) => {
        if (!confirm(`Are you sure you want to delete equipment log ${log.equipment_name}?`)) return;
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('rfi.equipment-logs.destroy', log.id));
                if (response.status === 200) {
                    await fetchLogs();
                    resolve([response.data.message || 'Equipment log deleted successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete equipment log']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting equipment log...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Status color map
    const statusColorMap = {
        operational: "success",
        maintenance: "warning",
        breakdown: "danger",
        idle: "default"
    };

    // Table columns
    const columns = [
        { name: "EQUIPMENT", uid: "equipment" },
        { name: "TYPE", uid: "type" },
        { name: "OPERATOR", uid: "operator" },
        { name: "WORKING HOURS", uid: "working_hours" },
        { name: "UTILIZATION", uid: "utilization" },
        { name: "FUEL (L)", uid: "fuel" },
        { name: "STATUS", uid: "status" },
        { name: "DATE", uid: "date" },
        { name: "ACTIONS", uid: "actions" },
    ];

    // Cell renderer
    const renderCell = useCallback((log, columnKey) => {
        const cellValue = log[columnKey];

        switch (columnKey) {
            case "equipment":
                return (
                    <div className="flex flex-col">
                        <p className="font-semibold text-sm">{log.equipment_name}</p>
                        <p className="text-xs text-default-500">{log.equipment_id}</p>
                    </div>
                );
            case "type":
                return (
                    <span className="text-sm capitalize">{log.equipment_type || '-'}</span>
                );
            case "operator":
                return (
                    <span className="text-sm">{log.operator_name || '-'}</span>
                );
            case "working_hours":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm font-semibold">{parseFloat(log.working_hours).toFixed(1)}h</p>
                        <p className="text-xs text-default-500">
                            Idle: {parseFloat(log.idle_hours || 0).toFixed(1)}h
                        </p>
                    </div>
                );
            case "utilization":
                const utilization = parseFloat(log.utilization_percentage || 0);
                const utilizationColor = utilization >= 80 ? 'success' : utilization >= 50 ? 'warning' : 'danger';
                return (
                    <div className="flex flex-col gap-1">
                        <Progress
                            size="sm"
                            value={utilization}
                            color={utilizationColor}
                            className="max-w-[100px]"
                        />
                        <span className="text-xs">{utilization.toFixed(1)}%</span>
                    </div>
                );
            case "fuel":
                const fuelConsumed = parseFloat(log.fuel_consumed || 0);
                const fuelEfficiency = log.fuel_efficiency ? parseFloat(log.fuel_efficiency).toFixed(2) : null;
                return (
                    <div className="flex flex-col">
                        <p className="text-sm font-semibold">{fuelConsumed.toFixed(1)}L</p>
                        {fuelEfficiency && (
                            <p className="text-xs text-default-500">{fuelEfficiency} L/h</p>
                        )}
                    </div>
                );
            case "status":
                return (
                    <Chip
                        color={statusColorMap[log.status] || 'default'}
                        size="sm"
                        variant="flat"
                    >
                        {log.status ? log.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                    </Chip>
                );
            case "date":
                return (
                    <span className="text-sm">
                        {new Date(log.log_date).toLocaleDateString()}
                    </span>
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
                            <DropdownMenu aria-label="Equipment log actions">
                                {canEditLog && (
                                    <DropdownItem 
                                        key="edit"
                                        startContent={<PencilIcon className="w-4 h-4" />}
                                        onPress={() => handleEdit(log)}
                                    >
                                        Edit
                                    </DropdownItem>
                                )}
                                {canDeleteLog && (
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
            <Head title={title || "Equipment Logs"} />
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Equipment Logs Management">
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
                                                    <TruckIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Equipment Logs
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Track equipment usage, fuel consumption, and maintenance
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateLog && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => console.log('Add Equipment Log')}
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
                                        <Input
                                            label="Search"
                                            placeholder="Search equipment name or ID..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />
                                        
                                        <Select
                                            label="Equipment Type"
                                            placeholder="All Types"
                                            selectedKeys={filters.equipment_type !== 'all' ? [filters.equipment_type] : []}
                                            onSelectionChange={(keys) => handleFilterChange('equipment_type', Array.from(keys)[0] || 'all')}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            classNames={{ trigger: "bg-default-100" }}
                                        >
                                            <SelectItem key="all">All Types</SelectItem>
                                            <SelectItem key="excavator">Excavator</SelectItem>
                                            <SelectItem key="bulldozer">Bulldozer</SelectItem>
                                            <SelectItem key="crane">Crane</SelectItem>
                                            <SelectItem key="loader">Loader</SelectItem>
                                            <SelectItem key="dump_truck">Dump Truck</SelectItem>
                                            <SelectItem key="concrete_mixer">Concrete Mixer</SelectItem>
                                        </Select>
                                        
                                        <Select
                                            label="Status"
                                            placeholder="All Status"
                                            selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            classNames={{ trigger: "bg-default-100" }}
                                        >
                                            <SelectItem key="all">All Status</SelectItem>
                                            <SelectItem key="operational">Operational</SelectItem>
                                            <SelectItem key="maintenance">Maintenance</SelectItem>
                                            <SelectItem key="breakdown">Breakdown</SelectItem>
                                            <SelectItem key="idle">Idle</SelectItem>
                                        </Select>
                                    </div>
                                    
                                    {/* Data Table */}
                                    {loading ? (
                                        <div className="flex justify-center py-10">
                                            <Spinner size="lg" />
                                        </div>
                                    ) : (
                                        <Table
                                            aria-label="Equipment logs table"
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
                                                emptyContent="No equipment logs found"
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
EquipmentLogsIndex.layout = (page) => <App children={page} />;
export default EquipmentLogsIndex;
