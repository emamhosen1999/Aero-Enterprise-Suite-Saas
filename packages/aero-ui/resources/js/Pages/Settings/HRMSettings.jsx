import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Tabs,
    Tab,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Skeleton
} from '@heroui/react';
import { motion } from 'framer-motion';
import { Head, usePage } from "@inertiajs/react";
import App from "@/Layouts/App.jsx";
import { 
    PlusIcon, 
    UserIcon, 
    AcademicCapIcon, 
    CreditCardIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { showToast } from "@/utils/toastUtils";
import StatsCards from '@/Components/StatsCards.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const HRMSettings = ({ title, activeTab = 0 }) => {
    const [selectedTab, setSelectedTab] = useState(String(activeTab));
    const [loading, setLoading] = useState(false);
    
    // Get props from the page
    const { 
        onboardingSettings = { steps: [], checklists: [] }, 
        skillsSettings = { skills: [], competencies: [] },
        benefitsSettings = { benefits: [] },
        safetySettings = { trainings: [], incidentTypes: [] },
        documentSettings = { categories: [] }
    } = usePage().props;

    // Responsive breakpoints
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Theme radius helper
    const themeRadius = useThemeRadius();
// Stats data
    const statsData = [
        { 
            title: "Onboarding Steps", 
            value: onboardingSettings.steps?.length || 0, 
            icon: <UserIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Skills", 
            value: skillsSettings.skills?.length || 0, 
            icon: <AcademicCapIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Benefits", 
            value: benefitsSettings.benefits?.length || 0, 
            icon: <CreditCardIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Safety Trainings", 
            value: safetySettings.trainings?.length || 0, 
            icon: <ShieldCheckIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
    ];

    const tabItems = [
        { key: "0", title: "Onboarding", icon: <UserIcon className="w-4 h-4" /> },
        { key: "1", title: "Skills", icon: <AcademicCapIcon className="w-4 h-4" /> },
        { key: "2", title: "Benefits", icon: <CreditCardIcon className="w-4 h-4" /> },
        { key: "3", title: "Safety", icon: <ShieldCheckIcon className="w-4 h-4" /> },
        { key: "4", title: "Documents", icon: <DocumentTextIcon className="w-4 h-4" /> },
    ];

    const renderSettingsCard = (title, description, items, columns) => (
        <Card className="mb-4">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex justify-between items-center w-full">
                    <div>
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <p className="text-sm text-default-500">{description}</p>
                    </div>
                    <Button 
                        color="primary" 
                        size="sm"
                        startContent={<PlusIcon className="w-4 h-4" />}
                    >
                        Add New
                    </Button>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {items?.length > 0 ? (
                    <Table aria-label={title} classNames={{
                        wrapper: "shadow-none border border-divider rounded-lg",
                    }}>
                        <TableHeader>
                            {columns.map((col) => (
                                <TableColumn key={col.key}>{col.label}</TableColumn>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {items.map((item, idx) => (
                                <TableRow key={item.id || idx}>
                                    {columns.map((col) => (
                                        <TableCell key={col.key}>
                                            {item[col.key] || '-'}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-8 text-default-400">
                        <p>No items configured yet.</p>
                        <p className="text-sm mt-2">Click "Add New" to get started.</p>
                    </div>
                )}
            </CardBody>
        </Card>
    );

    return (
        <>
            <Head title={title || "HR Module Settings"} />
            
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="HRM Settings">
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
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <Cog6ToothIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        HR Module Settings
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Configure onboarding, skills, benefits, safety, and document settings
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
                                    {/* Tabs */}
                                    <Tabs 
                                        aria-label="HR Settings Tabs"
                                        selectedKey={selectedTab}
                                        onSelectionChange={(key) => setSelectedTab(String(key))}
                                        color="primary"
                                        variant="underlined"
                                        classNames={{
                                            tabList: "gap-6 w-full border-b border-divider",
                                            cursor: "w-full bg-primary",
                                            tab: "max-w-fit px-0 h-12",
                                        }}
                                    >
                                        {tabItems.map((tab) => (
                                            <Tab 
                                                key={tab.key} 
                                                title={
                                                    <div className="flex items-center gap-2">
                                                        {tab.icon}
                                                        <span>{tab.title}</span>
                                                    </div>
                                                }
                                            />
                                        ))}
                                    </Tabs>
                                    
                                    {/* Tab Content */}
                                    <div className="mt-6">
                                        {/* Onboarding Tab */}
                                        {selectedTab === "0" && (
                                            <div className="space-y-4">
                                                {renderSettingsCard(
                                                    "Onboarding Steps",
                                                    "Configure the employee onboarding workflow steps",
                                                    onboardingSettings.steps,
                                                    [
                                                        { key: "name", label: "Step Name" },
                                                        { key: "order", label: "Order" },
                                                        { key: "description", label: "Description" },
                                                    ]
                                                )}
                                                {renderSettingsCard(
                                                    "Onboarding Checklists",
                                                    "Configure checklists for new employees",
                                                    onboardingSettings.checklists,
                                                    [
                                                        { key: "name", label: "Checklist Name" },
                                                        { key: "items_count", label: "Items" },
                                                    ]
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Skills Tab */}
                                        {selectedTab === "1" && (
                                            <div className="space-y-4">
                                                {renderSettingsCard(
                                                    "Skills",
                                                    "Define and manage skills categories",
                                                    skillsSettings.skills,
                                                    [
                                                        { key: "name", label: "Skill Name" },
                                                        { key: "category", label: "Category" },
                                                    ]
                                                )}
                                                {renderSettingsCard(
                                                    "Competencies",
                                                    "Configure competency frameworks",
                                                    skillsSettings.competencies,
                                                    [
                                                        { key: "name", label: "Competency Name" },
                                                        { key: "level", label: "Level" },
                                                    ]
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Benefits Tab */}
                                        {selectedTab === "2" && (
                                            <div className="space-y-4">
                                                {renderSettingsCard(
                                                    "Benefits",
                                                    "Configure employee benefits packages",
                                                    benefitsSettings.benefits,
                                                    [
                                                        { key: "name", label: "Benefit Name" },
                                                        { key: "type", label: "Type" },
                                                        { key: "description", label: "Description" },
                                                    ]
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Safety Tab */}
                                        {selectedTab === "3" && (
                                            <div className="space-y-4">
                                                {renderSettingsCard(
                                                    "Safety Trainings",
                                                    "Configure safety training requirements",
                                                    safetySettings.trainings,
                                                    [
                                                        { key: "name", label: "Training Name" },
                                                        { key: "duration", label: "Duration" },
                                                        { key: "frequency", label: "Frequency" },
                                                    ]
                                                )}
                                                {renderSettingsCard(
                                                    "Incident Types",
                                                    "Configure incident categories",
                                                    safetySettings.incidentTypes,
                                                    [
                                                        { key: "type", label: "Incident Type" },
                                                    ]
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Documents Tab */}
                                        {selectedTab === "4" && (
                                            <div className="space-y-4">
                                                {renderSettingsCard(
                                                    "Document Categories",
                                                    "Configure document categories and templates",
                                                    documentSettings.categories,
                                                    [
                                                        { key: "name", label: "Category Name" },
                                                        { key: "description", label: "Description" },
                                                    ]
                                                )}
                                            </div>
                                        )}
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

HRMSettings.layout = (page) => <App>{page}</App>;
export default HRMSettings;
