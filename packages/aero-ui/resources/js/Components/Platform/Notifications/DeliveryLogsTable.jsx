import React, { useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Input, Select, SelectItem, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Pagination } from "@heroui/react";
import { MagnifyingGlassIcon, FunnelIcon, ArrowPathIcon, EllipsisVerticalIcon, DocumentArrowDownIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import { router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import axios from 'axios';

export default function DeliveryLogsTable({ logs = [], pagination = {}, filters: initialFilters = {} }) {
    const [filters, setFilters] = useState({
        search: initialFilters.search || '',
        channel: initialFilters.channel || 'all',
        status: initialFilters.status || 'all',
        date_from: initialFilters.date_from || '',
        date_to: initialFilters.date_to || '',
    });
    
    const [selectedLog, setSelectedLog] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Get theme radius
    const getThemeRadius = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'full';
    };

    const themeRadius = getThemeRadius();

    const statusColorMap = {
        sent: "success",
        failed: "danger",
        pending: "warning",
        queued: "primary"
    };

    const channelIcons = {
        email: "📧",
        sms: "💬",
        push: "🔔",
        slack: "💬"
    };

    const columns = [
        { uid: "recipient", name: "Recipient" },
        { uid: "channel", name: "Channel" },
        { uid: "subject", name: "Subject/Message" },
        { uid: "status", name: "Status" },
        { uid: "sent_at", name: "Sent At" },
        { uid: "actions", name: "Actions" }
    ];

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        
        // Reload data with new filters
        router.get(route('admin.notifications.logs'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (page) => {
        router.get(route('admin.notifications.logs'), { ...filters, page }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleViewDetails = (log) => {
        setSelectedLog(log);
        setDetailsOpen(true);
    };

    const handleRetry = async (logId) => {
        setRetrying(true);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.notifications.logs.retry', logId));
                resolve([response.data.message || 'Notification queued for retry']);
                router.reload({ only: ['logs'] });
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to retry notification']);
            }
        });

        showToast.promise(promise, {
            loading: 'Retrying notification...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });

        promise.finally(() => setRetrying(false));
    };

    const handleDelete = async (logId) => {
        if (!confirm('Are you sure you want to delete this delivery log?')) {
            return;
        }

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('admin.notifications.logs.destroy', logId));
                resolve([response.data.message || 'Log deleted successfully']);
                router.reload({ only: ['logs'] });
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete log']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting log...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleExport = async (format = 'csv') => {
        setExporting(true);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.notifications.logs.export'), {
                    ...filters,
                    format
                }, {
                    responseType: 'blob'
                });
                
                // Create download link
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `delivery-logs-${Date.now()}.${format}`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                
                resolve(['Export completed successfully']);
            } catch (error) {
                reject(['Failed to export logs']);
            }
        });

        showToast.promise(promise, {
            loading: 'Exporting logs...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });

        promise.finally(() => setExporting(false));
    };

    const renderCell = (log, columnKey) => {
        switch (columnKey) {
            case "recipient":
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{log.recipient_name || 'N/A'}</span>
                        <span className="text-xs text-default-400">{log.recipient_email || log.recipient_phone}</span>
                    </div>
                );
            case "channel":
                return (
                    <Chip 
                        size="sm" 
                        variant="flat"
                        startContent={<span>{channelIcons[log.channel]}</span>}
                    >
                        {log.channel}
                    </Chip>
                );
            case "subject":
                return (
                    <div className="max-w-xs truncate text-sm">
                        {log.subject || log.message?.substring(0, 50)}
                    </div>
                );
            case "status":
                return (
                    <Chip 
                        size="sm" 
                        color={statusColorMap[log.status]} 
                        variant="flat"
                    >
                        {log.status}
                    </Chip>
                );
            case "sent_at":
                return (
                    <div className="flex flex-col">
                        <span className="text-sm">{new Date(log.sent_at).toLocaleDateString()}</span>
                        <span className="text-xs text-default-400">{new Date(log.sent_at).toLocaleTimeString()}</span>
                    </div>
                );
            case "actions":
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light" radius={themeRadius}>
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Actions">
                            <DropdownItem 
                                key="view" 
                                startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => handleViewDetails(log)}
                            >
                                View Details
                            </DropdownItem>
                            {log.status === 'failed' && (
                                <DropdownItem 
                                    key="retry" 
                                    startContent={<ArrowPathIcon className="w-4 h-4" />}
                                    onPress={() => handleRetry(log.id)}
                                >
                                    Retry
                                </DropdownItem>
                            )}
                            <DropdownItem 
                                key="delete" 
                                className="text-danger" 
                                color="danger"
                                startContent={<TrashIcon className="w-4 h-4" />}
                                onPress={() => handleDelete(log.id)}
                            >
                                Delete
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return log[columnKey];
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Input
                    placeholder="Search logs..."
                    value={filters.search}
                    onValueChange={(value) => handleFilterChange('search', value)}
                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                    radius={themeRadius}
                    classNames={{ inputWrapper: "bg-default-100" }}
                    className="sm:max-w-xs"
                />
                
                <Select
                    placeholder="All Channels"
                    selectedKeys={filters.channel !== 'all' ? [filters.channel] : []}
                    onSelectionChange={(keys) => handleFilterChange('channel', Array.from(keys)[0] || 'all')}
                    radius={themeRadius}
                    classNames={{ trigger: "bg-default-100" }}
                    className="sm:max-w-xs"
                >
                    <SelectItem key="all">All Channels</SelectItem>
                    <SelectItem key="email">Email</SelectItem>
                    <SelectItem key="sms">SMS</SelectItem>
                    <SelectItem key="push">Push</SelectItem>
                    <SelectItem key="slack">Slack</SelectItem>
                </Select>
                
                <Select
                    placeholder="All Statuses"
                    selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                    onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                    radius={themeRadius}
                    classNames={{ trigger: "bg-default-100" }}
                    className="sm:max-w-xs"
                >
                    <SelectItem key="all">All Statuses</SelectItem>
                    <SelectItem key="sent">Sent</SelectItem>
                    <SelectItem key="failed">Failed</SelectItem>
                    <SelectItem key="pending">Pending</SelectItem>
                    <SelectItem key="queued">Queued</SelectItem>
                </Select>

                <div className="flex gap-2 ml-auto">
                    <Button
                        variant="flat"
                        startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                        onPress={() => handleExport('csv')}
                        isLoading={exporting}
                        radius={themeRadius}
                    >
                        Export CSV
                    </Button>
                    <Button
                        variant="flat"
                        startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                        onPress={() => handleExport('xlsx')}
                        isLoading={exporting}
                        radius={themeRadius}
                    >
                        Export Excel
                    </Button>
                </div>
            </div>

            {/* Table */}
            <Table 
                aria-label="Delivery logs table"
                isHeaderSticky
                classNames={{
                    wrapper: "shadow-none border border-divider rounded-lg",
                    th: "bg-default-100 text-default-600 font-semibold",
                    td: "py-3"
                }}
            >
                <TableHeader columns={columns}>
                    {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                </TableHeader>
                <TableBody items={logs} emptyContent="No delivery logs found">
                    {(log) => (
                        <TableRow key={log.id}>
                            {(columnKey) => <TableCell>{renderCell(log, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Pagination */}
            {pagination.last_page > 1 && (
                <div className="flex justify-center">
                    <Pagination
                        total={pagination.last_page}
                        page={pagination.current_page}
                        onChange={handlePageChange}
                        showControls
                        radius={themeRadius}
                    />
                </div>
            )}

            {/* Details Modal */}
            <Modal 
                isOpen={detailsOpen} 
                onOpenChange={setDetailsOpen}
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
                        <h2 className="text-lg font-semibold">Delivery Details</h2>
                    </ModalHeader>
                    <ModalBody>
                        {selectedLog && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm text-default-500">Recipient</span>
                                        <p className="font-medium">{selectedLog.recipient_name || 'N/A'}</p>
                                        <p className="text-sm text-default-400">
                                            {selectedLog.recipient_email || selectedLog.recipient_phone}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-default-500">Channel</span>
                                        <div className="mt-1">
                                            <Chip size="sm" variant="flat">
                                                {channelIcons[selectedLog.channel]} {selectedLog.channel}
                                            </Chip>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm text-default-500">Status</span>
                                        <div className="mt-1">
                                            <Chip 
                                                size="sm" 
                                                color={statusColorMap[selectedLog.status]} 
                                                variant="flat"
                                            >
                                                {selectedLog.status}
                                            </Chip>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-sm text-default-500">Sent At</span>
                                        <p className="font-medium">
                                            {new Date(selectedLog.sent_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {selectedLog.subject && (
                                    <div>
                                        <span className="text-sm text-default-500">Subject</span>
                                        <p className="font-medium">{selectedLog.subject}</p>
                                    </div>
                                )}

                                <div>
                                    <span className="text-sm text-default-500">Message</span>
                                    <p className="mt-1 whitespace-pre-wrap text-sm">{selectedLog.message}</p>
                                </div>

                                {selectedLog.error && (
                                    <div className="border border-danger rounded-lg p-3 bg-danger-50">
                                        <span className="text-sm font-semibold text-danger">Error Details</span>
                                        <p className="mt-1 text-sm text-danger">{selectedLog.error}</p>
                                    </div>
                                )}

                                {selectedLog.attempts > 1 && (
                                    <div>
                                        <span className="text-sm text-default-500">Delivery Attempts</span>
                                        <p className="font-medium">{selectedLog.attempts}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        {selectedLog?.status === 'failed' && (
                            <Button 
                                color="primary"
                                onPress={() => {
                                    handleRetry(selectedLog.id);
                                    setDetailsOpen(false);
                                }}
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                radius={themeRadius}
                            >
                                Retry Delivery
                            </Button>
                        )}
                        <Button 
                            variant="flat" 
                            onPress={() => setDetailsOpen(false)}
                            radius={themeRadius}
                        >
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
