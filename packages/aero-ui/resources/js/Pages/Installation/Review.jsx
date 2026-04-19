import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UnifiedInstallationLayout from '@/Layouts/UnifiedInstallationLayout';
import { 
    Card, 
    CardHeader, 
    CardBody, 
    CardFooter, 
    Button, 
    Chip,
    Divider,
    Accordion,
    AccordionItem
} from '@heroui/react';
import { 
    ClipboardDocumentCheckIcon, 
    ArrowRightIcon, 
    ArrowLeftIcon,
    CheckCircleIcon,
    CircleStackIcon,
    Cog6ToothIcon,
    UserCircleIcon,
    KeyIcon,
    CubeIcon,
    PencilIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

/**
 * Review Page - Summary of all installation settings
 * 
 * Shows all configured settings before final installation
 */
export default function Review() {
    const { 
        mode = 'standalone',
        summary = {}
    } = usePage().props;

    // Current step depends on mode
    const currentStep = mode === 'saas' ? 6 : 7;

    const [installing, setInstalling] = useState(false);

    // Extract data from summary
    const {
        license = null,
        database = {},
        settings = {},
        admin = {},
        modules = []
    } = summary;

    useEffect(() => {
        const themeRadius = useThemeRadius();
        setThemeRadius(themeRadius);
    }, []);

    const handleInstall = async () => {
        setInstalling(true);
        try {
            const response = await axios.post('/install/execute');

            if (response.data.success) {
                router.visit('/install/processing');
            } else {
                showToast.error(response.data.message || 'Failed to start installation');
                setInstalling(false);
            }
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to start installation');
            setInstalling(false);
        }
    };

    const handleBack = () => {
        router.visit('/install/admin');
    };

    const editStep = (step) => {
        const routes = {
            license: '/install/license',
            database: '/install/database',
            settings: '/install/settings',
            admin: '/install/admin',
        };
        router.visit(routes[step] || '/install/welcome');
    };

    const SectionItem = ({ label, value, masked = false, mono = false }) => (
        <div className="flex justify-between py-2">
            <span className="text-default-500">{label}</span>
            <span className={`font-medium ${mono ? 'font-mono text-sm' : ''}`}>
                {masked ? '••••••••' : (value || '-')}
            </span>
        </div>
    );

    const SectionHeader = ({ icon: Icon, title, step, canEdit = true }) => (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="font-semibold">{title}</span>
            </div>
            {canEdit && (
                <Button
                    size="sm"
                    variant="light"
                    startContent={<PencilIcon className="w-3 h-3" />}
                    onPress={() => editStep(step)}
                >
                    Edit
                </Button>
            )}
        </div>
    );

    return (
        <UnifiedInstallationLayout currentStep={currentStep} mode={mode}>
            <Head title="Installation - Review" />
            
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
                        <ClipboardDocumentCheckIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            Review Configuration
                        </h1>
                        <p className="text-default-600">
                            Please review your settings before installation
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 pb-6">
                    {/* Warning Notice */}
                    <div className="bg-warning-50 dark:bg-warning/10 border border-warning-200 dark:border-warning/20 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <ExclamationTriangleIcon className="w-5 h-5 text-warning mt-0.5" />
                            <div>
                                <p className="font-medium text-warning-800 dark:text-warning">
                                    Ready to Install
                                </p>
                                <p className="text-sm text-warning-600 dark:text-warning/80">
                                    Once you click "Begin Installation", the process cannot be cancelled. 
                                    Make sure all settings are correct before proceeding.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Accordion 
                        defaultExpandedKeys={['settings', 'admin']}
                        variant="splitted"
                        className="px-0"
                    >
                        {/* License Section (Standalone only) */}
                        {mode === 'standalone' && license && (
                            <AccordionItem
                                key="license"
                                aria-label="License"
                                title={<SectionHeader icon={KeyIcon} title="License" step="license" />}
                            >
                                <div className="px-2 pb-2">
                                    <SectionItem label="License Key" value={license.key} masked />
                                    <SectionItem label="Provider" value={license.provider} />
                                    <SectionItem label="Type" value={license.type} />
                                    {license.valid_until && (
                                        <SectionItem label="Valid Until" value={license.valid_until} />
                                    )}
                                    <Divider className="my-2" />
                                    <div className="flex items-center gap-1">
                                        <span className="text-default-500 text-sm">Status:</span>
                                        <Chip color="success" size="sm" variant="flat">
                                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                                            Verified
                                        </Chip>
                                    </div>
                                </div>
                            </AccordionItem>
                        )}

                        {/* Database Section */}
                        <AccordionItem
                            key="database"
                            aria-label="Database"
                            title={<SectionHeader icon={CircleStackIcon} title="Database" step="database" />}
                        >
                            <div className="px-2 pb-2">
                                <SectionItem label="Connection" value={database.connection} />
                                <SectionItem label="Host" value={database.host} mono />
                                <SectionItem label="Port" value={database.port} mono />
                                <SectionItem label="Database" value={database.database} mono />
                                <SectionItem label="Username" value={database.username} mono />
                                <SectionItem label="Password" value="••••••••" />
                                {mode === 'saas' && (
                                    <SectionItem label="Prefix" value={database.prefix || 'tenant_'} mono />
                                )}
                            </div>
                        </AccordionItem>

                        {/* Settings Section */}
                        <AccordionItem
                            key="settings"
                            aria-label="Settings"
                            title={
                                <SectionHeader 
                                    icon={Cog6ToothIcon} 
                                    title={mode === 'saas' ? 'Platform Settings' : 'System Settings'} 
                                    step="settings" 
                                />
                            }
                        >
                            <div className="px-2 pb-2">
                                <SectionItem 
                                    label={mode === 'saas' ? 'Site Name' : 'Company Name'} 
                                    value={mode === 'saas' ? settings.site_name : settings.company_name} 
                                />
                                <SectionItem label="Legal Name" value={settings.legal_name} />
                                <SectionItem label="Application URL" value={settings.app_url} mono />
                                <SectionItem label="Timezone" value={settings.timezone} />
                                <SectionItem label="Support Email" value={settings.support_email} />
                                <SectionItem label="Support Phone" value={settings.support_phone} />
                                
                                {settings.mail_host && (
                                    <>
                                        <Divider className="my-2" />
                                        <p className="text-sm font-medium text-default-700 mb-1">Email Configuration</p>
                                        <SectionItem label="SMTP Host" value={settings.mail_host} mono />
                                        <SectionItem label="SMTP Port" value={settings.mail_port} mono />
                                        <SectionItem label="From Address" value={settings.mail_from_address} />
                                    </>
                                )}

                                {mode === 'saas' && (
                                    <>
                                        <Divider className="my-2" />
                                        <p className="text-sm font-medium text-default-700 mb-1">Drivers</p>
                                        <SectionItem label="Queue" value={settings.queue_driver} />
                                        <SectionItem label="Session" value={settings.session_driver} />
                                        <SectionItem label="Cache" value={settings.cache_driver} />
                                    </>
                                )}

                                {mode === 'standalone' && settings.address_line1 && (
                                    <>
                                        <Divider className="my-2" />
                                        <p className="text-sm font-medium text-default-700 mb-1">Address</p>
                                        <SectionItem 
                                            label="Address" 
                                            value={`${settings.address_line1}${settings.address_line2 ? ', ' + settings.address_line2 : ''}`} 
                                        />
                                        <SectionItem 
                                            label="City/State" 
                                            value={`${settings.city}${settings.state ? ', ' + settings.state : ''} ${settings.postal_code || ''}`} 
                                        />
                                        <SectionItem label="Country" value={settings.country} />
                                    </>
                                )}
                            </div>
                        </AccordionItem>

                        {/* Admin Account Section */}
                        <AccordionItem
                            key="admin"
                            aria-label="Admin Account"
                            title={<SectionHeader icon={UserCircleIcon} title="Admin Account" step="admin" />}
                        >
                            <div className="px-2 pb-2">
                                <SectionItem label="Name" value={`${admin.first_name} ${admin.last_name}`} />
                                <SectionItem label="Email" value={admin.email} />
                                <SectionItem label="Password" value="••••••••" />
                                <SectionItem 
                                    label="Role" 
                                    value={mode === 'saas' ? 'Platform Administrator' : 'Super Administrator'} 
                                />
                            </div>
                        </AccordionItem>

                        {/* Products Section (Standalone only) */}
                        {mode === 'standalone' && modules.length > 0 && (
                            <AccordionItem
                                key="modules"
                                aria-label="Products"
                                title={<SectionHeader icon={CubeIcon} title="Licensed Products" step="license" />}
                            >
                                <div className="px-2 pb-2">
                                    <div className="flex flex-wrap gap-2">
                                        {modules.map((module, index) => (
                                            <Chip key={index} color="primary" variant="flat" size="sm">
                                                {module}
                                            </Chip>
                                        ))}
                                    </div>
                                </div>
                            </AccordionItem>
                        )}
                    </Accordion>

                    {/* Installation Summary */}
                    <div className="mt-6 bg-success-50 dark:bg-success/10 border border-success-200 dark:border-success/20 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <CheckCircleIcon className="w-5 h-5 text-success" />
                            <div>
                                <p className="font-medium text-success-800 dark:text-success">
                                    Configuration Complete
                                </p>
                                <p className="text-sm text-success-600 dark:text-success/80">
                                    All required settings have been configured. Click "Begin Installation" to proceed.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardBody>

                <CardFooter className="px-8 pb-8 pt-4 border-t border-divider">
                    <div className="w-full flex justify-between">
                        <Button
                            variant="flat"
                            startContent={<ArrowLeftIcon className="w-4 h-4" />}
                            onPress={handleBack}
                            isDisabled={installing}
                        >
                            Back
                        </Button>
                        <Button
                            color="success"
                            size="lg"
                            endContent={<ArrowRightIcon className="w-5 h-5" />}
                            onPress={handleInstall}
                            isLoading={installing}
                        >
                            {installing ? 'Starting...' : 'Begin Installation'}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </UnifiedInstallationLayout>
    );
}