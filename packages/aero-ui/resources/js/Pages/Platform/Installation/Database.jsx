import React, { useState } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import InstallationLayout from '@/Layouts/InstallationLayout';
import { Card, CardHeader, CardBody, CardFooter, Button, Input, Chip, Divider, Tooltip } from '@heroui/react';
import { CircleStackIcon, CheckCircleIcon, XCircleIcon, ServerIcon, PlusCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

export default function Database({ dbConfig = {}, environmentIssues = [] }) {
    const [testResult, setTestResult] = useState(null);
    const [testing, setTesting] = useState(false);
    const [serverTestResult, setServerTestResult] = useState(null);
    const [testingServer, setTestingServer] = useState(false);
    const [availableDatabases, setAvailableDatabases] = useState([]);
    const [creatingDatabase, setCreatingDatabase] = useState(false);
    const [canCreateDatabase, setCanCreateDatabase] = useState(false);

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

    const handleTestServerConnection = async () => {
        setTestingServer(true);
        setServerTestResult(null);
        setAvailableDatabases([]);
        setCanCreateDatabase(false);

        try {
            const response = await axios.post(route('installation.test-server'), {
                host: data.host,
                port: data.port,
                username: data.username,
                password: data.password,
            });
            
            if (response.data.success) {
                setServerTestResult({ success: true, message: response.data.message });
                setAvailableDatabases(response.data.databases || []);
                setCanCreateDatabase(response.data.can_create_database || false);
                showToast.success('Server connection successful!');
            } else {
                setServerTestResult({ success: false, message: response.data.message });
                showToast.error('Server connection failed');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Server connection test failed';
            setServerTestResult({ success: false, message });
            showToast.error(message);
        } finally {
            setTestingServer(false);
        }
    };

    const handleCreateDatabase = async () => {
        if (!data.database) {
            showToast.error('Please enter a database name');
            return;
        }

        setCreatingDatabase(true);

        try {
            const response = await axios.post(route('installation.create-database'), {
                host: data.host,
                port: data.port,
                username: data.username,
                password: data.password,
                database: data.database,
            });
            
            if (response.data.success) {
                showToast.success(response.data.message || 'Database created successfully!');
                setAvailableDatabases(prev => [...prev, data.database]);
                // Automatically test the full connection now
                handleTestConnection();
            } else {
                showToast.error(response.data.message || 'Failed to create database');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to create database';
            showToast.error(message);
        } finally {
            setCreatingDatabase(false);
        }
    };

    const selectDatabase = (dbName) => {
        setData('database', dbName);
        setTestResult(null);
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
                            {/* Environment issues warning */}
                            {environmentIssues.length > 0 && (
                                <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-3 sm:p-4 border border-warning-200 dark:border-warning-800">
                                    <div className="flex items-start gap-2">
                                        <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-warning-800 dark:text-warning-200 mb-2">
                                                Environment Issues Detected:
                                            </p>
                                            <ul className="list-disc list-inside text-xs text-warning-700 dark:text-warning-300 space-y-1">
                                                {environmentIssues.map((issue, index) => (
                                                    <li key={index}>{issue}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 1: Server connection */}
                            <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-4 border border-default-200 dark:border-default-700">
                                <div className="flex items-center gap-2 mb-3">
                                    <ServerIcon className="w-5 h-5 text-primary-600" />
                                    <h3 className="text-sm font-semibold text-foreground">Step 1: Test Server Connection</h3>
                                </div>
                                <p className="text-xs text-default-500 mb-4">
                                    First, verify your MySQL server is accessible. This will also show available databases.
                                </p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                                    <Input
                                        label="Database Host"
                                        placeholder="localhost"
                                        value={data.host}
                                        onValueChange={(value) => {
                                            setData('host', value);
                                            setServerTestResult(null);
                                            setTestResult(null);
                                        }}
                                        isInvalid={!!errors.host}
                                        errorMessage={errors.host}
                                        isRequired
                                        size="sm"
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Input
                                        label="Database Port"
                                        placeholder="3306"
                                        value={data.port}
                                        onValueChange={(value) => {
                                            setData('port', value);
                                            setServerTestResult(null);
                                            setTestResult(null);
                                        }}
                                        isInvalid={!!errors.port}
                                        errorMessage={errors.port}
                                        isRequired
                                        size="sm"
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                                    <Input
                                        label="Database Username"
                                        placeholder="root"
                                        value={data.username}
                                        onValueChange={(value) => {
                                            setData('username', value);
                                            setServerTestResult(null);
                                            setTestResult(null);
                                        }}
                                        isInvalid={!!errors.username}
                                        errorMessage={errors.username}
                                        isRequired
                                        size="sm"
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Input
                                        type="password"
                                        label="Database Password"
                                        placeholder="Leave empty if no password"
                                        value={data.password}
                                        onValueChange={(value) => {
                                            setData('password', value);
                                            setServerTestResult(null);
                                            setTestResult(null);
                                        }}
                                        isInvalid={!!errors.password}
                                        errorMessage={errors.password}
                                        size="sm"
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />
                                </div>

                                <Button
                                    type="button"
                                    color="secondary"
                                    variant="flat"
                                    onPress={handleTestServerConnection}
                                    isLoading={testingServer}
                                    isDisabled={!data.host || !data.port || !data.username}
                                    size="sm"
                                    startContent={!testingServer && <ServerIcon className="w-4 h-4" />}
                                >
                                    Test Server Connection
                                </Button>

                                {/* Server test result */}
                                {serverTestResult && (
                                    <div className={`flex items-center gap-2 p-3 rounded-lg border mt-3 ${
                                        serverTestResult.success
                                            ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                                            : 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
                                    }`}>
                                        {serverTestResult.success ? (
                                            <CheckCircleIcon className="w-5 h-5 text-success-600 flex-shrink-0" />
                                        ) : (
                                            <XCircleIcon className="w-5 h-5 text-danger-600 flex-shrink-0" />
                                        )}
                                        <p className={`text-sm ${
                                            serverTestResult.success 
                                                ? 'text-success-800 dark:text-success-200' 
                                                : 'text-danger-800 dark:text-danger-200'
                                        }`}>
                                            {serverTestResult.message}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Step 2: Database selection/creation (only show after successful server test) */}
                            {serverTestResult?.success && (
                                <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-4 border border-default-200 dark:border-default-700">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CircleStackIcon className="w-5 h-5 text-primary-600" />
                                        <h3 className="text-sm font-semibold text-foreground">Step 2: Select or Create Database</h3>
                                    </div>

                                    {/* Available databases */}
                                    {availableDatabases.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-xs text-default-500 mb-2">Available databases (click to select):</p>
                                            <div className="flex flex-wrap gap-2">
                                                {availableDatabases.map((db) => (
                                                    <Chip
                                                        key={db}
                                                        variant={data.database === db ? 'solid' : 'flat'}
                                                        color={data.database === db ? 'primary' : 'default'}
                                                        className="cursor-pointer"
                                                        onClick={() => selectDatabase(db)}
                                                    >
                                                        {db}
                                                    </Chip>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <Divider className="my-4" />

                                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                                        <div className="flex-1 w-full">
                                            <Input
                                                label="Database Name"
                                                placeholder="eos365"
                                                value={data.database}
                                                onValueChange={(value) => {
                                                    setData('database', value);
                                                    setTestResult(null);
                                                }}
                                                isInvalid={!!errors.database}
                                                errorMessage={errors.database}
                                                isRequired
                                                size="sm"
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />
                                        </div>
                                        
                                        {canCreateDatabase && !availableDatabases.includes(data.database) && data.database && (
                                            <Tooltip content="Create this database on the server">
                                                <Button
                                                    type="button"
                                                    color="success"
                                                    variant="flat"
                                                    onPress={handleCreateDatabase}
                                                    isLoading={creatingDatabase}
                                                    size="sm"
                                                    startContent={!creatingDatabase && <PlusCircleIcon className="w-4 h-4" />}
                                                >
                                                    Create Database
                                                </Button>
                                            </Tooltip>
                                        )}
                                    </div>

                                    {!canCreateDatabase && !availableDatabases.includes(data.database) && data.database && (
                                        <div className="flex items-start gap-2 mt-3 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                                            <InformationCircleIcon className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-warning-700 dark:text-warning-300">
                                                Your MySQL user doesn't have CREATE DATABASE privileges. 
                                                Please create the database manually using phpMyAdmin or MySQL command line, 
                                                or use a user with administrative privileges.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Test full connection (only show after database is selected) */}
                            {serverTestResult?.success && data.database && (
                                <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-4 border border-default-200 dark:border-default-700">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircleIcon className="w-5 h-5 text-primary-600" />
                                        <h3 className="text-sm font-semibold text-foreground">Step 3: Verify Database Connection</h3>
                                    </div>
                                    <p className="text-xs text-default-500 mb-4">
                                        Test the full database connection to ensure everything is configured correctly.
                                    </p>

                                    <Button
                                        type="button"
                                        color="primary"
                                        variant="flat"
                                        onPress={handleTestConnection}
                                        isLoading={testing}
                                        isDisabled={!data.host || !data.port || !data.database || !data.username}
                                        size="sm"
                                        startContent={!testing && <CircleStackIcon className="w-4 h-4" />}
                                    >
                                        Test Database Connection
                                    </Button>

                                    {/* Database test result */}
                                    {testResult && (
                                        <div className={`flex items-center gap-2 p-3 rounded-lg border mt-3 ${
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
                            )}
                        </div>
                    </CardBody>

                    <CardFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-t border-divider px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                        <Button
                            as={Link}
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
