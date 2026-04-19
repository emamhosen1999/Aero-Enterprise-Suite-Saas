import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useHRMAC } from '@/Hooks/useHRMAC';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Select,
    SelectItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Tooltip,
    Spinner,
} from "@heroui/react";
import {
    PlusIcon,
    MagnifyingGlassIcon,
    DocumentTextIcon,
    PencilIcon,
    TrashIcon,
    DocumentDuplicateIcon,
    EyeIcon,
    EllipsisVerticalIcon,
    GlobeAltIcon,
    ArrowUpOnSquareIcon,
    ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { getStatusColor, useResponsiveBreakpoints } from '@/utils/themeUtils';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const CmsIndex = ({ title }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();

    // Responsive breakpoints using centralized utility
    const { isMobile, isTablet } = useResponsiveBreakpoints();

    // State
    const [loading, setLoading] = useState(true);
    const [pages, setPages] = useState([]);
    const [filters, setFilters] = useState({ search: '', status: 'all' });
    const [pagination, setPagination] = useState({ perPage: 20, currentPage: 1, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, scheduled: 0 });

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { title: "Total Pages", value: stats.total, icon: <DocumentTextIcon className="w-5 h-5" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Published", value: stats.published, icon: <GlobeAltIcon className="w-5 h-5" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Drafts", value: stats.draft, icon: <PencilIcon className="w-5 h-5" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Scheduled", value: stats.scheduled, icon: <ArchiveBoxIcon className="w-5 h-5" />, color: "text-secondary", iconBg: "bg-secondary/20" },
    ], [stats]);

    // Permission checks
    const { hasAccess: hrmacHasAccess } = useHRMAC();
    const canCreate = hrmacHasAccess('cms.pages.editor.create');
    const canEdit = hrmacHasAccess('cms.pages.editor.edit');
    const canDelete = hrmacHasAccess('cms.pages.editor.delete');
    const canPublish = hrmacHasAccess('cms.pages.editor.publish');

    // Fetch pages
    const fetchPages = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('admin.cms.pages.paginate'), {
                params: {
                    page: pagination.currentPage,
                    per_page: pagination.perPage,
                    search: filters.search,
                    status: filters.status !== 'all' ? filters.status : undefined,
                }
            });

            if (response.data) {
                setPages(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1,
                }));
                
                // Update stats
                if (response.data.stats) {
                    setStats(response.data.stats);
                }
            }
        } catch (error) {
            console.error('Failed to fetch pages:', error);
            showToast.error('Failed to load pages');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    useEffect(() => {
        fetchPages();
    }, [fetchPages]);

    // Handle search with debounce
    useEffect(() => {
        const debounce = setTimeout(() => {
            setPagination(prev => ({ ...prev, currentPage: 1 }));
        }, 300);
        return () => clearTimeout(debounce);
    }, [filters.search]);

    // Actions
    const handleEdit = (page) => {
        router.visit(route('admin.cms.pages.edit', page.id));
    };

    const handleDuplicate = async (page) => {
        const promise = axios.post(route('admin.cms.pages.duplicate', page.id));
        
        showToast.promise(promise, {
            loading: 'Duplicating page...',
            success: (response) => {
                fetchPages();
                return response.data.message || 'Page duplicated successfully';
            },
            error: (err) => err.response?.data?.message || 'Failed to duplicate page',
        });
    };

    const handleDelete = async (page) => {
        if (!confirm(`Are you sure you want to delete "${page.title}"?`)) return;

        const promise = axios.delete(route('admin.cms.pages.destroy', page.id));
        
        showToast.promise(promise, {
            loading: 'Deleting page...',
            success: () => {
                fetchPages();
                return 'Page deleted successfully';
            },
            error: (err) => err.response?.data?.message || 'Failed to delete page',
        });
    };

    const handlePublish = async (page) => {
        const promise = axios.post(route('admin.cms.pages.publish', page.id));
        
        showToast.promise(promise, {
            loading: 'Publishing page...',
            success: () => {
                fetchPages();
                return 'Page published successfully';
            },
            error: (err) => err.response?.data?.message || 'Failed to publish page',
        });
    };

    const handleUnpublish = async (page) => {
        const promise = axios.post(route('admin.cms.pages.unpublish', page.id));
        
        showToast.promise(promise, {
            loading: 'Unpublishing page...',
            success: () => {
                fetchPages();
                return 'Page unpublished successfully';
            },
            error: (err) => err.response?.data?.message || 'Failed to unpublish page',
        });
    };

    // Status colors
    const statusColorMap = {
        published: 'success',
        draft: 'warning',
        scheduled: 'secondary',
        archived: 'default',
    };

    // Table columns
    const columns = [
        { key: 'title', label: 'Title' },
        { key: 'slug', label: 'URL' },
        { key: 'status', label: 'Status' },
        { key: 'updated_at', label: 'Last Modified' },
        { key: 'actions', label: 'Actions' },
    ];

    // Render cell
    const renderCell = (page, columnKey) => {
        switch (columnKey) {
            case 'title':
                return (
                    <div>
                        <p className="font-medium">{page.title}</p>
                        {page.is_homepage && (
                            <Chip size="sm" color="primary" variant="flat" className="mt-1">
                                Homepage
                            </Chip>
                        )}
                    </div>
                );
            case 'slug':
                return (
                    <a
                        href={`/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                    >
                        /{page.slug}
                    </a>
                );
            case 'status':
                return (
                    <Chip
                        size="sm"
                        color={statusColorMap[page.status] || 'default'}
                        variant="flat"
                    >
                        {page.status}
                    </Chip>
                );
            case 'updated_at':
                return (
                    <span className="text-sm text-default-500">
                        {new Date(page.updated_at).toLocaleDateString()}
                    </span>
                );
            case 'actions':
                return (
                    <div className="flex items-center gap-1">
                        <Tooltip content="Preview">
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                as="a"
                                href={route('admin.cms.pages.preview', page.id)}
                                target="_blank"
                            >
                                <EyeIcon className="w-4 h-4" />
                            </Button>
                        </Tooltip>
                        
                        {canEdit && (
                            <Tooltip content="Edit">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => handleEdit(page)}
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                        )}
                        
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                    <EllipsisVerticalIcon className="w-4 h-4" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Page Actions">
                                {canPublish && page.status === 'draft' && (
                                    <DropdownItem
                                        key="publish"
                                        startContent={<ArrowUpOnSquareIcon className="w-4 h-4" />}
                                        onPress={() => handlePublish(page)}
                                    >
                                        Publish
                                    </DropdownItem>
                                )}
                                {canPublish && page.status === 'published' && (
                                    <DropdownItem
                                        key="unpublish"
                                        startContent={<ArchiveBoxIcon className="w-4 h-4" />}
                                        onPress={() => handleUnpublish(page)}
                                    >
                                        Unpublish
                                    </DropdownItem>
                                )}
                                <DropdownItem
                                    key="duplicate"
                                    startContent={<DocumentDuplicateIcon className="w-4 h-4" />}
                                    onPress={() => handleDuplicate(page)}
                                >
                                    Duplicate
                                </DropdownItem>
                                {canDelete && (
                                    <DropdownItem
                                        key="delete"
                                        className="text-danger"
                                        color="danger"
                                        startContent={<TrashIcon className="w-4 h-4" />}
                                        onPress={() => handleDelete(page)}
                                    >
                                        Delete
                                    </DropdownItem>
                                )}
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return page[columnKey];
        }
    };

    return (
        <>
            <Head title={title || 'CMS Pages'} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="CMS Page Management">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="transition-all duration-200" style={getThemedCardStyle()}>
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
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <DocumentTextIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        CMS Pages
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage your website pages and content
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 flex-wrap">
                                                {canCreate && (
                                                    <Button
                                                        color="primary"
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => router.visit(route('admin.cms.pages.create'))}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Create Page
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} isLoading={loading} className="mb-6" />

                                    {/* Filters */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            placeholder="Search pages..."
                                            value={filters.search}
                                            onValueChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            className="flex-1"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        <Select
                                            placeholder="All Status"
                                            selectedKeys={[filters.status]}
                                            onSelectionChange={(keys) => {
                                                const status = Array.from(keys)[0] || 'all';
                                                setFilters(prev => ({ ...prev, status }));
                                            }}
                                            className="w-full sm:w-48"
                                            size="sm"
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="all">All Status</SelectItem>
                                            <SelectItem key="published">Published</SelectItem>
                                            <SelectItem key="draft">Draft</SelectItem>
                                            <SelectItem key="scheduled">Scheduled</SelectItem>
                                        </Select>
                                    </div>

                                    {/* Table */}
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Spinner size="lg" />
                                        </div>
                                    ) : (
                                        <Table
                                            aria-label="CMS Pages table"
                                            classNames={{
                                                wrapper: "shadow-none border border-divider rounded-lg",
                                                th: "bg-default-100 text-default-600 font-semibold",
                                                td: "py-3",
                                            }}
                                        >
                                            <TableHeader columns={columns}>
                                                {(column) => (
                                                    <TableColumn key={column.key}>
                                                        {column.label}
                                                    </TableColumn>
                                                )}
                                            </TableHeader>
                                            <TableBody
                                                items={pages}
                                                emptyContent="No pages found. Create your first page!"
                                            >
                                                {(item) => (
                                                    <TableRow key={item.id}>
                                                        {(columnKey) => (
                                                            <TableCell>{renderCell(item, columnKey)}</TableCell>
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
                                                size="sm"
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

CmsIndex.layout = (page) => <App children={page} />;
export default CmsIndex;
