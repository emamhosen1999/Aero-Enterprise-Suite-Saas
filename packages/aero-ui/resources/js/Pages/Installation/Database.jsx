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
    CircleStackIcon, 
    ArrowRightIcon, 
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    PlusIcon,
    ServerIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

/**
 * Database Configuration Page
 * 
 * Configures database connection:
 * - Test server connection (without database)
 * - Create database if needed
 * - Test full database connection
 */
export default function Database() {
    const { 
        mode = 'standalone',
        savedDatabase = null,
        availableDatabases = []
    } = usePage().props;

    // Current step depends on mode
    const currentStep = mode === 'saas' ? 3 : 4;

    const [formData, setFormData] = useState({
        driver: savedDatabase?.driver || 'mysql',
        host: savedDatabase?.host || '127.0.0.1',
        port: savedDatabase?.port || '3306',
        database: savedDatabase?.database || '',
        username: savedDatabase?.username || 'root',
        password: savedDatabase?.password || '',
    });
    const [errors, setErrors] = useState({});
    const [testing, setTesting] = useState(false);
    const [testingServer, setTestingServer] = useState(false);
    const [creating, setCreating] = useState(false);
    const [serverConnected, setServerConnected] = useState(savedDatabase?.serverConnected || false);
    const [databaseConnected, setDatabaseConnected] = useState(savedDatabase?.databaseConnected || false);
    const [databases, setDatabases] = useState(availableDatabases);

    useEffect(() => {
        const themeRadius = useThemeRadius();
        setThemeRadius(themeRadius);
    }, []);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: null }));
        
        // Reset connection status when credentials change
        if (['host', 'port', 'username', 'password'].includes(field)) {
            setServerConnected(false);
            setDatabaseConnected(false);
        }
        if (field === 'database') {
            setDatabaseConnected(false);
        }
    };

    const testServerConnection = async () => {
        setTestingServer(true);
        setServerConnected(false);
        setErrors({});

        try {
            const response = await axios.post('/install/test-server', {
                connection: formData.driver,
                host: formData.host,
                port: formData.port,
                username: formData.username,
                password: formData.password,
            });

            if (response.data.success) {
                setServerConnected(true);
                setDatabases(response.data.databases || []);
                showToast.success('Server connection successful!');
            } else {
                setErrors({ server: response.data.message || 'Connection failed' });
                showToast.error(response.data.message || 'Server connection failed');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to connect to database server';
            setErrors({ server: message });
            showToast.error(message);
        } finally {
            setTestingServer(false);
        }
    };

    const createDatabase = async () => {
        if (!formData.database.trim()) {
            setErrors({ database: 'Please enter a database name' });
            return;
        }

        setCreating(true);
        try {
            const response = await axios.post('/install/create-database', {
                connection: formData.driver,
                host: formData.host,
                port: formData.port,
                username: formData.username,
                password: formData.password,
                name: formData.database,
            });

            if (response.data.success) {
                showToast.success(`Database "${formData.database}" created successfully!`);
                setDatabases(prev => [...prev, formData.database]);
            } else {
                setErrors({ database: response.data.message || 'Failed to create database' });
                showToast.error(response.data.message || 'Failed to create database');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to create database';
            setErrors({ database: message });
            showToast.error(message);
        } finally {
            setCreating(false);
        }
    };

    const testDatabaseConnection = async () => {
        if (!formData.database.trim()) {
            setErrors({ database: 'Please select or enter a database name' });
            return;
        }

        setTesting(true);
        setDatabaseConnected(false);

        try {
            const response = await axios.post('/install/test-database', {
                connection: formData.driver,
                host: formData.host,
                port: formData.port,
                username: formData.username,
                password: formData.password,
                database: formData.database,
            });

            if (response.data.success) {
                setDatabaseConnected(true);
                showToast.success('Database connection successful!');
            } else {
                setErrors({ database: response.data.message || 'Connection failed' });
                showToast.error(response.data.message || 'Database connection failed');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to connect to database';
            setErrors({ database: message });
            showToast.error(message);
        } finally {
            setTesting(false);
        }
    };

    const handleNext = async () => {
        if (!databaseConnected) {
            showToast.warning('Please test the database connection first');
            return;
        }

        // Save database configuration before proceeding
        try {
            const response = await axios.post('/install/save-database', {
                connection: formData.driver,
                host: formData.host,
                port: formData.port,
                database: formData.database,
                username: formData.username,
                password: formData.password,
            });

            if (response.status === 200) {
                router.visit('/install/settings');
            }
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to save database configuration');
        }
    };

    const handleBack = () => {
        router.visit('/install/requirements');
    };

    return (
        <UnifiedInstallationLayout currentStep={currentStep} mode={mode}>
            <Head title="Installation - Database Configuration" />
            
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
                        <CircleStackIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            Database Configuration
                        </h1>
                        <p className="text-default-600">
                            Configure your database connection
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 pb-6">
                    <div className="space-y-6">
                        {/* Server Connection Section */}
                        <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-4">
                            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                <ServerIcon className="w-5 h-5" />
                                Server Connection
                                {serverConnected && (
                                    <Chip color="success" size="sm" variant="flat">Connected</Chip>
                                )}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Database Driver"
                                    selectedKeys={[formData.driver]}
                                    onSelectionChange={(keys) => handleChange('driver', Array.from(keys)[0])}
                                    radius={themeRadius}
                                    classNames={{ trigger: "bg-default-100" }}
                                >
                                    <SelectItem key="mysql">MySQL / MariaDB</SelectItem>
                                    <SelectItem key="pgsql">PostgreSQL</SelectItem>
                                    <SelectItem key="sqlite">SQLite</SelectItem>
                                </Select>

                                <Input
                                    label="Host"
                                    placeholder="127.0.0.1"
                                    value={formData.host}
                                    onValueChange={(v) => handleChange('host', v)}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />

                                <Input
                                    label="Port"
                                    placeholder="3306"
                                    value={formData.port}
                                    onValueChange={(v) => handleChange('port', v)}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />

                                <Input
                                    label="Username"
                                    placeholder="root"
                                    value={formData.username}
                                    onValueChange={(v) => handleChange('username', v)}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />

                                <Input
                                    type="password"
                                    label="Password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onValueChange={(v) => handleChange('password', v)}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                            </div>

                            {errors.server && (
                                <p className="text-danger text-sm mt-2">{errors.server}</p>
                            )}

                            <Button
                                color="secondary"
                                variant="flat"
                                className="mt-4"
                                onPress={testServerConnection}
                                isLoading={testingServer}
                                startContent={!testingServer && <ServerIcon className="w-4 h-4" />}
                            >
                                {testingServer ? 'Testing...' : 'Test Server Connection'}
                            </Button>
                        </div>

                        {/* Database Selection Section */}
                        {serverConnected && (
                            <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-4">
                                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <CircleStackIcon className="w-5 h-5" />
                                    Database Selection
                                    {databaseConnected && (
                                        <Chip color="success" size="sm" variant="flat">Connected</Chip>
                                    )}
                                </h3>

                                <div className="space-y-4">
                                    {databases.length > 0 ? (
                                        <Select
                                            label="Select Existing Database"
                                            placeholder="Choose a database or enter a new name below"
                                            selectedKeys={formData.database && databases.includes(formData.database) ? [formData.database] : []}
                                            onSelectionChange={(keys) => {
                                                const selected = Array.from(keys)[0];
                                                if (selected) handleChange('database', selected);
                                            }}
                                            radius={themeRadius}
                                            classNames={{ trigger: "bg-default-100" }}
                                        >
                                            {databases.map(db => (
                                                <SelectItem key={db}>{db}</SelectItem>
                                            ))}
                                        </Select>
                                    ) : null}

                                    <div className="flex gap-2">
                                        <Input
                                            label="Database Name"
                                            placeholder={mode === 'saas' ? 'eos365' : 'aero_erp'}
                                            value={formData.database}
                                            onValueChange={(v) => handleChange('database', v)}
                                            isInvalid={!!errors.database}
                                            errorMessage={errors.database}
                                            radius={themeRadius}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                            className="flex-1"
                                        />
                                        <Button
                                            color="secondary"
                                            variant="flat"
                                            className="self-end"
                                            onPress={createDatabase}
                                            isLoading={creating}
                                            isDisabled={!formData.database.trim() || databases.includes(formData.database)}
                                            startContent={!creating && <PlusIcon className="w-4 h-4" />}
                                        >
                                            Create
                                        </Button>
                                    </div>

                                    <Button
                                        color="primary"
                                        variant="flat"
                                        onPress={testDatabaseConnection}
                                        isLoading={testing}
                                        isDisabled={!formData.database.trim()}
                                        startContent={!testing && (
                                            databaseConnected 
                                                ? <CheckCircleIcon className="w-4 h-4" />
                                                : <CircleStackIcon className="w-4 h-4" />
                                        )}
                                    >
                                        {testing ? 'Testing...' : databaseConnected ? 'Connection Verified' : 'Test Database Connection'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Connection Status */}
                        {databaseConnected && (
                            <div className="bg-success-50 dark:bg-success-900/20 rounded-lg p-4 border border-success-200 dark:border-success-800">
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-6 h-6 text-success shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-success-700 dark:text-success-300">
                                            Database Connected
                                        </h4>
                                        <p className="text-sm text-success-600 dark:text-success-400 mt-1">
                                            Successfully connected to <strong>{formData.database}</strong> on <strong>{formData.host}:{formData.port}</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>
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
                            isDisabled={!databaseConnected}
                        >
                            Continue
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </UnifiedInstallationLayout>
    );
}