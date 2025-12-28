import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Switch,
    Chip,
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
    Input,
    Textarea,
    Select,
    SelectItem,
} from "@heroui/react";
import {
    BoltIcon,
    EnvelopeIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    PlayIcon,
    PauseIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

const Automation = ({ 
    stats: initialStats, 
    automationRules, 
    executionLogs,
    emailTemplates,
    auth 
}) => {
    const [isMobile, setIsMobile] = useState(false);
    const [stats, setStats] = useState(initialStats || {});
    const [rules, setRules] = useState(automationRules || []);
    const [logs, setLogs] = useState(executionLogs || []);
    const [templates, setTemplates] = useState(emailTemplates || []);
    const [ruleModal, setRuleModal] = useState({ open: false, rule: null });
    const [loading, setLoading] = useState({});

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'xl';
    };

    const statsData = useMemo(() => [
        {
            title: "Active Rules",
            value: stats?.activeRules || 0,
            icon: <BoltIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
        },
        {
            title: "Emails Sent",
            value: stats?.emailsSent || 0,
            icon: <EnvelopeIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
        },
        {
            title: "Success Rate",
            value: `${stats?.successRate || 0}%`,
            icon: <CheckCircleIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
        },
        {
            title: "Last 24 Hours",
            value: stats?.last24Hours || 0,
            icon: <ClockIcon className="w-6 h-6" />,
            color: "text-orange-400",
            iconBg: "bg-orange-500/20",
        },
    ], [stats]);

    const toggleRule = useCallback(async (ruleId, currentState) => {
        setLoading(prev => ({ ...prev, [ruleId]: true }));
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.onboarding.automation.toggle'), {
                    rule_id: ruleId,
                    enabled: !currentState,
                });
                if (response.status === 200) {
                    setRules(prev => prev.map(r => 
                        r.id === ruleId ? { ...r, enabled: !currentState } : r
                    ));
                    resolve([response.data.message || 'Automation rule updated']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to update automation rule']);
            } finally {
                setLoading(prev => ({ ...prev, [ruleId]: false }));
            }
        });

        showToast.promise(promise, {
            loading: 'Updating automation rule...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, []);

    const defaultRules = [
        {
            id: 'welcome_email',
            name: 'Welcome Email',
            description: 'Send welcome email immediately after registration',
            trigger: 'on_registration',
            enabled: true,
        },
        {
            id: 'trial_reminder_3',
            name: '3-Day Trial Reminder',
            description: 'Send reminder email 3 days before trial expires',
            trigger: 'trial_expiring',
            delay: '3 days before',
            enabled: true,
        },
        {
            id: 'trial_reminder_1',
            name: '1-Day Trial Reminder',
            description: 'Send urgent reminder 1 day before trial expires',
            trigger: 'trial_expiring',
            delay: '1 day before',
            enabled: true,
        },
        {
            id: 'trial_expired',
            name: 'Trial Expired Notice',
            description: 'Send notification when trial has expired',
            trigger: 'trial_expired',
            enabled: true,
        },
        {
            id: 'onboarding_complete',
            name: 'Onboarding Complete',
            description: 'Send congratulations email when onboarding is complete',
            trigger: 'onboarding_complete',
            enabled: false,
        },
    ];

    const displayRules = rules.length > 0 ? rules : defaultRules;

    const ruleColumns = [
        { uid: 'name', name: 'Rule Name' },
        { uid: 'trigger', name: 'Trigger' },
        { uid: 'delay', name: 'Timing' },
        { uid: 'enabled', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderRuleCell = useCallback((rule, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-xs text-default-400">{rule.description}</p>
                    </div>
                );
            case 'trigger':
                return (
                    <Chip size="sm" variant="flat" color="primary">
                        {rule.trigger?.replace(/_/g, ' ')}
                    </Chip>
                );
            case 'delay':
                return (
                    <span className="text-sm text-default-500">
                        {rule.delay || 'Immediate'}
                    </span>
                );
            case 'enabled':
                return (
                    <Switch
                        size="sm"
                        isSelected={rule.enabled}
                        isDisabled={loading[rule.id]}
                        onValueChange={() => toggleRule(rule.id, rule.enabled)}
                    />
                );
            case 'actions':
                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="flat"
                            isIconOnly
                            onPress={() => setRuleModal({ open: true, rule })}
                        >
                            <PencilIcon className="w-4 h-4" />
                        </Button>
                    </div>
                );
            default:
                return null;
        }
    }, [loading, toggleRule]);

    const logColumns = [
        { uid: 'timestamp', name: 'Time' },
        { uid: 'rule', name: 'Rule' },
        { uid: 'recipient', name: 'Recipient' },
        { uid: 'status', name: 'Status' },
    ];

    const sampleLogs = [
        { id: 1, timestamp: '2024-01-15 14:30', rule: 'Welcome Email', recipient: 'john@example.com', status: 'success' },
        { id: 2, timestamp: '2024-01-15 14:25', rule: 'Welcome Email', recipient: 'jane@example.com', status: 'success' },
        { id: 3, timestamp: '2024-01-15 14:20', rule: 'Trial Reminder', recipient: 'bob@example.com', status: 'failed' },
        { id: 4, timestamp: '2024-01-15 14:15', rule: 'Welcome Email', recipient: 'alice@example.com', status: 'success' },
        { id: 5, timestamp: '2024-01-15 14:10', rule: 'Trial Reminder', recipient: 'charlie@example.com', status: 'success' },
    ];

    const displayLogs = logs.length > 0 ? logs : sampleLogs;

    const renderLogCell = useCallback((log, columnKey) => {
        switch (columnKey) {
            case 'timestamp':
                return <span className="text-sm">{log.timestamp}</span>;
            case 'rule':
                return <span className="text-sm font-medium">{log.rule}</span>;
            case 'recipient':
                return <span className="text-sm text-default-500">{log.recipient}</span>;
            case 'status':
                return (
                    <Chip
                        size="sm"
                        variant="flat"
                        color={log.status === 'success' ? 'success' : 'danger'}
                        startContent={log.status === 'success' 
                            ? <CheckCircleIcon className="w-3 h-3" /> 
                            : <XCircleIcon className="w-3 h-3" />
                        }
                    >
                        {log.status}
                    </Chip>
                );
            default:
                return null;
        }
    }, []);

    return (
        <>
            <Head title="Onboarding Automation" />

            <div className="flex flex-col w-full h-full p-4">
                <div className="space-y-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="transition-all duration-200" style={getThemedCardStyle()}>
                            <CardHeader
                                className="border-b p-0"
                                style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}
                            >
                                <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <div
                                                className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                style={{
                                                    background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)',
                                                    borderRadius: 'var(--borderRadius, 12px)',
                                                }}
                                            >
                                                <BoltIcon
                                                    className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                    style={{ color: 'var(--theme-primary)' }}
                                                />
                                            </div>
                                            <div>
                                                <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                    Onboarding Automation
                                                </h4>
                                                <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                    Configure automated emails and onboarding sequences
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                color="primary"
                                                variant="shadow"
                                                startContent={<PlusIcon className="w-4 h-4" />}
                                                size={isMobile ? 'sm' : 'md'}
                                                onPress={() => setRuleModal({ open: true, rule: null })}
                                            >
                                                Add Rule
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="p-6">
                                {/* Stats */}
                                <StatsCards stats={statsData} className="mb-6" />

                                {/* Automation Rules */}
                                <Card className="border border-divider mb-6">
                                    <CardHeader className="border-b border-divider">
                                        <h3 className="text-lg font-semibold">Automation Rules</h3>
                                    </CardHeader>
                                    <CardBody className="p-0">
                                        <Table
                                            aria-label="Automation rules table"
                                            removeWrapper
                                            classNames={{
                                                th: "bg-default-100 text-default-600 font-semibold",
                                                td: "py-3",
                                            }}
                                        >
                                            <TableHeader columns={ruleColumns}>
                                                {(column) => (
                                                    <TableColumn key={column.uid}>{column.name}</TableColumn>
                                                )}
                                            </TableHeader>
                                            <TableBody items={displayRules} emptyContent="No automation rules configured">
                                                {(item) => (
                                                    <TableRow key={item.id}>
                                                        {(columnKey) => (
                                                            <TableCell>{renderRuleCell(item, columnKey)}</TableCell>
                                                        )}
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardBody>
                                </Card>

                                {/* Execution Logs */}
                                <Card className="border border-divider">
                                    <CardHeader className="border-b border-divider flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">Recent Execution Logs</h3>
                                        <Chip size="sm" variant="flat" color="default">
                                            Last 24 hours
                                        </Chip>
                                    </CardHeader>
                                    <CardBody className="p-0">
                                        <Table
                                            aria-label="Execution logs table"
                                            removeWrapper
                                            classNames={{
                                                th: "bg-default-100 text-default-600 font-semibold",
                                                td: "py-2",
                                            }}
                                        >
                                            <TableHeader columns={logColumns}>
                                                {(column) => (
                                                    <TableColumn key={column.uid}>{column.name}</TableColumn>
                                                )}
                                            </TableHeader>
                                            <TableBody items={displayLogs} emptyContent="No execution logs">
                                                {(item) => (
                                                    <TableRow key={item.id}>
                                                        {(columnKey) => (
                                                            <TableCell>{renderLogCell(item, columnKey)}</TableCell>
                                                        )}
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardBody>
                                </Card>
                            </CardBody>
                        </Card>
                    </motion.div>
                </div>
            </div>

            {/* Rule Edit Modal */}
            <Modal
                isOpen={ruleModal.open}
                onOpenChange={(open) => setRuleModal({ ...ruleModal, open })}
                size="xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader>
                        <h2 className="text-lg font-semibold">
                            {ruleModal.rule ? 'Edit Automation Rule' : 'Create Automation Rule'}
                        </h2>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <Input
                                label="Rule Name"
                                placeholder="Enter rule name"
                                defaultValue={ruleModal.rule?.name || ''}
                                radius={getThemeRadius()}
                            />
                            <Textarea
                                label="Description"
                                placeholder="Describe what this rule does"
                                defaultValue={ruleModal.rule?.description || ''}
                                radius={getThemeRadius()}
                            />
                            <Select
                                label="Trigger Event"
                                placeholder="Select trigger"
                                defaultSelectedKeys={ruleModal.rule?.trigger ? [ruleModal.rule.trigger] : []}
                                radius={getThemeRadius()}
                            >
                                <SelectItem key="on_registration">On Registration</SelectItem>
                                <SelectItem key="trial_expiring">Trial Expiring</SelectItem>
                                <SelectItem key="trial_expired">Trial Expired</SelectItem>
                                <SelectItem key="onboarding_complete">Onboarding Complete</SelectItem>
                                <SelectItem key="subscription_created">Subscription Created</SelectItem>
                            </Select>
                            <Select
                                label="Email Template"
                                placeholder="Select email template"
                                radius={getThemeRadius()}
                            >
                                <SelectItem key="welcome">Welcome Email</SelectItem>
                                <SelectItem key="trial_reminder">Trial Reminder</SelectItem>
                                <SelectItem key="trial_expired">Trial Expired</SelectItem>
                                <SelectItem key="onboarding_complete">Onboarding Complete</SelectItem>
                            </Select>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="flat"
                            onPress={() => setRuleModal({ open: false, rule: null })}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={() => setRuleModal({ open: false, rule: null })}
                        >
                            {ruleModal.rule ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

Automation.layout = (page) => <App children={page} />;

export default Automation;
