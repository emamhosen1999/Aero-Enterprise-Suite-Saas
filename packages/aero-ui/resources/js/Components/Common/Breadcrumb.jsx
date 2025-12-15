import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from '@heroui/react';
import { HomeIcon } from '@heroicons/react/24/outline';
import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { getDashboardUrl } from '@/utils/moduleAccessUtils';
import { getPages } from '@/Props/pages.jsx';
import { getSettingsPages } from '@/Props/settings.jsx';

const Breadcrumb = () => {
    const { props, url } = usePage();
    const { title, auth } = props;
    
    // Get permissions and determine if we're on a settings page
    const permissions = auth?.permissions || [];
    const roles = auth?.roles || [];
    const isSettingsPage = url.startsWith('/settings') || url.includes('settings');
    
    // Get the appropriate pages data
    const pages = isSettingsPage 
        ? getSettingsPages(permissions, auth) 
        : getPages(roles, permissions, auth);
    
    // Function to find a page by route name in nested structure
    const findPageByRoute = (pages, routeName) => {
        for (const page of pages) {
            // Check if this page matches
            if (page.route === routeName) {
                return page;
            }
            // Check subMenu if it exists
            if (page.subMenu) {
                for (const subPage of page.subMenu) {
                    if (subPage.route === routeName) {
                        return { parent: page, page: subPage };
                    }
                    // Check nested subMenu
                    if (subPage.subMenu) {
                        for (const nestedPage of subPage.subMenu) {
                            if (nestedPage.route === routeName) {
                                return { parent: page, subParent: subPage, page: nestedPage };
                            }
                        }
                    }
                }
            }
        }
        return null;
    };
    
    // Generate breadcrumb items based on current route
    const generateBreadcrumbs = () => {
        const breadcrumbs = [];
        let currentRoute;
        
        try {
            currentRoute = route().current();
        } catch (error) {
            console.warn('Route function not available:', error);
            currentRoute = null;
        }
        
        // Always add Home breadcrumb first
        breadcrumbs.push({
            label: "Home",
            icon: <HomeIcon className="w-4 h-4" />,
            href: getDashboardUrl(),
            key: 'home'
        });
        
        if (!currentRoute) {
            // Fallback if no route found
            breadcrumbs.push({
                label: title || 'Current Page',
                icon: null,
                href: null,
                key: 'current'
            });
            return breadcrumbs;
        }
        
        // Find the current page in the pages data
        const pageData = findPageByRoute(pages, currentRoute);
        
        if (pageData) {
            if (pageData.parent && pageData.subParent) {
                // Three-level deep: Parent > SubParent > Current
                breadcrumbs.push({
                    label: pageData.parent.name,
                    icon: React.cloneElement(pageData.parent.icon, { className: "w-4 h-4" }),
                    href: pageData.parent.route ? (() => {
                        try {
                            return route(pageData.parent.route);
                        } catch {
                            return null;
                        }
                    })() : null,
                    key: 'parent'
                });
                breadcrumbs.push({
                    label: pageData.subParent.name,
                    icon: React.cloneElement(pageData.subParent.icon, { className: "w-4 h-4" }),
                    href: pageData.subParent.route ? (() => {
                        try {
                            return route(pageData.subParent.route);
                        } catch {
                            return null;
                        }
                    })() : null,
                    key: 'subparent'
                });
                breadcrumbs.push({
                    label: pageData.page.name,
                    icon: React.cloneElement(pageData.page.icon, { className: "w-4 h-4" }),
                    href: null, // Current page
                    key: 'current'
                });
            } else if (pageData.parent) {
                // Two-level deep: Parent > Current
                breadcrumbs.push({
                    label: pageData.parent.name,
                    icon: React.cloneElement(pageData.parent.icon, { className: "w-4 h-4" }),
                    href: pageData.parent.route ? (() => {
                        try {
                            return route(pageData.parent.route);
                        } catch {
                            return null;
                        }
                    })() : null,
                    key: 'parent'
                });
                breadcrumbs.push({
                    label: pageData.page.name,
                    icon: React.cloneElement(pageData.page.icon, { className: "w-4 h-4" }),
                    href: null, // Current page
                    key: 'current'
                });
            } else {
                // Top-level page
                breadcrumbs.push({
                    label: pageData.name,
                    icon: React.cloneElement(pageData.icon, { className: "w-4 h-4" }),
                    href: null, // Current page
                    key: 'current'
                });
            }
        } else {
            // Fallback if page not found in data
            breadcrumbs.push({
                label: title || 'Current Page',
                icon: null,
                href: null,
                key: 'current'
            });
        }
        
        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    return (
        <div className="px-4 py-2">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-7xl "
            >
                <Breadcrumbs
                    separator="/"
                    classNames={{
                        list: "flex flex-wrap items-center gap-1.5",
                        separator: "text-[var(--theme-text-secondary,#6b7280)] mx-1.5 text-sm",
                        base: "w-full"
                    }}
                >
                    {breadcrumbs.map((breadcrumb) => (
                        <BreadcrumbItem
                            key={breadcrumb.key}
                            startContent={breadcrumb.icon}
                            className={`
                                text-sm font-medium transition-colors duration-200
                                ${breadcrumb.href 
                                    ? 'text-[var(--theme-text-secondary,#6b7280)] hover:text-[var(--theme-primary,#0070f3)] cursor-pointer' 
                                    : 'text-[var(--theme-text,#374151)] cursor-default'
                                }
                            `}
                        >
                            {breadcrumb.href ? (
                                <Link href={breadcrumb.href} className="hover:underline">
                                    {breadcrumb.label}
                                </Link>
                            ) : (
                                breadcrumb.label
                            )}
                        </BreadcrumbItem>
                    ))}
                </Breadcrumbs>
            </motion.div>
        </div>
    );
};

export default Breadcrumb;
