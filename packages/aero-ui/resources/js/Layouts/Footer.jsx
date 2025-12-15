import React from 'react';
import { Button, Divider } from "@heroui/react";
import { Link, usePage, router } from '@inertiajs/react';
import { 
  HeartIcon, 
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon 
} from '@heroicons/react/24/outline';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import { useTheme } from '@/Context/ThemeContext.jsx';
import { useBranding } from '@/Hooks/useBranding';
import { Card } from '@heroui/react';
import { publicNavLinks, footerColumns } from '@/Config/publicNavigation';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const isMobile = useMediaQuery('(max-width: 640px)');
    const isTablet = useMediaQuery('(max-width: 768px)');
    const { theme } = useTheme();
    const { url, platform } = usePage().props;
    const activePage = url;
    
    // Get domain-aware branding
    const { logo, siteName, isTenantContext, settings } = useBranding();
    
    // Get modules from platform settings (for platform/public) or system settings (for tenant)
    const availableModules = platform?.modules || [];
    
    // Get contact info from settings
    const supportEmail = settings?.site?.support_email || settings?.organization?.support_email || 'support@aero-enterprise.com';
    const supportPhone = settings?.site?.support_phone || settings?.organization?.support_phone || '+1 (555) 123-4567';
    const website = settings?.site?.marketing_url || settings?.organization?.website_url || 'www.aero-enterprise.com';

    // Generate quick links based on context
    const quickLinks = isTenantContext ? [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Employees', href: '/employees' },
        { label: 'Attendance', href: '/attendances' },
        { label: 'Leaves', href: '/leaves' },
        { label: 'Timesheet', href: '/timesheet' },
        { label: 'Users', href: '/users' },
        { label: 'Reports', href: '/reports' },
        { label: 'Settings', href: '/settings' }
    ] : publicNavLinks.map(link => ({
        label: link.label,
        routeName: link.routeName
    }));

    const contactInfo = [
        { 
            icon: EnvelopeIcon, 
            label: 'Email', 
            value: supportEmail,
            href: `mailto:${supportEmail}`
        },
        { 
            icon: PhoneIcon, 
            label: 'Phone', 
            value: supportPhone,
            href: `tel:${supportPhone.replace(/\D/g, '')}`
        },
        { 
            icon: GlobeAltIcon, 
            label: 'Website', 
            value: website.replace(/^https?:\/\//, ''),
            href: website.startsWith('http') ? website : `https://${website}`
        }
    ];

    return (
        <footer 
            role="contentinfo"
            className="py-12 md:py-16 mt-auto border-t border-divider"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Card className="shadow-lg overflow-hidden">
                    <div className="p-12 md:p-16">
                        {/* Main Footer Content */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
                            {/* Brand Section */}
                            <div className="md:col-span-1">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        {logo ? (
                                            <img 
                                                src={logo} 
                                                alt={siteName}
                                                className="h-12 w-auto object-contain"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-600 to-purple-600">
                                                <span 
                                                    className="font-bold text-white text-xl"
                                                    style={{ fontFamily: 'Inter, sans-serif' }}
                                                >
                                                    {siteName ? siteName.charAt(0) : 'A'}
                                                </span>
                                            </div>
                                        )}
                                        <div className="h-12 w-px bg-default-300 mx-2" />
                                        <div>
                                            <h3 className="font-bold text-xl text-foreground">
                                                {siteName}
                                            </h3>
                                            <p className="text-default-500 text-sm">
                                                Enterprise Solution
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-default-500 leading-relaxed mt-3 text-sm">
                                        {isTenantContext 
                                            ? `Comprehensive enterprise resource planning system for ${siteName}. Streamline operations, manage resources, and boost productivity.`
                                            : `Advanced cloud-based platform designed for modern enterprises. Streamline operations with comprehensive modules for HR, project management, and more.`
                                        }
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-default-500 mt-4">
                                        <span>Crafted with</span>
                                        <HeartIcon className="w-4 h-4 text-red-500 animate-pulse" />
                                        <span>by the Aero Team</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className="md:col-span-1">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-foreground text-lg">
                                        Quick Links
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {quickLinks.map((link, index) => {
                                            const linkHref = link.routeName ? route(link.routeName) : link.href;
                                            const isActive = link.routeName ? route().current(link.routeName) : activePage === link.href;
                                            return (
                                                <Link
                                                    key={index}
                                                    href={linkHref}
                                                    
                                                    className="text-sm transition-all duration-200 p-2 rounded-lg"
                                                    style={isActive ? {
                                                        backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`,
                                                        border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
                                                        borderRadius: `var(--borderRadius, 8px)`,
                                                        color: `#FFFFFF`
                                                    } : {
                                                        border: `var(--borderWidth, 2px) solid transparent`,
                                                        borderRadius: `var(--borderRadius, 8px)`,
                                                        color: `var(--theme-foreground, #11181C)`
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isActive) {
                                                            e.target.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`;
                                                            e.target.style.color = `var(--theme-primary, #006FEE)`;
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isActive) {
                                                            e.target.style.border = `var(--borderWidth, 2px) solid transparent`;
                                                            e.target.style.color = `var(--theme-foreground, #11181C)`;
                                                        }
                                                    }}
                                                >
                                                    {link.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="md:col-span-1">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-foreground text-lg">
                                        Contact Info
                                    </h4>
                                    <div className="space-y-3">
                                        {contactInfo.map((contact, index) => {
                                            const IconComponent = contact.icon;
                                            return (
                                                <a
                                                    key={index}
                                                    href={contact.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 text-sm transition-all duration-200 p-2 rounded-lg"
                                                    style={{
                                                        border: `var(--borderWidth, 2px) solid transparent`,
                                                        borderRadius: `var(--borderRadius, 8px)`,
                                                        color: `var(--theme-foreground, #11181C)`
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`;
                                                        e.currentTarget.style.color = `var(--theme-primary, #006FEE)`;
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.border = `var(--borderWidth, 2px) solid transparent`;
                                                        e.currentTarget.style.color = `var(--theme-foreground, #11181C)`;
                                                    }}
                                                >
                                                    <div 
                                                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                                                        style={{
                                                            backgroundColor: `var(--theme-content1, #FAFAFA)`,
                                                            borderRadius: `var(--borderRadius, 8px)`
                                                        }}
                                                    >
                                                        <IconComponent 
                                                            className="w-4 h-4" 
                                                            style={{ color: `var(--theme-foreground, #11181C)` }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{contact.label}</div>
                                                        <div 
                                                            className="text-xs"
                                                            style={{ color: `var(--theme-foreground-500, #71717A)` }}
                                                        >
                                                            {contact.value}
                                                        </div>
                                                    </div>
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Columns - Only for Public Pages */}
                        {!isTenantContext && (
                            <>
                                <Divider className="my-8 bg-white/20" />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                    {footerColumns.map((column, index) => (
                                        <div key={index}>
                                            <h4 className="font-semibold text-foreground mb-4 text-sm">
                                                {column.heading}
                                            </h4>
                                            <ul className="space-y-2">
                                                {column.links.map((link) => (
                                                    <li key={link.label}>
                                                        <Link
                                                            href={route(link.routeName)}
                                                            className="text-sm text-default-500 hover:text-primary transition-colors duration-200"
                                                        >
                                                            {link.label}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <Divider className="my-6 bg-white/20" />

                        {/* Bottom Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="md:col-span-1">
                                <p className="text-default-500 text-center md:text-left text-sm">
                                    &copy; {currentYear} {siteName}. All rights reserved.
                                </p>
                            </div>
                            <div className="md:col-span-1">
                                <div className="flex justify-center md:justify-end gap-4">
                                    <Link
                                        href={route('legal.privacy')}
                                        
                                        className="text-sm hover:text-primary transition-colors duration-200"
                                    >
                                        Privacy Policy
                                    </Link>
                                    <Link
                                        href={route('legal.terms')}
                                        
                                        className="text-sm hover:text-primary transition-colors duration-200"
                                    >
                                        Terms of Service
                                    </Link>
                                    <Link
                                        href={route('support')}
                                        
                                        className="text-sm hover:text-primary transition-colors duration-200"
                                    >
                                        Support
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </footer>
    );
};

export default Footer;
