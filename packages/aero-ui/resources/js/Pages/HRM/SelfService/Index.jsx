import React, { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader } from "@heroui/react";
import {
    UserIcon,
    DocumentTextIcon,
    BanknotesIcon,
    CalendarDaysIcon,
    AcademicCapIcon,
    ChartBarIcon,
    HeartIcon,
    MapPinIcon,
    ClipboardDocumentListIcon,
    IdentificationIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const PORTAL_SECTIONS = [
    {
        key: 'profile',
        label: 'My Profile',
        description: 'View and update your personal information',
        icon: UserIcon,
        color: 'text-primary',
        iconBg: 'bg-primary/10',
        route: 'hrm.selfservice.profile',
    },
    {
        key: 'personal-information',
        label: 'Personal Information',
        description: 'Update name, contact details & emergency contacts',
        icon: IdentificationIcon,
        color: 'text-secondary',
        iconBg: 'bg-secondary/10',
        route: 'hrm.selfservice.personal-information',
    },
    {
        key: 'bank-information',
        label: 'Bank Information',
        description: 'Manage your bank account details for payroll',
        icon: BanknotesIcon,
        color: 'text-success',
        iconBg: 'bg-success/10',
        route: 'hrm.selfservice.bank-information',
    },
    {
        key: 'payslips',
        label: 'My Payslips',
        description: 'View and download your payslips',
        icon: ClipboardDocumentListIcon,
        color: 'text-warning',
        iconBg: 'bg-warning/10',
        route: 'hrm.selfservice.payslips',
    },
    {
        key: 'time-off',
        label: 'Time Off',
        description: 'Request and track your leave',
        icon: CalendarDaysIcon,
        color: 'text-danger',
        iconBg: 'bg-danger/10',
        route: 'hrm.selfservice.timeoff',
    },
    {
        key: 'documents',
        label: 'My Documents',
        description: 'View your personal HR documents',
        icon: DocumentTextIcon,
        color: 'text-primary',
        iconBg: 'bg-primary/10',
        route: 'hrm.selfservice.documents',
    },
    {
        key: 'trainings',
        label: 'My Trainings',
        description: 'Track your training and development courses',
        icon: AcademicCapIcon,
        color: 'text-secondary',
        iconBg: 'bg-secondary/10',
        route: 'hrm.selfservice.trainings',
    },
    {
        key: 'performance',
        label: 'My Performance',
        description: 'View your performance reviews and goals',
        icon: ChartBarIcon,
        color: 'text-success',
        iconBg: 'bg-success/10',
        route: 'hrm.selfservice.performance',
    },
    {
        key: 'benefits',
        label: 'My Benefits',
        description: 'View and enroll in company benefits',
        icon: HeartIcon,
        color: 'text-danger',
        iconBg: 'bg-danger/10',
        route: 'hrm.selfservice.benefits',
    },
    {
        key: 'career-path',
        label: 'Career Path',
        description: 'Explore your career progression and opportunities',
        icon: MapPinIcon,
        color: 'text-warning',
        iconBg: 'bg-warning/10',
        route: 'hrm.selfservice.careerpath',
    },
];

const Index = ({ title, user }) => {
    const themeRadius = useThemeRadius();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    return (
        <>
            <Head title={title || 'Employee Self-Service Portal'} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Self-Service Portal">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
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
                                <CardHeader
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg,
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%,
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <div
                                                className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                style={{
                                                    background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}
                                            >
                                                <UserIcon
                                                    className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                    style={{ color: 'var(--theme-primary)' }}
                                                />
                                            </div>
                                            <div>
                                                <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                    Employee Self-Service Portal
                                                </h4>
                                                <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                    {user?.name ? `Welcome back, ${user.name}` : 'Manage your HR information in one place'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {PORTAL_SECTIONS.map((section, idx) => {
                                            const Icon = section.icon;
                                            return (
                                                <motion.div
                                                    key={section.key}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                                                >
                                                    <Link href={route(section.route)}>
                                                        <Card
                                                            isPressable
                                                            className="h-full transition-all duration-200 hover:shadow-md"
                                                            style={{
                                                                borderRadius: `var(--borderRadius, 12px)`,
                                                                background: `var(--theme-content1, #FAFAFA)`,
                                                            }}
                                                        >
                                                            <CardBody className="p-4 flex flex-col gap-3">
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${section.iconBg}`}>
                                                                    <Icon className={`w-5 h-5 ${section.color}`} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-sm">{section.label}</p>
                                                                    <p className="text-xs text-default-400 mt-1">{section.description}</p>
                                                                </div>
                                                            </CardBody>
                                                        </Card>
                                                    </Link>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

Index.layout = (page) => <App children={page} />;
export default Index;
