import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import InstallationLayout from '@/Layouts/InstallationLayout';
import { Card, CardHeader, CardBody, CardFooter, Button, Divider } from '@heroui/react';
import { ClipboardDocumentCheckIcon, CircleStackIcon, Cog6ToothIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';

export default function Review({ dbConfig, platformConfig, adminConfig }) {
    const { post, processing } = useForm({});
    const [installing, setInstalling] = useState(false);

    const handleInstall = () => {
        setInstalling(true);

        const promise = new Promise(async (resolve, reject) => {
            post(route('installation.install'), {
                onSuccess: () => resolve(['Installation completed successfully!']),
                onError: (errors) => {
                    setInstalling(false);
                    reject(Object.values(errors));
                },
                preserveState: false,
            });
        });

        showToast.promise(promise, {
            loading: 'Installing platform... This may take a few minutes.',
            success: (data) => data.join(', '),
            error: (err) => {
                setInstalling(false);
                return Array.isArray(err) ? err.join(', ') : 'Installation failed';
            },
        });
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
        <InstallationLayout currentStep={7}>
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
                                    host: dbConfig.db_host,
                                    port: dbConfig.db_port,
                                    database: dbConfig.db_database,
                                    username: dbConfig.db_username,
                                    password: dbConfig.db_password ? '********' : 'No password',
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
                                    name: adminConfig.name,
                                    email: adminConfig.email,
                                    password: adminConfig.password ? '********' : 'N/A',
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
                                <li>• Clear application cache</li>
                                <li>• Generate application key</li>
                                <li>• Create installation lock file</li>
                            </ul>
                        </div>
                    </div>
                </CardBody>

                <CardFooter className="flex justify-between items-center border-t border-divider px-8 py-6">
                    <Button
                        as="a"
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
                        isDisabled={processing || installing}
                    >
                        {installing ? 'Installing...' : 'Install Now'}
                    </Button>
                </CardFooter>
            </Card>
        </InstallationLayout>
    );
}
