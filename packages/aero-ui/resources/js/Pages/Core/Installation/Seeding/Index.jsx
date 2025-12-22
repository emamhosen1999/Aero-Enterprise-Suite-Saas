import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import StandaloneInstallationLayout from '@/Layouts/StandaloneInstallationLayout';
import { Card, CardHeader, CardBody, CardFooter, Button, Chip, Spinner, Progress } from '@heroui/react';
import { 
    CircleStackIcon, 
    ArrowRightIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    PlayIcon,
    ShieldCheckIcon,
    CubeIcon,
    KeyIcon
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

export default function Seeding() {
    const { title, step, totalSteps, seeders = [] } = usePage().props;
    const [seeding, setSeeding] = useState(false);
    const [seedingComplete, setSeedingComplete] = useState(false);
    const [seedingOutput, setSeedingOutput] = useState('');
    const [currentSeeder, setCurrentSeeder] = useState('');

    const seederInfo = [
        {
            name: 'CoreDatabaseSeeder',
            description: 'Creates default roles and permissions',
            icon: ShieldCheckIcon,
            color: 'text-blue-500'
        },
        {
            name: 'ModuleSeeder',
            description: 'Sets up module hierarchy from configuration',
            icon: CubeIcon,
            color: 'text-purple-500'
        },
        {
            name: 'RoleModuleAccessSeeder',
            description: 'Configures role-based module access permissions',
            icon: KeyIcon,
            color: 'text-green-500'
        }
    ];

    const handleRunSeeders = async () => {
        setSeeding(true);
        setSeedingOutput('');

        const promise = new Promise(async (resolve, reject) => {
            try {
                setCurrentSeeder('Running seeders...');
                const response = await axios.post(route('installation.seed'));
                
                if (response.data.success) {
                    setSeedingComplete(true);
                    setSeedingOutput(response.data.output || 'All seeders completed successfully.');
                    setCurrentSeeder('');
                    resolve(['Essential data seeded successfully!']);
                } else {
                    setCurrentSeeder('');
                    reject([response.data.message || 'Seeding failed']);
                }
            } catch (error) {
                const message = error.response?.data?.message || 'Seeding failed. Please try again.';
                setSeedingOutput(message);
                setCurrentSeeder('');
                reject([message]);
            } finally {
                setSeeding(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Seeding essential data...',
            success: (data) => data.join(', '),
            error: (err) => Array.isArray(err) ? err.join(', ') : err,
        });
    };

    const handleContinue = () => {
        router.visit(route('installation.admin'));
    };

    const handleBack = () => {
        router.visit(route('installation.database'));
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
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <CircleStackIcon className="w-10 h-10 text-purple-600" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Seed Essential Data
                        </h2>
                        <p className="text-default-600">
                            Create roles, permissions, and module configurations
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 py-8">
                    <div className="space-y-6">
                        {/* Info about what will be seeded */}
                        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 border border-primary-200 dark:border-primary-800">
                            <p className="text-foreground leading-relaxed">
                                This step will populate your database with essential data including:
                            </p>
                            <ul className="mt-3 space-y-1 text-sm text-default-600">
                                <li>• <strong>Super Administrator</strong> role with full access</li>
                                <li>• Core permissions for all modules</li>
                                <li>• Module hierarchy configuration</li>
                                <li>• Role-module access mappings</li>
                            </ul>
                        </div>

                        {/* Seeders list */}
                        <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-6">
                            <h3 className="font-semibold text-foreground mb-4">Seeders to Run</h3>
                            <div className="space-y-4">
                                {seederInfo.map((seeder, index) => {
                                    const IconComponent = seeder.icon;
                                    return (
                                        <div 
                                            key={seeder.name}
                                            className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                                                seedingComplete 
                                                    ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                                                    : 'bg-white dark:bg-gray-800 border-default-200 dark:border-default-700'
                                            }`}
                                        >
                                            <div className={`flex-shrink-0 ${seeder.color}`}>
                                                <IconComponent className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-foreground">{seeder.name}</h4>
                                                <p className="text-sm text-default-600">{seeder.description}</p>
                                            </div>
                                            {seedingComplete && (
                                                <CheckCircleIcon className="w-5 h-5 text-success flex-shrink-0" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Run seeders button or completion status */}
                        {!seedingComplete ? (
                            <div className="space-y-4">
                                <Button
                                    color="primary"
                                    onPress={handleRunSeeders}
                                    isLoading={seeding}
                                    isDisabled={seeding}
                                    startContent={!seeding && <PlayIcon className="w-4 h-4" />}
                                    className="w-full"
                                >
                                    {seeding ? currentSeeder || 'Running Seeders...' : 'Run Seeders'}
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-success-50 dark:bg-success-900/20 rounded-lg p-6 border border-success-200 dark:border-success-800">
                                <div className="flex items-center gap-3 text-success">
                                    <CheckCircleIcon className="w-6 h-6" />
                                    <span className="font-medium">All seeders completed successfully!</span>
                                </div>
                                <p className="text-sm text-default-600 mt-2">
                                    Your database has been populated with essential data. Proceed to create your administrator account.
                                </p>
                            </div>
                        )}

                        {/* Seeding Output */}
                        {seedingOutput && (
                            <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-6">
                                <h4 className="text-sm font-medium text-foreground mb-2">Output:</h4>
                                <pre className="bg-default-100 dark:bg-default-800 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap">
                                    {seedingOutput}
                                </pre>
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
                        isDisabled={seeding}
                    >
                        Back
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleContinue}
                        endContent={<ArrowRightIcon className="w-4 h-4" />}
                        isDisabled={!seedingComplete}
                    >
                        Continue
                    </Button>
                </CardFooter>
            </Card>
        </StandaloneInstallationLayout>
    );
}
