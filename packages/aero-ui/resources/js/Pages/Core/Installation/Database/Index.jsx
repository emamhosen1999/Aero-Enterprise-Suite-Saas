import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import StandaloneInstallationLayout from '@/Layouts/StandaloneInstallationLayout';
import { Card, CardHeader, CardBody, CardFooter, Button, Chip, Spinner } from '@heroui/react';
import { 
    ServerIcon, 
    ArrowRightIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    PlayIcon
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

export default function Database() {
    const { title, step, totalSteps, databaseStatus } = usePage().props;
    const [migrating, setMigrating] = useState(false);
    const [migrationComplete, setMigrationComplete] = useState(databaseStatus?.tables_exist || false);
    const [migrationOutput, setMigrationOutput] = useState('');

    const handleRunMigrations = async () => {
        setMigrating(true);
        setMigrationOutput('');

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('installation.migrate'), {
                    fresh: !databaseStatus?.tables_exist
                });
                
                if (response.data.success) {
                    setMigrationComplete(true);
                    setMigrationOutput(response.data.output || 'Migrations completed successfully.');
                    resolve(['Database migrations completed successfully!']);
                } else {
                    reject([response.data.message || 'Migration failed']);
                }
            } catch (error) {
                const message = error.response?.data?.message || 'Migration failed. Please check your database configuration.';
                setMigrationOutput(message);
                reject([message]);
            } finally {
                setMigrating(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Running database migrations...',
            success: (data) => data.join(', '),
            error: (err) => Array.isArray(err) ? err.join(', ') : err,
        });
    };

    const handleContinue = () => {
        router.visit(route('installation.seeding'));
    };

    const handleBack = () => {
        router.visit(route('installation.index'));
    };

    return (
        <StandaloneInstallationLayout currentStep={step} totalSteps={totalSteps}>
            <Head title={title} />
            
            <Card 
                className="transition-all duration-200"
                style={{
                    border: `var(--borderWidth, 2px) solid transparent`,
                    borderRadius: `var(--borderRadius, 12px)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}
            >
                <CardHeader className="flex flex-col items-center gap-4 pt-8 pb-6 border-b border-divider">
                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        <ServerIcon className="w-10 h-10 text-primary-600" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Database Setup
                        </h2>
                        <p className="text-default-600">
                            Configure your database and run migrations
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 py-8">
                    <div className="space-y-6">
                        {/* Database Connection Status */}
                        <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-6">
                            <h3 className="font-semibold text-foreground mb-4">Connection Status</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Database Connection</span>
                                    <Chip 
                                        size="sm" 
                                        color={databaseStatus?.connected ? 'success' : 'danger'}
                                        variant="flat"
                                        startContent={databaseStatus?.connected ? 
                                            <CheckCircleIcon className="w-3 h-3" /> : 
                                            <ExclamationTriangleIcon className="w-3 h-3" />
                                        }
                                    >
                                        {databaseStatus?.connected ? 'Connected' : 'Not Connected'}
                                    </Chip>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Tables Status</span>
                                    <Chip 
                                        size="sm" 
                                        color={migrationComplete ? 'success' : 'warning'}
                                        variant="flat"
                                    >
                                        {migrationComplete ? 'Tables Created' : 'Pending Migration'}
                                    </Chip>
                                </div>
                            </div>
                        </div>

                        {/* Migration Section */}
                        <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-6">
                            <h3 className="font-semibold text-foreground mb-4">Database Migrations</h3>
                            
                            {!migrationComplete ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-default-600">
                                        Click the button below to create the required database tables. 
                                        This will set up the structure needed for the application.
                                    </p>
                                    
                                    <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 border border-warning-200 dark:border-warning-800">
                                        <p className="text-sm text-warning-800 dark:text-warning-200">
                                            <strong>Note:</strong> This will create new tables in your database. 
                                            Make sure your database credentials in <code className="bg-warning-100 dark:bg-warning-800 px-1 rounded">.env</code> are correct.
                                        </p>
                                    </div>

                                    <Button
                                        color="primary"
                                        onPress={handleRunMigrations}
                                        isLoading={migrating}
                                        isDisabled={!databaseStatus?.connected || migrating}
                                        startContent={!migrating && <PlayIcon className="w-4 h-4" />}
                                        className="w-full"
                                    >
                                        {migrating ? 'Running Migrations...' : 'Run Migrations'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-success">
                                        <CheckCircleIcon className="w-6 h-6" />
                                        <span className="font-medium">Migrations completed successfully!</span>
                                    </div>
                                    <p className="text-sm text-default-600">
                                        All database tables have been created. You can proceed to the next step.
                                    </p>
                                </div>
                            )}

                            {/* Migration Output */}
                            {migrationOutput && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-foreground mb-2">Output:</h4>
                                    <pre className="bg-default-100 dark:bg-default-800 rounded-lg p-4 text-xs overflow-x-auto">
                                        {migrationOutput}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Tables that will be created */}
                        {!migrationComplete && (
                            <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-6">
                                <h3 className="font-semibold text-foreground mb-4">Tables to be Created</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {['users', 'roles', 'permissions', 'modules', 'model_has_roles', 'role_has_permissions', 'password_reset_tokens', 'sessions'].map((table) => (
                                        <div key={table} className="flex items-center gap-2 text-sm text-default-600">
                                            <div className="w-2 h-2 bg-primary rounded-full" />
                                            <span>{table}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardBody>

                <CardFooter className="flex justify-between items-center border-t border-divider px-8 py-6">
                    <Button
                        variant="flat"
                        color="default"
                        onPress={handleBack}
                        startContent={<ArrowLeftIcon className="w-4 h-4" />}
                    >
                        Back
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleContinue}
                        endContent={<ArrowRightIcon className="w-4 h-4" />}
                        isDisabled={!migrationComplete}
                    >
                        Continue
                    </Button>
                </CardFooter>
            </Card>
        </StandaloneInstallationLayout>
    );
}
