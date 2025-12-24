import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { Card, CardBody, CardHeader, Button, Input } from '@heroui/react';
import { 
    UserCircleIcon, 
    CheckCircleIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';

import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

export default function Admin({ title, licenseEmail }) {
    const [themeRadius, setThemeRadius] = useState('lg');
    const [formData, setFormData] = useState({
        admin_name: '',
        admin_email: licenseEmail || '',
        admin_password: '',
        admin_password_confirmation: '',
    });
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

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

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSaveAndInstall = async () => {
        setErrors({});

        const promise = new Promise(async (resolve, reject) => {
            try {
                setIsSaving(true);
                const response = await axios.post(route('install.save-admin'), formData);
                
                if (response.data.success) {
                    resolve([response.data.message]);
                    // Start installation
                    setTimeout(() => {
                        startInstallation();
                    }, 1000);
                } else {
                    reject([response.data.message]);
                }
            } catch (error) {
                if (error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                }
                reject(error.response?.data?.message ? [error.response.data.message] : ['Failed to save admin details']);
                setIsSaving(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Saving admin details...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const startInstallation = () => {
        safeNavigate('install.process', {}, {
            method: 'post',
            preserveState: true,
            onSuccess: () => {
                // Will be handled by Processing component
            },
            onError: (errors) => {
                setIsSaving(false);
                showToast.error(errors.message || 'Installation failed');
            }
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
                            <span className="text-primary font-semibold">Step 5 of 6</span>
                            <span className="text-default-500">Admin User</span>
                        </div>
                        <div className="mt-2 h-2 bg-default-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '83.33%' }}></div>
                        </div>
                    </div>

                    {/* Main Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <UserCircleIcon className="w-8 h-8 text-primary" />
                                <div>
                                    <h2 className="text-2xl font-semibold">Create Admin User</h2>
                                    <p className="text-sm text-default-600 mt-1">
                                        Set up your administrator account
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-6">
                                {/* Admin Name */}
                                <Input
                                    label="Full Name"
                                    placeholder="John Doe"
                                    value={formData.admin_name}
                                    onValueChange={(value) => handleInputChange('admin_name', value)}
                                    isInvalid={!!errors.admin_name}
                                    errorMessage={errors.admin_name}
                                    isRequired
                                    radius={themeRadius}
                                    classNames={{
                                        inputWrapper: "bg-default-100"
                                    }}
                                />

                                {/* Admin Email */}
                                <Input
                                    type="email"
                                    label="Email Address"
                                    placeholder="admin@example.com"
                                    value={formData.admin_email}
                                    onValueChange={(value) => handleInputChange('admin_email', value)}
                                    isInvalid={!!errors.admin_email}
                                    errorMessage={errors.admin_email}
                                    isRequired
                                    radius={themeRadius}
                                    classNames={{
                                        inputWrapper: "bg-default-100"
                                    }}
                                    description={licenseEmail ? "Using license email. You can change this if needed." : "This will be your login email"}
                                />

                                {/* Password */}
                                <Input
                                    type="password"
                                    label="Password"
                                    placeholder="Enter a strong password"
                                    value={formData.admin_password}
                                    onValueChange={(value) => handleInputChange('admin_password', value)}
                                    isInvalid={!!errors.admin_password}
                                    errorMessage={errors.admin_password}
                                    isRequired
                                    radius={themeRadius}
                                    classNames={{
                                        inputWrapper: "bg-default-100"
                                    }}
                                    description="Minimum 8 characters"
                                />

                                {/* Confirm Password */}
                                <Input
                                    type="password"
                                    label="Confirm Password"
                                    placeholder="Re-enter password"
                                    value={formData.admin_password_confirmation}
                                    onValueChange={(value) => handleInputChange('admin_password_confirmation', value)}
                                    isInvalid={!!errors.admin_password_confirmation}
                                    errorMessage={errors.admin_password_confirmation}
                                    isRequired
                                    radius={themeRadius}
                                    classNames={{
                                        inputWrapper: "bg-default-100"
                                    }}
                                />

                                {/* Info Box */}
                                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                    <div className="flex gap-3">
                                        <ExclamationCircleIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-semibold text-primary mb-1">Administrator Privileges</p>
                                            <ul className="space-y-1 text-default-700 dark:text-default-300">
                                                <li>• This user will have full system access (Super Admin role)</li>
                                                <li>• You can create additional users after installation</li>
                                                <li>• Keep your credentials secure</li>
                                                <li>• You'll use these credentials to login after installation</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-between pt-4">
                                    <Button
                                        variant="flat"
                                        radius={themeRadius}
                                        onPress={() => safeNavigate('install.application')}
                                        isDisabled={isSaving}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        color="primary"
                                        size="lg"
                                        radius={themeRadius}
                                        onPress={handleSaveAndInstall}
                                        isLoading={isSaving}
                                        endContent={!isSaving && <CheckCircleIcon className="w-5 h-5" />}
                                    >
                                        {isSaving ? 'Starting Installation...' : 'Start Installation'}
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
