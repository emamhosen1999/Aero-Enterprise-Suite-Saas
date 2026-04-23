import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Tooltip,
    Switch,
    Textarea
} from "@heroui/react";
import {
    FolderIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    EllipsisVerticalIcon
} from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import App from '@/Layouts/App.jsx';
import { motion } from 'framer-motion';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard.jsx';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import StatsCards from '@/Components/UI/StatsCards';

const ExpenseCategoriesIndex = ({ title }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canAccess } = useHRMAC();
    
    // Responsive breakpoints
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // State management
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
    const [filters, setFilters] = useState({ search: '' });
    const [pagination, setPagination] = useState({ 
        currentPage: 1, 
        perPage: 30, 
        total: 0 
    });
    
    // Modal states
    const [modalStates, setModalStates] = useState({
        add: false,
        edit: false,
        delete: false
    });
    const [selectedCategory, setSelectedCategory] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true
    });
    const [formErrors, setFormErrors] = useState({});
    const [formProcessing, setFormProcessing] = useState(false);

    // Permission checks
    const canCreate = canAccess('hrm.expenses.categories.create');
    const canUpdate = canAccess('hrm.expenses.categories.update');
    const canDelete = canAccess('hrm.expenses.categories.delete');

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        {
            title: "Total Categories",
            value: stats.total,
            icon: <FolderIcon className="w-6 h-6" />,
            color: "text-primary",
            iconBg: "bg-primary/20"
        },
        {
            title: "Active",
            value: stats.active,
            icon: <FolderIcon className="w-6 h-6" />,
            color: "text-success",
            iconBg: "bg-success/20"
        },
        {
            title: "Inactive",
            value: stats.inactive,
            icon: <FolderIcon className="w-6 h-6" />,
            color: "text-danger",
            iconBg: "bg-danger/20"
        }
    ], [stats]);

    // Fetch categories data
    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.expenses.categories.paginate'), {
                params: {
                    page: pagination.currentPage,
                    perPage: pagination.perPage,
                    ...filters
                }
            });

            if (response.status === 200) {
                setCategories(response.data.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.data.total || 0
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to load expense categories'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(route('hrm.expenses.categories.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }, []);

    useEffect(() => { 
        fetchCategories(); 
        fetchStats();
    }, [fetchCategories, fetchStats]);

    // Modal management
    const openModal = (type, category = null) => {
        if (category) {
            setSelectedCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                is_active: category.is_active
            });
        } else {
            setSelectedCategory(null);
            setFormData({
                name: '',
                description: '',
                is_active: true
            });
        }
        setFormErrors({});
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedCategory(null);
        setFormData({ name: '', description: '', is_active: true });
        setFormErrors({});
    };

    // Form handlers
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    // CRUD operations
    const handleSubmit = async () => {
        setFormProcessing(true);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const url = selectedCategory 
                    ? route('hrm.expenses.categories.update', selectedCategory.id)
                    : route('hrm.expenses.categories.store');
                    
                const response = await axios({
                    method: selectedCategory ? 'put' : 'post',
                    url,
                    data: formData
                });

                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || 'Category saved successfully']);
                    closeModal(selectedCategory ? 'edit' : 'add');
                    fetchCategories();
                    fetchStats();
                }
            } catch (error) {
                if (error.response?.status === 422) {
                    setFormErrors(error.response.data.errors || {});
                }
                reject(error.response?.data?.errors || ['An error occurred']);
            }
        });

        showToast.promise(promise, {
            loading: selectedCategory ? 'Updating category...' : 'Creating category...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });

        setFormProcessing(false);
    };

    const handleDelete = async () => {
        if (!selectedCategory) return;
        
        setFormProcessing(true);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(
                    route('hrm.expenses.categories.destroy', selectedCategory.id)
                );

                if (response.status === 200) {
                    resolve([response.data.message || 'Category deleted successfully']);
                    closeModal('delete');
                    fetchCategories();
                    fetchStats();
                }
            } catch (error) {
                reject(error.response?.data?.message || ['Failed to delete category']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting category...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });

        setFormProcessing(false);
    };

    // Search handling
    const handleSearchChange = (value) => {
        setFilters(prev => ({ ...prev, search: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Table columns
    const columns = [
        { name: "NAME", uid: "name" },
        { name: "DESCRIPTION", uid: "description" },
        { name: "STATUS", uid: "status" },
        { name: "CLAIMS", uid: "claims_count" },
        { name: "ACTIONS", uid: "actions" }
    ];

    // Table cell renderer
    const renderCell = useCallback((category, columnKey) => {
        switch (columnKey) {
            case "name":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm">{category.name}</p>
                    </div>
                );
            case "description":
                return (
                    <div className="text-small text-default-600">
                        {category.description || 'No description'}
                    </div>
                );
            case "status":
                return (
                    <Chip
                        className="capitalize"
                        color={category.is_active ? "success" : "danger"}
                        size="sm"
                        variant="flat"
                    >
                        {category.is_active ? "Active" : "Inactive"}
                    </Chip>
                );
            case "claims_count":
                return (
                    <div className="text-small">
                        {category.claims_count || 0} claims
                    </div>
                );
            case "actions":
                return (
                    <div className="flex items-center gap-2">
                        {canUpdate && (
                            <Tooltip content="Edit Category">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => openModal('edit', category)}
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                        )}
                        {canDelete && (
                            <Tooltip content="Delete Category" color="danger">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    onPress={() => openModal('delete', category)}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                        )}
                    </div>
                );
            default:
                return category[columnKey];
        }
    }, [canUpdate, canDelete]);

    return (
        <>
            <Head title={title || "Expense Categories"} />
            
            {/* Add Modal */}
            <Modal 
                isOpen={modalStates.add} 
                onOpenChange={() => closeModal('add')}
                size="2xl"
                scrollBehavior="inside"
                classNames={{
                    base: "bg-content1",
                    header: "border-b border-divider",
                    body: "py-6",
                    footer: "border-t border-divider"
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold">Add New Category</h2>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <Input
                                label="Category Name"
                                placeholder="Enter category name"
                                value={formData.name}
                                onValueChange={(value) => handleInputChange('name', value)}
                                isInvalid={!!formErrors.name}
                                errorMessage={formErrors.name?.[0]}
                                isRequired
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            
                            <Textarea
                                label="Description"
                                placeholder="Enter category description (optional)"
                                value={formData.description}
                                onValueChange={(value) => handleInputChange('description', value)}
                                isInvalid={!!formErrors.description}
                                errorMessage={formErrors.description?.[0]}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            
                            <div className="flex items-center gap-2">
                                <Switch
                                    isSelected={formData.is_active}
                                    onValueChange={(value) => handleInputChange('is_active', value)}
                                    color="success"
                                >
                                    Active Category
                                </Switch>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button 
                            variant="flat" 
                            onPress={() => closeModal('add')}
                            disabled={formProcessing}
                        >
                            Cancel
                        </Button>
                        <Button 
                            color="primary" 
                            onPress={handleSubmit}
                            isLoading={formProcessing}
                        >
                            Create Category
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Edit Modal */}
            <Modal 
                isOpen={modalStates.edit} 
                onOpenChange={() => closeModal('edit')}
                size="2xl"
                scrollBehavior="inside"
                classNames={{
                    base: "bg-content1",
                    header: "border-b border-divider",
                    body: "py-6",
                    footer: "border-t border-divider"
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold">Edit Category</h2>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <Input
                                label="Category Name"
                                placeholder="Enter category name"
                                value={formData.name}
                                onValueChange={(value) => handleInputChange('name', value)}
                                isInvalid={!!formErrors.name}
                                errorMessage={formErrors.name?.[0]}
                                isRequired
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            
                            <Textarea
                                label="Description"
                                placeholder="Enter category description (optional)"
                                value={formData.description}
                                onValueChange={(value) => handleInputChange('description', value)}
                                isInvalid={!!formErrors.description}
                                errorMessage={formErrors.description?.[0]}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            
                            <div className="flex items-center gap-2">
                                <Switch
                                    isSelected={formData.is_active}
                                    onValueChange={(value) => handleInputChange('is_active', value)}
                                    color="success"
                                >
                                    Active Category
                                </Switch>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button 
                            variant="flat" 
                            onPress={() => closeModal('edit')}
                            disabled={formProcessing}
                        >
                            Cancel
                        </Button>
                        <Button 
                            color="primary" 
                            onPress={handleSubmit}
                            isLoading={formProcessing}
                        >
                            Update Category
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Modal */}
            <Modal 
                isOpen={modalStates.delete} 
                onOpenChange={() => closeModal('delete')}
                size="md"
                classNames={{
                    base: "bg-content1",
                    header: "border-b border-divider",
                    body: "py-6",
                    footer: "border-t border-divider"
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold text-danger">Delete Category</h2>
                    </ModalHeader>
                    <ModalBody>
                        <p>Are you sure you want to delete <strong>{selectedCategory?.name}</strong>?</p>
                        <p className="text-small text-default-600">
                            This action cannot be undone. Any expense claims using this category will need to be reassigned.
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button 
                            variant="flat" 
                            onPress={() => closeModal('delete')}
                            disabled={formProcessing}
                        >
                            Cancel
                        </Button>
                        <Button 
                            color="danger" 
                            onPress={handleDelete}
                            isLoading={formProcessing}
                        >
                            Delete Category
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Expense Categories Management">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card 
                                className="transition-all duration-200"
                                style={getThemedCardStyle()}
                            >
                                <CardHeader className="border-b border-divider p-0" 
                                    style={{
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl bg-primary/20`}>
                                                    <FolderIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'} text-primary`} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Expense Categories
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage expense claim categories and settings
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreate && (
                                                    <Button 
                                                        color="primary" 
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('add')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Add Category
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
                                            placeholder="Search categories..."
                                            value={filters.search}
                                            onValueChange={handleSearchChange}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />
                                    </div>
                                    
                                    {/* Data Table */}
                                    <Table
                                        aria-label="Expense categories table"
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
                                            items={categories} 
                                            emptyContent={loading ? "Loading categories..." : "No categories found"}
                                            isLoading={loading}
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
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

ExpenseCategoriesIndex.layout = (page) => <App children={page} />;
export default ExpenseCategoriesIndex;
