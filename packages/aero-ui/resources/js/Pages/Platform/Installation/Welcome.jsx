import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import InstallationLayout from '@/Layouts/InstallationLayout';
import { Card, CardHeader, CardBody, Button } from '@heroui/react';
import { CheckCircleIcon, ServerIcon, CpuChipIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function Welcome() {
    const { app, platformSettings } = usePage().props;
    const appName = app?.name || 'Aero Enterprise Suite';
    const appVersion = app?.version || '1.0.0';
    const logo = platformSettings?.branding?.logo || platformSettings?.branding?.logo_light;
    const firstLetter = appName ? appName.charAt(0).toUpperCase() : 'A';
    
    return (
        <InstallationLayout currentStep={1}>
            <Head title="Installation - Welcome" />
            
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
                <CardHeader className="flex flex-col items-center gap-4 pt-8 pb-6">
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
                        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center">
                            <span className="text-white font-bold text-4xl">{firstLetter}</span>
                        </div>
                    )}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Welcome to {appName}
                        </h1>
                        <p className="text-default-600">
                            Multi-tenant SaaS ERP Platform - Version {appVersion}
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 pb-8">
                    <div className="space-y-6">
                        {/* Welcome message */}
                        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 border border-primary-200 dark:border-primary-800">
                            <p className="text-foreground leading-relaxed">
                                Thank you for choosing {appName}! This wizard will guide you through 
                                the installation process, which should take approximately 5-10 minutes to complete.
                            </p>
                        </div>

                        {/* Features grid */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex gap-3 p-4 bg-default-50 dark:bg-default-100/10 rounded-lg">
                                <div className="flex-shrink-0">
                                    <ServerIcon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Multi-Tenancy</h3>
                                    <p className="text-sm text-default-600">
                                        Isolated tenant databases with subdomain routing
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 p-4 bg-default-50 dark:bg-default-100/10 rounded-lg">
                                <div className="flex-shrink-0">
                                    <CpuChipIcon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Modular Architecture</h3>
                                    <p className="text-sm text-default-600">
                                        20+ integrated business modules (HRM, CRM, FMS, etc.)
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 p-4 bg-default-50 dark:bg-default-100/10 rounded-lg">
                                <div className="flex-shrink-0">
                                    <ShieldCheckIcon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Enterprise Security</h3>
                                    <p className="text-sm text-default-600">
                                        RBAC with Super Admin protection and compliance
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 p-4 bg-default-50 dark:bg-default-100/10 rounded-lg">
                                <div className="flex-shrink-0">
                                    <CheckCircleIcon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Modern Stack</h3>
                                    <p className="text-sm text-default-600">
                                        Laravel 11 + Inertia.js + React 18 + HeroUI
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Installation steps preview */}
                        <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-6">
                            <h3 className="font-semibold text-foreground mb-4">Installation Steps</h3>
                            <ol className="space-y-2 text-sm text-default-600">
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary">1.</span>
                                    <span>Secret code verification</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary">2.</span>
                                    <span>System requirements check</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary">3.</span>
                                    <span>Database configuration</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary">4.</span>
                                    <span>Platform settings setup</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary">5.</span>
                                    <span>Admin account creation</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary">6.</span>
                                    <span>Review and install</span>
                                </li>
                            </ol>
                        </div>

                        {/* Action button */}
                        <div className="flex justify-center pt-4">
                            <Button
                                as={Link}
                                href={route('installation.secret')}
                                color="primary"
                                size="lg"
                                className="px-12"
                            >
                                Start Installation
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </InstallationLayout>
    );
}
