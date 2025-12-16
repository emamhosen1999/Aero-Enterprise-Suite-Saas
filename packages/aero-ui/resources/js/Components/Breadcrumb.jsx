import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from '@heroui/react';
import { HomeIcon } from '@heroicons/react/24/outline';
import * as OutlineIcons from '@heroicons/react/24/outline';
import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { getDashboardUrl } from '@/utils/moduleAccessUtils';

/**
 * Icon Resolver - converts string icon names to React components
 */
const getIcon = (icon) => {
    if (typeof icon === 'function' || typeof icon === 'object') {
        return icon;
    }
    if (typeof icon === 'string' && OutlineIcons[icon]) {
        return OutlineIcons[icon];
    }
    return null;
};

/**
 * Breadcrumb Component
 * Uses navigation from backend props (via Inertia shared props)
 */
const Breadcrumb = () => {
    const { props, url } = usePage();
    const { title, navigation } = props;
    
    // Navigation is a flat array of items from backend
    const pages = Array.isArray(navigation) ? navigation : [];
    
    // Function to find a page by path in flat structure
    const findPageByPath = (pages, currentPath) => {
        for (const page of pages) {
            if (page.path === currentPath) {
                return page;
            }
            // Check children if they exist
            if (page.children) {
                for (const child of page.children) {
                    if (child.path === currentPath) {
                        return { parent: page, page: child };
                    }
                    // Check nested children
                    if (child.children) {
                        for (const nested of child.children) {
                            if (nested.path === currentPath) {
                                return { parent: page, subParent: child, page: nested };
                            }
                        }
                    }
                }
            }
        }
        return null;
    };
    
    // Generate breadcrumb items based on current path
    const generateBreadcrumbs = () => {
        const breadcrumbs = [];
        
        // Always add Home breadcrumb first - use context-aware dashboard URL
        breadcrumbs.push({
            label: "Home",
            icon: <HomeIcon className="w-4 h-4" />,
            href: getDashboardUrl(),
            key: 'home'
        });
        
        // Find the current page in navigation
        const pageData = findPageByPath(pages, url);
        
        if (pageData) {
            if (pageData.parent && pageData.subParent) {
                // Three-level deep: Parent > SubParent > Current
                const ParentIcon = getIcon(pageData.parent.icon);
                const SubParentIcon = getIcon(pageData.subParent.icon);
                const PageIcon = getIcon(pageData.page.icon);
                
                breadcrumbs.push({
                    label: pageData.parent.name,
                    icon: ParentIcon ? <ParentIcon className="w-4 h-4" /> : null,
                    href: pageData.parent.path || null,
                    key: 'parent'
                });
                breadcrumbs.push({
                    label: pageData.subParent.name,
                    icon: SubParentIcon ? <SubParentIcon className="w-4 h-4" /> : null,
                    href: pageData.subParent.path || null,
                    key: 'subparent'
                });
                breadcrumbs.push({
                    label: pageData.page.name,
                    icon: PageIcon ? <PageIcon className="w-4 h-4" /> : null,
                    href: null, // Current page
                    key: 'current'
                });
            } else if (pageData.parent) {
                // Two-level deep: Parent > Current
                const ParentIcon = getIcon(pageData.parent.icon);
                const PageIcon = getIcon(pageData.page.icon);
                
                breadcrumbs.push({
                    label: pageData.parent.name,
                    icon: ParentIcon ? <ParentIcon className="w-4 h-4" /> : null,
                    href: pageData.parent.path || null,
                    key: 'parent'
                });
                breadcrumbs.push({
                    label: pageData.page.name,
                    icon: PageIcon ? <PageIcon className="w-4 h-4" /> : null,
                    href: null, // Current page
                    key: 'current'
                });
            } else {
                // Top-level page
                const PageIcon = getIcon(pageData.icon);
                
                breadcrumbs.push({
                    label: pageData.name,
                    icon: PageIcon ? <PageIcon className="w-4 h-4" /> : null,
                    href: null, // Current page
                    key: 'current'
                });
            }
        } else {
            // Fallback: use page title from props
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
                className="w-full max-w-7xl"
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
