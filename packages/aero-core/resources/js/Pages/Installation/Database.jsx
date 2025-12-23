import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Button, Input, Spinner } from '@heroui/react';
import { 
    CircleStackIcon, 
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

export default function Database({ title, currentConfig }) {
    const [themeRadius, setThemeRadius] = useState('lg');
    const [formData, setFormData] = useState({
        host: currentConfig?.host || 'localhost',
        port: currentConfig?.port || '3306',
        database: currentConfig?.database || '',
        username: currentConfig?.username || '',
        password: '',
    });
    const [errors, setErrors] = useState({});
    const [isTesting, setIsTesting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

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
        setIsConnected(false);
    };

    const handleTestConnection = async () => {
        setErrors({});

        const promise = new Promise(async (resolve, reject) => {
            try {
                setIsTesting(true);
                const response = await axios.post(route('install.test-database'), formData);
                
                if (response.data.success) {
                    setIsConnected(true);
                    resolve([response.data.message]);
                } else {
                    reject([response.data.message]);
                }
            } catch (error) {
                if (error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                }
                reject(error.response?.data?.message ? [error.response.data.message] : ['Connection failed']);
            } finally {
                setIsTesting(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Testing database connection...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleContinue = () => {
        if (!isConnected) {
            showToast.error('Please test the database connection first');
            return;
        }
        router.visit(route('install.application'));
    };

    return (
        <>
            <Head title={title} />
            
            <div className="min-h-screen bg-gradient-to-br from-background via-content1 to-background flex items-center justify-center p-4">
                <div className="w-full max-w-4xl">
                    {/* Progress Indicator */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-primary font-semibold">Step 3 of 6</span>
                            <span className="text-default-500">Database Configuration</span>
                        </div>
                        <div className="mt-2 h-2 bg-default-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '50%' }}></div>
                        </div>
                    </div>

                    {/* Main Card */}
                    <ThemedCard>
                        <ThemedCardHeader>
                            <div className="flex items-center gap-3">
                                <CircleStackIcon className="w-8 h-8 text-primary" />
                                <div>
                                    <h2 className="text-2xl font-semibold">Database Configuration</h2>
                                    <p className="text-sm text-default-600 mt-1">
                                        Configure your database connection
                                    </p>
                                </div>
                            </div>
                        </ThemedCardHeader>
                        <ThemedCardBody>
                            <div className="space-y-6">
                                {/* Database Host & Port */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <Input
                                            label="Database Host"
                                            placeholder="localhost or IP address"
                                            value={formData.host}
                                            onValueChange={(value) => handleInputChange('host', value)}
                                            isInvalid={!!errors.host}
                                            errorMessage={errors.host}
                                            isRequired
                                            radius={themeRadius}
                                            classNames={{
                                                inputWrapper: "bg-default-100"
                                            }}
                                        />
                                    </div>
                                    <Input
                                        type="number"
                                        label="Port"
                                        placeholder="3306"
                                        value={formData.port}
                                        onValueChange={(value) => handleInputChange('port', value)}
                                        isInvalid={!!errors.port}
                                        errorMessage={errors.port}
                                        isRequired
                                        radius={themeRadius}
                                        classNames={{
                                            inputWrapper: "bg-default-100"
                                        }}
                                    />
                                </div>

                                {/* Database Name */}
                                <Input
                                    label="Database Name"
                                    placeholder="aero_db"
                                    value={formData.database}
                                    onValueChange={(value) => handleInputChange('database', value)}
                                    isInvalid={!!errors.database}
                                    errorMessage={errors.database}
                                    isRequired
                                    radius={themeRadius}
                                    classNames={{
                                        inputWrapper: "bg-default-100"
                                    }}
                                    description="The database must already exist"
                                />

                                {/* Database Username */}
                                <Input
                                    label="Database Username"
                                    placeholder="root"
                                    value={formData.username}
                                    onValueChange={(value) => handleInputChange('username', value)}
                                    isInvalid={!!errors.username}
                                    errorMessage={errors.username}
                                    isRequired
                                    radius={themeRadius}
                                    classNames={{
                                        inputWrapper: "bg-default-100"
                                    }}
                                />

                                {/* Database Password */}
                                <Input
                                    type="password"
                                    label="Database Password"
                                    placeholder="Enter password"
                                    value={formData.password}
                                    onValueChange={(value) => handleInputChange('password', value)}
                                    isInvalid={!!errors.password}
                                    errorMessage={errors.password}
                                    radius={themeRadius}
                                    classNames={{
                                        inputWrapper: "bg-default-100"
                                    }}
                                    description="Leave empty if no password"
                                />

                                {/* Connection Status */}
                                {isConnected && (
                                    <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <CheckCircleIcon className="w-6 h-6 text-success flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold text-success">Connection Successful</p>
                                                <p className="text-sm text-default-700 dark:text-default-300 mt-0.5">
                                                    Successfully connected to database: <strong>{formData.database}</strong>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Warning */}
                                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                                    <div className="flex gap-3">
                                        <ExclamationTriangleIcon className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-semibold text-warning mb-1">Important</p>
                                            <ul className="space-y-1 text-default-700 dark:text-default-300">
                                                <li>• The database must be created before installation</li>
                                                <li>• Make sure the user has full privileges on the database</li>
                                                <li>• Test the connection before proceeding</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Test Connection Button */}
                                <div>
                                    <Button
                                        color="secondary"
                                        variant="flat"
                                        radius={themeRadius}
                                        onPress={handleTestConnection}
                                        isLoading={isTesting}
                                        className="w-full"
                                    >
                                        {isTesting ? 'Testing Connection...' : 'Test Database Connection'}
                                    </Button>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-between pt-4">
                                    <Button
                                        variant="flat"
                                        radius={themeRadius}
                                        onPress={() => router.visit(route('install.requirements'))}
                                        isDisabled={isTesting}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        color="primary"
                                        radius={themeRadius}
                                        onPress={handleContinue}
                                        isDisabled={!isConnected || isTesting}
                                        endContent={<CheckCircleIcon className="w-5 h-5" />}
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </div>
                        </ThemedCardBody>
                    </ThemedCard>
                </div>
            </div>
        </>
    );
}
