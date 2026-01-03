import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UnifiedInstallationLayout from '@/Layouts/UnifiedInstallationLayout';
import { 
    Card, 
    CardHeader, 
    CardBody, 
    CardFooter, 
    Button, 
    Input, 
    Select, 
    SelectItem,
    Spinner,
    Chip
} from '@heroui/react';
import { 
    KeyIcon, 
    ArrowRightIcon, 
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

/**
 * License Validation Page (Standalone Mode Only)
 * 
 * Validates license key against:
 * - Aero Platform API (AP-prefix)
 * - CodeCanyon/Envato (CC-prefix)
 * - Enterprise offline validation (EP-prefix)
 */
export default function License() {
    const { 
        app,
        mode = 'standalone',
        providers = [],
        savedLicense = null,
        product
    } = usePage().props;

    const [themeRadius, setThemeRadius] = useState('lg');
    const [licenseKey, setLicenseKey] = useState(savedLicense?.key || '');
    const [email, setEmail] = useState(savedLicense?.email || '');
    const [provider, setProvider] = useState(savedLicense?.provider || '');
    const [validating, setValidating] = useState(false);
    const [validated, setValidated] = useState(savedLicense?.validated || false);
    const [validationResult, setValidationResult] = useState(savedLicense?.result || null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const getThemeRadius = () => {
            const rootStyles = getComputedStyle(document.documentElement);
            const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
            const radiusValue = parseInt(borderRadius);
            if (radiusValue === 0) return 'none';
            if (radiusValue <= 4) return 'sm';
            if (radiusValue <= 8) return 'md';
            if (radiusValue <= 12) return 'lg';
            return 'xl';
        };
        setThemeRadius(getThemeRadius());
    }, []);

    // Auto-detect provider from license key
    useEffect(() => {
        if (licenseKey.length >= 3) {
            const prefix = licenseKey.substring(0, 2).toUpperCase();
            if (prefix === 'AP') {
                setProvider('aero');
            } else if (prefix === 'CC') {
                setProvider('codecanyon');
            } else if (prefix === 'EP' || licenseKey.startsWith('ENT')) {
                setProvider('enterprise');
            }
        }
    }, [licenseKey]);

    const validateLicense = async () => {
        setErrors({});
        
        if (!licenseKey.trim()) {
            setErrors({ licenseKey: 'License key is required' });
            return;
        }

        if (!email.trim()) {
            setErrors({ email: 'Email address is required' });
            return;
        }

        setValidating(true);
        setValidated(false);
        setValidationResult(null);

        try {
            const response = await axios.post('/install/validate-license', {
                license_key: licenseKey,
                email: email,
                domain: window.location.hostname,
            });

            if (response.data.success) {
                setValidated(true);
                setValidationResult(response.data.data);
                showToast.success(response.data.message || 'License validated successfully!');
            } else {
                setErrors({ licenseKey: response.data.message || 'License validation failed' });
                showToast.error(response.data.message || 'License validation failed');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to validate license';
            setErrors({ licenseKey: message });
            showToast.error(message);
        } finally {
            setValidating(false);
        }
    };

    const handleNext = () => {
        if (!validated) {
            showToast.warning('Please validate your license first');
            return;
        }
        router.visit('/install/requirements');
    };

    const handleBack = () => {
        router.visit('/install');
    };

    const availableProviders = [
        { key: 'aero', label: 'Aero Platform', prefix: 'AP-', description: 'License from aeos365.com' },
        { key: 'codecanyon', label: 'CodeCanyon', prefix: 'CC-', description: 'Envato purchase code' },
        { key: 'enterprise', label: 'Enterprise', prefix: 'EP-', description: 'Enterprise offline license' },
    ];

    return (
        <UnifiedInstallationLayout currentStep={2} mode={mode}>
            <Head title="Installation - License Validation" />
            
            <Card 
                className="transition-all duration-200"
                style={{
                    border: `var(--borderWidth, 2px) solid transparent`,
                    borderRadius: `var(--borderRadius, 12px)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                    background: `linear-gradient(135deg, 
                        var(--theme-content1, #FAFAFA) 20%, 
                        var(--theme-content2, #F4F4F5) 10%, 
                        var(--theme-content3, #F1F3F4) 20%)`,
                }}
            >
                <CardHeader className="flex flex-col items-center gap-4 pt-8 pb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <KeyIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            License Validation
                        </h1>
                        <p className="text-default-600">
                            Enter your license key to activate {product?.name || 'Aero Enterprise Suite'}
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 pb-6">
                    <div className="space-y-6">
                        {/* License Provider Info */}
                        <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-4">
                            <p className="text-sm text-default-600 mb-3">
                                <ShieldCheckIcon className="w-4 h-4 inline mr-1" />
                                Your license key determines which modules you can access. 
                                The key format indicates the provider:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {availableProviders.map(p => (
                                    <Chip 
                                        key={p.key} 
                                        variant="flat"
                                        color={provider === p.key ? 'primary' : 'default'}
                                        size="sm"
                                    >
                                        <span className="font-mono">{p.prefix}</span> {p.label}
                                    </Chip>
                                ))}
                            </div>
                        </div>

                        {/* License Form */}
                        <div className="space-y-4">
                            <Input
                                label="License Key"
                                placeholder="AP-AES-ALL-XXXXX-XXXXX-XXXXX"
                                value={licenseKey}
                                onValueChange={setLicenseKey}
                                isInvalid={!!errors.licenseKey}
                                errorMessage={errors.licenseKey}
                                isDisabled={validating || validated}
                                startContent={<KeyIcon className="w-4 h-4 text-default-400" />}
                                endContent={
                                    validated ? (
                                        <CheckCircleIcon className="w-5 h-5 text-success" />
                                    ) : null
                                }
                                radius={themeRadius}
                                classNames={{
                                    inputWrapper: "bg-default-100"
                                }}
                                description={
                                    provider && (
                                        <span className="text-xs">
                                            Detected provider: <strong>{availableProviders.find(p => p.key === provider)?.label}</strong>
                                        </span>
                                    )
                                }
                            />

                            <Input
                                type="email"
                                label="Purchase Email"
                                placeholder="your@email.com"
                                value={email}
                                onValueChange={setEmail}
                                isInvalid={!!errors.email}
                                errorMessage={errors.email}
                                isDisabled={validating || validated}
                                radius={themeRadius}
                                classNames={{
                                    inputWrapper: "bg-default-100"
                                }}
                                description="The email used when purchasing the license"
                            />

                            {/* Validate Button */}
                            {!validated && (
                                <Button
                                    color="secondary"
                                    variant="flat"
                                    onPress={validateLicense}
                                    isLoading={validating}
                                    isDisabled={!licenseKey.trim() || !email.trim()}
                                    className="w-full"
                                >
                                    {validating ? 'Validating...' : 'Validate License'}
                                </Button>
                            )}
                        </div>

                        {/* Validation Result */}
                        {validated && validationResult && (
                            <div className="bg-success-50 dark:bg-success-900/20 rounded-lg p-4 border border-success-200 dark:border-success-800">
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-success-700 dark:text-success-300">
                                            License Validated
                                        </h4>
                                        <div className="text-sm text-success-600 dark:text-success-400 mt-2 space-y-1">
                                            {validationResult.customer_name && (
                                                <p>Licensed to: <strong>{validationResult.customer_name}</strong></p>
                                            )}
                                            {validationResult.license_type && (
                                                <p>License type: <strong className="capitalize">{validationResult.license_type}</strong></p>
                                            )}
                                            {validationResult.allowed_modules && (
                                                <div className="mt-2">
                                                    <p className="mb-1">Included products:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {validationResult.allowed_modules.map(mod => (
                                                            <Chip key={mod} size="sm" color="success" variant="flat">
                                                                {mod === 'all' ? 'All Products' : mod.toUpperCase()}
                                                            </Chip>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reset Button */}
                        {validated && (
                            <Button
                                variant="light"
                                color="warning"
                                size="sm"
                                onPress={() => {
                                    setValidated(false);
                                    setValidationResult(null);
                                    setLicenseKey('');
                                    setEmail('');
                                }}
                            >
                                Use Different License
                            </Button>
                        )}
                    </div>
                </CardBody>

                <CardFooter className="px-8 pb-8 pt-4 border-t border-divider">
                    <div className="w-full flex justify-between">
                        <Button
                            variant="flat"
                            startContent={<ArrowLeftIcon className="w-4 h-4" />}
                            onPress={handleBack}
                        >
                            Back
                        </Button>
                        <Button
                            color="primary"
                            size="lg"
                            endContent={<ArrowRightIcon className="w-5 h-5" />}
                            onPress={handleNext}
                            isDisabled={!validated}
                        >
                            Continue
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </UnifiedInstallationLayout>
    );
}
