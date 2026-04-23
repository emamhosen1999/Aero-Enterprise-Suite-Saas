import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { 
    BanknotesIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    PlusIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon 
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import ExpenseClaimForm from '@/Forms/HRM/ExpenseClaimForm.jsx';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const MyExpenses = ({ title, categories: initialCategories }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
    // Manual responsive state management
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
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState(initialCategories || []);
    const [stats, setStats] = useState({ 
        total: 0, 
        pending: 0, 
        approved: 0, 
        rejected: 0,
        totalAmount: 0,
        pendingAmount: 0
    });
    
    // Filter and pagination state
    const [filters, setFilters] = useState({ search: '', status: '', category: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 10, total: 0, lastPage: 1 });
    
    // Modal state
    const [modalStates, setModalStates] = useState({
        add: false,
        edit: false,
        view: false,
        delete: false
    });
    const [selectedExpense, setSelectedExpense] = useState(null);

    // Permission checks
    const canCreateExpense = canCreate('hrm.expenses') || isSuperAdmin();
    const canEditExpense = canUpdate('hrm.expenses') || isSuperAdmin();
    const canDeleteExpense = canDelete('hrm.expenses') || isSuperAdmin();

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Claims", 
            value: stats.total, 
            icon: <DocumentTextIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Pending", 
            value: stats.pending, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Approved", 
            value: stats.approved, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Total Amount", 
            value: `$${stats.totalAmount.toLocaleString()}`, 
            icon: <BanknotesIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // Status color mapping
    const statusColorMap = {
        pending: "warning",
        approved: "success",
        rejected: "danger",
        paid: "primary"
    };

    // Fetch expenses data
    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.my-expenses.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setExpenses(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch my expenses'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.my-expenses.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch expense stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExpenses();
        fetchStats();
    }, [fetchExpenses, fetchStats]);

    // Modal handlers
    const openModal = (type, expense = null) => {
        setSelectedExpense(expense);
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedExpense(null);
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Table columns
    const columns = [
        { uid: 'expense_date', name: 'Date' },
        { uid: 'category', name: 'Category' },
        { uid: 'description', name: 'Description' },
        { uid: 'amount', name: 'Amount' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'expense_date':
                return new Date(item.expense_date).toLocaleDateString();
            case 'category':
                return item.category?.name || 'N/A';
            case 'amount':
                return `$${parseFloat(item.amount).toFixed(2)}`;
            case 'status':
                return (
                    <Chip 
                        color={statusColorMap[item.status] || 'default'} 
                        size="sm" 
                        variant="flat"
                    >
                        {item.status}
                    </Chip>
                );
            case 'actions':
                return (
                    <div className="flex gap-1">
                        <Button 
                            isIconOnly 
                            size="sm" 
                            variant="light"
                            onPress={() => openModal('view', item)}
                        >
                            <EyeIcon className="w-4 h-4" />
                        </Button>
                        {item.status === 'draft' && canEditExpense && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light"
                                onPress={() => openModal('edit', item)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {item.status === 'draft' && canDeleteExpense && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light" 
                                color="danger"
                                onPress={() => openModal('delete', item)}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            default:
                return item[columnKey] || '-';
        }
    }, [canEditExpense, canDeleteExpense]);

    // Handle successful form submission
    const handleFormSuccess = () => {
        fetchExpenses();
        fetchStats();
        closeModal('add');
        closeModal('edit');
    };

    return (
        <StandardPageLayout
            title="My Expenses"
            subtitle="Manage your expense claims and reimbursements"
            icon={<BanknotesIcon className="w-6 h-6" />}
            iconColorClass="text-primary"
            iconBgClass="bg-primary/20"
            stats={<StatsCards stats={statsData} isLoading={statsLoading} />}
            actions={
                canCreateExpense && (
                    <Button 
                        color="primary" 
                        variant="shadow"
                        startContent={<PlusIcon className="w-4 h-4" />}
                        onPress={() => openModal('add')}
                        size={isMobile ? "sm" : "md"}
                    >
                        Submit Claim
                    </Button>
                )
            }
            ariaLabel="My Expense Claims"
        >
            {/* Modals */}
            {modalStates.add && (
                <ExpenseClaimForm
                    open={modalStates.add}
                    onClose={() => closeModal('add')}
                    onSuccess={handleFormSuccess}
                    categories={categories}
                />
            )}
            
            {modalStates.edit && selectedExpense && (
                <ExpenseClaimForm
                    open={modalStates.edit}
                    onClose={() => closeModal('edit')}
                    onSuccess={handleFormSuccess}
                    categories={categories}
                    expense={selectedExpense}
                />
            )}

            {/* Filter Section */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Input
                    placeholder="Search expenses..."
                    value={filters.search}
                    onValueChange={(value) => handleFilterChange('search', value)}
                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                    classNames={{ inputWrapper: "bg-default-100" }}
                    size="sm"
                    radius={themeRadius}
                />
                
                <Select
                    placeholder="All Categories"
                    selectedKeys={filters.category ? [filters.category] : []}
                    onSelectionChange={(keys) => handleFilterChange('category', Array.from(keys)[0] || '')}
                    classNames={{ trigger: "bg-default-100" }}
                    size="sm"
                    radius={themeRadius}
                >
                    {categories.map(category => (
                        <SelectItem key={category.id}>{category.name}</SelectItem>
                    ))}
                </Select>
                
                <Select
                    placeholder="All Status"
                    selectedKeys={filters.status ? [filters.status] : []}
                    onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                    classNames={{ trigger: "bg-default-100" }}
                    size="sm"
                    radius={themeRadius}
                >
                    <SelectItem key="pending">Pending</SelectItem>
                    <SelectItem key="approved">Approved</SelectItem>
                    <SelectItem key="rejected">Rejected</SelectItem>
                    <SelectItem key="paid">Paid</SelectItem>
                </Select>
            </div>

            {/* Data Table */}
            <Table 
                aria-label="My Expenses" 
                classNames={{
                    wrapper: "shadow-none border border-divider rounded-lg",
                    th: "bg-default-100 text-default-600 font-semibold",
                    td: "py-3"
                }}
            >
                <TableHeader columns={columns}>
                    {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                </TableHeader>
                <TableBody 
                    items={expenses} 
                    emptyContent={loading ? "Loading..." : "No expense claims found"}
                    isLoading={loading}
                >
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Pagination */}
            {pagination.total > pagination.perPage && (
                <div className="flex justify-center mt-6">
                    <Pagination
                        total={pagination.lastPage}
                        page={pagination.currentPage}
                        onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                        showControls
                        showShadow
                        color="primary"
                        size={isMobile ? "sm" : "md"}
                    />
                </div>
            )}
        </StandardPageLayout>
    );
};

MyExpenses.layout = (page) => <App children={page} />;
export default MyExpenses;