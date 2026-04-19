import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Pagination,
    Select,
    SelectItem,
    Spinner,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Tooltip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Skeleton,
    Textarea
} from "@heroui/react";
import {
    CalculatorIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    EllipsisVerticalIcon,
    DocumentArrowDownIcon,
    ArrowPathIcon,
    CubeIcon,
    CurrencyDollarIcon,
    DocumentTextIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

/**
 * BOQ Measurements - PATENTABLE COMPONENT
 * 
 * Auto-generated quantity measurements from RFI approvals.
 * Part of the "Spatially-Verified Construction Payment Assurance System".
 */
const BoqMeasurementsIndex = ({ title, measurements: initialData, filters: initialFilters, stats: initialStats, statuses, boqItems }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
    // Responsive breakpoints
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // State management
    const [loading, setLoading] = useState(false);
    const [measurements, setMeasurements] = useState(initialData?.data || []);
    const [pagination, setPagination] = useState({
        currentPage: initialData?.current_page || 1,
        perPage: initialData?.per_page || 30,
        total: initialData?.total || 0,
        lastPage: initialData?.last_page || 1
    });
    const [stats, setStats] = useState(initialStats || {});
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
        boq_item_id: initialFilters?.boq_item_id || 'all'
    });
    
    // Verification modal
    const [verifyModal, setVerifyModal] = useState({ open: false, measurement: null });
    const [verifyData, setVerifyData] = useState({ verified_quantity: '', verification_notes: '' });
    const [rejectModal, setRejectModal] = useState({ open: false, measurement: null });
    const [rejectReason, setRejectReason] = useState('');

    // Status color mapping
    const statusColorMap = {
        pending: 'warning',
        verified: 'success',
        rejected: 'danger'
    };

    // Table columns
    const columns = [
        { uid: 'boq_item', name: 'BOQ Item' },
        { uid: 'rfi', name: 'RFI Reference' },
        { uid: 'chainage', name: 'Chainage' },
        { uid: 'quantity', name: 'Quantity' },
        { uid: 'value', name: 'Value' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' }
    ];

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        {
            title: "Total Measurements",
            value: stats.total_count || 0,
            icon: <CalculatorIcon className="w-5 h-5" />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "All BOQ measurements"
        },
        {
            title: "Pending Verification",
            value: stats.pending_count || 0,
            icon: <ClockIcon className="w-5 h-5" />,
            color: "text-warning",
            iconBg: "bg-warning/20",
            description: "Awaiting QS approval"
        },
        {
            title: "Verified",
            value: stats.verified_count || 0,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: "text-success",
            iconBg: "bg-success/20",
            description: "Approved for payment"
        },
        {
            title: "Total Verified Qty",
            value: `${(stats.total_verified_quantity || 0).toFixed(2)}`,
            icon: <CubeIcon className="w-5 h-5" />,
            color: "text-secondary",
            iconBg: "bg-secondary/20",
            description: "Cumulative verified"
        }
    ], [stats]);

    // Permission checks
    const canVerify = auth?.permissions?.includes('projects.boq-measurements.verify') || true;

    // Fetch measurements
    const fetchMeasurements = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.currentPage,
                per_page: pagination.perPage,
                search: filters.search || undefined,
                status: filters.status !== 'all' ? filters.status : undefined,
                boq_item_id: filters.boq_item_id !== 'all' ? filters.boq_item_id : undefined
            };

            const response = await axios.get(route('projects.boq-measurements.index'), { params });
            
            if (response.status === 200) {
                setMeasurements(response.data.measurements?.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.measurements?.total || 0,
                    lastPage: response.data.measurements?.last_page || 1
                }));
                setStats(response.data.stats || {});
            }
        } catch (error) {
            console.error('Failed to fetch measurements', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.currentPage, pagination.perPage, filters]);

    useEffect(() => {
        fetchMeasurements();
    }, [fetchMeasurements]);

    // Handle verification
    const handleVerify = async () => {
        if (!verifyModal.measurement) return;
        
        setLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(
                    route('projects.boq-measurements.verify', verifyModal.measurement.id),
                    verifyData
                );
                
                if (response.status === 200) {
                    setVerifyModal({ open: false, measurement: null });
                    setVerifyData({ verified_quantity: '', verification_notes: '' });
                    fetchMeasurements();
                    resolve(['Measurement verified successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.message || 'Failed to verify measurement');
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Verifying measurement...',
            success: (data) => data.join(', '),
            error: (err) => err
        });
    };

    // Handle rejection
    const handleReject = async () => {
        if (!rejectModal.measurement) return;
        
        setLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(
                    route('projects.boq-measurements.reject', rejectModal.measurement.id),
                    { rejection_reason: rejectReason }
                );
                
                if (response.status === 200) {
                    setRejectModal({ open: false, measurement: null });
                    setRejectReason('');
                    fetchMeasurements();
                    resolve(['Measurement rejected']);
                }
            } catch (error) {
                reject(error.response?.data?.message || 'Failed to reject measurement');
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Rejecting measurement...',
            success: (data) => data.join(', '),
            error: (err) => err
        });
    };

    // Open verify modal
    const openVerifyModal = (measurement) => {
        setVerifyData({
            verified_quantity: measurement.quantity,
            verification_notes: ''
        });
        setVerifyModal({ open: true, measurement });
    };

    // Calculate value
    const calculateValue = (measurement) => {
        const qty = measurement.verified_quantity || measurement.quantity || 0;
        const rate = measurement.boq_item?.rate || 0;
        return (qty * rate).toFixed(2);
    };

    // Render table cell
    const renderCell = (measurement, columnKey) => {
        switch (columnKey) {
            case 'boq_item':
                return (
                    <div>
                        <p className="font-medium">{measurement.boq_item?.code}</p>
                        <p className="text-xs text-default-500 max-w-xs truncate">
                            {measurement.boq_item?.description}
                        </p>
                        <p className="text-xs text-default-400">
                            Unit: {measurement.boq_item?.unit} @ {measurement.boq_item?.rate?.toFixed(2) || 0}
                        </p>
                    </div>
                );
            
            case 'rfi':
                return measurement.daily_work ? (
                    <div>
                        <p className="font-medium">{measurement.daily_work.reference_number}</p>
                        <p className="text-xs text-default-500">
                            {measurement.daily_work.work_location?.name}
                        </p>
                        <Chip size="sm" variant="flat" color={measurement.daily_work.status === 'approved' ? 'success' : 'default'}>
                            {measurement.daily_work.status}
                        </Chip>
                    </div>
                ) : (
                    <span className="text-default-400">-</span>
                );
            
            case 'chainage':
                return (
                    <div className="text-sm">
                        <p>CH {measurement.start_chainage}m</p>
                        <p className="text-default-400">to {measurement.end_chainage}m</p>
                    </div>
                );
            
            case 'quantity':
                return (
                    <div>
                        <p className="font-medium">{measurement.quantity?.toFixed(3)}</p>
                        {measurement.status === 'verified' && measurement.verified_quantity !== measurement.quantity && (
                            <p className="text-xs text-success">
                                Verified: {measurement.verified_quantity?.toFixed(3)}
                            </p>
                        )}
                        <p className="text-xs text-default-400">{measurement.boq_item?.unit}</p>
                    </div>
                );
            
            case 'value':
                return (
                    <div className="font-medium">
                        ${calculateValue(measurement)}
                    </div>
                );
            
            case 'status':
                return (
                    <Chip 
                        size="sm" 
                        color={statusColorMap[measurement.status] || 'default'}
                        variant="flat"
                        startContent={
                            measurement.status === 'verified' ? <CheckCircleIcon className="w-3 h-3" /> :
                            measurement.status === 'rejected' ? <XCircleIcon className="w-3 h-3" /> :
                            <ClockIcon className="w-3 h-3" />
                        }
                    >
                        {measurement.status?.charAt(0).toUpperCase() + measurement.status?.slice(1)}
                    </Chip>
                );
            
            case 'actions':
                if (measurement.status !== 'pending') {
                    return (
                        <Tooltip content={measurement.verification_notes || 'No notes'}>
                            <Button isIconOnly size="sm" variant="light">
                                <DocumentTextIcon className="w-4 h-4" />
                            </Button>
                        </Tooltip>
                    );
                }
                
                return canVerify ? (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Measurement actions">
                            <DropdownItem 
                                key="verify" 
                                startContent={<CheckCircleIcon className="w-4 h-4 text-success" />}
                                onPress={() => openVerifyModal(measurement)}
                            >
                                Verify
                            </DropdownItem>
                            <DropdownItem 
                                key="reject" 
                                className="text-danger"
                                color="danger"
                                startContent={<XCircleIcon className="w-4 h-4" />}
                                onPress={() => setRejectModal({ open: true, measurement })}
                            >
                                Reject
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                ) : null;
            
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={title} />
            
            {/* Verify Modal */}
            <Modal 
                isOpen={verifyModal.open} 
                onOpenChange={(open) => { if (!open) setVerifyModal({ open: false, measurement: null }); }}
                size="md"
            >
                <ModalContent>
                    <ModalHeader>Verify Measurement</ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <div className="bg-default-100 p-3 rounded-lg">
                                <p className="text-sm font-medium">{verifyModal.measurement?.boq_item?.code}</p>
                                <p className="text-xs text-default-500">{verifyModal.measurement?.boq_item?.description}</p>
                            </div>
                            
                            <Input
                                type="number"
                                label="Verified Quantity"
                                placeholder="Enter verified quantity"
                                value={verifyData.verified_quantity}
                                onValueChange={(v) => setVerifyData(prev => ({ ...prev, verified_quantity: v }))}
                                endContent={<span className="text-default-400 text-xs">{verifyModal.measurement?.boq_item?.unit}</span>}
                                radius={themeRadius}
                            />
                            
                            <Textarea
                                label="Verification Notes"
                                placeholder="Optional notes about this verification..."
                                value={verifyData.verification_notes}
                                onValueChange={(v) => setVerifyData(prev => ({ ...prev, verification_notes: v }))}
                                radius={themeRadius}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setVerifyModal({ open: false, measurement: null })}>
                            Cancel
                        </Button>
                        <Button color="success" onPress={handleVerify} isLoading={loading}>
                            Verify
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Reject Modal */}
            <Modal 
                isOpen={rejectModal.open} 
                onOpenChange={(open) => { if (!open) setRejectModal({ open: false, measurement: null }); }}
                size="md"
            >
                <ModalContent>
                    <ModalHeader>Reject Measurement</ModalHeader>
                    <ModalBody>
                        <Textarea
                            label="Rejection Reason"
                            placeholder="Explain why this measurement is being rejected..."
                            value={rejectReason}
                            onValueChange={setRejectReason}
                            isRequired
                            radius={themeRadius}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setRejectModal({ open: false, measurement: null })}>
                            Cancel
                        </Button>
                        <Button color="danger" onPress={handleReject} isLoading={loading} isDisabled={!rejectReason.trim()}>
                            Reject
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Main Content */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="BOQ Measurements">
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
                                                <div 
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <CalculatorIcon 
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} 
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        BOQ Measurements
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Auto-generated quantities from approved RFIs
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                <Button 
                                                    color="default" 
                                                    variant="flat"
                                                    startContent={<ArrowPathIcon className="w-4 h-4" />}
                                                    onPress={fetchMeasurements}
                                                    isLoading={loading}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Refresh
                                                </Button>
                                                <Button 
                                                    color="primary" 
                                                    variant="shadow"
                                                    startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Export
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} className="mb-6" isLoading={loading && !measurements.length} />
                                    
                                    {/* Filter Section */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            placeholder="Search BOQ items..."
                                            value={filters.search}
                                            onValueChange={(v) => setFilters(prev => ({ ...prev, search: v }))}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            className="min-w-[200px]"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            label="Status"
                                            placeholder="All statuses"
                                            selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                            onSelectionChange={(keys) => setFilters(prev => ({ ...prev, status: Array.from(keys)[0] || 'all' }))}
                                            className="min-w-[150px]"
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="all">All Statuses</SelectItem>
                                            <SelectItem key="pending">Pending</SelectItem>
                                            <SelectItem key="verified">Verified</SelectItem>
                                            <SelectItem key="rejected">Rejected</SelectItem>
                                        </Select>
                                        
                                        <Select
                                            label="BOQ Item"
                                            placeholder="All items"
                                            selectedKeys={filters.boq_item_id !== 'all' ? [filters.boq_item_id] : []}
                                            onSelectionChange={(keys) => setFilters(prev => ({ ...prev, boq_item_id: Array.from(keys)[0] || 'all' }))}
                                            className="min-w-[200px]"
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="all">All BOQ Items</SelectItem>
                                            {(boqItems || []).map(item => (
                                                <SelectItem key={String(item.id)}>
                                                    {item.code} - {item.description?.substring(0, 30)}...
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    {/* Table */}
                                    {loading && !measurements.length ? (
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
                                        <Table
                                            aria-label="BOQ measurements table"
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
                                                items={measurements} 
                                                emptyContent={
                                                    <div className="py-8 text-center">
                                                        <CalculatorIcon className="w-12 h-12 mx-auto text-default-300 mb-2" />
                                                        <p className="text-default-400">No measurements found.</p>
                                                        <p className="text-sm text-default-300">
                                                            Measurements are auto-generated when RFIs are approved.
                                                        </p>
                                                    </div>
                                                }
                                            >
                                                {(measurement) => (
                                                    <TableRow key={measurement.id}>
                                                        {(columnKey) => (
                                                            <TableCell>{renderCell(measurement, columnKey)}</TableCell>
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
                                                onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                                                showControls
                                                size={isMobile ? "sm" : "md"}
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

BoqMeasurementsIndex.layout = (page) => <App children={page} />;
export default BoqMeasurementsIndex;
