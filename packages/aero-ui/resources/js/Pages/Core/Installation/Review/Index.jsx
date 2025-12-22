import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import StandaloneInstallationLayout from '@/Layouts/StandaloneInstallationLayout';
import { Card, CardHeader, CardBody, CardFooter, Button, Progress, Chip, Spinner } from '@heroui/react';
import { 
    ClipboardDocumentCheckIcon, 
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    PlayIcon,
    ServerIcon,
    CircleStackIcon,
    UserPlusIcon,
    DocumentCheckIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

export default function Review() {
    const { title, step, totalSteps, summary, canInstall } = usePage().props;
    
    const [isInstalling, setIsInstalling] = useState(false);
    const [installationProgress, setInstallationProgress] = useState(0);
    const [currentStage, setCurrentStage] = useState('');
    const [stages, setStages] = useState([
        { id: 'migrate', name: 'Running Migrations', status: 'pending', icon: ServerIcon },
        { id: 'seed', name: 'Seeding Essential Data', status: 'pending', icon: CircleStackIcon },
        { id: 'admin', name: 'Creating Administrator', status: 'pending', icon: UserPlusIcon },
        { id: 'finalize', name: 'Finalizing Installation', status: 'pending', icon: DocumentCheckIcon },
    ]);
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);
    const logsEndRef = useRef(null);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { timestamp, message, type }]);
    };

    const updateStageStatus = (stageId, status) => {
        setStages(prev => prev.map(stage => 
            stage.id === stageId ? { ...stage, status } : stage
        ));
    };

    const runInstallation = async () => {
        setIsInstalling(true);
        setError(null);
        setLogs([]);
        setInstallationProgress(0);

        try {
            // Stage 1: Migrations
            setCurrentStage('Running database migrations...');
            updateStageStatus('migrate', 'running');
            addLog('Starting database migrations...', 'info');
            setInstallationProgress(10);

            const migrateResponse = await axios.post(route('installation.api.migrate'));
            if (!migrateResponse.data.success) {
                throw new Error(migrateResponse.data.message || 'Migration failed');
            }
            updateStageStatus('migrate', 'completed');
            addLog('✓ Database migrations completed successfully', 'success');
            setInstallationProgress(30);

            // Stage 2: Seeding
            setCurrentStage('Seeding essential data...');
            updateStageStatus('seed', 'running');
            addLog('Seeding roles, permissions, and modules...', 'info');

            const seedResponse = await axios.post(route('installation.api.seed'));
            if (!seedResponse.data.success) {
                throw new Error(seedResponse.data.message || 'Seeding failed');
            }
            updateStageStatus('seed', 'completed');
            addLog('✓ Essential data seeded successfully', 'success');
            setInstallationProgress(60);

            // Stage 3: Admin Account (already collected)
            setCurrentStage('Creating administrator account...');
            updateStageStatus('admin', 'running');
            addLog('Setting up Super Administrator account...', 'info');

            // The admin should already be created in step 5, but we verify it
            const adminResponse = await axios.post(route('installation.verify-admin'));
            if (adminResponse.data.success) {
                updateStageStatus('admin', 'completed');
                addLog('✓ Administrator account verified', 'success');
            } else {
                updateStageStatus('admin', 'warning');
                addLog('⚠ Admin verification skipped - create via step 5', 'warning');
            }
            setInstallationProgress(80);

            // Stage 4: Finalize
            setCurrentStage('Finalizing installation...');
            updateStageStatus('finalize', 'running');
            addLog('Creating installation marker...', 'info');

            const finalizeResponse = await axios.post(route('installation.finalize'));
            if (!finalizeResponse.data.success) {
                throw new Error(finalizeResponse.data.message || 'Finalization failed');
            }
            updateStageStatus('finalize', 'completed');
            addLog('✓ Installation finalized successfully', 'success');
            setInstallationProgress(100);

            // Success!
            setCurrentStage('Installation complete!');
            addLog('🎉 Installation completed successfully!', 'success');
            
            // Disable beforeunload warning
            if (window.disableInstallationWarning) {
                window.disableInstallationWarning();
            }

            showToast.success('Installation completed successfully!');
            
            // Redirect to complete page after a short delay
            setTimeout(() => {
                router.visit(route('installation.complete'));
            }, 2000);

        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Installation failed';
            setError(errorMessage);
            addLog(`✗ Error: ${errorMessage}`, 'error');
            setCurrentStage('Installation failed');
            
            // Mark current running stage as failed
            setStages(prev => prev.map(stage => 
                stage.status === 'running' ? { ...stage, status: 'failed' } : stage
            ));

            showToast.error(errorMessage);
            setIsInstalling(false);
        }
    };

    const handleBack = () => {
        if (!isInstalling) {
            router.visit(route('installation.admin'));
        }
    };

    const getStageIcon = (stage) => {
        const IconComponent = stage.icon;
        switch (stage.status) {
            case 'completed':
                return <CheckCircleIcon className="w-5 h-5 text-success" />;
            case 'running':
                return <Spinner size="sm" color="primary" />;
            case 'failed':
                return <XCircleIcon className="w-5 h-5 text-danger" />;
            case 'warning':
                return <ExclamationTriangleIcon className="w-5 h-5 text-warning" />;
            default:
                return <IconComponent className="w-5 h-5 text-default-400" />;
        }
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
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        isInstalling 
                            ? 'bg-primary-100 dark:bg-primary-900/30' 
                            : error 
                                ? 'bg-danger-100 dark:bg-danger-900/30'
                                : 'bg-purple-100 dark:bg-purple-900/30'
                    }`}>
                        {isInstalling ? (
                            <ArrowPathIcon className="w-10 h-10 text-primary-600 animate-spin" />
                        ) : error ? (
                            <XCircleIcon className="w-10 h-10 text-danger-600" />
                        ) : (
                            <ClipboardDocumentCheckIcon className="w-10 h-10 text-purple-600" />
                        )}
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            {isInstalling ? 'Installing...' : error ? 'Installation Failed' : 'Review & Install'}
                        </h2>
                        <p className="text-default-600">
                            {isInstalling 
                                ? currentStage 
                                : error 
                                    ? 'An error occurred during installation'
                                    : 'Review your configuration and start the installation'
                            }
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 py-8">
                    <div className="space-y-6">
                        {/* Progress Bar (visible during installation) */}
                        {isInstalling && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-default-600">Installation Progress</span>
                                    <span className="font-medium">{installationProgress}%</span>
                                </div>
                                <Progress 
                                    value={installationProgress} 
                                    color={error ? 'danger' : 'primary'}
                                    size="lg"
                                    className="w-full"
                                />
                            </div>
                        )}

                        {/* Installation Stages */}
                        <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-6">
                            <h3 className="font-semibold text-foreground mb-4">Installation Stages</h3>
                            <div className="space-y-3">
                                {stages.map((stage, index) => (
                                    <div 
                                        key={stage.id}
                                        className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                                            stage.status === 'completed' 
                                                ? 'bg-success-50 dark:bg-success-900/10 border-success-200 dark:border-success-800'
                                                : stage.status === 'running'
                                                    ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800'
                                                    : stage.status === 'failed'
                                                        ? 'bg-danger-50 dark:bg-danger-900/10 border-danger-200 dark:border-danger-800'
                                                        : stage.status === 'warning'
                                                            ? 'bg-warning-50 dark:bg-warning-900/10 border-warning-200 dark:border-warning-800'
                                                            : 'bg-white dark:bg-gray-800 border-default-200 dark:border-default-700'
                                        }`}
                                    >
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-default-100 dark:bg-default-800 flex items-center justify-center">
                                            <span className="text-sm font-medium">{index + 1}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-foreground">{stage.name}</h4>
                                        </div>
                                        {getStageIcon(stage)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary (before installation) */}
                        {!isInstalling && !error && summary && (
                            <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-6">
                                <h3 className="font-semibold text-foreground mb-4">Configuration Summary</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-default-200 dark:border-default-700">
                                        <span className="text-xs text-default-500">Database</span>
                                        <p className="font-medium">{summary?.database || 'Configured'}</p>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-default-200 dark:border-default-700">
                                        <span className="text-xs text-default-500">Admin Email</span>
                                        <p className="font-medium">{summary?.admin_email || 'Configured'}</p>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-default-200 dark:border-default-700">
                                        <span className="text-xs text-default-500">Seeders</span>
                                        <p className="font-medium">{summary?.seeders || '3 seeders ready'}</p>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-default-200 dark:border-default-700">
                                        <span className="text-xs text-default-500">Mode</span>
                                        <p className="font-medium">Standalone</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Installation Logs */}
                        {logs.length > 0 && (
                            <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 max-h-48 overflow-y-auto">
                                <h4 className="text-xs font-medium text-gray-400 mb-2">Installation Log</h4>
                                <div className="space-y-1 font-mono text-xs">
                                    {logs.map((log, index) => (
                                        <div 
                                            key={index}
                                            className={`${
                                                log.type === 'success' ? 'text-green-400' :
                                                log.type === 'error' ? 'text-red-400' :
                                                log.type === 'warning' ? 'text-yellow-400' :
                                                'text-gray-300'
                                            }`}
                                        >
                                            <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                                        </div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                            </div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="bg-danger-50 dark:bg-danger-900/20 rounded-lg p-4 border border-danger-200 dark:border-danger-800">
                                <div className="flex gap-3">
                                    <XCircleIcon className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-danger-800 dark:text-danger-200">
                                            Installation Error
                                        </p>
                                        <p className="text-sm text-danger-700 dark:text-danger-300 mt-1">
                                            {error}
                                        </p>
                                        <p className="text-xs text-danger-600 dark:text-danger-400 mt-2">
                                            You can try running the installation again or check your server logs for more details.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pre-installation Warning */}
                        {!isInstalling && !error && (
                            <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 border border-warning-200 dark:border-warning-800">
                                <div className="flex gap-3">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-warning-800 dark:text-warning-200">
                                            <strong>Important:</strong> The installation will create database tables, 
                                            seed essential data, and set up your administrator account. 
                                            Make sure you have reviewed all the previous steps.
                                        </p>
                                    </div>
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
                        isDisabled={isInstalling}
                    >
                        Back
                    </Button>
                    
                    {error ? (
                        <Button
                            color="primary"
                            onPress={runInstallation}
                            startContent={<ArrowPathIcon className="w-4 h-4" />}
                        >
                            Retry Installation
                        </Button>
                    ) : !isInstalling ? (
                        <Button
                            color="success"
                            size="lg"
                            onPress={runInstallation}
                            startContent={<PlayIcon className="w-5 h-5" />}
                            isDisabled={!canInstall}
                        >
                            Start Installation
                        </Button>
                    ) : null}
                </CardFooter>
            </Card>
        </StandaloneInstallationLayout>
    );
}
