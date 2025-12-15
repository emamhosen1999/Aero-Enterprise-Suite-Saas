import React, { useState, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Select,
    SelectItem,
    DateRangePicker,
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
    Tabs,
    Tab
} from '@heroui/react';
import { 
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    ArrowPathIcon,
    DocumentTextIcon,
    UserCircleIcon,
    ClockIcon,
    GlobeAltIcon,
    ComputerDesktopIcon,
    EyeIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import AuditTimeline from '@/Components/Platform/AuditTimeline';
import App from '@/Layouts/App';

/**
 * Activity Detail Modal
 */
const ActivityDetailModal = ({ activity, isOpen, onClose }) => {
    if (!activity) return null;

    const properties = activity.properties || {};
    const causer = activity.causer || {};

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-primary" />
                        Activity Details
                    </div>
                    <p className="text-sm font-normal text-default-500">
                        ID: {activity.id}
                    </p>
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-default-500 uppercase">Description</label>
                                <p className="font-medium">{activity.description}</p>
                            </div>
                            <div>
                                <label className="text-xs text-default-500 uppercase">Log Name</label>
                                <p className="font-medium">{activity.log_name || 'default'}</p>
                            </div>
                        </div>

                        <Divider />

                        {/* Subject Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-default-500 uppercase">Subject Type</label>
                                <p className="font-medium">{activity.subject_type?.split('\\').pop() || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-default-500 uppercase">Subject ID</label>
                                <p className="font-medium">{activity.subject_id || 'N/A'}</p>
                            </div>
                        </div>

                        <Divider />

                        {/* Causer Info */}
                        <div>
                            <label className="text-xs text-default-500 uppercase mb-2 block">Performed By</label>
                            <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                                <UserCircleIcon className="w-8 h-8 text-default-400" />
                                <div>
                                    <p className="font-medium">{causer.name || 'System'}</p>
                                    <p className="text-sm text-default-500">{causer.email || 'Automated action'}</p>
                                </div>
                            </div>
                        </div>

                        <Divider />

                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <ClockIcon className="w-4 h-4 text-default-400" />
                                <div>
                                    <label className="text-xs text-default-500">Timestamp</label>
                                    <p className="text-sm">{new Date(activity.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                            {properties.ip_address && (
                                <div className="flex items-center gap-2">
                                    <GlobeAltIcon className="w-4 h-4 text-default-400" />
                                    <div>
                                        <label className="text-xs text-default-500">IP Address</label>
                                        <p className="text-sm">{properties.ip_address}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {properties.user_agent && (
                            <div className="flex items-start gap-2">
                                <ComputerDesktopIcon className="w-4 h-4 text-default-400 mt-1" />
                                <div className="flex-1 min-w-0">
                                    <label className="text-xs text-default-500">User Agent</label>
                                    <p className="text-xs text-default-600 break-all">{properties.user_agent}</p>
                                </div>
                            </div>
                        )}

                        {/* Changes */}
                        {(properties.attributes || properties.old) && (
                            <>
                                <Divider />
                                <div>
                                    <label className="text-xs text-default-500 uppercase mb-2 block">Changes</label>
                                    <Tabs aria-label="Changes tabs">
                                        {properties.attributes && (
                                            <Tab key="new" title="New Values">
                                                <Card className="mt-2">
                                                    <CardBody>
                                                        <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-48">
                                                            {JSON.stringify(properties.attributes, null, 2)}
                                                        </pre>
                                                    </CardBody>
                                                </Card>
                                            </Tab>
                                        )}
                                        {properties.old && (
                                            <Tab key="old" title="Old Values">
                                                <Card className="mt-2">
                                                    <CardBody>
                                                        <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-48">
                                                            {JSON.stringify(properties.old, null, 2)}
                                                        </pre>
                                                    </CardBody>
                                                </Card>
                                            </Tab>
                                        )}
                                    </Tabs>
                                </div>
                            </>
                        )}

                        {/* Raw Properties */}
                        <Divider />
                        <div>
                            <label className="text-xs text-default-500 uppercase mb-2 block">Raw Properties</label>
                            <Card>
                                <CardBody>
                                    <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-48">
                                        {JSON.stringify(properties, null, 2)}
                                    </pre>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

/**
 * Audit Log Index Page
 * 
 * Full-featured audit log viewer with filtering, searching, and export capabilities.
 */
export default function Index({ 
    activities = [], 
    filters = {},
    logNames = [],
    pagination = {},
    auth 
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedActivity, setSelectedActivity] = useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [currentFilters, setCurrentFilters] = useState({
        log_name: filters.log_name || '',
        subject_type: filters.subject_type || '',
        causer_id: filters.causer_id || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    const handleSearch = useCallback((value) => {
        setSearchQuery(value);
        
        // Debounce search
        const timer = setTimeout(() => {
            router.get(route('admin.audit-logs.index'), {
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

        router.get(route('admin.audit-logs.index'), {
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
            log_name: '',
            subject_type: '',
            causer_id: '',
            date_from: '',
            date_to: '',
        });
        setSearchQuery('');

        router.get(route('admin.audit-logs.index'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = (format) => {
        const params = new URLSearchParams({
            ...currentFilters,
            search: searchQuery,
            format,
        });
        
        window.open(`${route('admin.audit-logs.export')}?${params.toString()}`, '_blank');
    };

    const handleViewActivity = (activity) => {
        setSelectedActivity(activity);
        onOpen();
    };

    const handleLoadMore = () => {
        if (!pagination.next_page_url) return;

        router.get(pagination.next_page_url, {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['activities', 'pagination'],
            onStart: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
        });
    };

    const hasActiveFilters = Object.values(currentFilters).some(v => v) || searchQuery;

    return (
        <App>
            <Head title="Audit Logs" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
                            <p className="text-default-500 mt-1">
                                Track all system activities and changes
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Export dropdown */}
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        variant="flat"
                                        startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                    >
                                        Export
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Export options">
                                    <DropdownItem 
                                        key="csv" 
                                        onPress={() => handleExport('csv')}
                                    >
                                        Export as CSV
                                    </DropdownItem>
                                    <DropdownItem 
                                        key="json" 
                                        onPress={() => handleExport('json')}
                                    >
                                        Export as JSON
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>

                            {/* Refresh button */}
                            <Button
                                isIconOnly
                                variant="flat"
                                onPress={() => router.reload({ only: ['activities'] })}
                                isLoading={isLoading}
                            >
                                <ArrowPathIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardBody>
                            <div className="flex flex-wrap items-end gap-4">
                                {/* Search */}
                                <div className="flex-1 min-w-[200px]">
                                    <Input
                                        placeholder="Search activities..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                        isClearable
                                        onClear={() => handleSearch('')}
                                    />
                                </div>

                                {/* Log name filter */}
                                <Select
                                    label="Log Type"
                                    placeholder="All logs"
                                    selectedKeys={currentFilters.log_name ? [currentFilters.log_name] : []}
                                    onChange={(e) => handleFilterChange('log_name', e.target.value)}
                                    className="w-40"
                                    size="sm"
                                >
                                    {logNames.map(name => (
                                        <SelectItem key={name} value={name}>
                                            {name}
                                        </SelectItem>
                                    ))}
                                </Select>

                                {/* Subject type filter */}
                                <Input
                                    label="Subject Type"
                                    placeholder="e.g., User"
                                    value={currentFilters.subject_type}
                                    onChange={(e) => handleFilterChange('subject_type', e.target.value)}
                                    className="w-40"
                                    size="sm"
                                />

                                {/* Date from */}
                                <Input
                                    type="date"
                                    label="From Date"
                                    value={currentFilters.date_from}
                                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                    className="w-40"
                                    size="sm"
                                />

                                {/* Date to */}
                                <Input
                                    type="date"
                                    label="To Date"
                                    value={currentFilters.date_to}
                                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                    className="w-40"
                                    size="sm"
                                />

                                {/* Clear filters */}
                                {hasActiveFilters && (
                                    <Button
                                        variant="light"
                                        color="danger"
                                        size="sm"
                                        startContent={<XMarkIcon className="w-4 h-4" />}
                                        onPress={handleClearFilters}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>

                            {/* Active filter chips */}
                            {hasActiveFilters && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {searchQuery && (
                                        <Chip 
                                            onClose={() => handleSearch('')}
                                            variant="flat"
                                            size="sm"
                                        >
                                            Search: {searchQuery}
                                        </Chip>
                                    )}
                                    {currentFilters.log_name && (
                                        <Chip 
                                            onClose={() => handleFilterChange('log_name', '')}
                                            variant="flat"
                                            size="sm"
                                        >
                                            Log: {currentFilters.log_name}
                                        </Chip>
                                    )}
                                    {currentFilters.subject_type && (
                                        <Chip 
                                            onClose={() => handleFilterChange('subject_type', '')}
                                            variant="flat"
                                            size="sm"
                                        >
                                            Subject: {currentFilters.subject_type}
                                        </Chip>
                                    )}
                                    {currentFilters.date_from && (
                                        <Chip 
                                            onClose={() => handleFilterChange('date_from', '')}
                                            variant="flat"
                                            size="sm"
                                        >
                                            From: {currentFilters.date_from}
                                        </Chip>
                                    )}
                                    {currentFilters.date_to && (
                                        <Chip 
                                            onClose={() => handleFilterChange('date_to', '')}
                                            variant="flat"
                                            size="sm"
                                        >
                                            To: {currentFilters.date_to}
                                        </Chip>
                                    )}
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardBody className="flex flex-row items-center gap-4">
                                <div className="p-3 bg-primary-100 rounded-lg">
                                    <DocumentTextIcon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{pagination.total || activities.length}</p>
                                    <p className="text-sm text-default-500">Total Activities</p>
                                </div>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody className="flex flex-row items-center gap-4">
                                <div className="p-3 bg-success-100 rounded-lg">
                                    <ClockIcon className="w-6 h-6 text-success" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {activities.filter(a => {
                                            const date = new Date(a.created_at);
                                            const today = new Date();
                                            return date.toDateString() === today.toDateString();
                                        }).length}
                                    </p>
                                    <p className="text-sm text-default-500">Today</p>
                                </div>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody className="flex flex-row items-center gap-4">
                                <div className="p-3 bg-warning-100 rounded-lg">
                                    <UserCircleIcon className="w-6 h-6 text-warning" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {new Set(activities.map(a => a.causer_id).filter(Boolean)).size}
                                    </p>
                                    <p className="text-sm text-default-500">Active Users</p>
                                </div>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody className="flex flex-row items-center gap-4">
                                <div className="p-3 bg-secondary-100 rounded-lg">
                                    <FunnelIcon className="w-6 h-6 text-secondary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{logNames.length}</p>
                                    <p className="text-sm text-default-500">Log Categories</p>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Timeline */}
                    <AuditTimeline
                        activities={activities}
                        isLoading={isLoading}
                        onLoadMore={handleLoadMore}
                        hasMore={!!pagination.next_page_url}
                        logNames={logNames}
                        showDetails={true}
                        title="Recent Activity"
                        emptyMessage="No audit logs found matching your criteria"
                    />
                </div>
            </div>

            {/* Activity Detail Modal */}
            <ActivityDetailModal
                activity={selectedActivity}
                isOpen={isOpen}
                onClose={onClose}
            />
        </App>
    );
}
