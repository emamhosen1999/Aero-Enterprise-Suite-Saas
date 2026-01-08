import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem } from "@heroui/react";
import {
    ClipboardDocumentCheckIcon,
    MapPinIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import RfiTable from '@/Tables/RFI/RfiTable.jsx';
import InspectionFormModal from '@/Components/RFI/InspectionFormModal.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

/**
 * InspectionList - RFI Management Page
 * 
 * Main page for Request For Inspection management with:
 * - GPS validation badges
 * - Permit indicators  
 * - Bulk operations
 * - Export functionality
 * - Real-time status updates
 */
const InspectionList = ({ title }) => {
    const { auth } = usePage().props;
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
    const [rfis, setRfis] = useState([]);
    const [pagination, setPagination] = useState({
        perPage: 30,
        currentPage: 1,
        total: 0,
        lastPage: 1
    });
    
    const [filters, setFilters] = useState({
        search: '',
        status: [],
        layer: '',
        workLocation: '',
        dateFrom: '',
        dateTo: '',
        gpsValidation: '', // 'valid', 'invalid', 'all'
        permitStatus: '' // 'required', 'approved', 'pending', 'all'
    });

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        gpsVerified: 0
    });

    // Modal states
    const [modalStates, setModalStates] = useState({
        create: false,
        edit: false,
        delete: false,
        bulkOperation: false
    });

    const [currentRfi, setCurrentRfi] = useState(null);
    const [selectedRfis, setSelectedRfis] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // Permissions
    const canCreate = auth.permissions?.includes('rfi.create') || false;
    const canEdit = auth.permissions?.includes('rfi.update') || false;
    const canDelete = auth.permissions?.includes('rfi.delete') || false;
    const canApprove = auth.permissions?.includes('rfi.approve') || false;

    // Stats data for StatsCards
    const statsData = useMemo(() => [
        {
            title: "Total RFIs",
            value: stats.total,
            icon: <ClipboardDocumentCheckIcon className={`${!isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />,
            color: "text-primary",
            iconBg: "bg-primary/20"
        },
        {
            title: "Pending",
            value: stats.pending,
            icon: <ClipboardDocumentCheckIcon className={`${!isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />,
            color: "text-warning",
            iconBg: "bg-warning/20"
        },
        {
            title: "Approved",
            value: stats.approved,
            icon: <ClipboardDocumentCheckIcon className={`${!isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />,
            color: "text-success",
            iconBg: "bg-success/20"
        },
        {
            title: "Rejected",
            value: stats.rejected,
            icon: <ClipboardDocumentCheckIcon className={`${!isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />,
            color: "text-danger",
            iconBg: "bg-danger/20"
        },
        {
            title: "GPS Verified",
            value: stats.gpsVerified,
            icon: <MapPinIcon className={`${!isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />,
            color: "text-success",
            iconBg: "bg-success/20"
        }
    ], [stats, isMobile]);

    // Fetch RFIs with pagination and filters
    const fetchRfis = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('rfi.paginate'), {
                params: {
                    page: pagination.currentPage,
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            
            if (response.status === 200) {
                setRfis(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch RFIs'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(route('rfi.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    // Load data on mount and when filters/pagination change
    useEffect(() => {
        fetchRfis();
    }, [fetchRfis]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Filter handlers
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    // Modal handlers
    const openModal = useCallback((modalName, rfi = null) => {
        setCurrentRfi(rfi);
        setModalStates(prev => ({ ...prev, [modalName]: true }));
    }, []);

    const closeModal = useCallback((modalName) => {
        setModalStates(prev => ({ ...prev, [modalName]: false }));
        setCurrentRfi(null);
    }, []);

    // CRUD handlers
    const handleCreate = useCallback(() => {
        openModal('create');
    }, [openModal]);

    const handleEdit = useCallback((rfi) => {
        openModal('edit', rfi);
    }, [openModal]);

    const handleDelete = useCallback((rfi) => {
        setCurrentRfi(rfi);
        openModal('delete');
    }, [openModal]);

    const handleRfiSaved = useCallback(() => {
        fetchRfis();
        fetchStats();
        closeModal('create');
        closeModal('edit');
    }, [fetchRfis, fetchStats, closeModal]);

    // Bulk operations
    const handleBulkExport = useCallback(async () => {
        const exportPromise = axios.post(route('rfi.export'), {
            rfi_ids: selectedRfis.length > 0 ? selectedRfis : null,
            filters: filters
        }, {
            responseType: 'blob'
        }).then(response => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `rfis_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            return ['Export completed successfully'];
        });

        showToast.promise(exportPromise, {
            loading: 'Exporting RFIs...',
            success: (data) => data[0],
            error: (err) => err.response?.data?.message || 'Export failed'
        });
    }, [selectedRfis, filters]);

    // Pagination handler
    const handlePageChange = useCallback((page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    }, []);

    return (
        <>
            <Head title={title || 'RFI Management'} />
            
            {/* Modals */}
            {modalStates.create && (
                <InspectionFormModal
                    open={modalStates.create}
                    onClose={() => closeModal('create')}
                    onSaved={handleRfiSaved}
                />
            )}

            {modalStates.edit && currentRfi && (
                <InspectionFormModal
                    open={modalStates.edit}
                    onClose={() => closeModal('edit')}
                    rfi={currentRfi}
                    onSaved={handleRfiSaved}
                />
            )}

            {/* Main Content */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="RFI Management">
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
                                {/* Card Header */}
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
                                            {/* Title Section */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <ClipboardDocumentCheckIcon 
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }} 
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        RFI Management
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage requests for inspection with GPS validation
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                <Button
                                                    color="default"
                                                    variant="flat"
                                                    size={isMobile ? "sm" : "md"}
                                                    startContent={<FunnelIcon className="w-4 h-4" />}
                                                    onPress={() => setShowFilters(!showFilters)}
                                                >
                                                    {showFilters ? 'Hide' : 'Show'} Filters
                                                </Button>
                                                
                                                {selectedRfis.length > 0 && (
                                                    <Button
                                                        color="default"
                                                        variant="flat"
                                                        size={isMobile ? "sm" : "md"}
                                                        startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                                        onPress={handleBulkExport}
                                                    >
                                                        Export ({selectedRfis.length})
                                                    </Button>
                                                )}
                                                
                                                {canCreate && (
                                                    <Button 
                                                        color="primary" 
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={handleCreate}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        New RFI
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
                                    {showFilters && (
                                        <div className="mb-6 p-4 border border-divider rounded-lg bg-content2/50">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <Input
                                                    label="Search"
                                                    placeholder="Search by number, description..."
                                                    value={filters.search}
                                                    onValueChange={(value) => handleFilterChange('search', value)}
                                                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                                    size="sm"
                                                    radius={themeRadius}
                                                />
                                                
                                                <Select
                                                    label="Status"
                                                    placeholder="All Statuses"
                                                    selectedKeys={filters.status}
                                                    onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys))}
                                                    selectionMode="multiple"
                                                    size="sm"
                                                    radius={themeRadius}
                                                >
                                                    <SelectItem key="pending">Pending</SelectItem>
                                                    <SelectItem key="approved">Approved</SelectItem>
                                                    <SelectItem key="rejected">Rejected</SelectItem>
                                                    <SelectItem key="cancelled">Cancelled</SelectItem>
                                                </Select>
                                                
                                                <Select
                                                    label="GPS Validation"
                                                    placeholder="All"
                                                    selectedKeys={filters.gpsValidation ? [filters.gpsValidation] : []}
                                                    onSelectionChange={(keys) => handleFilterChange('gpsValidation', Array.from(keys)[0] || '')}
                                                    size="sm"
                                                    radius={themeRadius}
                                                >
                                                    <SelectItem key="valid">Valid</SelectItem>
                                                    <SelectItem key="invalid">Invalid</SelectItem>
                                                    <SelectItem key="all">All</SelectItem>
                                                </Select>
                                                
                                                <Select
                                                    label="Permit Status"
                                                    placeholder="All"
                                                    selectedKeys={filters.permitStatus ? [filters.permitStatus] : []}
                                                    onSelectionChange={(keys) => handleFilterChange('permitStatus', Array.from(keys)[0] || '')}
                                                    size="sm"
                                                    radius={themeRadius}
                                                >
                                                    <SelectItem key="required">Required</SelectItem>
                                                    <SelectItem key="approved">Approved</SelectItem>
                                                    <SelectItem key="pending">Pending</SelectItem>
                                                    <SelectItem key="all">All</SelectItem>
                                                </Select>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Data Table */}
                                    <RfiTable
                                        rfis={rfis}
                                        loading={loading}
                                        pagination={pagination}
                                        onPageChange={handlePageChange}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        selectedRfis={selectedRfis}
                                        onSelectionChange={setSelectedRfis}
                                        canEdit={canEdit}
                                        canDelete={canDelete}
                                        canApprove={canApprove}
                                    />
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

InspectionList.layout = (page) => <App children={page} />;
export default InspectionList;
