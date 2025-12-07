import React, { useState, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Select,
    SelectItem,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Spinner,
    Divider,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
    Checkbox,
    Tooltip,
} from '@heroui/react';
import { 
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowPathIcon,
    BugAntIcon,
    EyeIcon,
    XMarkIcon,
    CheckCircleIcon,
    TrashIcon,
    ClipboardDocumentIcon,
    GlobeAltIcon,
    ComputerDesktopIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ServerIcon,
    DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

/**
 * Stats Card Component
 */
const StatsCard = ({ title, value, icon: Icon, color = 'default' }) => {
    const colorClasses = {
        default: 'bg-default-100 text-default-600',
        danger: 'bg-danger-100 text-danger-600',
        success: 'bg-success-100 text-success-600',
        warning: 'bg-warning-100 text-warning-600',
        primary: 'bg-primary-100 text-primary-600',
    };

    return (
        <Card 
            className="transition-all duration-200"
            style={{
                border: `var(--borderWidth, 2px) solid transparent`,
                borderRadius: `var(--borderRadius, 12px)`,
                background: `linear-gradient(135deg, 
                    var(--theme-content1, #FAFAFA) 20%, 
                    var(--theme-content2, #F4F4F5) 10%, 
                    var(--theme-content3, #F1F3F4) 20%)`,
            }}
        >
            <CardBody className="flex flex-row items-center gap-4 py-4">
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-default-500">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </CardBody>
        </Card>
    );
};

/**
 * Error Detail Modal
 */
const ErrorDetailModal = ({ errorLog, isOpen, onClose, onResolve }) => {
    const [copied, setCopied] = useState(false);

    if (!errorLog) return null;

    const handleCopyTraceId = () => {
        navigator.clipboard.writeText(errorLog.trace_id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <BugAntIcon className="w-5 h-5 text-danger" />
                        Error Details
                    </div>
                    <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-danger-100 dark:bg-danger-900/30 text-danger px-2 py-1 rounded">
                            {errorLog.trace_id}
                        </code>
                        <Button 
                            size="sm" 
                            variant="flat" 
                            isIconOnly
                            onPress={handleCopyTraceId}
                        >
                            <ClipboardDocumentIcon className="w-4 h-4" />
                        </Button>
                        {copied && <span className="text-xs text-success">Copied!</span>}
                    </div>
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        {/* Status & Type */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <Chip 
                                color={errorLog.resolved_at ? 'success' : 'danger'} 
                                variant="flat"
                            >
                                {errorLog.resolved_at ? 'Resolved' : 'Unresolved'}
                            </Chip>
                            <Chip color="primary" variant="flat">
                                {errorLog.error_type}
                            </Chip>
                            <Chip 
                                color={errorLog.origin === 'frontend' ? 'warning' : 'secondary'} 
                                variant="flat"
                                startContent={errorLog.origin === 'frontend' ? 
                                    <DevicePhoneMobileIcon className="w-3 h-3" /> : 
                                    <ServerIcon className="w-3 h-3" />
                                }
                            >
                                {errorLog.origin}
                            </Chip>
                            {errorLog.http_code > 0 && (
                                <Chip color="default" variant="bordered">
                                    HTTP {errorLog.http_code}
                                </Chip>
                            )}
                        </div>

                        <Divider />

                        {/* Error Message */}
                        <div>
                            <label className="text-xs text-default-500 uppercase mb-2 block">Error Message</label>
                            <Card className="bg-danger-50 dark:bg-danger-900/20">
                                <CardBody>
                                    <p className="text-sm font-mono whitespace-pre-wrap break-all">
                                        {errorLog.error_message}
                                    </p>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Request Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-2">
                                <GlobeAltIcon className="w-4 h-4 text-default-400 mt-1" />
                                <div className="flex-1 min-w-0">
                                    <label className="text-xs text-default-500">Request URL</label>
                                    <p className="text-sm break-all">{errorLog.request_url || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <ClockIcon className="w-4 h-4 text-default-400 mt-1" />
                                <div>
                                    <label className="text-xs text-default-500">Occurred At</label>
                                    <p className="text-sm">{new Date(errorLog.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {errorLog.request_method && (
                            <div className="flex items-center gap-2">
                                <Chip size="sm" variant="bordered">{errorLog.request_method}</Chip>
                                <span className="text-sm text-default-500">Request Method</span>
                            </div>
                        )}

                        {/* User Agent */}
                        {errorLog.user_agent && (
                            <div className="flex items-start gap-2">
                                <ComputerDesktopIcon className="w-4 h-4 text-default-400 mt-1" />
                                <div className="flex-1 min-w-0">
                                    <label className="text-xs text-default-500">User Agent</label>
                                    <p className="text-xs text-default-600 break-all">{errorLog.user_agent}</p>
                                </div>
                            </div>
                        )}

                        {/* Stack Trace */}
                        {errorLog.stack_trace && (
                            <>
                                <Divider />
                                <div>
                                    <label className="text-xs text-default-500 uppercase mb-2 block">Stack Trace</label>
                                    <Card>
                                        <CardBody className="p-0">
                                            <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-64 p-4 bg-default-100 dark:bg-default-800 rounded-lg font-mono">
                                                {errorLog.stack_trace}
                                            </pre>
                                        </CardBody>
                                    </Card>
                                </div>
                            </>
                        )}

                        {/* Request Payload */}
                        {errorLog.request_payload && Object.keys(errorLog.request_payload).length > 0 && (
                            <>
                                <Divider />
                                <div>
                                    <label className="text-xs text-default-500 uppercase mb-2 block">Request Payload</label>
                                    <Card>
                                        <CardBody>
                                            <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-48 font-mono">
                                                {JSON.stringify(errorLog.request_payload, null, 2)}
                                            </pre>
                                        </CardBody>
                                    </Card>
                                </div>
                            </>
                        )}

                        {/* Context */}
                        {errorLog.context && Object.keys(errorLog.context).length > 0 && (
                            <>
                                <Divider />
                                <div>
                                    <label className="text-xs text-default-500 uppercase mb-2 block">Context</label>
                                    <Card>
                                        <CardBody>
                                            <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-48 font-mono">
                                                {JSON.stringify(errorLog.context, null, 2)}
                                            </pre>
                                        </CardBody>
                                    </Card>
                                </div>
                            </>
                        )}

                        {/* Tenant Info */}
                        {errorLog.tenant_id && (
                            <>
                                <Divider />
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-default-500">Tenant ID:</span>
                                    <code className="text-xs font-mono bg-default-100 px-2 py-1 rounded">
                                        {errorLog.tenant_id}
                                    </code>
                                </div>
                            </>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    {!errorLog.resolved_at && (
                        <Button 
                            color="success" 
                            variant="flat"
                            startContent={<CheckCircleIcon className="w-4 h-4" />}
                            onPress={() => {
                                onResolve(errorLog.id);
                                onClose();
                            }}
                        >
                            Mark Resolved
                        </Button>
                    )}
                    <Button variant="light" onPress={onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

/**
 * Error Log Index Page
 */
export default function Index({ 
    errorLogs = { data: [], meta: {} }, 
    errorTypes = [],
    httpCodes = [],
    stats = {},
    filters = {},
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedError, setSelectedError] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [currentFilters, setCurrentFilters] = useState({
        error_type: filters.error_type || '',
        http_code: filters.http_code || '',
        origin: filters.origin || '',
        resolved: filters.resolved || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
    });

    const handleSearch = useCallback((value) => {
        setSearchQuery(value);
        
        // Debounce search
        const timer = setTimeout(() => {
            router.get(route('admin.error-logs.index'), {
                ...currentFilters,
                search: value,
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [currentFilters]);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...currentFilters, [key]: value };
        setCurrentFilters(newFilters);

        router.get(route('admin.error-logs.index'), {
            ...newFilters,
            search: searchQuery,
        }, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
        });
    };

    const handleClearFilters = () => {
        setCurrentFilters({
            error_type: '',
            http_code: '',
            origin: '',
            resolved: '',
            start_date: '',
            end_date: '',
        });
        setSearchQuery('');

        router.get(route('admin.error-logs.index'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleViewError = (error) => {
        setSelectedError(error);
        onOpen();
    };

    const handleResolve = async (id) => {
        const promise = axios.post(route('admin.error-logs.resolve', id));
        
        showToast.promise(promise, {
            loading: 'Marking as resolved...',
            success: 'Error marked as resolved',
            error: 'Failed to resolve error',
        });

        promise.then(() => {
            router.reload({ only: ['errorLogs', 'stats'] });
        });
    };

    const handleBulkResolve = async () => {
        if (selectedIds.length === 0) return;

        const promise = axios.post(route('admin.error-logs.bulk-resolve'), {
            ids: selectedIds,
        });

        showToast.promise(promise, {
            loading: `Resolving ${selectedIds.length} errors...`,
            success: `${selectedIds.length} errors marked as resolved`,
            error: 'Failed to resolve errors',
        });

        promise.then(() => {
            setSelectedIds([]);
            router.reload({ only: ['errorLogs', 'stats'] });
        });
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const promise = axios.post(route('admin.error-logs.bulk-destroy'), {
            ids: selectedIds,
        });

        showToast.promise(promise, {
            loading: `Deleting ${selectedIds.length} errors...`,
            success: `${selectedIds.length} errors deleted`,
            error: 'Failed to delete errors',
        });

        promise.then(() => {
            setSelectedIds([]);
            router.reload({ only: ['errorLogs', 'stats'] });
        });
    };

    const handlePageChange = (page) => {
        router.get(route('admin.error-logs.index'), {
            ...currentFilters,
            search: searchQuery,
            page,
        }, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
        });
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedIds(errorLogs.data.map(e => e.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id, checked) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter(i => i !== id));
        }
    };

    const hasActiveFilters = Object.values(currentFilters).some(v => v) || searchQuery;

    const columns = [
        { key: 'select', label: '' },
        { key: 'trace_id', label: 'Error Code' },
        { key: 'error_type', label: 'Type' },
        { key: 'http_code', label: 'HTTP' },
        { key: 'error_message', label: 'Message' },
        { key: 'origin', label: 'Origin' },
        { key: 'created_at', label: 'Occurred' },
        { key: 'status', label: 'Status' },
        { key: 'actions', label: 'Actions' },
    ];

    const getHttpCodeColor = (code) => {
        if (!code || code === 0) return 'default';
        if (code >= 500) return 'danger';
        if (code >= 400) return 'warning';
        if (code >= 300) return 'primary';
        return 'success';
    };

    const renderCell = (error, columnKey) => {
        switch (columnKey) {
            case 'select':
                return (
                    <Checkbox 
                        isSelected={selectedIds.includes(error.id)}
                        onValueChange={(checked) => handleSelectOne(error.id, checked)}
                    />
                );
            case 'trace_id':
                return (
                    <code className="text-xs font-mono bg-default-100 px-2 py-1 rounded">
                        {error.trace_id?.substring(0, 16)}...
                    </code>
                );
            case 'error_type':
                return (
                    <Chip size="sm" variant="flat" color="primary">
                        {error.error_type || 'Unknown'}
                    </Chip>
                );
            case 'http_code':
                return error.http_code > 0 ? (
                    <Chip size="sm" variant="flat" color={getHttpCodeColor(error.http_code)}>
                        {error.http_code}
                    </Chip>
                ) : <span className="text-default-400">-</span>;
            case 'error_message':
                return (
                    <Tooltip content={error.error_message} placement="top" delay={500}>
                        <span className="text-sm max-w-xs truncate block">
                            {error.error_message?.substring(0, 50)}
                            {error.error_message?.length > 50 ? '...' : ''}
                        </span>
                    </Tooltip>
                );
            case 'origin':
                return (
                    <Chip 
                        size="sm" 
                        variant="dot" 
                        color={error.origin === 'frontend' ? 'warning' : 'secondary'}
                    >
                        {error.origin}
                    </Chip>
                );
            case 'created_at':
                return (
                    <span className="text-sm text-default-500">
                        {new Date(error.created_at).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                );
            case 'status':
                return (
                    <Chip 
                        size="sm" 
                        variant="flat" 
                        color={error.resolved_at ? 'success' : 'danger'}
                    >
                        {error.resolved_at ? 'Resolved' : 'Open'}
                    </Chip>
                );
            case 'actions':
                return (
                    <div className="flex items-center gap-1">
                        <Tooltip content="View Details">
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => handleViewError(error)}
                            >
                                <EyeIcon className="w-4 h-4" />
                            </Button>
                        </Tooltip>
                        {!error.resolved_at && (
                            <Tooltip content="Mark Resolved">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="success"
                                    onPress={() => handleResolve(error.id)}
                                >
                                    <CheckCircleIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                        )}
                    </div>
                );
            default:
                return error[columnKey];
        }
    };

    return (
        <App>
            <Head title="Error Logs" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Error Logs</h1>
                            <p className="text-default-500 mt-1">
                                Monitor and manage application errors
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                isIconOnly
                                variant="flat"
                                onPress={() => router.reload({ only: ['errorLogs', 'stats'] })}
                                isLoading={isLoading}
                            >
                                <ArrowPathIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                        <StatsCard 
                            title="Total Errors" 
                            value={stats.total || 0} 
                            icon={BugAntIcon}
                            color="default"
                        />
                        <StatsCard 
                            title="Unresolved" 
                            value={stats.unresolved || 0} 
                            icon={ExclamationTriangleIcon}
                            color="danger"
                        />
                        <StatsCard 
                            title="Resolved" 
                            value={stats.resolved || 0} 
                            icon={CheckCircleIcon}
                            color="success"
                        />
                        <StatsCard 
                            title="Today" 
                            value={stats.today || 0} 
                            icon={ClockIcon}
                            color="warning"
                        />
                        <StatsCard 
                            title="Frontend" 
                            value={stats.frontend || 0} 
                            icon={DevicePhoneMobileIcon}
                            color="primary"
                        />
                        <StatsCard 
                            title="Backend" 
                            value={stats.backend || 0} 
                            icon={ServerIcon}
                            color="default"
                        />
                    </div>

                    {/* Filters */}
                    <Card 
                        className="mb-6"
                        style={{
                            border: `var(--borderWidth, 2px) solid transparent`,
                            borderRadius: `var(--borderRadius, 12px)`,
                            background: `linear-gradient(135deg, 
                                var(--theme-content1, #FAFAFA) 20%, 
                                var(--theme-content2, #F4F4F5) 10%, 
                                var(--theme-content3, #F1F3F4) 20%)`,
                        }}
                    >
                        <CardBody>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {/* Search */}
                                    <Input
                                        placeholder="Search by trace ID, message, URL..."
                                        value={searchQuery}
                                        onValueChange={handleSearch}
                                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                        className="flex-1"
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    {/* Error Type Filter */}
                                    <Select
                                        placeholder="Error Type"
                                        selectedKeys={currentFilters.error_type ? [currentFilters.error_type] : []}
                                        onSelectionChange={(keys) => handleFilterChange('error_type', Array.from(keys)[0] || '')}
                                        className="w-full sm:w-48"
                                        classNames={{ trigger: "bg-default-100" }}
                                    >
                                        {errorTypes.map(type => (
                                            <SelectItem key={type}>{type}</SelectItem>
                                        ))}
                                    </Select>

                                    {/* Origin Filter */}
                                    <Select
                                        placeholder="Origin"
                                        selectedKeys={currentFilters.origin ? [currentFilters.origin] : []}
                                        onSelectionChange={(keys) => handleFilterChange('origin', Array.from(keys)[0] || '')}
                                        className="w-full sm:w-36"
                                        classNames={{ trigger: "bg-default-100" }}
                                    >
                                        <SelectItem key="frontend">Frontend</SelectItem>
                                        <SelectItem key="backend">Backend</SelectItem>
                                    </Select>

                                    {/* Status Filter */}
                                    <Select
                                        placeholder="Status"
                                        selectedKeys={currentFilters.resolved ? [currentFilters.resolved] : []}
                                        onSelectionChange={(keys) => handleFilterChange('resolved', Array.from(keys)[0] || '')}
                                        className="w-full sm:w-36"
                                        classNames={{ trigger: "bg-default-100" }}
                                    >
                                        <SelectItem key="unresolved">Unresolved</SelectItem>
                                        <SelectItem key="resolved">Resolved</SelectItem>
                                    </Select>

                                    {hasActiveFilters && (
                                        <Button
                                            variant="flat"
                                            color="danger"
                                            startContent={<XMarkIcon className="w-4 h-4" />}
                                            onPress={handleClearFilters}
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </div>

                                {/* Bulk Actions */}
                                {selectedIds.length > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                        <span className="text-sm font-medium">
                                            {selectedIds.length} selected
                                        </span>
                                        <Button
                                            size="sm"
                                            color="success"
                                            variant="flat"
                                            startContent={<CheckCircleIcon className="w-4 h-4" />}
                                            onPress={handleBulkResolve}
                                        >
                                            Resolve Selected
                                        </Button>
                                        <Button
                                            size="sm"
                                            color="danger"
                                            variant="flat"
                                            startContent={<TrashIcon className="w-4 h-4" />}
                                            onPress={handleBulkDelete}
                                        >
                                            Delete Selected
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Table */}
                    <Card
                        style={{
                            border: `var(--borderWidth, 2px) solid transparent`,
                            borderRadius: `var(--borderRadius, 12px)`,
                            background: `linear-gradient(135deg, 
                                var(--theme-content1, #FAFAFA) 20%, 
                                var(--theme-content2, #F4F4F5) 10%, 
                                var(--theme-content3, #F1F3F4) 20%)`,
                        }}
                    >
                        <CardBody className="p-0">
                            <Table
                                aria-label="Error logs table"
                                isHeaderSticky
                                classNames={{
                                    wrapper: "shadow-none",
                                    th: "bg-default-100 text-default-600 font-semibold",
                                    td: "py-3",
                                }}
                            >
                                <TableHeader columns={columns}>
                                    {(column) => (
                                        <TableColumn 
                                            key={column.key}
                                            width={column.key === 'select' ? 40 : undefined}
                                        >
                                            {column.key === 'select' ? (
                                                <Checkbox 
                                                    isSelected={selectedIds.length === errorLogs.data?.length && errorLogs.data?.length > 0}
                                                    isIndeterminate={selectedIds.length > 0 && selectedIds.length < errorLogs.data?.length}
                                                    onValueChange={handleSelectAll}
                                                />
                                            ) : column.label}
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody 
                                    items={errorLogs.data || []} 
                                    emptyContent="No errors found"
                                    isLoading={isLoading}
                                    loadingContent={<Spinner />}
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
                        </CardBody>

                        {/* Pagination */}
                        {errorLogs.meta && errorLogs.meta.last_page > 1 && (
                            <CardBody className="border-t border-divider">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-default-500">
                                        Showing {errorLogs.meta.from} to {errorLogs.meta.to} of {errorLogs.meta.total} errors
                                    </span>
                                    <Pagination
                                        total={errorLogs.meta.last_page}
                                        page={errorLogs.meta.current_page}
                                        onChange={handlePageChange}
                                        showControls
                                    />
                                </div>
                            </CardBody>
                        )}
                    </Card>
                </div>
            </div>

            {/* Error Detail Modal */}
            <ErrorDetailModal 
                errorLog={selectedError}
                isOpen={isOpen}
                onClose={onClose}
                onResolve={handleResolve}
            />
        </App>
    );
}
