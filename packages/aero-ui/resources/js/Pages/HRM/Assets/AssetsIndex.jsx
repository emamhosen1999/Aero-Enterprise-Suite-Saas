import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button, Input, Select, SelectItem, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { 
    CheckCircleIcon,
    ComputerDesktopIcon,
    PlusIcon,
    WrenchScrewdriverIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import AssetsTable from '@/Tables/HRM/AssetsTable.jsx';
import AssetForm from '@/Forms/HRM/AssetForm.jsx';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const AssetsIndex = ({ title, categories: initialCategories, employees: initialEmployees }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
    // Manual responsive state management (HRMAC pattern)
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

    // Data state
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [assets, setAssets] = useState([]);
    const [categories, setCategories] = useState(initialCategories || []);
    const [employees, setEmployees] = useState(initialEmployees || []);
    const [stats, setStats] = useState({ total: 0, available: 0, allocated: 0, maintenance: 0 });
    
    // Filter state
    const [filters, setFilters] = useState({ search: '', status: [] });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0, lastPage: 1 });
    
    // Modal state
    const [modalState, setModalState] = useState({ type: null, asset: null });
    const [allocateModalOpen, setAllocateModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState('');

    // Permissions
    const canCreateAsset = canCreate('hrm.assets') || isSuperAdmin();
    const canEditAsset = canUpdate('hrm.assets') || isSuperAdmin();
    const canDeleteAsset = canDelete('hrm.assets') || isSuperAdmin();
    const canAllocateAsset = canUpdate('hrm.assets') || isSuperAdmin();

    const statsData = useMemo(() => [
        { title: "Total Assets", value: stats.total, icon: <ComputerDesktopIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Available", value: stats.available, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Allocated", value: stats.allocated, icon: <ComputerDesktopIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Maintenance", value: stats.maintenance, icon: <WrenchScrewdriverIcon className="w-6 h-6" />, color: "text-danger", iconBg: "bg-danger/20" },
    ], [stats]);

    // Fetch assets
    const fetchAssets = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.assets.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    per_page: pagination.perPage, 
                    search: filters.search,
                    status: filters.status.length > 0 ? filters.status.join(',') : undefined
                }
            });
            if (response.status === 200) {
                setAssets(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            console.error('Failed to fetch assets:', error);
            showToast.error('Failed to fetch assets');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.assets.stats'));
            if (response.status === 200) setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    // Fetch categories if not provided
    const fetchCategories = useCallback(async () => {
        if (categories.length > 0) return;
        try {
            const response = await axios.get(route('hrm.assets.categories.list'));
            if (response.status === 200) setCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    }, [categories.length]);

    // Fetch employees if not provided
    const fetchEmployees = useCallback(async () => {
        if (employees.length > 0) return;
        try {
            const response = await axios.get(route('hrm.employees.list'));
            if (response.status === 200) setEmployees(response.data);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        }
    }, [employees.length]);

    useEffect(() => {
        fetchAssets();
        fetchStats();
        fetchCategories();
        fetchEmployees();
    }, [fetchAssets, fetchStats, fetchCategories, fetchEmployees]);

    // Modal handlers
    const openModal = (type, asset = null) => setModalState({ type, asset });
    const closeModal = () => setModalState({ type: null, asset: null });

    // CRUD handlers
    const handleEdit = (asset) => openModal('edit', asset);
    
    const handleDelete = async (asset) => {
        if (!confirm(`Are you sure you want to delete asset "${asset.name}"?`)) return;
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.delete(route('hrm.assets.destroy', asset.id));
                resolve(['Asset deleted successfully']);
                fetchAssets();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to delete asset']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Deleting asset...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    // Allocation handlers
    const handleAllocate = (asset) => {
        setSelectedAsset(asset);
        setAllocateModalOpen(true);
    };

    const handleReturn = async (asset) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('hrm.assets.return', asset.id));
                resolve(['Asset returned successfully']);
                fetchAssets();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to return asset']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Returning asset...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const submitAllocation = async () => {
        if (!selectedEmployee) {
            showToast.error('Please select an employee');
            return;
        }
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('hrm.assets.allocate', selectedAsset.id), {
                    employee_id: selectedEmployee
                });
                resolve(['Asset allocated successfully']);
                setAllocateModalOpen(false);
                setSelectedEmployee('');
                setSelectedAsset(null);
                fetchAssets();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to allocate asset']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Allocating asset...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleView = (asset) => openModal('view', asset);
    
    const handleSuccess = () => {
        fetchAssets();
        fetchStats();
        closeModal();
    };

    // Pagination handler
    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    // Filter handler
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Action buttons
    const actionButtons = useMemo(() => (
        <>
            <Button 
                isIconOnly 
                variant="flat" 
                onPress={() => { fetchAssets(); fetchStats(); }}
            >
                <ArrowPathIcon className="w-4 h-4" />
            </Button>
            {canCreateAsset && (
                <Button 
                    color="primary" 
                    variant="shadow" 
                    startContent={<PlusIcon className="w-4 h-4" />} 
                    onPress={() => openModal('add')}
                >
                    Add Asset
                </Button>
            )}
        </>
    ), [canCreateAsset, fetchAssets, fetchStats]);

    // Filter section
    const filterSection = useMemo(() => (
        <div className="flex flex-col sm:flex-row gap-4">
            <Input 
                label="Search" 
                placeholder="Search assets..." 
                value={filters.search} 
                onChange={(e) => handleFilterChange('search', e.target.value)}
                startContent={<MagnifyingGlassIcon className="w-4 h-4" />} 
                variant="bordered" 
                size="sm" 
                radius={themeRadius}
                className="flex-1"
                isClearable
                onClear={() => handleFilterChange('search', '')}
            />
            <Select 
                label="Status" 
                placeholder="All Statuses" 
                variant="bordered" 
                size="sm" 
                radius={themeRadius} 
                selectionMode="multiple"
                selectedKeys={new Set(filters.status)}
                onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys))}
                className="w-full sm:w-48"
            >
                <SelectItem key="available">Available</SelectItem>
                <SelectItem key="allocated">Allocated</SelectItem>
                <SelectItem key="maintenance">Maintenance</SelectItem>
                <SelectItem key="retired">Retired</SelectItem>
            </Select>
        </div>
    ), [filters, themeRadius]);

    // Pagination section
    const paginationSection = pagination.lastPage > 1 ? (
        <div className="flex justify-center">
            <Pagination
                total={pagination.lastPage}
                page={pagination.currentPage}
                onChange={handlePageChange}
                showControls
                radius={themeRadius}
            />
        </div>
    ) : null;

    return (
        <>
            <Head title={title || "Asset Management"} />
            
            {/* Add/Edit Modal */}
            {(modalState.type === 'add' || modalState.type === 'edit') && (
                <AssetForm
                    asset={modalState.asset}
                    categories={categories}
                    open={true}
                    closeModal={closeModal}
                    onSuccess={handleSuccess}
                    editMode={modalState.type === 'edit'}
                />
            )}

            {/* Allocate Modal */}
            <Modal isOpen={allocateModalOpen} onOpenChange={setAllocateModalOpen} size="md">
                <ModalContent>
                    <ModalHeader>Allocate Asset</ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-default-500 mb-4">
                            Allocate <strong>{selectedAsset?.name}</strong> to an employee
                        </p>
                        <Select
                            label="Select Employee"
                            placeholder="Choose employee"
                            selectedKeys={selectedEmployee ? [selectedEmployee] : []}
                            onSelectionChange={(keys) => setSelectedEmployee(Array.from(keys)[0])}
                            radius={themeRadius}
                        >
                            {employees.map(emp => (
                                <SelectItem key={String(emp.id)} value={String(emp.id)}>
                                    {emp.name}
                                </SelectItem>
                            ))}
                        </Select>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setAllocateModalOpen(false)}>Cancel</Button>
                        <Button color="primary" onPress={submitAllocation}>Allocate</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            
            <StandardPageLayout
                title="Asset Management"
                subtitle="Track and allocate company assets to employees"
                icon={<ComputerDesktopIcon className="w-6 h-6" />}
                isLoading={loading && statsLoading}
                ariaLabel="Asset Management"
                actions={actionButtons}
                stats={<StatsCards stats={statsData} isLoading={statsLoading} />}
                filters={filterSection}
                pagination={paginationSection}
            >
                <AssetsTable
                    assets={assets}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAllocate={handleAllocate}
                    onReturn={handleReturn}
                    onView={handleView}
                    canEdit={canEditAsset}
                    canDelete={canDeleteAsset}
                    canAllocate={canAllocateAsset}
                />
            </StandardPageLayout>
        </>
    );
};

AssetsIndex.layout = (page) => <App children={page} />;
export default AssetsIndex;
