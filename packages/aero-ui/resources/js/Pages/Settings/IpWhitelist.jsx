import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Tooltip,
} from '@heroui/react';
import {
    GlobeAltIcon,
    NoSymbolIcon,
    PlusIcon,
    ShieldCheckIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const MODE_LABELS = {
    disabled: { label: 'Disabled', color: 'default', description: 'No IP restrictions applied.' },
    whitelist: { label: 'Whitelist Mode', color: 'success', description: 'Only IPs in the whitelist can access the system.' },
    blacklist: { label: 'Blacklist Mode', color: 'danger', description: 'IPs in the blacklist are blocked; all others are allowed.' },
};

const IpWhitelist = ({ title, config: initialConfig }) => {
    const { hasAccess } = useHRMAC();
    const canEdit = hasAccess('core.settings.ip_whitelist.edit');

    const getThemeRadius = () => {
        if (typeof window === 'undefined') { return 'lg'; }
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) { return 'none'; }
        if (radiusValue <= 4) { return 'sm'; }
        if (radiusValue <= 8) { return 'md'; }
        if (radiusValue <= 16) { return 'lg'; }
        return 'full';
    };

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [config, setConfig] = useState(initialConfig || { mode: 'disabled', whitelist: [], blacklist: [], log_blocked: true, notify_on_blocked: false });
    const [saving, setSaving] = useState(false);
    const [testIp, setTestIp] = useState('');
    const [testResult, setTestResult] = useState(null);
    const [addModal, setAddModal] = useState({ open: false, list: 'whitelist', ip: '', label: '' });

    const statsData = useMemo(() => [
        {
            title: 'Mode',
            value: MODE_LABELS[config.mode]?.label || config.mode,
            icon: <ShieldCheckIcon className="w-5 h-5" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
        },
        {
            title: 'Whitelist IPs',
            value: config.whitelist?.length || 0,
            icon: <GlobeAltIcon className="w-5 h-5" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
        },
        {
            title: 'Blacklist IPs',
            value: config.blacklist?.length || 0,
            icon: <NoSymbolIcon className="w-5 h-5" />,
            color: 'text-danger',
            iconBg: 'bg-danger/20',
        },
    ], [config]);

    const handleSave = useCallback(async () => {
        setSaving(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.put(route('core.settings.ip-whitelist.update'), config);
                if (response.status === 200) {
                    setConfig(response.data.config);
                    resolve([response.data.message || 'IP access control saved.']);
                }
            } catch (error) {
                reject(error.response?.data?.errors
                    ? Object.values(error.response.data.errors).flat()
                    : ['Failed to save IP access control.']);
            } finally {
                setSaving(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Saving IP access control...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [config]);

    const handleAddIp = useCallback(async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('core.settings.ip-whitelist.add-ip'), {
                    ip: addModal.ip,
                    label: addModal.label,
                    list: addModal.list,
                });
                setConfig(response.data.config);
                setAddModal({ open: false, list: 'whitelist', ip: '', label: '' });
                resolve([response.data.message]);
            } catch (error) {
                reject(error.response?.data?.errors
                    ? Object.values(error.response.data.errors).flat()
                    : ['Failed to add IP.']);
            }
        });

        showToast.promise(promise, {
            loading: 'Adding IP...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [addModal]);

    const handleRemoveIp = useCallback(async (ip, list) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('core.settings.ip-whitelist.remove-ip'), {
                    data: { ip, list },
                });
                setConfig(response.data.config);
                resolve([response.data.message]);
            } catch (error) {
                reject(['Failed to remove IP.']);
            }
        });

        showToast.promise(promise, {
            loading: 'Removing IP...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, []);

    const handleTestIp = useCallback(async () => {
        if (!testIp.trim()) { return; }
        try {
            const response = await axios.post(route('core.settings.ip-whitelist.test-ip'), { ip: testIp });
            setTestResult(response.data);
        } catch (error) {
            setTestResult({ allowed: null, error: 'Test failed' });
        }
    }, [testIp]);

    const IpTable = ({ list, listType }) => (
        <Table
            aria-label={`${listType} IP addresses`}
            classNames={{
                wrapper: 'shadow-none border border-divider rounded-lg',
                th: 'bg-default-100 text-default-600 font-semibold',
                td: 'py-2',
            }}
        >
            <TableHeader>
                <TableColumn>IP / CIDR</TableColumn>
                <TableColumn>Label</TableColumn>
                {canEdit ? <TableColumn className="w-20">Action</TableColumn> : <TableColumn className="w-1"> </TableColumn>}
            </TableHeader>
            <TableBody items={list || []} emptyContent={`No IPs in ${listType}`}>
                {(item) => (
                    <TableRow key={item.ip}>
                        <TableCell>
                            <code className="text-sm bg-default-100 px-2 py-1 rounded">{item.ip}</code>
                        </TableCell>
                        <TableCell>
                            <span className="text-sm text-default-500">{item.label || '—'}</span>
                        </TableCell>
                        <TableCell>
                            {canEdit && (
                                <Tooltip content="Remove IP" color="danger">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        onPress={() => handleRemoveIp(item.ip, listType)}
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </Tooltip>
                            )}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <>
            <Head title={title} />

            {/* Add IP Modal */}
            <Modal
                isOpen={addModal.open}
                onOpenChange={() => setAddModal(prev => ({ ...prev, open: false }))}
                size="md"
                classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}
            >
                <ModalContent>
                    <ModalHeader>Add IP to {addModal.list === 'whitelist' ? 'Whitelist' : 'Blacklist'}</ModalHeader>
                    <ModalBody className="py-4 space-y-4">
                        <Input
                            label="IP Address or CIDR"
                            placeholder="e.g. 192.168.1.1 or 10.0.0.0/24"
                            value={addModal.ip}
                            onChange={(e) => setAddModal(prev => ({ ...prev, ip: e.target.value }))}
                            radius={getThemeRadius()}
                            classNames={{ inputWrapper: 'bg-default-100' }}
                        />
                        <Input
                            label="Label (optional)"
                            placeholder="e.g. Office network"
                            value={addModal.label}
                            onChange={(e) => setAddModal(prev => ({ ...prev, label: e.target.value }))}
                            radius={getThemeRadius()}
                            classNames={{ inputWrapper: 'bg-default-100' }}
                        />
                        <Select
                            label="Add to list"
                            selectedKeys={[addModal.list]}
                            onSelectionChange={(keys) => setAddModal(prev => ({ ...prev, list: Array.from(keys)[0] || 'whitelist' }))}
                            radius={getThemeRadius()}
                        >
                            <SelectItem key="whitelist">Whitelist (allow)</SelectItem>
                            <SelectItem key="blacklist">Blacklist (block)</SelectItem>
                        </Select>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setAddModal(prev => ({ ...prev, open: false }))}>Cancel</Button>
                        <Button color="primary" onPress={handleAddIp} isDisabled={!addModal.ip.trim()}>Add IP</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="IP Access Control Settings">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, var(--theme-content1, #FAFAFA) 20%, var(--theme-content2, #F4F4F5) 10%, var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                <CardHeader
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
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
                                                    <GlobeAltIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>IP Access Control</h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Restrict access by IP address using whitelist or blacklist mode
                                                    </p>
                                                </div>
                                            </div>
                                            {canEdit && (
                                                <div className="flex gap-2 flex-wrap">
                                                    <Button
                                                        color="default"
                                                        variant="flat"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => setAddModal({ open: true, list: 'whitelist', ip: '', label: '' })}
                                                        size={isMobile ? 'sm' : 'md'}
                                                    >
                                                        Add IP
                                                    </Button>
                                                    <Button
                                                        color="primary"
                                                        variant="shadow"
                                                        startContent={<ShieldCheckIcon className="w-4 h-4" />}
                                                        onPress={handleSave}
                                                        isLoading={saving}
                                                        size={isMobile ? 'sm' : 'md'}
                                                    >
                                                        Save Settings
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6 space-y-6">
                                    <StatsCards stats={statsData} className="mb-2" />

                                    {/* Mode Selection */}
                                    <div>
                                        <h5 className="text-base font-semibold mb-3">Access Control Mode</h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {Object.entries(MODE_LABELS).map(([mode, info]) => (
                                                <div
                                                    key={mode}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${config.mode === mode ? 'border-primary bg-primary/5' : 'border-divider hover:border-default-400'}`}
                                                    style={{ borderRadius: `var(--borderRadius, 12px)` }}
                                                    onClick={() => canEdit && setConfig(prev => ({ ...prev, mode }))}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium text-sm">{info.label}</span>
                                                        <Chip color={info.color} size="sm" variant="flat">
                                                            {config.mode === mode ? 'Active' : 'Inactive'}
                                                        </Chip>
                                                    </div>
                                                    <p className="text-xs text-default-500">{info.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Whitelist */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="text-base font-semibold">Whitelist</h5>
                                            <Chip color="success" size="sm" variant="flat">{config.whitelist?.length || 0} IPs</Chip>
                                        </div>
                                        <IpTable list={config.whitelist} listType="whitelist" />
                                    </div>

                                    {/* Blacklist */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="text-base font-semibold">Blacklist</h5>
                                            <Chip color="danger" size="sm" variant="flat">{config.blacklist?.length || 0} IPs</Chip>
                                        </div>
                                        <IpTable list={config.blacklist} listType="blacklist" />
                                    </div>

                                    {/* IP Tester */}
                                    <div
                                        className="p-4 rounded-xl border border-divider"
                                        style={{ borderRadius: `var(--borderRadius, 12px)` }}
                                    >
                                        <h5 className="text-base font-semibold mb-3">Test an IP Address</h5>
                                        <div className="flex gap-3 flex-col sm:flex-row">
                                            <Input
                                                label="IP Address"
                                                placeholder="e.g. 203.0.113.5"
                                                value={testIp}
                                                onChange={(e) => setTestIp(e.target.value)}
                                                radius={getThemeRadius()}
                                                classNames={{ inputWrapper: 'bg-default-100', base: 'flex-1' }}
                                            />
                                            <Button
                                                color="secondary"
                                                variant="flat"
                                                onPress={handleTestIp}
                                                className="self-end"
                                                size="lg"
                                            >
                                                Check
                                            </Button>
                                        </div>
                                        {testResult && (
                                            <div className="mt-3">
                                                {testResult.error ? (
                                                    <Chip color="warning" size="sm">Test failed</Chip>
                                                ) : (
                                                    <Chip color={testResult.allowed ? 'success' : 'danger'} size="sm">
                                                        {testIp} is {testResult.allowed ? 'ALLOWED' : 'BLOCKED'} (mode: {testResult.mode})
                                                    </Chip>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

IpWhitelist.layout = (page) => <App children={page} />;
export default IpWhitelist;
