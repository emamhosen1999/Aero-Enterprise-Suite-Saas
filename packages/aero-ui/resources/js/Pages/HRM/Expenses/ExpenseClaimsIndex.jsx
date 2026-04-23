import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button, Input, Select, SelectItem, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea } from "@heroui/react";
import { 
    BanknotesIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    PlusIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import ExpenseClaimsTable from '@/Tables/HRM/ExpenseClaimsTable.jsx';
import ExpenseClaimForm from '@/Forms/HRM/ExpenseClaimForm.jsx';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const ExpenseClaimsIndex = ({ title, categories: initialCategories }) => {
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
    const [claims, setClaims] = useState([]);
    const [categories, setCategories] = useState(initialCategories || []);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, paid: 0 });
    
    // Filter state
    const [filters, setFilters] = useState({ search: '', status: [] });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0, lastPage: 1 });
    
    // Modal state
    const [modalState, setModalState] = useState({ type: null, claim: null });
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    // Permissions
    const canCreateClaim = canCreate('hrm.expenses') || isSuperAdmin();
    const canEditClaim = canUpdate('hrm.expenses') || isSuperAdmin();
    const canDeleteClaim = canDelete('hrm.expenses') || isSuperAdmin();
    const canApproveClaim = canUpdate('hrm.expenses') || isSuperAdmin();

    // Stats data
    const statsData = useMemo(() => [
        { title: "Total Claims", value: stats.total, icon: <DocumentTextIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Pending", value: stats.pending, icon: <ClockIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Approved", value: stats.approved, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Paid", value: stats.paid, icon: <BanknotesIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
    ], [stats]);

    // Fetch claims data
    const fetchClaims = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.expenses.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    per_page: pagination.perPage, 
                    search: filters.search,
                    status: filters.status.length > 0 ? filters.status.join(',') : undefined
                }
            });
            if (response.status === 200) {
                setClaims(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            console.error('Failed to fetch expense claims:', error);
            showToast.error('Failed to fetch expense claims');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.expenses.stats'));
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
            const response = await axios.get(route('hrm.expense-categories.list'));
            if (response.status === 200) setCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    }, [categories.length]);

    useEffect(() => {
        fetchClaims();
        fetchStats();
        fetchCategories();
    }, [fetchClaims, fetchStats, fetchCategories]);

    // Modal handlers
    const openModal = (type, claim = null) => setModalState({ type, claim });
    const closeModal = () => setModalState({ type: null, claim: null });

    // CRUD handlers
    const handleEdit = (claim) => openModal('edit', claim);
    
    const handleDelete = async (claim) => {
        if (!confirm(`Are you sure you want to delete this expense claim?`)) return;
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.delete(route('hrm.expenses.destroy', claim.id));
                resolve(['Expense claim deleted successfully']);
                fetchClaims();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to delete expense claim']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Deleting expense claim...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    // Approval workflow
    const handleApprove = async (claim) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('hrm.expenses.approve', claim.id));
                resolve(['Expense claim approved successfully']);
                fetchClaims();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to approve expense claim']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Approving expense claim...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleReject = (claim) => {
        setSelectedClaim(claim);
        setRejectModalOpen(true);
    };

    const submitReject = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('hrm.expenses.reject', selectedClaim.id), {
                    reason: rejectReason
                });
                resolve(['Expense claim rejected']);
                setRejectModalOpen(false);
                setRejectReason('');
                setSelectedClaim(null);
                fetchClaims();
                fetchStats();
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to reject expense claim']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Rejecting expense claim...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleView = (claim) => openModal('view', claim);
    
    const handleSuccess = () => {
        fetchClaims();
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
                onPress={() => { fetchClaims(); fetchStats(); }}
            >
                <ArrowPathIcon className="w-4 h-4" />
            </Button>
            {canCreateClaim && (
                <Button 
                    color="primary" 
                    variant="shadow" 
                    startContent={<PlusIcon className="w-4 h-4" />} 
                    onPress={() => openModal('add')}
                >
                    New Claim
                </Button>
            )}
        </>
    ), [canCreateClaim, fetchClaims, fetchStats]);

    // Filter section
    const filterSection = useMemo(() => (
        <div className="flex flex-col sm:flex-row gap-4">
            <Input 
                label="Search" 
                placeholder="Search claims..." 
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
                <SelectItem key="draft">Draft</SelectItem>
                <SelectItem key="submitted">Submitted</SelectItem>
                <SelectItem key="pending">Pending</SelectItem>
                <SelectItem key="approved">Approved</SelectItem>
                <SelectItem key="rejected">Rejected</SelectItem>
                <SelectItem key="paid">Paid</SelectItem>
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
            <Head title={title || "Expense Claims"} />
            
            {/* Add/Edit Modal */}
            {(modalState.type === 'add' || modalState.type === 'edit') && (
                <ExpenseClaimForm
                    claim={modalState.claim}
                    categories={categories}
                    open={true}
                    closeModal={closeModal}
                    onSuccess={handleSuccess}
                    editMode={modalState.type === 'edit'}
                />
            )}

            {/* Reject Modal */}
            <Modal isOpen={rejectModalOpen} onOpenChange={setRejectModalOpen} size="md">
                <ModalContent>
                    <ModalHeader>Reject Expense Claim</ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-default-500 mb-4">
                            Please provide a reason for rejecting this expense claim.
                        </p>
                        <Textarea
                            label="Rejection Reason"
                            placeholder="Enter reason for rejection"
                            value={rejectReason}
                            onValueChange={setRejectReason}
                            radius={themeRadius}
                            minRows={3}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setRejectModalOpen(false)}>Cancel</Button>
                        <Button color="danger" onPress={submitReject}>Reject</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            
            <StandardPageLayout
                title="Expense Claims"
                subtitle="Manage employee expense reimbursement claims"
                icon={<BanknotesIcon className="w-6 h-6" />}
                isLoading={loading && statsLoading}
                ariaLabel="Expense Claims Management"
                actions={actionButtons}
                stats={<StatsCards stats={statsData} isLoading={statsLoading} />}
                filters={filterSection}
                pagination={paginationSection}
            >
                <ExpenseClaimsTable
                    claims={claims}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onView={handleView}
                    canEdit={canEditClaim}
                    canDelete={canDeleteClaim}
                    canApprove={canApproveClaim}
                />
            </StandardPageLayout>
        </>
    );
};

ExpenseClaimsIndex.layout = (page) => <App children={page} />;
export default ExpenseClaimsIndex;
