import React, { useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Card, CardBody, Button, Chip } from '@heroui/react';
import {
    UsersIcon, CurrencyDollarIcon, BriefcaseIcon, FolderIcon,
    ClipboardDocumentCheckIcon, TruckIcon, CubeIcon, BuildingStorefrontIcon,
    DocumentTextIcon, AcademicCapIcon, ShieldCheckIcon, ChartBarIcon,
    ArrowUpRightIcon, LockClosedIcon,
} from '@heroicons/react/24/outline';
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import { hasRoute } from '@/utils/routeUtils';

/**
 * Module metadata — icon, color, description, route.
 * Extend as modules are added.
 */
const MODULE_META = {
    hrm:        { label: 'HRM',             icon: UsersIcon,                   color: 'primary',   desc: 'Employees, Leave, Attendance', route: 'hrm.dashboard' },
    crm:        { label: 'CRM',             icon: BriefcaseIcon,               color: 'secondary',  desc: 'Contacts, Deals, Pipeline',    route: 'crm.dashboard' },
    finance:    { label: 'Finance',          icon: CurrencyDollarIcon,          color: 'success',   desc: 'Invoices, Expenses, Reports',  route: 'finance.dashboard' },
    project:    { label: 'Project',          icon: FolderIcon,                  color: 'warning',   desc: 'Tasks, Boards, Milestones',    route: 'project.dashboard' },
    ims:        { label: 'Inventory',        icon: CubeIcon,                    color: 'primary',   desc: 'Stock, Warehouses, Transfers', route: 'ims.dashboard' },
    pos:        { label: 'Point of Sale',    icon: BuildingStorefrontIcon,      color: 'danger',    desc: 'Sales, Registers, Receipts',   route: 'pos.dashboard' },
    scm:        { label: 'Supply Chain',     icon: TruckIcon,                   color: 'warning',   desc: 'Procurement, Suppliers',        route: 'scm.dashboard' },
    quality:    { label: 'Quality',          icon: ClipboardDocumentCheckIcon,  color: 'success',   desc: 'Inspections, Standards',        route: 'quality.dashboard' },
    dms:        { label: 'Documents',        icon: DocumentTextIcon,            color: 'primary',   desc: 'Files, Workflows, Versions',   route: 'dms.dashboard' },
    compliance: { label: 'Compliance',       icon: ShieldCheckIcon,             color: 'danger',    desc: 'Policies, Audits, Reports',    route: 'compliance.dashboard' },
    analytics:  { label: 'Analytics',        icon: ChartBarIcon,                color: 'secondary', desc: 'Reports, Dashboards, KPIs',    route: 'analytics.dashboard' },
    education:  { label: 'Education',        icon: AcademicCapIcon,             color: 'warning',   desc: 'Courses, LMS, Certificates',   route: 'education.dashboard' },
    cms:        { label: 'CMS',              icon: DocumentTextIcon,            color: 'primary',   desc: 'Pages, Blog, Media',           route: 'cms.dashboard' },
};

/**
 * ModuleSummaryWidget — shows subscribed modules as clickable cards,
 * locked modules with upgrade prompt.
 */
export default function ModuleSummaryWidget({ showLocked = true, maxLocked = 3 }) {
    const { aero, modules } = usePage().props;
    const themeRadius = useThemeRadius();

    const subscribedModules = useMemo(() => aero?.subscriptions || [], [aero]);
    const allModules = useMemo(() => {
        if (Array.isArray(modules)) return modules;
        if (modules && typeof modules === 'object') return Object.values(modules);
        return [];
    }, [modules]);

    // Active (subscribed) modules
    const activeModules = useMemo(() => {
        return subscribedModules
            .filter(code => MODULE_META[code])
            .map(code => ({ code, ...MODULE_META[code] }));
    }, [subscribedModules]);

    // Locked modules — in the system but not subscribed
    const lockedModules = useMemo(() => {
        if (!showLocked) return [];
        const allCodes = allModules.map(m => m.code || m);
        return allCodes
            .filter(code => !subscribedModules.includes(code) && MODULE_META[code])
            .map(code => ({ code, ...MODULE_META[code] }))
            .slice(0, maxLocked);
    }, [allModules, subscribedModules, showLocked, maxLocked]);

    const navigateToModule = (mod) => {
        if (hasRoute(mod.route)) {
            router.visit(route(mod.route));
        }
    };

    if (activeModules.length === 0 && lockedModules.length === 0) return null;

    return (
        <div className="space-y-4">
            {/* Active Modules */}
            {activeModules.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activeModules.map(mod => {
                        const Icon = mod.icon;
                        const routeExists = hasRoute(mod.route);
                        return (
                            <Card
                                key={mod.code}
                                isPressable={routeExists}
                                onPress={() => navigateToModule(mod)}
                                className="aero-card group"
                                radius={themeRadius}
                            >
                                <CardBody className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="p-2 rounded-lg shrink-0"
                                            style={{ background: `color-mix(in srgb, var(--theme-${mod.color}, var(--theme-primary)) 15%, transparent)` }}
                                        >
                                            <Icon className="w-5 h-5" style={{ color: `var(--theme-${mod.color}, var(--theme-primary))` }} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm">{mod.label}</p>
                                                <Chip size="sm" color="success" variant="flat" className="h-5 text-[10px]">Active</Chip>
                                            </div>
                                            <p className="text-xs text-default-500 mt-0.5 truncate">{mod.desc}</p>
                                        </div>
                                    </div>
                                    {routeExists && (
                                        <ArrowUpRightIcon className="w-4 h-4 text-default-300 group-hover:text-primary absolute top-3 right-3 transition-colors" />
                                    )}
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Locked Modules — Freemium hook */}
            {lockedModules.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {lockedModules.map(mod => {
                        const Icon = mod.icon;
                        return (
                            <Card
                                key={mod.code}
                                isPressable
                                onPress={() => hasRoute('billing.plans') && router.visit(route('billing.plans'))}
                                className="aero-card opacity-60 hover:opacity-80 transition-opacity"
                                radius={themeRadius}
                            >
                                <CardBody className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg shrink-0 bg-default-100">
                                            <Icon className="w-5 h-5 text-default-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm text-default-500">{mod.label}</p>
                                                <LockClosedIcon className="w-3.5 h-3.5 text-default-400" />
                                            </div>
                                            <p className="text-xs text-default-400 mt-0.5">{mod.desc}</p>
                                        </div>
                                    </div>
                                    <Chip size="sm" variant="flat" className="absolute top-3 right-3 h-5 text-[10px]">
                                        Upgrade
                                    </Chip>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
