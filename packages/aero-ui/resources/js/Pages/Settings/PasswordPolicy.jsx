import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Badge,
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Input,
    Slider,
    Switch,
    Tooltip,
} from '@heroui/react';
import {
    LockClosedIcon,
    ShieldCheckIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const PasswordPolicy = ({ title, policy: initialPolicy }) => {
    const { auth } = usePage().props;
    const { hasAccess } = useHRMAC();

    const canEdit = hasAccess('core.settings.password_policy.edit');

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
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [policy, setPolicy] = useState(initialPolicy || {
        min_length: 8,
        max_length: 128,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_symbols: false,
        password_expiry_days: 0,
        password_history_count: 5,
        prevent_common_passwords: true,
        prevent_username_in_password: true,
        max_consecutive_chars: 3,
    });

    const [saving, setSaving] = useState(false);
    const [testPassword, setTestPassword] = useState('');
    const [testResult, setTestResult] = useState(null);
    const [testing, setTesting] = useState(false);

    const statsData = useMemo(() => [
        {
            title: 'Min Length',
            value: policy.min_length,
            icon: <LockClosedIcon className="w-5 h-5" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
        },
        {
            title: 'Password Expiry',
            value: policy.password_expiry_days > 0 ? `${policy.password_expiry_days}d` : 'Never',
            icon: <ShieldCheckIcon className="w-5 h-5" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
        },
        {
            title: 'History Count',
            value: policy.password_history_count,
            icon: <ShieldCheckIcon className="w-5 h-5" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
        },
        {
            title: 'Complexity Rules',
            value: [policy.require_uppercase, policy.require_lowercase, policy.require_numbers, policy.require_symbols].filter(Boolean).length,
            icon: <ShieldCheckIcon className="w-5 h-5" />,
            color: 'text-secondary',
            iconBg: 'bg-secondary/20',
        },
    ], [policy]);

    const handleToggle = useCallback((field) => {
        setPolicy(prev => ({ ...prev, [field]: !prev[field] }));
    }, []);

    const handleNumberChange = useCallback((field, value) => {
        const num = parseInt(value);
        if (!isNaN(num)) {
            setPolicy(prev => ({ ...prev, [field]: num }));
        }
    }, []);

    const handleSave = useCallback(async () => {
        setSaving(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.put(route('core.settings.password-policy.update'), policy);
                if (response.status === 200) {
                    resolve([response.data.message || 'Password policy saved.']);
                }
            } catch (error) {
                reject(error.response?.data?.errors
                    ? Object.values(error.response.data.errors).flat()
                    : ['Failed to save password policy.']);
            } finally {
                setSaving(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Saving password policy...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [policy]);

    const handleTestPassword = useCallback(async () => {
        if (!testPassword.trim()) { return; }
        setTesting(true);
        try {
            const response = await axios.post(route('core.settings.password-policy.test'), { password: testPassword });
            setTestResult(response.data);
        } catch (error) {
            setTestResult({ valid: false, errors: ['Test failed'] });
        } finally {
            setTesting(false);
        }
    }, [testPassword]);

    const strengthColorMap = { very_weak: 'danger', weak: 'danger', fair: 'warning', good: 'primary', strong: 'success' };

    return (
        <>
            <Head title={title} />
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Password Policy Settings">
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
                                                    <LockClosedIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>Password Policy</h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Configure password strength requirements for all tenant users
                                                    </p>
                                                </div>
                                            </div>
                                            {canEdit && (
                                                <div className="flex gap-2 flex-wrap">
                                                    <Button
                                                        color="primary"
                                                        variant="shadow"
                                                        startContent={<ShieldCheckIcon className="w-4 h-4" />}
                                                        onPress={handleSave}
                                                        isLoading={saving}
                                                        size={isMobile ? 'sm' : 'md'}
                                                    >
                                                        Save Policy
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6 space-y-6">
                                    <StatsCards stats={statsData} className="mb-2" />

                                    {/* Complexity Requirements */}
                                    <div>
                                        <h5 className="text-base font-semibold mb-3">Complexity Requirements</h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {[
                                                { field: 'require_uppercase', label: 'Require uppercase letters (A-Z)' },
                                                { field: 'require_lowercase', label: 'Require lowercase letters (a-z)' },
                                                { field: 'require_numbers', label: 'Require numbers (0-9)' },
                                                { field: 'require_symbols', label: 'Require symbols (!@#$...)' },
                                                { field: 'prevent_common_passwords', label: 'Block common passwords' },
                                                { field: 'prevent_username_in_password', label: 'Block username in password' },
                                            ].map(({ field, label }) => (
                                                <div
                                                    key={field}
                                                    className="flex items-center justify-between p-3 rounded-lg border border-divider bg-content1"
                                                    style={{ borderRadius: `var(--borderRadius, 12px)` }}
                                                >
                                                    <span className="text-sm">{label}</span>
                                                    <Switch
                                                        isSelected={policy[field]}
                                                        onValueChange={() => handleToggle(field)}
                                                        isDisabled={!canEdit}
                                                        size="sm"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Length & Expiry */}
                                    <div>
                                        <h5 className="text-base font-semibold mb-3">Length & Expiry</h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <Input
                                                type="number"
                                                label="Minimum Length"
                                                value={String(policy.min_length)}
                                                onChange={(e) => handleNumberChange('min_length', e.target.value)}
                                                min="6"
                                                max="32"
                                                isDisabled={!canEdit}
                                                radius={getThemeRadius()}
                                                classNames={{ inputWrapper: 'bg-default-100' }}
                                                endContent={<span className="text-xs text-default-400">chars</span>}
                                            />
                                            <Input
                                                type="number"
                                                label="Maximum Length"
                                                value={String(policy.max_length)}
                                                onChange={(e) => handleNumberChange('max_length', e.target.value)}
                                                min="8"
                                                max="256"
                                                isDisabled={!canEdit}
                                                radius={getThemeRadius()}
                                                classNames={{ inputWrapper: 'bg-default-100' }}
                                                endContent={<span className="text-xs text-default-400">chars</span>}
                                            />
                                            <Input
                                                type="number"
                                                label="Password Expiry"
                                                description="0 = never expires"
                                                value={String(policy.password_expiry_days)}
                                                onChange={(e) => handleNumberChange('password_expiry_days', e.target.value)}
                                                min="0"
                                                max="365"
                                                isDisabled={!canEdit}
                                                radius={getThemeRadius()}
                                                classNames={{ inputWrapper: 'bg-default-100' }}
                                                endContent={<span className="text-xs text-default-400">days</span>}
                                            />
                                            <Input
                                                type="number"
                                                label="Password History"
                                                description="Prevent reusing last N"
                                                value={String(policy.password_history_count)}
                                                onChange={(e) => handleNumberChange('password_history_count', e.target.value)}
                                                min="0"
                                                max="24"
                                                isDisabled={!canEdit}
                                                radius={getThemeRadius()}
                                                classNames={{ inputWrapper: 'bg-default-100' }}
                                                endContent={<span className="text-xs text-default-400">passwords</span>}
                                            />
                                        </div>
                                    </div>

                                    {/* Consecutive Characters */}
                                    <div>
                                        <h5 className="text-base font-semibold mb-3">Consecutive Characters Limit</h5>
                                        <div className="flex items-center gap-4">
                                            <Input
                                                type="number"
                                                label="Max Consecutive Identical Chars"
                                                description="0 = disabled"
                                                value={String(policy.max_consecutive_chars)}
                                                onChange={(e) => handleNumberChange('max_consecutive_chars', e.target.value)}
                                                min="0"
                                                max="10"
                                                isDisabled={!canEdit}
                                                radius={getThemeRadius()}
                                                classNames={{ inputWrapper: 'bg-default-100', base: 'max-w-xs' }}
                                            />
                                            {policy.max_consecutive_chars > 0 && (
                                                <p className="text-sm text-default-500">
                                                    Blocks passwords with more than {policy.max_consecutive_chars} identical characters in a row (e.g., "aaa" or "111")
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Password Tester */}
                                    <div
                                        className="p-4 rounded-xl border border-divider"
                                        style={{ borderRadius: `var(--borderRadius, 12px)` }}
                                    >
                                        <h5 className="text-base font-semibold mb-3">Test Password Against Policy</h5>
                                        <div className="flex gap-3 flex-col sm:flex-row">
                                            <Input
                                                type="password"
                                                label="Test password"
                                                placeholder="Enter a password to test..."
                                                value={testPassword}
                                                onChange={(e) => setTestPassword(e.target.value)}
                                                radius={getThemeRadius()}
                                                classNames={{ inputWrapper: 'bg-default-100', base: 'flex-1' }}
                                            />
                                            <Button
                                                color="secondary"
                                                variant="flat"
                                                onPress={handleTestPassword}
                                                isLoading={testing}
                                                className="self-end"
                                                size="lg"
                                            >
                                                Test
                                            </Button>
                                        </div>
                                        {testResult && (
                                            <div className="mt-3 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Chip
                                                        color={testResult.valid ? 'success' : 'danger'}
                                                        size="sm"
                                                    >
                                                        {testResult.valid ? 'Passes policy' : 'Fails policy'}
                                                    </Chip>
                                                    {testResult.strength && (
                                                        <Chip
                                                            color={strengthColorMap[testResult.strength.label] || 'default'}
                                                            size="sm"
                                                            variant="flat"
                                                        >
                                                            {testResult.strength.label?.replace('_', ' ')} ({testResult.strength.score}/100)
                                                        </Chip>
                                                    )}
                                                </div>
                                                {testResult.errors?.length > 0 && (
                                                    <ul className="list-disc list-inside text-sm text-danger space-y-1">
                                                        {testResult.errors.map((err, i) => (
                                                            <li key={i}>{err}</li>
                                                        ))}
                                                    </ul>
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

PasswordPolicy.layout = (page) => <App children={page} />;
export default PasswordPolicy;
