import React, { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UnifiedInstallationLayout from '@/Layouts/UnifiedInstallationLayout';
import { Card, CardHeader, CardBody, CardFooter, Button, Chip } from '@heroui/react';
import { 
    RocketLaunchIcon, 
    ServerIcon, 
    CpuChipIcon, 
    ShieldCheckIcon,
    CheckCircleIcon,
    ArrowRightIcon 
} from '@heroicons/react/24/outline';

/**
 * Unified Welcome Page
 * 
 * First step of installation wizard. Shows product info and features.
 * Adapts display based on mode (SaaS vs Standalone).
 */
export default function Welcome() {
    const { 
        app, 
        mode = 'standalone',
        product,
        platformSettings,
        systemSettings,
        phpVersion,
        laravelVersion,
        installedModules = []
    } = usePage().props;

    const appName = mode === 'saas'
        ? (platformSettings?.site_name || app?.name || 'Aero Enterprise Suite')
        : (product?.name || systemSettings?.company_name || app?.name || 'Aero Enterprise Suite');
    
    const appVersion = app?.version || product?.version || '1.0.0';
    
    const logo = mode === 'saas'
        ? (platformSettings?.branding?.logo || platformSettings?.branding?.logo_light)
        : (systemSettings?.branding?.logo_light);

    const firstLetter = appName ? appName.charAt(0).toUpperCase() : 'A';

    const [themeRadius, setThemeRadius] = useState('lg');

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

    const handleStart = () => {
        window.disableInstallationWarning?.();
        // Navigate to next step based on mode
        if (mode === 'saas') {
            router.visit('/install/requirements');
        } else {
            router.visit('/install/license');
        }
    };

    // Features differ by mode
    const features = mode === 'saas' ? [
        {
            icon: ServerIcon,
            title: 'Multi-Tenancy',
            description: 'Isolated tenant databases with subdomain routing'
        },
        {
            icon: CpuChipIcon,
            title: 'Modular Architecture',
            description: '20+ integrated business modules (HRM, CRM, Finance, etc.)'
        },
        {
            icon: ShieldCheckIcon,
            title: 'Enterprise Security',
            description: 'Role-based access control with module-level permissions'
        },
        {
            icon: RocketLaunchIcon,
            title: 'Scalable Platform',
            description: 'Built for growth with flexible subscription plans'
        }
    ] : [
        {
            icon: CpuChipIcon,
            title: 'All-in-One ERP',
            description: 'Complete business management suite'
        },
        {
            icon: ShieldCheckIcon,
            title: 'Role-Based Access',
            description: 'Granular permissions for every module and action'
        },
        {
            icon: ServerIcon,
            title: 'Self-Hosted',
            description: 'Full control of your data and infrastructure'
        },
        {
            icon: RocketLaunchIcon,
            title: 'Easy Setup',
            description: 'Guided installation in just a few minutes'
        }
    ];

    // Steps preview differs by mode
    const stepsPreview = mode === 'saas' ? [
        'System requirements check',
        'Database configuration',
        'Platform settings',
        'Admin account creation',
        'Final review & install'
    ] : [
        'License validation',
        'System requirements check',
        'Database configuration',
        'System settings',
        'Admin account creation',
        'Final review & install'
    ];

    return (
        <UnifiedInstallationLayout currentStep={1} mode={mode}>
            <Head title="Installation - Welcome" />
            
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
                    {/* Logo */}
                    {logo ? (
                        <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center bg-white dark:bg-gray-800 shadow-lg">
                            <img 
                                src={logo} 
                                alt={appName}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    const parent = e.target.parentElement;
                                    if (parent) {
                                        e.target.style.display = 'none';
                                        parent.classList.add('bg-primary');
                                        parent.innerHTML = `<span class="text-white font-bold text-4xl">${firstLetter}</span>`;
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-4xl">{firstLetter}</span>
                        </div>
                    )}
                    
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Welcome to {appName}
                        </h1>
                        <p className="text-default-600">
                            {mode === 'saas' 
                                ? 'Multi-tenant SaaS ERP Platform'
                                : 'Enterprise Resource Planning Suite'
                            } - Version {appVersion}
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 pb-6">
                    <div className="space-y-6">
                        {/* Welcome Message */}
                        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 border border-primary-200 dark:border-primary-800">
                            <p className="text-foreground leading-relaxed">
                                Thank you for choosing {appName}! This wizard will guide you through 
                                the installation process, which should take approximately 5-10 minutes to complete.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {features.map((feature, index) => (
                                <div 
                                    key={index}
                                    className="flex gap-3 p-4 bg-default-50 dark:bg-default-100/10 rounded-lg"
                                >
                                    <div className="flex-shrink-0">
                                        <feature.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                                        <p className="text-sm text-default-600">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Included Modules (Standalone mode) */}
                        {mode === 'standalone' && installedModules.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Included Product Modules</h3>
                                <div className="space-y-3">
                                    {installedModules
                                        .filter(module => {
                                            const code = typeof module === 'object' ? module.code : module;
                                            return code !== 'core';
                                        })
                                        .map((module) => {
                                            const code = typeof module === 'object' ? module.code : module;
                                            const name = typeof module === 'object' ? module.name : module.toUpperCase();
                                            const description = typeof module === 'object' ? module.description : null;
                                            
                                            return (
                                                <div 
                                                    key={code}
                                                    className="p-3 rounded-lg border border-divider bg-default-50"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            <CheckCircleIcon className="w-5 h-5 text-success" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-foreground">
                                                                {code === 'all' ? 'All Modules' : name}
                                                            </h4>
                                                            {description && (
                                                                <p className="text-sm text-default-600 mt-1">
                                                                    {description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {/* System Info */}
                        {(phpVersion || laravelVersion) && (
                            <div className="grid grid-cols-2 gap-4">
                                {phpVersion && (
                                    <div className="p-4 bg-default-100 rounded-lg">
                                        <p className="text-sm text-default-600">PHP Version</p>
                                        <p className="font-semibold">{phpVersion}</p>
                                    </div>
                                )}
                                {laravelVersion && (
                                    <div className="p-4 bg-default-100 rounded-lg">
                                        <p className="text-sm text-default-600">Laravel Version</p>
                                        <p className="font-semibold">{laravelVersion}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Installation Steps Preview */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Installation Steps</h3>
                            <div className="space-y-2">
                                {stepsPreview.map((step, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-default-200 flex items-center justify-center text-xs font-medium text-default-600">
                                            {index + 1}
                                        </div>
                                        <span className="text-default-700">{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardBody>

                <CardFooter className="px-8 pb-8 pt-4 border-t border-divider">
                    <div className="w-full flex justify-end">
                        <Button
                            color="primary"
                            size="lg"
                            endContent={<ArrowRightIcon className="w-5 h-5" />}
                            onPress={handleStart}
                        >
                            Get Started
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </UnifiedInstallationLayout>
    );
}
