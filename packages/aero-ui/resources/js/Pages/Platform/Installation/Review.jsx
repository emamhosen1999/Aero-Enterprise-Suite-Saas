import React, { useState } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import SafeLink from '@/Components/Common/SafeLink';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import InstallationLayout from '@/Layouts/InstallationLayout';
import { Card, CardHeader, CardBody, CardFooter, Button, Divider, Progress, Chip } from '@heroui/react';
import { ClipboardDocumentCheckIcon, CircleStackIcon, Cog6ToothIcon, UserCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

export default function Review({ dbConfig, platformConfig, adminConfig }) {
    // Debug: Log received props
    console.log('Review Page Props:', {
        dbConfig,
        platformConfig,
        adminConfig
    });

    // Check if session data is complete
    const hasCompleteDbConfig = dbConfig && (
        (dbConfig.db_host || dbConfig.host) &&
        (dbConfig.db_database || dbConfig.database) &&
        (dbConfig.db_username || dbConfig.username)
    );
    const hasCompletePlatformConfig = platformConfig && platformConfig.app_name && platformConfig.app_url;
    const hasCompleteAdminConfig = adminConfig && adminConfig.admin_email;

    const sessionDataIncomplete = !hasCompleteDbConfig || !hasCompletePlatformConfig || !hasCompleteAdminConfig;

    const { post, processing } = useForm({});
    const [installing, setInstalling] = useState(false);
    const [installStages, setInstallStages] = useState([
        { key: 'environment', label: 'Updating environment configuration', status: 'pending' },
        { key: 'migrations', label: 'Running database migrations', status: 'pending' },
        { key: 'seeding', label: 'Seeding initial data', status: 'pending' },
        { key: 'admin', label: 'Creating administrator account', status: 'pending' },
        { key: 'settings', label: 'Configuring platform settings', status: 'pending' },
        { key: 'finalization', label: 'Finalizing installation', status: 'pending' },
    ]);
    const [currentStage, setCurrentStage] = useState(-1);
    const [installError, setInstallError] = useState(null);
    const [installationComplete, setInstallationComplete] = useState(false);

    const handleInstall = async () => {
        setInstalling(true);
        setInstallError(null);
        setCurrentStage(0);

        try {
            // Simulate stage progression
            const stageInterval = setInterval(() => {
                setCurrentStage(prev => {
                    if (prev < installStages.length - 1) {
                        const newStages = [...installStages];
                        if (prev >= 0) newStages[prev].status = 'completed';
                        if (prev + 1 < installStages.length) newStages[prev + 1].status = 'processing';
                        setInstallStages(newStages);
                        return prev + 1;
                    }
                    return prev;
                });
            }, 1000);

            const response = await axios.post(route('installation.install'), {});

            clearInterval(stageInterval);

            console.log('✅ Installation Response:', response.data);

            // Mark all stages as completed
            const completedStages = installStages.map(stage => ({ ...stage, status: 'completed' }));
            setInstallStages(completedStages);
            
            // Mark installation as complete to disable beforeunload warning
            setInstallationComplete(true);
            
            // Also call global function to disable warning synchronously (state updates are async)
            if (typeof window.disableInstallationWarning === 'function') {
                window.disableInstallationWarning();
            }

            showToast.success(response.data.message || 'Installation completed successfully!');

            // Navigate to Complete page using Inertia router
            // The warning is now disabled via the global function above
            setTimeout(() => {
                console.log('🔄 Navigating to Complete page...');
                safeNavigate('installation.complete');
            }, 1500);

        } catch (error) {
            console.error('❌ Installation Error:', error);
            
            const errorData = error.response?.data;
            console.error('Error Details:', {
                message: errorData?.message,
                error: errorData?.error,
                file: errorData?.file,
                line: errorData?.line,
                stage: errorData?.stage,
            });

            // Mark current stage as failed
            if (currentStage >= 0 && currentStage < installStages.length) {
                const failedStages = [...installStages];
                failedStages[currentStage].status = 'failed';
                setInstallStages(failedStages);
            }

            const errorMessage = errorData?.message || errorData?.error || 'Installation failed. Please check console for details.';
            setInstallError({
                message: errorMessage,
                stage: errorData?.stage,
                file: errorData?.file,
                line: errorData?.line,
            });

            showToast.error(errorMessage);
            setInstalling(false);
        }
    };

    const ConfigSection = ({ icon: Icon, title, data }) => (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">{title}</h3>
            </div>
            <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-4">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-divider last:border-b-0">
                        <span className="text-sm text-default-600 capitalize">
                            {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-sm font-medium text-foreground">
                            {key.includes('password') ? '••••••••' : value || 'N/A'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <InstallationLayout currentStep={7} installationComplete={installationComplete}>
            <Head title="Installation - Review" />
            
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
                <CardHeader className="flex flex-col items-center gap-4 pt-8 pb-6 border-b border-divider">
                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        <ClipboardDocumentCheckIcon className="w-10 h-10 text-primary-600" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Review & Install
                        </h2>
                        <p className="text-default-600">
                            Review your configuration before proceeding with installation
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 py-8">
                    {/* Session Data Warning */}
                    {sessionDataIncomplete && (
                        <div className="mb-6 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-danger mb-2">
                                        Incomplete Session Data
                                    </h3>
                                    <p className="text-sm text-danger-700 dark:text-danger-300 mb-4">
                                        Your session data is incomplete or in an old format. This will cause installation errors. 
                                        Please go back to the Database step and re-enter your configuration.
                                    </p>
                                    <div className="text-xs text-danger-600 dark:text-danger-400 mb-4 space-y-1">
                                        <div>• Database Config: {hasCompleteDbConfig ? '✓ Complete' : '✗ Incomplete'}</div>
                                        <div>• Platform Config: {hasCompletePlatformConfig ? '✓ Complete' : '✗ Incomplete'}</div>
                                        <div>• Admin Config: {hasCompleteAdminConfig ? '✓ Complete' : '✗ Incomplete'}</div>
                                    </div>
                                    <Link 
                                        href={route('installation.database')}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger-600 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                        </svg>
                                        Go Back to Database Step
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Installation Progress */}
                    {installing && (
                        <div className="mb-8 space-y-4">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    Installing Platform...
                                </h3>
                                <p className="text-sm text-default-600">
                                    Please wait while we set up your platform
                                </p>
                            </div>

                            <Progress 
                                value={(currentStage + 1) / installStages.length * 100}
                                color="primary"
                                size="lg"
                                className="w-full"
                            />

                            <div className="space-y-2">
                                {installStages.map((stage, index) => (
                                    <div 
                                        key={stage.key}
                                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                            stage.status === 'processing' ? 'bg-primary-50 dark:bg-primary-900/20' :
                                            stage.status === 'completed' ? 'bg-success-50 dark:bg-success-900/20' :
                                            stage.status === 'failed' ? 'bg-danger-50 dark:bg-danger-900/20' :
                                            'bg-default-50 dark:bg-default-100/10'
                                        }`}
                                    >
                                        {stage.status === 'completed' && (
                                            <CheckCircleIcon className="w-5 h-5 text-success shrink-0" />
                                        )}
                                        {stage.status === 'processing' && (
                                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                                        )}
                                        {stage.status === 'failed' && (
                                            <div className="w-5 h-5 rounded-full bg-danger flex items-center justify-center shrink-0">
                                                <span className="text-white text-xs">✕</span>
                                            </div>
                                        )}
                                        {stage.status === 'pending' && (
                                            <div className="w-5 h-5 rounded-full bg-default-200 shrink-0" />
                                        )}
                                        <span className={`text-sm ${
                                            stage.status === 'completed' ? 'text-success' :
                                            stage.status === 'processing' ? 'text-primary font-medium' :
                                            stage.status === 'failed' ? 'text-danger' :
                                            'text-default-600'
                                        }`}>
                                            {stage.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {installError && (
                                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4">
                                    <h4 className="font-semibold text-danger mb-2">Installation Failed</h4>
                                    <p className="text-sm text-danger-700 dark:text-danger-300 mb-2">
                                        {installError.message}
                                    </p>
                                    {installError.file && (
                                        <div className="text-xs text-danger-600 dark:text-danger-400 space-y-1">
                                            <div>File: {installError.file}</div>
                                            <div>Line: {installError.line}</div>
                                            <div>Stage: {installError.stage}</div>
                                        </div>
                                    )}
                                    <p className="text-xs text-danger-600 dark:text-danger-400 mt-2">
                                        Check browser console and Laravel logs for more details.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {!installing && (
                        <div className="space-y-6">
                        {/* Warning message */}
                        <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 border border-warning-200 dark:border-warning-800">
                            <p className="text-sm text-warning-800 dark:text-warning-200">
                                <strong>Before you proceed:</strong> Make sure all the information below is correct. 
                                The installation process will create database tables, run migrations, and set up your platform.
                            </p>
                        </div>

                        {/* Database Configuration */}
                        {dbConfig && (
                            <ConfigSection
                                icon={CircleStackIcon}
                                title="Database Configuration"
                                data={{
                                    host: dbConfig.db_host || dbConfig.host,
                                    port: dbConfig.db_port || dbConfig.port,
                                    database: dbConfig.db_database || dbConfig.database,
                                    username: dbConfig.db_username || dbConfig.username,
                                    password: (dbConfig.db_password || dbConfig.password) ? '********' : 'No password',
                                }}
                            />
                        )}

                        <Divider />

                        {/* Platform Settings */}
                        {platformConfig && (
                            <ConfigSection
                                icon={Cog6ToothIcon}
                                title="Platform Settings"
                                data={{
                                    app_name: platformConfig.app_name,
                                    app_url: platformConfig.app_url,
                                    mail_from_address: platformConfig.mail_from_address,
                                    mail_from_name: platformConfig.mail_from_name,
                                }}
                            />
                        )}

                        <Divider />

                        {/* Admin Account */}
                        {adminConfig && (
                            <ConfigSection
                                icon={UserCircleIcon}
                                title="Admin Account"
                                data={{
                                    name: adminConfig.admin_name || adminConfig.name,
                                    email: adminConfig.admin_email || adminConfig.email,
                                    password: (adminConfig.admin_password || adminConfig.password) ? '********' : 'N/A',
                                }}
                            />
                        )}

                        {/* Installation steps */}
                        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
                            <h4 className="font-semibold text-foreground mb-3 text-sm">
                                Installation will perform the following:
                            </h4>
                            <ul className="text-sm text-default-600 space-y-1">
                                <li>• Update environment configuration (.env file)</li>
                                <li>• Run database migrations</li>
                                <li>• Seed initial data (roles, permissions, modules)</li>
                                <li>• Create platform super administrator account</li>
                                <li>• Configure platform settings</li>
                                <li>• Clear application cache</li>
                                <li>• Create installation lock file</li>
                            </ul>
                        </div>
                        </div>
                    )}
                </CardBody>

                <CardFooter className="flex justify-between items-center border-t border-divider px-8 py-6">
                    <Button
                        as={Link}
                        href={route('installation.admin')}
                        variant="flat"
                        color="default"
                        isDisabled={processing || installing}
                    >
                        Back
                    </Button>
                    <Button
                        onPress={handleInstall}
                        color="primary"
                        size="lg"
                        isLoading={processing || installing}
                        isDisabled={processing || installing || sessionDataIncomplete}
                    >
                        {installing ? 'Installing...' : 'Install Now'}
                    </Button>
                </CardFooter>
            </Card>
        </InstallationLayout>
    );
}
