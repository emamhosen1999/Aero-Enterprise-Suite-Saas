import React from 'react';
import {
    HomeIcon,
    BuildingOfficeIcon,
    ClockIcon,
    PhotoIcon,
    KeyIcon,
    AtSymbolIcon,
    ChartBarIcon,
    HandThumbUpIcon,
    PencilIcon,
    CurrencyDollarIcon,
    BellIcon,
    LockClosedIcon,
    WrenchScrewdriverIcon,
    ChatBubbleLeftRightIcon,
    RocketLaunchIcon,
    UserGroupIcon,
    ShieldCheckIcon,
    DocumentChartBarIcon,
    Cog8ToothIcon,
    ShoppingBagIcon,
    CreditCardIcon,
    UserIcon,
    ShoppingCartIcon,
    ArchiveBoxIcon,
    AcademicCapIcon,
    TruckIcon,
    TicketIcon,
    BeakerIcon,
    ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { Squares2X2Icon } from '@heroicons/react/24/outline';

// Function to create settings pages array with enhanced organization aligned with ISO standards
export const getSettingsPages = (permissions = []) => {
    const settings = [];
    // 1. Navigation
    if (permissions.includes('core.dashboard.view')) {
        settings.push({
            name: 'Return to Dashboard', 
            icon: <Squares2X2Icon className="w-5 h-5" />, 
            route: 'dashboard',
            category: 'navigation',
            priority: 1
        });
    }
    // 2. Organization
    if (permissions.includes('company.settings')) {
        settings.push({
            name: 'Organization', 
            icon: <BuildingOfficeIcon className="w-5 h-5" />, 
            route: 'admin.settings.company',
            category: 'organization',
            priority: 2,
            description: 'Configure organizational structure, company information, and brand assets'
        });
    }
    if (permissions.includes('attendance.settings')) {
        settings.push({
            name: 'Time & Attendance', 
            icon: <ClockIcon className="w-5 h-5" />, 
            route: 'attendance-settings.index',
            category: 'organization',
            priority: 3,
            description: 'Configure attendance tracking and workforce management'
        });
    }
    if (permissions.includes('leave-settings.view')) {
        settings.push({
            name: 'Leave Policy', 
            icon: <HandThumbUpIcon className="w-5 h-5" />, 
            route: 'leave-settings',
            category: 'organization',
            priority: 4,
            description: 'Manage leave types and approval workflows'
        });
    }
    // 3. Security
    if (permissions.includes('roles.view')) {
        settings.push({
            name: 'Roles & Permission', 
            icon: <KeyIcon className="w-5 h-5" />, 
            route: 'admin.roles-management',
            category: 'security',
            priority: 5,
            description: 'Manage user roles and permission system'
        });
    }
    
    
    // // HR Module Settings
    // if (permissions.includes('performance-templates.view')) {
    //     settings.push({
    //         name: 'Performance Review Configuration', 
    //         icon: <ChartBarIcon className="w-5 h-5" />, 
    //         route: 'hr.performance.templates.index',
    //         category: 'organization',
    //         priority: 7,
    //         description: 'Manage performance review templates and evaluation criteria'
    //     });
    // }
    // if (permissions.includes('training-categories.view')) {
    //     settings.push({
    //         name: 'Training Program Configuration', 
    //         icon: <AcademicCapIcon className="w-5 h-5" />, 
    //         route: 'hr.training.categories.index',
    //         category: 'organization',
    //         priority: 8,
    //         description: 'Configure training categories and learning programs'
    //     });
    // }
    // if (permissions.includes('job-hiring-stages.view')) {
    //     settings.push({
    //         name: 'Recruitment Pipeline Configuration', 
    //         icon: <UserIcon className="w-5 h-5" />, 
    //         route: 'hr.recruitment.stages.index',
    //         category: 'organization',
    //         priority: 9,
    //         description: 'Configure hiring stages and recruitment workflow'
    //     });
    // }
    // // Additional HR Settings
    // if (permissions.includes('hr.onboarding.view')) {
    //     settings.push({
    //         name: 'Onboarding & Offboarding Configuration', 
    //         icon: <UserGroupIcon className="w-5 h-5" />, 
    //         route: 'settings.hr.onboarding',
    //         category: 'organization',
    //         priority: 9.1,
    //         description: 'Configure onboarding and offboarding processes and templates'
    //     });
    // }
    // if (permissions.includes('hr.skills.view')) {
    //     settings.push({
    //         name: 'Skills & Competencies Configuration', 
    //         icon: <AcademicCapIcon className="w-5 h-5" />, 
    //         route: 'settings.hr.skills',
    //         category: 'organization',
    //         priority: 9.2,
    //         description: 'Manage skill categories and competency frameworks'
    //     });
    // }
    // if (permissions.includes('hr.benefits.view')) {
    //     settings.push({
    //         name: 'Employee Benefits Configuration', 
    //         icon: <CreditCardIcon className="w-5 h-5" />, 
    //         route: 'settings.hr.benefits',
    //         category: 'organization',
    //         priority: 9.3,
    //         description: 'Configure employee benefits packages and eligibility rules'
    //     });
    // }
    // if (permissions.includes('hr.safety.view')) {
    //     settings.push({
    //         name: 'Workplace Safety Configuration', 
    //         icon: <ShieldCheckIcon className="w-5 h-5" />, 
    //         route: 'settings.hr.safety',
    //         category: 'organization',
    //         priority: 9.4,
    //         description: 'Configure safety protocols, incident reporting, and training requirements'
    //     });
    // }
    // if (permissions.includes('hr.documents.view')) {
    //     settings.push({
    //         name: 'HR Document Management', 
    //         icon: <DocumentChartBarIcon className="w-5 h-5" />, 
    //         route: 'settings.hr.documents',
    //         category: 'organization',
    //         priority: 9.5,
    //         description: 'Configure document categories, templates, and retention policies'
    //     });
    // }
    // // Add Payroll Configuration
    // if (permissions.includes('hr.payroll.view')) {
    //     settings.push({
    //         name: 'Payroll & Compensation Configuration', 
    //         icon: <CurrencyDollarIcon className="w-5 h-5" />, 
    //         route: 'settings.hr.payroll',
    //         category: 'organization',
    //         priority: 9.6,
    //         description: 'Configure payroll structures, tax settings, and benefits deductions'
    //     });
    // }
    // // Add HR Analytics Configuration
    // if (permissions.includes('hr.analytics.view')) {
    //     settings.push({
    //         name: 'HR Analytics Configuration', 
    //         icon: <ChartBarIcon className="w-5 h-5" />, 
    //         route: 'settings.hr.analytics',
    //         category: 'organization',
    //         priority: 9.7,
    //         description: 'Configure HR metrics, dashboards, and reporting parameters'
    //     });
    // }
    // // 4. CRM Settings
    // if (permissions.includes('crm.settings')) {
    //     settings.push({
    //         name: 'Customer Relationship Management', 
    //         icon: <UserIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.crm',
    //         category: 'business-process',
    //         priority: 10,
    //         description: 'Configure customer management and sales pipeline settings'
    //     });
    // }

    // // 5. Financial Settings
    // if (permissions.includes('fms.settings')) {
    //     settings.push({
    //         name: 'Financial Management System', 
    //         icon: <CurrencyDollarIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.finance',
    //         category: 'business-process',
    //         priority: 11,
    //         description: 'Configure financial accounts, categories, and reporting'
    //     });
    // }

    // // 6. POS Settings
    // if (permissions.includes('pos.settings')) {
    //     settings.push({
    //         name: 'Point of Sale Configuration', 
    //         icon: <ShoppingCartIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.pos',
    //         category: 'business-process',
    //         priority: 12,
    //         description: 'Configure registers, receipts, and payment methods'
    //     });
    // }

    // // 7. Inventory Settings
    // if (permissions.includes('warehousing.manage')) {
    //     settings.push({
    //         name: 'Inventory Management System', 
    //         icon: <ArchiveBoxIcon className="w-5 h-5" />, 
    //         route: 'ims.settings',
    //         category: 'business-process',
    //         priority: 13,
    //         description: 'Configure inventory categories, locations, and units'
    //     });
    // }

    // // 8. Learning Settings
    // if (permissions.includes('lms.settings.manage')) {
    //     settings.push({
    //         name: 'Learning Management System', 
    //         icon: <AcademicCapIcon className="w-5 h-5" />, 
    //         route: 'lms.settings',
    //         category: 'business-process',
    //         priority: 14,
    //         description: 'Configure course categories, assessments, and certificates'
    //     });
    // }

    // // 9. Supply Chain Settings
    // if (permissions.includes('scm.settings')) {
    //     settings.push({
    //         name: 'Supply Chain Management', 
    //         icon: <TruckIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.supply-chain',
    //         category: 'business-process',
    //         priority: 15,
    //         description: 'Configure supplier categories, purchase workflows, and logistics'
    //     });
    // }

    // // 10. Sales Settings
    // if (permissions.includes('sales.settings')) {
    //     settings.push({
    //         name: 'Sales & Retail Configuration', 
    //         icon: <ShoppingBagIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.sales',
    //         category: 'business-process',
    //         priority: 16,
    //         description: 'Configure sales channels, quotations, and order processing'
    //     });
    // }

    // // 11. Helpdesk Settings
    // if (permissions.includes('helpdesk.settings')) {
    //     settings.push({
    //         name: 'Helpdesk Configuration', 
    //         icon: <TicketIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.helpdesk',
    //         category: 'services',
    //         priority: 17,
    //         description: 'Configure ticket categories, SLAs, and support workflows'
    //     });
    // }

    // // 12. Asset Management Settings
    // if (permissions.includes('assets.settings')) {
    //     settings.push({
    //         name: 'Asset Management Configuration', 
    //         icon: <ComputerDesktopIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.assets',
    //         category: 'services',
    //         priority: 18,
    //         description: 'Configure asset categories, depreciation, and maintenance schedules'
    //     });
    // }

    // // 13. Procurement Settings
    // if (permissions.includes('procurement.settings')) {
    //     settings.push({
    //         name: 'Procurement Management', 
    //         icon: <ShoppingBagIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.procurement',
    //         category: 'business-process',
    //         priority: 19,
    //         description: 'Configure procurement policies, approval workflows, and vendor ratings'
    //     });
    // }

    // // 14. Compliance Settings
    // if (permissions.includes('compliance.settings')) {
    //     settings.push({
    //         name: 'Compliance Management System', 
    //         icon: <ShieldCheckIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.compliance',
    //         category: 'security',
    //         priority: 20,
    //         description: 'Configure compliance documents, audit workflows, and reporting'
    //     });
    // }

    // // 15. Quality Management Settings
    // if (permissions.includes('quality.settings')) {
    //     settings.push({
    //         name: 'Quality Management System', 
    //         icon: <BeakerIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.quality',
    //         category: 'business-process',
    //         priority: 21,
    //         description: 'Configure inspection workflows, quality standards, and reporting'
    //     });
    // }

    // // 16. Analytics Settings
    // if (permissions.includes('analytics.settings')) {
    //     settings.push({
    //         name: 'Analytics & Reporting System', 
    //         icon: <ChartBarIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.analytics',
    //         category: 'system-administration',
    //         priority: 22,
    //         description: 'Configure KPIs, dashboards, and data sources'
    //     });
    // }

    // if (permissions.includes('audit.view')) {
    //     settings.push({
    //         name: 'Security Audit & Compliance', 
    //         icon: <ShieldCheckIcon className="w-5 h-5" />, 
    //         route: 'admin.audit.index',
    //         category: 'security',
    //         priority: 7,
    //         description: 'View audit trails and compliance reports'
    //     });
    // }
    // // 4. Services
    // if (permissions.includes('email.settings')) {
    //     settings.push({
    //         name: 'Communication Services', 
    //         icon: <AtSymbolIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.email',
    //         category: 'services',
    //         priority: 8,
    //         description: 'Configure email templates and communication services'
    //     });
    // }
    // if (permissions.includes('notification.settings')) {
    //     settings.push({
    //         name: 'Notification Management', 
    //         icon: <BellIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.notifications',
    //         category: 'services',
    //         priority: 9,
    //         description: 'Manage notification preferences and delivery channels'
    //     });
    // }
    // if (permissions.includes('settings.view')) {
    //     settings.push({
    //         name: 'Internal Messaging System', 
    //         icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.toxbox',
    //         category: 'services',
    //         priority: 10,
    //         description: 'Configure internal communication and messaging'
    //     });
    // }
    // // 5. Interface
    // if (permissions.includes('theme.settings')) {
    //     settings.push({
    //         name: 'User Interface & Branding', 
    //         icon: <PhotoIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.theme',
    //         category: 'interface',
    //         priority: 11,
    //         description: 'Customize application appearance and corporate branding'
    //     });
    // }
    // if (permissions.includes('localization.settings')) {
    //     settings.push({
    //         name: 'Regional & Localization Settings', 
    //         icon: <ClockIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.localization',
    //         category: 'interface',
    //         priority: 12,
    //         description: 'Configure language, timezone, and regional preferences'
    //     });
    // }
    // // 6. Business Process
    // if (permissions.includes('performance.settings')) {
    //     settings.push({
    //         name: 'Performance Management Configuration', 
    //         icon: <ChartBarIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.performance',
    //         category: 'business-process',
    //         priority: 13,
    //         description: 'Configure performance evaluation and review processes'
    //     });
    // }
    // if (permissions.includes('approval.settings')) {
    //     settings.push({
    //         name: 'Workflow & Approval Management', 
    //         icon: <HandThumbUpIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.approval',
    //         category: 'business-process',
    //         priority: 14,
    //         description: 'Manage approval workflows and business processes'
    //     });
    // }
    // if (permissions.includes('invoice.settings')) {
    //     settings.push({
    //         name: 'Financial Process Configuration', 
    //         icon: <PencilIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.invoice',
    //         category: 'business-process',
    //         priority: 15,
    //         description: 'Configure invoicing and financial processes'
    //     });
    // }
    // if (permissions.includes('salary.settings')) {
    //     settings.push({
    //         name: 'Compensation & Benefits Management', 
    //         icon: <CurrencyDollarIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.salary',
    //         category: 'business-process',
    //         priority: 16,
    //         description: 'Manage payroll and compensation structures'
    //     });
    // }
    // // 7. System Administration
    // if (permissions.includes('system.settings')) {
    //     settings.push({
    //         name: 'System Architecture Configuration', 
    //         icon: <Cog8ToothIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.system',
    //         category: 'system-administration',
    //         priority: 17,
    //         description: 'Advanced system configuration and maintenance'
    //     });
    // }
    // if (permissions.includes('leave-settings.view')) {
    //     settings.push({
    //         name: 'Policy Framework Management', 
    //         icon: <WrenchScrewdriverIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.leave-types',
    //         category: 'system-administration',
    //         priority: 18,
    //         description: 'Define and manage organizational policies'
    //     });
    // }
    // if (permissions.includes('system.settings')) {
    //     settings.push({
    //         name: 'Automated Process Management', 
    //         icon: <RocketLaunchIcon className="w-5 h-5" />, 
    //         route: 'admin.settings.cron',
    //         category: 'system-administration',
    //         priority: 19,
    //         description: 'Configure automated tasks and scheduled operations'
    //     });
    // }
    // // 8. Personal Security
    // settings.push({
    //     name: 'Personal Security Settings', 
    //     icon: <LockClosedIcon className="w-5 h-5" />, 
    //     route: 'profile.password',
    //     category: 'personal-security',
    //     priority: 20,
    //     description: 'Update personal password and security preferences'
    // });
    return settings.sort((a, b) => a.priority - b.priority);
};

// Helper function to get settings by category with ISO-aligned organization
export const getSettingsByCategory = (permissions = []) => {
    const settings = getSettingsPages(permissions);
    const categories = {};
    
    settings.forEach(setting => {
        const category = setting.category || 'other';
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(setting);
    });
    
    return categories;
};

// Utility functions for settings management

// Get settings by ISO standard
export const getSettingsByISOStandard = (permissions = []) => {
    const settings = getSettingsPages(permissions);
    return {
        'ISO 9001 - Quality Management': settings.filter(s => s.category === 'organization'),
        'ISO 27001 - Information Security': settings.filter(s => s.category === 'security'),
        'ISO 20000 - IT Service Management': settings.filter(s => s.category === 'services'),
        'ISO 14001 - Interface Management': settings.filter(s => s.category === 'interface'),
        'Business Process Management': settings.filter(s => s.category === 'business-process'),
        'System Administration': settings.filter(s => s.category === 'system-administration'),
        'Personal Security': settings.filter(s => s.category === 'personal-security')
    };
};

// Get settings by priority level
export const getSettingsByPriority = (permissions = []) => {
    return getSettingsPages(permissions).sort((a, b) => a.priority - b.priority);
};

// Search settings by name or description
export const searchSettings = (searchTerm, permissions = []) => {
    const settings = getSettingsPages(permissions);
    const term = searchTerm.toLowerCase();
    return settings.filter(setting => 
        setting.name.toLowerCase().includes(term) ||
        (setting.description && setting.description.toLowerCase().includes(term))
    );
};

// Get recommended settings for new system setup
export const getRecommendedSettings = (permissions = []) => {
    const settings = getSettingsPages(permissions);
    const recommended = ['Organization Configuration', 'Identity & Access Management', 'User Account Administration'];
    return settings.filter(setting => recommended.includes(setting.name));
};
