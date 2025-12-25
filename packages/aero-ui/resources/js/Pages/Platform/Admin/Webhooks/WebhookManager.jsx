import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Select,
    SelectItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Tabs,
    Tab,
    Textarea,
    Switch,
    Skeleton,
    Code,
    Divider,
} from '@heroui/react';
import {
    PlusIcon,
    TrashIcon,
    EllipsisVerticalIcon,
    CheckCircleIcon,
    XCircleIcon,
    PlayIcon,
    DocumentDuplicateIcon,
    ClockIcon,
    BoltIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

const WebhookManager = ({ webhooks: initialWebhooks = [] }) => {
    const [webhooks, setWebhooks] = useState(initialWebhooks);
    const [selectedWebhook, setSelectedWebhook] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('list');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [testResult, setTestResult] = useState(null);
    const [themeRadius, setThemeRadius] = useState('lg');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        secret: '',
        events: [],
        is_active: true,
        retry_attempts: 3,
        timeout: 30,
    });

    // Event types (15+ events)
    const eventTypes = [
        { value: 'subscription.created', label: 'Subscription Created', category: 'Subscription' },
        { value: 'subscription.updated', label: 'Subscription Updated', category: 'Subscription' },
        { value: 'subscription.cancelled', label: 'Subscription Cancelled', category: 'Subscription' },
        { value: 'subscription.renewed', label: 'Subscription Renewed', category: 'Subscription' },
        { value: 'subscription.upgraded', label: 'Subscription Upgraded', category: 'Subscription' },
        { value: 'subscription.downgraded', label: 'Subscription Downgraded', category: 'Subscription' },
        { value: 'payment.succeeded', label: 'Payment Succeeded', category: 'Payment' },
        { value: 'payment.failed', label: 'Payment Failed', category: 'Payment' },
        { value: 'quota.warning', label: 'Quota Warning (80%)', category: 'Quota' },
        { value: 'quota.exceeded', label: 'Quota Exceeded', category: 'Quota' },
        { value: 'tenant.created', label: 'Tenant Created', category: 'Tenant' },
        { value: 'tenant.updated', label: 'Tenant Updated', category: 'Tenant' },
        { value: 'tenant.suspended', label: 'Tenant Suspended', category: 'Tenant' },
        { value: 'user.created', label: 'User Created', category: 'User' },
        { value: 'user.updated', label: 'User Updated', category: 'User' },
        { value: 'user.deleted', label: 'User Deleted', category: 'User' },
    ];

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) setThemeRadius('none');
        else if (radiusValue <= 4) setThemeRadius('sm');
        else if (radiusValue <= 8) setThemeRadius('md');
        else if (radiusValue <= 12) setThemeRadius('lg');
        else setThemeRadius('xl');
    }, []);

    const fetchWebhooks = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('admin.webhooks.index'));
            setWebhooks(response.data.data || []);
        } catch (error) {
            showToast.error('Failed to load webhooks');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setFormData({
            name: '',
            url: '',
            secret: generateSecret(),
            events: [],
            is_active: true,
            retry_attempts: 3,
            timeout: 30,
        });
        setSelectedWebhook(null);
        setIsModalOpen(true);
    };

    const openEditModal = (webhook) => {
        setFormData({
            name: webhook.name,
            url: webhook.url,
            secret: webhook.secret,
            events: webhook.events || [],
            is_active: webhook.is_active,
            retry_attempts: webhook.retry_attempts || 3,
            timeout: webhook.timeout || 30,
        });
        setSelectedWebhook(webhook);
        setIsModalOpen(true);
    };

    const generateSecret = () => {
        return 'whsec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.url || formData.events.length === 0) {
            showToast.error('Please fill in all required fields and select at least one event');
            return;
        }

        const promise = new Promise(async (resolve, reject) => {
            try {
                const url = selectedWebhook
                    ? route('admin.webhooks.update', selectedWebhook.id)
                    : route('admin.webhooks.store');
                
                const method = selectedWebhook ? 'put' : 'post';
                const response = await axios[method](url, formData);
                
                if (response.status === 200 || response.status === 201) {
                    await fetchWebhooks();
                    setIsModalOpen(false);
                    resolve([response.data.message || 'Webhook saved successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to save webhook']);
            }
        });

        showToast.promise(promise, {
            loading: selectedWebhook ? 'Updating webhook...' : 'Creating webhook...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDelete = async (webhookId) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('admin.webhooks.destroy', webhookId));
                if (response.status === 200) {
                    await fetchWebhooks();
                    resolve(['Webhook deleted successfully']);
                }
            } catch (error) {
                reject(['Failed to delete webhook']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting webhook...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleTest = async (webhook) => {
        setSelectedWebhook(webhook);
        setTestResult(null);
        setIsTestModalOpen(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.webhooks.test', webhook.id));
                setTestResult(response.data);
                resolve(['Test webhook sent successfully']);
            } catch (error) {
                setTestResult({ success: false, error: error.response?.data?.message || 'Test failed' });
                reject(['Failed to send test webhook']);
            }
        });

        showToast.promise(promise, {
            loading: 'Sending test webhook...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleViewLogs = async (webhook) => {
        setSelectedWebhook(webhook);
        setIsLogsModalOpen(true);
        setLoading(true);

        try {
            const response = await axios.get(route('admin.webhooks.logs', webhook.id));
            setLogs(response.data.data || []);
        } catch (error) {
            showToast.error('Failed to load webhook logs');
        } finally {
            setLoading(false);
        }
    };

    const toggleActive = async (webhook) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.put(route('admin.webhooks.toggle', webhook.id), {
                    is_active: !webhook.is_active
                });
                await fetchWebhooks();
                resolve(['Webhook status updated']);
            } catch (error) {
                reject(['Failed to update webhook status']);
            }
        });

        showToast.promise(promise, {
            loading: 'Updating status...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleDuplicate = async (webhook) => {
        setFormData({
            name: webhook.name + ' (Copy)',
            url: webhook.url,
            secret: generateSecret(),
            events: webhook.events || [],
            is_active: false,
            retry_attempts: webhook.retry_attempts || 3,
            timeout: webhook.timeout || 30,
        });
        setSelectedWebhook(null);
        setIsModalOpen(true);
    };

    const renderWebhooksList = () => {
        if (loading) {
            return (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-lg" />
                    ))}
                </div>
            );
        }

        if (webhooks.length === 0) {
            return (
                <Card>
                    <CardBody className="text-center py-12">
                        <BoltIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Webhooks Yet</h3>
                        <p className="text-default-500 mb-4">Create your first webhook to start receiving event notifications</p>
                        <Button color="primary" startContent={<PlusIcon className="w-4 h-4" />} onPress={openCreateModal}>
                            Create Webhook
                        </Button>
                    </CardBody>
                </Card>
            );
        }

        return (
            <Table
                aria-label="Webhooks table"
                classNames={{
                    wrapper: "shadow-none border border-divider rounded-lg",
                    th: "bg-default-100 text-default-600 font-semibold",
                }}
            >
                <TableHeader>
                    <TableColumn>NAME</TableColumn>
                    <TableColumn>URL</TableColumn>
                    <TableColumn>EVENTS</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>SUCCESS RATE</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                    {webhooks.map((webhook) => (
                        <TableRow key={webhook.id}>
                            <TableCell>
                                <div>
                                    <p className="font-semibold">{webhook.name}</p>
                                    <p className="text-xs text-default-500">
                                        Last triggered: {webhook.last_triggered_at || 'Never'}
                                    </p>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Code size="sm" className="max-w-xs truncate">{webhook.url}</Code>
                            </TableCell>
                            <TableCell>
                                <Chip size="sm" variant="flat">
                                    {webhook.events?.length || 0} events
                                </Chip>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    size="sm"
                                    color={webhook.is_active ? 'success' : 'default'}
                                    variant="flat"
                                    startContent={webhook.is_active ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                                >
                                    {webhook.is_active ? 'Active' : 'Inactive'}
                                </Chip>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <span className={webhook.success_rate >= 95 ? 'text-success' : webhook.success_rate >= 80 ? 'text-warning' : 'text-danger'}>
                                        {webhook.success_rate || 0}%
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button isIconOnly size="sm" variant="light">
                                            <EllipsisVerticalIcon className="w-5 h-5" />
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu aria-label="Webhook actions">
                                        <DropdownItem key="edit" onPress={() => openEditModal(webhook)}>
                                            Edit
                                        </DropdownItem>
                                        <DropdownItem key="test" startContent={<PlayIcon className="w-4 h-4" />} onPress={() => handleTest(webhook)}>
                                            Test Webhook
                                        </DropdownItem>
                                        <DropdownItem key="logs" startContent={<ClockIcon className="w-4 h-4" />} onPress={() => handleViewLogs(webhook)}>
                                            View Logs
                                        </DropdownItem>
                                        <DropdownItem key="duplicate" startContent={<DocumentDuplicateIcon className="w-4 h-4" />} onPress={() => handleDuplicate(webhook)}>
                                            Duplicate
                                        </DropdownItem>
                                        <DropdownItem key="toggle" onPress={() => toggleActive(webhook)}>
                                            {webhook.is_active ? 'Deactivate' : 'Activate'}
                                        </DropdownItem>
                                        <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={() => handleDelete(webhook.id)}>
                                            Delete
                                        </DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    return (
        <>
            <Head title="Webhook Manager" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Webhook Manager</h1>
                        <p className="text-default-500">Manage webhook endpoints and event subscriptions</p>
                    </div>
                    <Button
                        color="primary"
                        startContent={<PlusIcon className="w-4 h-4" />}
                        onPress={openCreateModal}
                        radius={themeRadius}
                    >
                        Create Webhook
                    </Button>
                </div>

                {renderWebhooksList()}

                {/* Create/Edit Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    size="2xl"
                    scrollBehavior="inside"
                    classNames={{
                        base: "bg-content1",
                        header: "border-b border-divider",
                        body: "py-6",
                        footer: "border-t border-divider",
                    }}
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">
                                {selectedWebhook ? 'Edit Webhook' : 'Create Webhook'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <Input
                                    label="Webhook Name"
                                    placeholder="My Webhook"
                                    value={formData.name}
                                    onValueChange={(value) => setFormData({ ...formData, name: value })}
                                    isRequired
                                    radius={themeRadius}
                                />

                                <Input
                                    label="Endpoint URL"
                                    placeholder="https://example.com/webhook"
                                    value={formData.url}
                                    onValueChange={(value) => setFormData({ ...formData, url: value })}
                                    isRequired
                                    radius={themeRadius}
                                />

                                <div className="flex gap-2">
                                    <Input
                                        label="Secret Key"
                                        value={formData.secret}
                                        onValueChange={(value) => setFormData({ ...formData, secret: value })}
                                        isRequired
                                        radius={themeRadius}
                                        className="flex-1"
                                    />
                                    <Button
                                        onPress={() => setFormData({ ...formData, secret: generateSecret() })}
                                        className="mt-6"
                                        radius={themeRadius}
                                    >
                                        Generate
                                    </Button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Event Types</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-divider rounded-lg">
                                        {eventTypes.map((event) => (
                                            <div key={event.value} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={event.value}
                                                    checked={formData.events.includes(event.value)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({ ...formData, events: [...formData.events, event.value] });
                                                        } else {
                                                            setFormData({ ...formData, events: formData.events.filter(ev => ev !== event.value) });
                                                        }
                                                    }}
                                                    className="rounded"
                                                />
                                                <label htmlFor={event.value} className="text-sm cursor-pointer">
                                                    {event.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        type="number"
                                        label="Retry Attempts"
                                        value={formData.retry_attempts.toString()}
                                        onValueChange={(value) => setFormData({ ...formData, retry_attempts: parseInt(value) || 3 })}
                                        radius={themeRadius}
                                    />
                                    <Input
                                        type="number"
                                        label="Timeout (seconds)"
                                        value={formData.timeout.toString()}
                                        onValueChange={(value) => setFormData({ ...formData, timeout: parseInt(value) || 30 })}
                                        radius={themeRadius}
                                    />
                                </div>

                                <Switch
                                    isSelected={formData.is_active}
                                    onValueChange={(value) => setFormData({ ...formData, is_active: value })}
                                >
                                    Active
                                </Switch>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => setIsModalOpen(false)} radius={themeRadius}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSave} radius={themeRadius}>
                                {selectedWebhook ? 'Update' : 'Create'}
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {/* Test Modal */}
                <Modal isOpen={isTestModalOpen} onOpenChange={setIsTestModalOpen} size="lg">
                    <ModalContent>
                        <ModalHeader>Test Webhook</ModalHeader>
                        <ModalBody>
                            {testResult ? (
                                <div className={`p-4 rounded-lg ${testResult.success ? 'bg-success-50' : 'bg-danger-50'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {testResult.success ? (
                                            <CheckCircleIcon className="w-6 h-6 text-success" />
                                        ) : (
                                            <XCircleIcon className="w-6 h-6 text-danger" />
                                        )}
                                        <span className="font-semibold">
                                            {testResult.success ? 'Test Successful' : 'Test Failed'}
                                        </span>
                                    </div>
                                    {testResult.response && (
                                        <Code className="mt-2 w-full">{JSON.stringify(testResult.response, null, 2)}</Code>
                                    )}
                                    {testResult.error && (
                                        <p className="text-danger mt-2">{testResult.error}</p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p>Sending test webhook...</p>
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button onPress={() => setIsTestModalOpen(false)}>Close</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {/* Logs Modal */}
                <Modal isOpen={isLogsModalOpen} onOpenChange={setIsLogsModalOpen} size="3xl" scrollBehavior="inside">
                    <ModalContent>
                        <ModalHeader>Webhook Logs</ModalHeader>
                        <ModalBody>
                            {loading ? (
                                <div className="space-y-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-16 rounded-lg" />
                                    ))}
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="text-center py-8 text-default-500">
                                    No logs available
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {logs.map((log, index) => (
                                        <Card key={index} className="shadow-none border border-divider">
                                            <CardBody className="p-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Chip
                                                            size="sm"
                                                            color={log.status === 'success' ? 'success' : log.status === 'pending' ? 'warning' : 'danger'}
                                                            variant="flat"
                                                        >
                                                            {log.status}
                                                        </Chip>
                                                        <span className="text-sm font-medium">{log.event}</span>
                                                    </div>
                                                    <span className="text-xs text-default-500">{log.created_at}</span>
                                                </div>
                                                <Code size="sm" className="w-full">{log.response_code} - {log.response_time}ms</Code>
                                                {log.error && (
                                                    <p className="text-xs text-danger mt-2">{log.error}</p>
                                                )}
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button onPress={() => setIsLogsModalOpen(false)}>Close</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </div>
        </>
    );
};

export default WebhookManager;
