import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Input,
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
} from "@heroui/react";
import {
    ArrowDownTrayIcon,
    DocumentIcon,
    DocumentTextIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    FolderIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    PlusIcon,
    ShareIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { showToast } from '@/utils/toastUtils.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const statusColorMap = {
    draft: 'default',
    pending_review: 'warning',
    approved: 'success',
    published: 'primary',
    archived: 'secondary',
    rejected: 'danger',
};

const statusLabels = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    approved: 'Approved',
    published: 'Published',
    archived: 'Archived',
    rejected: 'Rejected',
};

const Documents = ({ documents = { data: [], total: 0, current_page: 1, per_page: 20, last_page: 1 }, categories = [], folders = [], filters: initialFilters = {} }) => {
    const { auth } = usePage().props;
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC('dms');
    const themeRadius = useThemeRadius();

    // Responsive breakpoints
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // State
    const [filters, setFilters] = useState({
        search: initialFilters.search || '',
        category_id: initialFilters.category_id || '',
        status: initialFilters.status || '',
    });
    const [loading, setLoading] = useState(false);

    // Stats data
    const stats = useMemo(() => {
        const docs = documents.data || [];
        return [
            { 
                title: "Total Documents", 
                value: documents.total || 0, 
                icon: <DocumentIcon className="w-6 h-6" />, 
                color: "text-primary", 
                iconBg: "bg-primary/20" 
            },
            { 
                title: "Draft", 
                value: docs.filter(d => d.status === 'draft').length, 
                icon: <DocumentTextIcon className="w-6 h-6" />, 
                color: "text-default-500", 
                iconBg: "bg-default/20" 
            },
            { 
                title: "Published", 
                value: docs.filter(d => d.status === 'published').length, 
                icon: <FolderIcon className="w-6 h-6" />, 
                color: "text-success", 
                iconBg: "bg-success/20" 
            },
            { 
                title: "Pending Review", 
                value: docs.filter(d => d.status === 'pending_review').length, 
                icon: <EyeIcon className="w-6 h-6" />, 
                color: "text-warning", 
                iconBg: "bg-warning/20" 
            },
        ];
    }, [documents]);

    const columns = [
        { uid: 'title', name: 'Document' },
        { uid: 'category', name: 'Category' },
        { uid: 'file_type', name: 'Type' },
        { uid: 'file_size', name: 'Size' },
        { uid: 'status', name: 'Status' },
        { uid: 'created_at', name: 'Created' },
        { uid: 'actions', name: 'Actions' },
    ];

    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const applyFilters = useCallback(() => {
        setLoading(true);
        router.get(route('dms.documents'), filters, {
            preserveState: true,
            onFinish: () => setLoading(false),
        });
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (filters.search !== initialFilters.search) {
                applyFilters();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [filters.search]);

    const handlePageChange = (page) => {
        router.get(route('dms.documents'), { ...filters, page }, { preserveState: true });
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleView = (document) => {
        router.visit(route('dms.documents.show', document.id));
    };

    const handleDelete = async (document) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        
        const promise = new Promise((resolve, reject) => {
            router.delete(route('dms.documents.destroy', document.id), {
                preserveScroll: true,
                onSuccess: () => resolve(['Document deleted successfully']),
                onError: (errors) => reject(Object.values(errors)),
            });
        });

        showToast.promise(promise, {
            loading: 'Deleting document...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'title':
                return (
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <DocumentIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-default-400">{item.document_number || 'No number'}</p>
                        </div>
                    </div>
                );
            case 'category':
                return (
                    <span className="text-sm">{item.category?.name || 'Uncategorized'}</span>
                );
            case 'file_type':
                return (
                    <Chip size="sm" variant="flat">
                        {item.file_type?.toUpperCase() || 'Unknown'}
                    </Chip>
                );
            case 'file_size':
                return (
                    <span className="text-sm text-default-500">{formatFileSize(item.file_size)}</span>
                );
            case 'status':
                return (
                    <Chip 
                        size="sm" 
                        color={statusColorMap[item.status] || 'default'}
                        variant="flat"
                    >
                        {statusLabels[item.status] || item.status}
                    </Chip>
                );
            case 'created_at':
                return (
                    <span className="text-sm text-default-500">
                        {new Date(item.created_at).toLocaleDateString()}
                    </span>
                );
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Document actions">
                            <DropdownItem 
                                key="view" 
                                startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => handleView(item)}
                            >
                                View Details
                            </DropdownItem>
                            <DropdownItem 
                                key="download" 
                                startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                            >
                                Download
                            </DropdownItem>
                            <DropdownItem 
                                key="share" 
                                startContent={<ShareIcon className="w-4 h-4" />}
                            >
                                Share
                            </DropdownItem>
                            {canUpdate && (
                                <DropdownItem 
                                    key="edit" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDelete && (
                                <DropdownItem 
                                    key="delete" 
                                    className="text-danger" 
                                    color="danger"
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                    onPress={() => handleDelete(item)}
                                >
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return item[columnKey];
        }
    };

    const headerActions = (
        <div className="flex gap-2 flex-wrap">
            <Button 
                variant="flat" 
                startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                size={isMobile ? "sm" : "md"}
            >
                Export
            </Button>
            {canCreate && (
                <Button 
                    color="primary" 
                    variant="shadow"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={() => router.visit(route('dms.documents.create'))}
                    size={isMobile ? "sm" : "md"}
                >
                    Upload Document
                </Button>
            )}
        </div>
    );

    const statsSection = <StatsCards stats={stats} className="mb-6" />;

    const filtersSection = (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
                placeholder="Search documents..."
                value={filters.search}
                onValueChange={(value) => handleFilterChange('search', value)}
                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                className="sm:max-w-xs"
                radius={themeRadius}
                variant="bordered"
                size="sm"
            />
            <Select
                placeholder="All Categories"
                selectedKeys={filters.category_id ? [filters.category_id] : []}
                onSelectionChange={(keys) => {
                    handleFilterChange('category_id', Array.from(keys)[0] || '');
                    applyFilters();
                }}
                className="sm:max-w-xs"
                radius={themeRadius}
                variant="bordered"
                size="sm"
            >
                {categories.map(cat => (
                    <SelectItem key={cat.id}>{cat.name}</SelectItem>
                ))}
            </Select>
            <Select
                placeholder="All Statuses"
                selectedKeys={filters.status ? [filters.status] : []}
                onSelectionChange={(keys) => {
                    handleFilterChange('status', Array.from(keys)[0] || '');
                    applyFilters();
                }}
                className="sm:max-w-xs"
                radius={themeRadius}
                variant="bordered"
                size="sm"
            >
                <SelectItem key="draft">Draft</SelectItem>
                <SelectItem key="pending_review">Pending Review</SelectItem>
                <SelectItem key="approved">Approved</SelectItem>
                <SelectItem key="published">Published</SelectItem>
                <SelectItem key="archived">Archived</SelectItem>
            </Select>
        </div>
    );

    const contentSection = (
        <>
            {loading ? (
                <div className="flex justify-center py-12">
                    <Spinner size="lg" />
                </div>
            ) : (
                <Table
                    aria-label="Documents table"
                    isHeaderSticky
                    classNames={{
                        wrapper: "shadow-none border border-divider rounded-lg",
                        th: "bg-default-100 text-default-600 font-semibold",
                        td: "py-3"
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                                {column.name}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody 
                        items={documents.data || []} 
                        emptyContent="No documents found. Upload your first document to get started."
                    >
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </>
    );

    const paginationSection = documents.last_page > 1 && (
        <div className="flex justify-center mt-6">
            <Pagination
                total={documents.last_page}
                page={documents.current_page}
                onChange={handlePageChange}
                showControls
                radius={themeRadius}
            />
        </div>
    );

    return (
        <>
            <Head title="Document Browser" />
            <StandardPageLayout
                title="Document Browser"
                subtitle="Manage and organize your documents"
                icon={<DocumentIcon className="w-8 h-8" />}
                actions={headerActions}
                stats={statsSection}
                filters={filtersSection}
                content={contentSection}
                pagination={paginationSection}
                breadcrumbs={[
                    { label: 'Home', href: route('core.dashboard') },
                    { label: 'Document Management' },
                    { label: 'Document Browser' },
                ]}
            />
        </>
    );
};

export default Documents;
