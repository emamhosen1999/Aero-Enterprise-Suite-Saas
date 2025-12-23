import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Button, Input, Select, SelectItem, Spinner } from '@heroui/react';
import { 
    ShieldCheckIcon, 
    CheckCircleIcon, 
    ExclamationCircleIcon,
    GlobeAltIcon,
    ShoppingCartIcon,
    BuildingOfficeIcon
} from '@heroicons/react/24/outline';

import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

export default function License({ title, providers, products }) {
    const [themeRadius, setThemeRadius] = useState('lg');
    const [selectedProvider, setSelectedProvider] = useState('');
    const [formData, setFormData] = useState({
        license_key: '',
        email: '',
        domain: window.location.origin,
    });
    const [errors, setErrors] = useState({});
    const [isValidating, setIsValidating] = useState(false);

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

    const providerIcons = {
        aero: GlobeAltIcon,
        codecanyon: ShoppingCartIcon,
        enterprise: BuildingOfficeIcon,
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleValidate = async () => {
        // Reset errors
        setErrors({});

        // Basic validation
        const newErrors = {};
        if (!formData.license_key) newErrors.license_key = 'License key is required';
        if (!formData.email) newErrors.email = 'Email is required';
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const promise = new Promise(async (resolve, reject) => {
            try {
                setIsValidating(true);
                const response = await axios.post(route('install.validate-license'), formData);
                
                if (response.data.success) {
                    resolve([response.data.message]);
                    // Navigate to next step after short delay
                    setTimeout(() => {
                        router.visit(route('install.requirements'));
                    }, 1000);
                } else {
                    reject([response.data.message]);
                }
            } catch (error) {
                if (error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                }
                reject(error.response?.data?.message ? [error.response.data.message] : ['License validation failed']);
            } finally {
                setIsValidating(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Validating license...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    return (
        <>
            <Head title={title} />
            
            <div className="min-h-screen bg-gradient-to-br from-background via-content1 to-background flex items-center justify-center p-4">
                <div className="w-full max-w-4xl">
                    {/* Progress Indicator */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-primary font-semibold">Step 1 of 6</span>
                            <span className="text-default-500">License Validation</span>
                        </div>
                        <div className="mt-2 h-2 bg-default-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '16.66%' }}></div>
                        </div>
                    </div>

                    {/* Main Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <ShieldCheckIcon className="w-8 h-8 text-primary" />
                                <div>
                                    <h2 className="text-2xl font-semibold">License Validation</h2>
                                    <p className="text-sm text-default-600 mt-1">
                                        Enter your license key to continue
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-6">
                                {/* Provider Selection */}
                                <div>
                                    <label className="block text-sm font-medium mb-3">Select License Provider</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {providers?.map((provider) => {
                                            const Icon = providerIcons[provider.id] || GlobeAltIcon;
                                            return (
                                                <button
                                                    key={provider.id}
                                                    onClick={() => setSelectedProvider(provider.id)}
                                                    className={`p-4 border-2 rounded-lg transition-all text-left ${
                                                        selectedProvider === provider.id
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-divider hover:border-primary/50'
                                                    }`}
                                                >
                                                    <Icon className="w-8 h-8 mb-2 text-primary" />
                                                    <h3 className="font-semibold mb-1">{provider.name}</h3>
                                                    <p className="text-xs text-default-600">{provider.description}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* License Key Input */}
                                <Input
                                    label="License Key"
                                    placeholder="Enter your license key"
                                    value={formData.license_key}
                                    onValueChange={(value) => handleInputChange('license_key', value)}
                                    isInvalid={!!errors.license_key}
                                    errorMessage={errors.license_key}
                                    isRequired
                                    radius={themeRadius}
                                    classNames={{
                                        inputWrapper: "bg-default-100"
                                    }}
                                    description="Format: XX-XXX-XXX-XXXXX-XXXXX"
                                />

                                {/* Email Input */}
                                <Input
                                    type="email"
                                    label="License Email"
                                    placeholder="email@example.com"
                                    value={formData.email}
                                    onValueChange={(value) => handleInputChange('email', value)}
                                    isInvalid={!!errors.email}
                                    errorMessage={errors.email}
                                    isRequired
                                    radius={themeRadius}
                                    classNames={{
                                        inputWrapper: "bg-default-100"
                                    }}
                                    description="Email address used during purchase"
                                />

                                {/* Domain Input */}
                                <Input
                                    type="url"
                                    label="Domain (Optional)"
                                    placeholder="https://yourdomain.com"
                                    value={formData.domain}
                                    onValueChange={(value) => handleInputChange('domain', value)}
                                    isInvalid={!!errors.domain}
                                    errorMessage={errors.domain}
                                    radius={themeRadius}
                                    classNames={{
                                        inputWrapper: "bg-default-100"
                                    }}
                                    description="Leave as default or enter your custom domain"
                                />

                                {/* Info Box */}
                                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                    <div className="flex gap-3">
                                        <ExclamationCircleIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-semibold text-primary mb-1">License Information</p>
                                            <ul className="space-y-1 text-default-700 dark:text-default-300">
                                                <li>• Your license will be validated with the provider's server</li>
                                                <li>• Make sure you have an active internet connection</li>
                                                <li>• The email should match your purchase email</li>
                                                <li>• Each license can be activated on one domain only</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-between pt-4">
                                    <Button
                                        variant="flat"
                                        radius={themeRadius}
                                        onPress={() => router.visit(route('install.index'))}
                                        isDisabled={isValidating}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        color="primary"
                                        radius={themeRadius}
                                        onPress={handleValidate}
                                        isLoading={isValidating}
                                        endContent={!isValidating && <CheckCircleIcon className="w-5 h-5" />}
                                    >
                                        {isValidating ? 'Validating...' : 'Validate & Continue'}
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </>
    );
}
