import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Head, usePage} from '@inertiajs/react';
import {motion} from 'framer-motion';
import {Card, Input, Select, SelectItem, Spinner} from "@heroui/react";
import {
    BuildingOffice2Icon,
    CheckCircleIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    UserGroupIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import PageHeader from '@/Components/PageHeader.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import App from '@/Layouts/App.jsx';
import DesignationTable from '@/Tables/HRM/DesignationTable.jsx';
import DesignationForm from '@/Forms/HRM/DesignationForm.jsx';
import DeleteDesignationForm from '@/Forms/HRM/DeleteDesignationForm.jsx';
import axios from 'axios';
import {showToast} from '@/utils/toastUtils.jsx';

const Designations = ({ title, initialDesignations, departments, managers, parentDesignations, allDesignations, stats: initialStats, filters: initialFilters }) => {
    const { auth } = usePage().props;

    const [designationsData, setDesignationsData] = useState(initialDesignations || { data: [] });
    const [loading, setLoading] = useState(false);
    const [modalState, setModalState] = useState({ type: null, designation: null });
    // Find department with most designations
    const defaultDepartment = useMemo(() => {
        if (!departments || departments.length === 0) return 'all';
        
        const deptCounts = {};
        allDesignations?.forEach(des => {
            if (des.department_id) {
                deptCounts[des.department_id] = (deptCounts[des.department_id] || 0) + 1;
            }
        });
        
        const maxDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0];
        return maxDept ? String(maxDept[0]) : 'all';
    }, [departments, allDesignations]);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
        department: initialFilters?.department || defaultDepartment,
        parentDesignation: initialFilters?.parentDesignation || 'all'
    });
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    const [pagination, setPagination] = useState({
        currentPage: initialDesignations?.current_page || 1,
        perPage: initialDesignations?.per_page || 10
    });
    const [stats, setStats] = useState(initialStats || {
        total: 0, active: 0, inactive: 0, parent_designations: 0
    });

    // Add responsive handling
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const canCreateDesignation = auth.permissions?.includes('designations.create') || false;
    const canEditDesignation = auth.permissions?.includes('designations.update') || false;
    const canDeleteDesignation = auth.permissions?.includes('designations.delete') || false;



    const fetchDesignations = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('designations.json'), {
                params: {
                    page: pagination.currentPage,
                    per_page: pagination.perPage,
                    search: filters.search,
                    status: filters.status,
                    department: filters.department !== 'all' ? filters.department : undefined,
                    parent_designation: filters.parentDesignation
                }
            });
     
            setDesignationsData(response.data.designations || response.data);
        } catch (error) {
            console.error('Error fetching designations:', error);
            showToast.error('Failed to load designations data');
        } finally {
            setLoading(false);
        }
    }, [pagination, filters]);

    const fetchDesignationStats = useCallback(async () => {
        try {
            const response = await axios.get(route('designations.stats'));
            if (response.status === 200) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching designation stats:', error);
        }
    }, []);

    useEffect(() => {
        fetchDesignations();
        fetchDesignationStats();
    }, [fetchDesignations, fetchDesignationStats]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRowsPerPageChange = (rowsPerPage) => {
        setPagination({ currentPage: 1, perPage: rowsPerPage });
    };

    const openModal = (type, designation = null) => {
        setModalState({ type, designation });
    };

    const closeModal = () => {
        setModalState({ type: null, designation: null });
    };

    // Optimistically update table after add/edit/delete without full reload
    const handleSuccess = (updatedDesignation = null, action = null) => {
        if (action === 'add' && updatedDesignation) {
            setDesignationsData(prev => {
                const newData = [updatedDesignation, ...prev.data];
                return { ...prev, data: newData, total: (prev.total || 0) + 1 };
            });
        } else if (action === 'edit' && updatedDesignation) {
            setDesignationsData(prev => {
                const newData = prev.data.map(d => d.id === updatedDesignation.id ? updatedDesignation : d);
                return { ...prev, data: newData };
            });
        } else if (action === 'delete' && updatedDesignation) {
            setDesignationsData(prev => {
                const newData = prev.data.filter(d => d.id !== updatedDesignation.id);
                return { ...prev, data: newData, total: (prev.total || 1) - 1 };
            });
        } else {
            // fallback: refetch
            fetchDesignations();
            fetchDesignationStats();
        }
    };

    const statsCards = useMemo(() => [
        {
            title: 'Total Designations',
            value: stats.total,
            icon: <BuildingOffice2Icon className="w-5 h-5" />,
            color: 'text-blue-400',
            iconBg: 'bg-blue-500/20',
            description: 'All designations'
        },
        {
            title: 'Active',
            value: stats.active,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: 'text-green-400',
            iconBg: 'bg-green-500/20',
            description: 'Active designations'
        },
        {
            title: 'Inactive',
            value: stats.inactive,
            icon: <XCircleIcon className="w-5 h-5" />,
            color: 'text-red-400',
            iconBg: 'bg-red-500/20',
            description: 'Inactive designations'
        },
        {
            title: 'Parent Designations',
            value: stats.parent_designations,
            icon: <UserGroupIcon className="w-5 h-5" />,
            color: 'text-purple-400',
            iconBg: 'bg-purple-500/20',
            description: 'Top-level designations'
        },
    ], [stats]);

    const actionButtons = useMemo(() => {
        const buttons = [];
        if (canCreateDesignation) {
            buttons.push({
                label: isMobile ? "Add" : "Add Designation",
                icon: <PlusIcon className="w-4 h-4" />,
                onPress: () => openModal('add_designation'),
                className: "bg-linear-to-r from-(--theme-primary) to-(--theme-secondary) text-white font-medium hover:opacity-90"
            });
        }
        return buttons;
    }, [canCreateDesignation, isMobile]);

    return (
        <App>
            <Head title={title} />
            <div className="flex justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Card className="shadow-lg">
                        <PageHeader
                            title="Designation Management"
                            subtitle="Manage company designations and hierarchy"
                            icon={<BuildingOffice2Icon className="w-8 h-8" />}
                            variant="default"
                            actionButtons={actionButtons}
                        >
                            <div className="p-4 sm:p-6">
                                <StatsCards stats={statsCards} className="mb-6" />
                                {/* Search and Filters Section */}
                                <div className="mb-6 space-y-4">
                                    {/* Search */}
                                    <div className="flex-1">
                                        <Input
                                            label="Search Designations"
                                            placeholder="Search by title..."
                                            value={filters.search}
                                            onValueChange={(value) => handleFilterChange('search', value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            variant="bordered"
                                            size={isMobile ? "sm" : "md"}
                                            classNames={{
                                                base: "w-full",
                                                input: "bg-transparent",
                                                inputWrapper: "border-default-200 hover:border-default-300",
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        />
                                    </div>

                                    {/* Filters */}
                                    <div className="flex flex-wrap gap-3">
                                        <Select
                                            label="Department"
                                            selectedKeys={filters.department ? [filters.department] : []}
                                            onSelectionChange={(keys) => handleFilterChange('department', Array.from(keys)[0])}
                                            variant="bordered"
                                            size={isMobile ? "sm" : "md"}
                                            className="w-48"
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            <SelectItem key="all">All Departments</SelectItem>
                                            {departments?.map((dept) => (
                                                <SelectItem key={String(dept.id)}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            label="Status"
                                            selectedKeys={filters.status ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0])}
                                            variant="bordered"
                                            size={isMobile ? "sm" : "md"}
                                            className="w-32"
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            <SelectItem key="all">All Status</SelectItem>
                                            <SelectItem key="active">Active</SelectItem>
                                            <SelectItem key="inactive">Inactive</SelectItem>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    {loading ? (
                                        <div className="text-center py-6">
                                            <Spinner size="lg" />
                                            <p className="mt-4 text-default-500">Loading...</p>
                                        </div>
                                    ) : (
                                        <DesignationTable
                                            designations={designationsData}
                                            loading={loading}
                                            onEdit={canEditDesignation ? (designation) => openModal('edit_designation', designation) : undefined}
                                            onDelete={canDeleteDesignation ? (designation) => openModal('delete_designation', designation) : undefined}
                                            onView={(designation) => openModal('view_designation', designation)}
                                            pagination={pagination}
                                            onPageChange={handlePageChange}
                                            onRowsPerPageChange={handleRowsPerPageChange}
                                            canEditDesignation={canEditDesignation}
                                            canDeleteDesignation={canDeleteDesignation}
                                        />
                                    )}
                                </div>
                            </div>
                        </PageHeader>
                    </Card>
                </motion.div>
            </div>

            {(modalState.type === 'add_designation' || modalState.type === 'edit_designation') && (
                <DesignationForm
                    open={true}
                    departments={departments}
                    designations={allDesignations}
                    onClose={closeModal}
                    onSuccess={(designation) => handleSuccess(designation, modalState.type === 'add_designation' ? 'add' : 'edit')}
                    designation={modalState.designation}
                />
            )}

            {modalState.type === 'delete_designation' && (
                <DeleteDesignationForm
                    open={true}
                    onClose={closeModal}
                    onSuccess={(designation) => handleSuccess(designation, 'delete')}
                    designation={modalState.designation}
                />
            )}
        </App>
    );
};

export default Designations;
