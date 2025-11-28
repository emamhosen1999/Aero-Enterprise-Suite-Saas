import React from 'react';
import { Button, Divider, Link } from "@heroui/react";
import { usePage } from '@inertiajs/react';
import { 
  HeartIcon, 
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon 
} from '@heroicons/react/24/outline';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import { useTheme } from '@/Contexts/ThemeContext.jsx';
import GlassCard from '@/Components/GlassCard.jsx';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const isMobile = useMediaQuery('(max-width: 640px)');
    const isTablet = useMediaQuery('(max-width: 768px)');
    const { theme } = useTheme();
    const { url } = usePage();
    const activePage = url;

    const quickLinks = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Employees', href: '/employees' },
        { label: 'Attendance', href: '/attendance-admin' },
        { label: 'Leave Management', href: '/leaves-admin' },
        { label: 'Timesheets', href: '/time-sheet' },
        { label: 'User Management', href: '/users' },
        { label: 'Reports', href: '/reports' },
        { label: 'Settings', href: '/settings' }
    ];

    const contactInfo = [
        { 
            icon: EnvelopeIcon, 
            label: 'Email', 
            value: 'support@aero-hr.com',
            href: 'mailto:support@aero-hr.com'
        },
        { 
            icon: PhoneIcon, 
            label: 'Phone', 
            value: '+1 (555) 123-4567',
            href: 'tel:+15551234567'
        },
        { 
            icon: GlobeAltIcon, 
            label: 'Website', 
            value: 'www.aero-hr.com',
            href: 'https://www.aero-hr.com'
        }
    ];

    return (
        <footer 
            role="contentinfo"
            className="py-12 md:py-16 mt-auto border-t border-divider"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <GlassCard className="overflow-hidden">
                    <div className="p-12 md:p-16">
                        {/* Main Footer Content */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
                            {/* Brand Section */}
                            <div className="md:col-span-1">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${GRADIENT_PRESETS.iconContainer}`}>
                                            <span 
                                                className="font-bold text-white text-xl"
                                                style={{ fontFamily: 'Inter, sans-serif' }}
                                            >
                                                A
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-xl ${GRADIENT_PRESETS.gradientText}`}>
                                                aeos365
                                            </h3>
                                            <p className="text-default-500 text-sm">
                                                Enterprise Solution
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-default-500 leading-relaxed mt-3 text-sm">
                                        Advanced Human Resource Management system designed for modern enterprises. 
                                        Streamline your HR operations with our comprehensive, cloud-based solution 
                                        featuring employee management, attendance tracking, leave management, and more.
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
                                            const isActive = activePage === link.href;
                                            return (
                                                <Link
                                                    key={index}
                                                    href={link.href}
                                                    className="text-sm transition-all duration-200 p-2 rounded-lg"
                                                    underline="hover"
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
                                                <Link
                                                    key={index}
                                                    href={contact.href}
                                                    className="flex items-center gap-3 text-sm transition-all duration-200 p-2 rounded-lg"
                                                    underline="none"
                                                    style={{
                                                        border: `var(--borderWidth, 2px) solid transparent`,
                                                        borderRadius: `var(--borderRadius, 8px)`,
                                                        color: `var(--theme-foreground, #11181C)`
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`;
                                                        e.target.style.color = `var(--theme-primary, #006FEE)`;
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.border = `var(--borderWidth, 2px) solid transparent`;
                                                        e.target.style.color = `var(--theme-foreground, #11181C)`;
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
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Divider className="my-6 bg-white/20" />

                        {/* Bottom Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="md:col-span-1">
                                <p className="text-default-500 text-center md:text-left text-sm">
                                    &copy; {currentYear} Aero HR Enterprise Solution. All rights reserved.
                                </p>
                            </div>
                            <div className="md:col-span-1">
                                <div className="flex justify-center md:justify-end gap-4">
                                    <Link
                                        href="/privacy"
                                        color="foreground"
                                        className="text-sm hover:text-primary transition-colors duration-200"
                                        underline="hover"
                                    >
                                        Privacy Policy
                                    </Link>
                                    <Link
                                        href="/terms"
                                        color="foreground"
                                        className="text-sm hover:text-primary transition-colors duration-200"
                                        underline="hover"
                                    >
                                        Terms of Service
                                    </Link>
                                    <Link
                                        href="/support"
                                        color="foreground"
                                        className="text-sm hover:text-primary transition-colors duration-200"
                                        underline="hover"
                                    >
                                        Support
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </footer>
    );
};

export default Footer;
