import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import InstallationLayout from '@/Layouts/InstallationLayout';
import { Card, CardHeader, CardBody, CardFooter, Button, Input } from '@heroui/react';
import { CircleStackIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

export default function Database({ dbConfig = {} }) {
    const [testResult, setTestResult] = useState(null);
    const [testing, setTesting] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        host: dbConfig.host || 'localhost',
        port: dbConfig.port || '3306',
        database: dbConfig.database || 'eos365',
        username: dbConfig.username || 'root',
        password: dbConfig.password || '',
    });

    const handleTestConnection = async () => {
        setTesting(true);
        setTestResult(null);

        try {
            const response = await axios.post(route('installation.test-database'), data);
            
            if (response.data.success) {
                setTestResult({ success: true, message: response.data.message });
                showToast.success('Database connection successful!');
            } else {
                setTestResult({ success: false, message: response.data.message });
                showToast.error('Database connection failed');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Connection test failed';
            setTestResult({ success: false, message });
            showToast.error(message);
        } finally {
            setTesting(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!testResult || !testResult.success) {
            showToast.warning('Please test the database connection first');
            return;
        }

        // Database config is already saved in session during test
        // Just navigate to the next step
        router.visit(route('installation.platform'));
    };

    return (
        <InstallationLayout currentStep={4}>
            <Head title="Installation - Database Configuration" />
            
            <Card 
                className="transition-all duration-200"
                style={{
                    border: `var(--borderWidth, 2px) solid transparent`,
                    borderRadius: `var(--borderRadius, 12px)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                    transform: `scale(var(--scale, 1))`,
                    background: `linear-gradient(135deg, 
                        var(--theme-content1, #FAFAFA) 20%, 
                        var(--theme-content2, #F4F4F5) 10%, 
                        var(--theme-content3, #F1F3F4) 20%)`,
                }}
            >
                <CardHeader className="flex flex-col items-center gap-3 sm:gap-4 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-divider">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        <CircleStackIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">
                            Database Configuration
                        </h2>
                        <p className="text-sm sm:text-base text-default-600">
                            Configure your MySQL database connection
                        </p>
                    </div>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardBody className="px-4 sm:px-6 md:px-8 py-6 sm:py-8">
                        <div className="space-y-4 sm:space-y-6">
                            {/* Database info */}
                            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 sm:p-4 border border-primary-200 dark:border-primary-800">
                                <p className="text-xs sm:text-sm text-primary-800 dark:text-primary-200">
                                    <strong>Note:</strong> The database must exist before installation. 
                                    Create the database manually using phpMyAdmin or MySQL command line.
                                </p>
                            </div>

                            {/* Database connection fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <Input
                                    label="Database Host"
                                    placeholder="localhost"
                                    value={data.host}
                                    onValueChange={(value) => setData('host', value)}
                                    isInvalid={!!errors.host}
                                    errorMessage={errors.host}
                                    isRequired
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />

                                <Input
                                    label="Database Port"
                                    placeholder="3306"
                                    value={data.port}
                                    onValueChange={(value) => setData('port', value)}
                                    isInvalid={!!errors.port}
                                    errorMessage={errors.port}
                                    isRequired
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                            </div>

                            <Input
                                label="Database Name"
                                placeholder="eos365"
                                value={data.database}
                                onValueChange={(value) => setData('database', value)}
                                isInvalid={!!errors.database}
                                errorMessage={errors.database}
                                isRequired
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Input
                                label="Database Username"
                                placeholder="root"
                                value={data.username}
                                onValueChange={(value) => setData('username', value)}
                                isInvalid={!!errors.username}
                                errorMessage={errors.username}
                                isRequired
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Input
                                type="password"
                                label="Database Password"
                                placeholder="Leave empty if no password"
                                value={data.password}
                                onValueChange={(value) => setData('password', value)}
                                isInvalid={!!errors.password}
                                errorMessage={errors.password}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            {/* Test connection button */}
                            <div className="flex flex-col gap-3">
                                <Button
                                    type="button"
                                    color="secondary"
                                    variant="flat"
                                    onPress={handleTestConnection}
                                    isLoading={testing}
                                    isDisabled={!data.host || !data.port || !data.database || !data.username}
                                    className="w-full"
                                >
                                    Test Database Connection
                                </Button>

                                {/* Test result */}
                                {testResult && (
                                    <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                                        testResult.success
                                            ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                                            : 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
                                    }`}>
                                        {testResult.success ? (
                                            <CheckCircleIcon className="w-5 h-5 text-success-600 flex-shrink-0" />
                                        ) : (
                                            <XCircleIcon className="w-5 h-5 text-danger-600 flex-shrink-0" />
                                        )}
                                        <p className={`text-sm ${
                                            testResult.success 
                                                ? 'text-success-800 dark:text-success-200' 
                                                : 'text-danger-800 dark:text-danger-200'
                                        }`}>
                                            {testResult.message}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardBody>

                    <CardFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-t border-divider px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                        <Button
                            as="a"
                            href={route('installation.requirements')}
                            variant="flat"
                            color="default"
                            isDisabled={processing}
                            className="w-full sm:w-auto order-2 sm:order-1"
                        >
                            Back
                        </Button>
                        <Button
                            type="submit"
                            color="primary"
                            isLoading={processing}
                            isDisabled={!testResult || !testResult.success || processing}
                            className="w-full sm:w-auto order-1 sm:order-2"
                        >
                            Continue
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </InstallationLayout>
    );
}
