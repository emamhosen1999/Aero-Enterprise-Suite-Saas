import { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
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
    Chip,
    Switch,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Tabs,
    Tab,
    Textarea,
    Skeleton,
} from '@heroui/react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    BoltIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import App from '@/Layouts/App';
import PageHeader from '@/Components/PageHeader';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';

const RateLimitConfig = ({ auth }) => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [activeTab, setActiveTab] = useState('global');
    const [themeRadius, setThemeRadius] = useState('lg');
    const [formData, setFormData] = useState({
        tenant_id: null,
        limit_type: 'api',
        max_requests: 1000,
        time_window_seconds: 3600,
        burst_limit: 100,
        throttle_percentage: 100,
        block_duration_seconds: 3600,
        whitelist_ips: '',
        blacklist_ips: '',
        is_active: true,
    });

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

    const fetchConfigs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/admin/rate-limit-configs', {
                params: {
                    tenant_id: activeTab === 'global' ? undefined : activeTab,
                },
            });
            setConfigs(response.data.data || []);
        } catch (error) {
            showToast.error('Failed to load rate limit configurations');
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    const openCreateModal = () => {
        setFormData({
            tenant_id: activeTab === 'global' ? null : activeTab,
            limit_type: 'api',
            max_requests: 1000,
            time_window_seconds: 3600,
            burst_limit: 100,
            throttle_percentage: 100,
            block_duration_seconds: 3600,
            whitelist_ips: '',
            blacklist_ips: '',
            is_active: true,
        });
        setSelectedConfig(null);
        setIsModalOpen(true);
    };

    const openEditModal = (config) => {
        setFormData({
            tenant_id: config.tenant_id,
            limit_type: config.limit_type,
            max_requests: config.max_requests,
            time_window_seconds: config.time_window_seconds,
            burst_limit: config.burst_limit || 100,
            throttle_percentage: config.throttle_percentage || 100,
            block_duration_seconds: config.block_duration_seconds || 3600,
            whitelist_ips: (config.whitelist_ips || []).join('\n'),
            blacklist_ips: (config.blacklist_ips || []).join('\n'),
            is_active: config.is_active,
        });
        setSelectedConfig(config);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const payload = {
                    ...formData,
                    whitelist_ips: formData.whitelist_ips.split('\n').filter(ip => ip.trim()),
                    blacklist_ips: formData.blacklist_ips.split('\n').filter(ip => ip.trim()),
                };

                const url = selectedConfig
                    ? `/api/v1/admin/rate-limit-configs/${selectedConfig.id}`
                    : '/api/v1/admin/rate-limit-configs';
                
                const method = selectedConfig ? 'put' : 'post';
                const response = await axios[method](url, payload);
                
                await fetchConfigs();
                setIsModalOpen(false);
                resolve([response.data.message || 'Configuration saved successfully']);
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to save configuration']);
            }
        });

        showToast.promise(promise, {
            loading: 'Saving configuration...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDelete = async (configId) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(`/api/v1/admin/rate-limit-configs/${configId}`);
                await fetchConfigs();
                resolve([response.data.message || 'Configuration deleted successfully']);
            } catch (error) {
                reject(['Failed to delete configuration']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting configuration...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleToggle = async (config) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.put(`/api/v1/admin/rate-limit-configs/${config.id}/toggle`, {
                    is_active: !config.is_active,
                });
                await fetchConfigs();
                resolve(['Configuration status updated']);
            } catch (error) {
                reject(['Failed to update configuration']);
            }
        });

        showToast.promise(promise, {
            loading: 'Updating status...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const columns = [
        { key: 'limit_type', label: 'Type' },
        { key: 'max_requests', label: 'Max Requests' },
        { key: 'time_window', label: 'Time Window' },
        { key: 'burst_limit', label: 'Burst Limit' },
        { key: 'status', label: 'Status' },
        { key: 'actions', label: 'Actions' },
    ];

    const renderCell = (config, columnKey) => {
        switch (columnKey) {
            case 'limit_type':
                return (
                    <Chip size="sm" variant="flat" color="primary" radius={themeRadius}>
                        {config.limit_type.toUpperCase()}
                    </Chip>
                );
            case 'max_requests':
                return config.max_requests.toLocaleString();
            case 'time_window':
                return `${config.time_window_seconds}s (${Math.round(config.time_window_seconds / 60)}m)`;
            case 'burst_limit':
                return config.burst_limit || 'N/A';
            case 'status':
                return (
                    <Switch
                        isSelected={config.is_active}
                        onValueChange={() => handleToggle(config)}
                        size="sm"
                        color="success"
                    />
                );
            case 'actions':
                return (
                    <div className="flex gap-2">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openEditModal(config)}
                        >
                            <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDelete(config.id)}
                        >
                            <TrashIcon className="w-4 h-4" />
                        </Button>
                    </div>
                );
            default:
                return config[columnKey];
        }
    };

    return (
        <App>
            <Head title="Rate Limit Configuration" />
            
            <div className="space-y-6">
                <PageHeader
                    title="Rate Limit Configuration"
                    description="Configure rate limiting for API, web, and webhook requests"
                    action={
                        <Button
                            color="primary"
                            startContent={<PlusIcon className="w-4 h-4" />}
                            onPress={openCreateModal}
                            radius={themeRadius}
                        >
                            Add Configuration
                        </Button>
                    }
                />

                <Card className="transition-all duration-200" style={{
                    background: `var(--theme-content1, #FAFAFA)`,
                    borderColor: `var(--theme-divider, #E4E4E7)`,
                    borderWidth: `var(--borderWidth, 2px)`,
                    borderRadius: `var(--borderRadius, 12px)`,
                }}>
                    <ThemedCardHeader>
                        <Tabs
                            selectedKey={activeTab}
                            onSelectionChange={setActiveTab}
                            aria-label="Configuration tabs"
                            radius={themeRadius}
                        >
                            <Tab key="global" title="Global Settings" />
                            <Tab key="tenant" title="Tenant-Specific" />
                        </Tabs>
                    </ThemedCardHeader>
                    <ThemedCardBody>
                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-16 rounded-lg" />
                                ))}
                            </div>
                        ) : (
                            <Table
                                aria-label="Rate limit configurations"
                                classNames={{
                                    wrapper: "shadow-none",
                                    th: "bg-default-100 text-default-600 font-semibold",
                                }}
                            >
                                <TableHeader columns={columns}>
                                    {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                                </TableHeader>
                                <TableBody items={configs} emptyContent="No configurations found">
                                    {(config) => (
                                        <TableRow key={config.id}>
                                            {(columnKey) => <TableCell>{renderCell(config, columnKey)}</TableCell>}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </ThemedCardBody>
                </Card>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="aero-card">
                        <CardBody className="text-center">
                            <BoltIcon className="w-8 h-8 mx-auto mb-2 text-primary" />
                            <h3 className="font-semibold">API Rate Limiting</h3>
                            <p className="text-sm text-default-500 mt-1">
                                Control request rates per tenant/IP
                            </p>
                        </CardBody>
                    </Card>
                    <Card className="aero-card">
                        <CardBody className="text-center">
                            <ShieldCheckIcon className="w-8 h-8 mx-auto mb-2 text-success" />
                            <h3 className="font-semibold">IP Whitelisting</h3>
                            <p className="text-sm text-default-500 mt-1">
                                Bypass rate limits for trusted IPs
                            </p>
                        </CardBody>
                    </Card>
                    <Card className="aero-card">
                        <CardBody className="text-center">
                            <CheckCircleIcon className="w-8 h-8 mx-auto mb-2 text-warning" />
                            <h3 className="font-semibold">Burst Protection</h3>
                            <p className="text-sm text-default-500 mt-1">
                                Handle traffic spikes gracefully
                            </p>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Configuration Modal */}
            <Modal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                size="2xl"
                scrollBehavior="inside"
                radius={themeRadius}
            >
                <ModalContent>
                    <ModalHeader>
                        {selectedConfig ? 'Edit Configuration' : 'Add Configuration'}
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <Select
                                label="Limit Type"
                                selectedKeys={[formData.limit_type]}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, limit_type: Array.from(keys)[0] }))}
                                radius={themeRadius}
                                isRequired
                            >
                                <SelectItem key="api">API</SelectItem>
                                <SelectItem key="web">Web</SelectItem>
                                <SelectItem key="webhook">Webhook</SelectItem>
                                <SelectItem key="custom">Custom</SelectItem>
                            </Select>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    type="number"
                                    label="Max Requests"
                                    value={String(formData.max_requests)}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, max_requests: parseInt(value) || 0 }))}
                                    radius={themeRadius}
                                    isRequired
                                />
                                <Input
                                    type="number"
                                    label="Time Window (seconds)"
                                    value={String(formData.time_window_seconds)}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, time_window_seconds: parseInt(value) || 0 }))}
                                    radius={themeRadius}
                                    isRequired
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    type="number"
                                    label="Burst Limit"
                                    value={String(formData.burst_limit)}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, burst_limit: parseInt(value) || 0 }))}
                                    radius={themeRadius}
                                />
                                <Input
                                    type="number"
                                    label="Throttle %"
                                    value={String(formData.throttle_percentage)}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, throttle_percentage: parseInt(value) || 100 }))}
                                    radius={themeRadius}
                                />
                            </div>

                            <Input
                                type="number"
                                label="Block Duration (seconds)"
                                value={String(formData.block_duration_seconds)}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, block_duration_seconds: parseInt(value) || 0 }))}
                                radius={themeRadius}
                            />

                            <Textarea
                                label="Whitelist IPs (one per line)"
                                value={formData.whitelist_ips}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, whitelist_ips: value }))}
                                placeholder="192.168.1.1&#10;10.0.0.1"
                                radius={themeRadius}
                                minRows={3}
                            />

                            <Textarea
                                label="Blacklist IPs (one per line)"
                                value={formData.blacklist_ips}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, blacklist_ips: value }))}
                                placeholder="192.168.1.100&#10;10.0.0.100"
                                radius={themeRadius}
                                minRows={3}
                            />

                            <Switch
                                isSelected={formData.is_active}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value }))}
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
                            Save
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </App>
    );
};

export default RateLimitConfig;
