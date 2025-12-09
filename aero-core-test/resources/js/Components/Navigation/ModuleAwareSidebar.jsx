import React, { useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Button, Chip, Tooltip, Divider } from '@heroui/react';
import { useModule, useModuleEnabled } from '@/Hooks/useModule';
import { useModuleContext, AVAILABLE_MODULES } from '@/Context/ModuleContext';
import {
    HomeIcon,
    UserGroupIcon,
    UserCircleIcon,
    ClipboardDocumentCheckIcon,
    BanknotesIcon,
    CubeIcon,
    ShoppingCartIcon,
    DocumentDuplicateIcon,
    ShieldCheckIcon,
    ChartBarIcon,
    ScaleIcon,
    Cog6ToothIcon,
    LockClosedIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';

/**
 * Module-Aware Navigation Link
 * 
 * A navigation link that is only visible when the required module is enabled.
 * Shows a locked indicator for disabled modules (optional).
 */
const ModuleNavLink = ({
    module,
    href,
    icon: Icon,
    label,
    isActive = false,
    showLockedState = false,
    badge,
}) => {
    const { isEnabled } = useModule(module);

    // If module is disabled and we don't want to show locked state, hide completely
    if (!isEnabled && !showLockedState) {
        return null;
    }

    // Module is disabled but we want to show it as locked
    if (!isEnabled && showLockedState) {
        return (
            <Tooltip content={`${label} module is not enabled. Upgrade your plan to access.`}>
                <div className="w-full">
                    <Button
                        variant="light"
                        className="w-full justify-start h-11 px-4 opacity-50 cursor-not-allowed"
                        isDisabled
                        startContent={<Icon className="w-5 h-5 text-default-400" />}
                        endContent={<LockClosedIcon className="w-4 h-4 text-warning-500" />}
                    >
                        <span className="text-sm font-medium text-default-400">{label}</span>
                    </Button>
                </div>
            </Tooltip>
        );
    }

    // Module is enabled - render normal link
    return (
        <Button
            as={Link}
            href={href}
            variant={isActive ? 'flat' : 'light'}
            color={isActive ? 'primary' : 'default'}
            className={`w-full justify-start h-11 px-4 transition-all duration-200 ${
                isActive ? 'bg-primary/20 border-l-3 border-primary' : ''
            }`}
            startContent={
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-foreground'}`} />
            }
            endContent={
                badge && (
                    <Chip size="sm" variant="flat" color="primary" className="h-5 min-w-5">
                        {badge}
                    </Chip>
                )
            }
        >
            <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                {label}
            </span>
        </Button>
    );
};

/**
 * Module-Aware Navigation Section
 * 
 * A section that groups navigation items and shows based on module availability.
 */
const ModuleNavSection = ({ title, children, module }) => {
    const { isEnabled } = useModule(module || []);

    // If a module is specified and none are enabled, hide the section
    if (module && !isEnabled) {
        return null;
    }

    // Filter out null children (hidden nav items)
    const visibleChildren = React.Children.toArray(children).filter(Boolean);

    // Don't render section if no visible items
    if (visibleChildren.length === 0) {
        return null;
    }

    return (
        <div className="mb-6">
            {title && (
                <div className="px-4 mb-2">
                    <p className="text-xs font-semibold text-default-400 uppercase tracking-wider">
                        {title}
                    </p>
                </div>
            )}
            <div className="space-y-1">{children}</div>
        </div>
    );
};

/**
 * Example Sidebar Component with Module-Based Navigation
 * 
 * This example demonstrates how to use the module system to conditionally
 * render navigation items based on enabled modules.
 * 
 * @example
 * // Usage in your layout
 * import ModuleAwareSidebar from '@/Components/Navigation/ModuleAwareSidebar';
 * 
 * function Layout({ children }) {
 *   return (
 *     <div className="flex">
 *       <ModuleAwareSidebar />
 *       <main>{children}</main>
 *     </div>
 *   );
 * }
 */
const ModuleAwareSidebar = ({ 
    currentPath = '', 
    showLockedModules = false,
    className = '' 
}) => {
    const { url } = usePage().props;
    const activePath = currentPath || url;

    // Use the context for more features
    const { 
        enabledModules, 
        isModuleEnabled,
        filterNavigationByModules 
    } = useModuleContext();

    /**
     * Navigation configuration with module requirements
     */
    const navigationConfig = useMemo(() => [
        // Core navigation (always visible)
        {
            section: 'Main',
            items: [
                { 
                    label: 'Dashboard', 
                    href: '/dashboard', 
                    icon: HomeIcon,
                    // No module requirement - always visible
                },
            ],
        },
        // HR Module
        {
            section: 'Human Resources',
            module: 'hrm', // Section requires HRM module
            items: [
                { 
                    label: 'Employees', 
                    href: '/hr/employees', 
                    icon: UserGroupIcon,
                    module: 'hrm',
                },
                { 
                    label: 'Leave Management', 
                    href: '/hr/leave', 
                    icon: ClipboardDocumentCheckIcon,
                    module: 'hrm',
                },
                { 
                    label: 'Attendance', 
                    href: '/hr/attendance', 
                    icon: ClipboardDocumentCheckIcon,
                    module: 'hrm',
                },
            ],
        },
        // CRM Module
        {
            section: 'Customer Relations',
            module: 'crm',
            items: [
                { 
                    label: 'Contacts', 
                    href: '/crm/contacts', 
                    icon: UserCircleIcon,
                    module: 'crm',
                },
                { 
                    label: 'Leads', 
                    href: '/crm/leads', 
                    icon: UserCircleIcon,
                    module: 'crm',
                    badge: 'New',
                },
                { 
                    label: 'Deals', 
                    href: '/crm/deals', 
                    icon: BanknotesIcon,
                    module: 'crm',
                },
            ],
        },
        // Project Management
        {
            section: 'Projects',
            module: 'project',
            items: [
                { 
                    label: 'All Projects', 
                    href: '/projects', 
                    icon: ClipboardDocumentCheckIcon,
                    module: 'project',
                },
                { 
                    label: 'Tasks', 
                    href: '/projects/tasks', 
                    icon: ClipboardDocumentCheckIcon,
                    module: 'project',
                },
            ],
        },
        // Finance Module
        {
            section: 'Finance',
            module: 'finance',
            items: [
                { 
                    label: 'Invoices', 
                    href: '/finance/invoices', 
                    icon: BanknotesIcon,
                    module: 'finance',
                },
                { 
                    label: 'Expenses', 
                    href: '/finance/expenses', 
                    icon: BanknotesIcon,
                    module: 'finance',
                },
            ],
        },
        // Analytics Module
        {
            section: 'Analytics',
            module: 'analytics',
            items: [
                { 
                    label: 'Reports', 
                    href: '/analytics/reports', 
                    icon: ChartBarIcon,
                    module: 'analytics',
                },
                { 
                    label: 'Insights', 
                    href: '/analytics/insights', 
                    icon: ChartBarIcon,
                    module: 'analytics',
                },
            ],
        },
        // Settings (always visible)
        {
            section: 'Settings',
            items: [
                { 
                    label: 'Settings', 
                    href: '/settings', 
                    icon: Cog6ToothIcon,
                },
            ],
        },
    ], []);

    /**
     * Filter navigation based on enabled modules
     */
    const filteredNavigation = useMemo(() => {
        return navigationConfig
            .filter(section => {
                // If section has no module requirement, always show
                if (!section.module) return true;
                // Check if section's required module is enabled
                return isModuleEnabled(section.module);
            })
            .map(section => ({
                ...section,
                items: section.items.filter(item => {
                    // If item has no module requirement, always show
                    if (!item.module) return true;
                    // For locked state, show all items
                    if (showLockedModules) return true;
                    // Otherwise, only show enabled modules
                    return isModuleEnabled(item.module);
                }),
            }))
            .filter(section => section.items.length > 0);
    }, [navigationConfig, isModuleEnabled, showLockedModules]);

    return (
        <aside className={`w-64 h-screen bg-content1 border-r border-divider flex flex-col ${className}`}>
            {/* Logo/Brand */}
            <div className="h-16 flex items-center px-4 border-b border-divider">
                <span className="text-xl font-bold text-foreground">Aero Suite</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
                {filteredNavigation.map((section, sectionIndex) => (
                    <ModuleNavSection 
                        key={`section-${section.section}-${sectionIndex}`} 
                        title={section.section}
                    >
                        {section.items.map((item, itemIndex) => (
                            <ModuleNavLink
                                key={`nav-${item.label}-${itemIndex}`}
                                module={item.module}
                                href={item.href}
                                icon={item.icon}
                                label={item.label}
                                badge={item.badge}
                                isActive={activePath === item.href}
                                showLockedState={showLockedModules && item.module}
                            />
                        ))}
                    </ModuleNavSection>
                ))}
            </nav>

            {/* Module Status Footer */}
            <div className="p-4 border-t border-divider">
                <p className="text-xs text-default-400 mb-2">
                    Enabled Modules: {enabledModules.length}
                </p>
                <div className="flex flex-wrap gap-1">
                    {enabledModules.slice(0, 3).map(mod => (
                        <Chip key={mod} size="sm" variant="flat" color="success">
                            {mod.toUpperCase()}
                        </Chip>
                    ))}
                    {enabledModules.length > 3 && (
                        <Chip size="sm" variant="flat" color="default">
                            +{enabledModules.length - 3}
                        </Chip>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default ModuleAwareSidebar;

// Export sub-components for flexible usage
export { ModuleNavLink, ModuleNavSection };
