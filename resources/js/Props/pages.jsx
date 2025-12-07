import {
  HomeIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  UsersIcon,
  FolderIcon, // Changed from FolderOpenIcon
  ChartBarSquareIcon, // Changed from ChartBarIcon
  CreditCardIcon,
  ShoppingBagIcon,
  BuildingOffice2Icon,
  BuildingOfficeIcon, // ERP Asset Management
  BanknotesIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentCheckIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  PhoneIcon,
  UserIcon,
  ArchiveBoxIcon,
  AcademicCapIcon,
  TruckIcon,
  ShoppingCartIcon,
  TicketIcon,
  BeakerIcon,
  CubeIcon,
  ScaleIcon,
  BuildingStorefrontIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ChartPieIcon,
  MapPinIcon,
  MegaphoneIcon, // CRM Campaigns
  CalculatorIcon, // ERP Finance
  DocumentCheckIcon, // ERP GRN/Delivery
  ReceiptPercentIcon, // ERP Tax
  QueueListIcon, // ERP Stock
  ArrowsRightLeftIcon, // ERP Transfer
  ClipboardDocumentListIcon, // ERP Reports
  DocumentIcon, // PM Documents
  ExclamationTriangleIcon, // PM Risks
  ViewColumnsIcon, // PM Kanban/Boards
  RectangleStackIcon, // PM Sprints
  TagIcon, // PM Labels
  AdjustmentsHorizontalIcon, // PM Settings
  BookOpenIcon, // Finance GL
  DocumentPlusIcon, // Finance Journals
  ArrowUpTrayIcon, // Finance AP
  ArrowDownTrayIcon, // Finance AR
  BuildingLibraryIcon, // Finance Banking
  DocumentChartBarIcon, // Finance Statements
  QrCodeIcon, // Inventory Barcodes
  GiftIcon, // E-commerce Promotions
  StarIcon, // E-commerce Reviews
  ArrowUturnLeftIcon, // E-commerce Returns
  GlobeAltIcon, // E-commerce Storefront
  ArrowTrendingUpIcon, // Analytics Acquisition
  CursorArrowRaysIcon, // Analytics Behavior
  FunnelIcon, // Analytics Conversion
  MagnifyingGlassIcon, // Analytics Data Explorer
  PresentationChartLineIcon, // Analytics Charts
  PresentationChartBarIcon, // Analytics Reports
  LinkIcon, // Integrations Connectors
  KeyIcon, // Integrations API Keys
  CloudIcon, // Integrations Cloud Storage
  ChatBubbleLeftRightIcon, // Integrations Slack/Teams
  ServerStackIcon, // Integrations Sync Engines
  PencilSquareIcon, // DMS E-Signatures
  WrenchIcon, // Quality Calibrations  
  DocumentMagnifyingGlassIcon, // Quality Audits
  ShieldExclamationIcon, // Compliance main
  CheckBadgeIcon, // Certifications
  ShareIcon, // DMS Sharing
} from '@heroicons/react/24/outline';

import { hasAccess, isAuthSuperAdmin } from '@/utils/moduleAccessUtils';

/**
 * Tenant Navigation Pages
 * 
 * This file defines the navigation structure for Tenant Users.
 * The structure mirrors config/modules.php hierarchy.
 * 
 * Access Control:
 * - Each nav item specifies `access` path matching module hierarchy
 * - Access is checked using hasAccess() which checks:
 *   1. Plan Access (tenant subscription includes module)
 *   2. Permission Match (user role has required permission)
 * - Super Admin (tenant) bypasses all access checks
 * 
 * @see config/modules.php for complete hierarchy definition
 */

/**
 * Check access using module access system with legacy fallback
 * 
 * @param {string} accessPath - Module access path (e.g., 'hrm.employees.view')
 * @param {Object} auth - Auth object from Inertia
 * @param {Array} permissions - Legacy permissions array (optional fallback)
 * @returns {boolean}
 */
const can = (accessPath, auth, permissions = []) => {
  // Super admin bypasses all checks
  if (isAuthSuperAdmin(auth)) return true;
  
  // Try new module access system first
  if (hasAccess(accessPath, auth)) return true;
  
  // Fall back to legacy permission check (for backward compatibility)
  return permissions.includes(accessPath);
};

/**
 * Get Tenant navigation pages
 * 
 * @param {Array} roles - User's roles
 * @param {Array} permissions - Legacy permissions array
 * @param {Object} auth - Auth object from Inertia usePage().props
 * @returns {Array} Navigation pages array filtered by user's access
 */
export const getPages = (roles, permissions, auth = null) => {
  
  // Check if user is Super Admin (bypasses all access checks)
  const isSuperAdmin = isAuthSuperAdmin(auth);
  
  // Check if user has only Employee role (special case for self-service)
  const isOnlyEmployee = roles?.length === 1 && roles[0] === 'Employee';

  // Employee self-service items shown directly in menu
  const employeeSelfServiceItems = [
    ...(can('hrm.attendance.my-attendance.view', auth, permissions) || permissions.includes('attendance.own.view') ? [{
      name: 'My Attendance',
      icon: <CalendarDaysIcon className="" />,
      route: 'attendance-employee',
      access: 'hrm.attendance.my-attendance',
      priority: 10,
      module: 'self-service'
    }] : []),
    ...(can('hrm.leaves.leave-requests.create', auth, permissions) || permissions.includes('leave.own.view') ? [{
      name: 'My Leaves',
      icon: <ArrowRightOnRectangleIcon className="" />,
      route: 'leaves-employee',
      access: 'hrm.leaves.leave-requests',
      priority: 11,
      module: 'self-service'
    }] : []),
    ...(permissions.includes('communications.own.view') ? [{
      name: 'Communications',
      icon: <EnvelopeIcon className="" />,
      route: 'emails',
      priority: 12,
      module: 'self-service'
    }] : []),
  ];

  /**
   * Tenant Navigation Structure
   * Matches config/modules.php hierarchy
   */
  const pages = [
    /*
    |--------------------------------------------------------------------------
    | 1. Core Module - Dashboard
    |--------------------------------------------------------------------------
    */
    {
      name: 'Dashboards',
      icon: <HomeIcon className="" />, 
      module: 'core',
      access: 'core.dashboard',
      priority: 1,
      subMenu: [
        { 
          name: 'Main Dashboard', 
          icon: <HomeIcon />, 
          route: 'dashboard',
          access: 'core.dashboard.overview'
        },
        ...(can('hrm', auth, permissions) ? [{ 
          name: 'HR Dashboard', 
          icon: <UserGroupIcon />, 
          route: 'hr.dashboard',
          access: 'hrm'
        }] : []),
        ...(isOnlyEmployee ? [{ 
          name: 'Employee Dashboard', 
          icon: <UserIcon />, 
          route: 'employee.dashboard',
          access: 'core.dashboard'
        }] : []),
      ]
    },
    
    // Employee Self-Service (Direct menu items for employees only)
    ...(isOnlyEmployee ? employeeSelfServiceItems : []),
    
    /*
    |--------------------------------------------------------------------------
    | 2. HRM Module (Human Resources Management)
    | Matches: config/modules.php -> hierarchy -> hrm
    | Section 2 - 8 Submodules: Employees, Attendance, Leaves, Payroll,
    |             Recruitment, Performance, Training, HR Analytics
    |--------------------------------------------------------------------------
    */
    {
      name: 'HRM',
      icon: <UserGroupIcon className="" />,
      module: 'hrm',
      access: 'hrm',
      priority: 10,
      subMenu: [
        // 2.1 Employees
        {
          name: 'Employees',
          icon: <UserGroupIcon />,
          access: 'hrm.employees',
          category: 'employees',
          subMenu: [
            { name: 'Employee Directory', icon: <UserGroupIcon />, route: 'employees', access: 'hrm.employees.employee-directory.view' },
            { name: 'Departments', icon: <BuildingOffice2Icon />, route: 'departments', access: 'hrm.employees.departments.view' },
            { name: 'Designations', icon: <BriefcaseIcon />, route: 'designations.index', access: 'hrm.employees.designations.view' },
            { name: 'Onboarding', icon: <UserIcon />, route: 'hr.onboarding.index', access: 'hrm.employees.onboarding-wizard.view' },
            { name: 'Exit/Termination', icon: <ArrowRightOnRectangleIcon />, route: 'hr.offboarding.index', access: 'hrm.employees.exit-termination.view' },
          ]
        },
        
        // 2.2 Attendance
        {
          name: 'Attendance',
          icon: <CalendarDaysIcon />,
          access: 'hrm.attendance',
          category: 'attendance',
          subMenu: [
            { name: 'Daily Attendance', icon: <CalendarDaysIcon />, route: 'attendances', access: 'hrm.attendance.daily-attendance.view' },
            { name: 'Monthly Calendar', icon: <CalendarIcon />, route: 'attendance.calendar', access: 'hrm.attendance.monthly-calendar.view' },
            { name: 'Attendance Logs', icon: <ClipboardDocumentCheckIcon />, route: 'attendance.logs', access: 'hrm.attendance.attendance-logs.view' },
            { name: 'Shift Scheduling', icon: <ClockIcon />, route: 'shifts.index', access: 'hrm.attendance.shift-scheduling.view' },
            { name: 'Adjustment Requests', icon: <DocumentDuplicateIcon />, route: 'attendance.adjustments', access: 'hrm.attendance.adjustment-requests.view' },
            { name: 'My Attendance', icon: <UserIcon />, route: 'hr.my-attendance', access: 'hrm.attendance.my-attendance.view' },
            { name: 'Holidays', icon: <CalendarIcon />, route: 'holidays', access: 'hrm.leaves.holiday-calendar.view' },
          ]
        },
        
        // 2.3 Leave Management
        {
          name: 'Leaves',
          icon: <ArrowRightOnRectangleIcon />,
          access: 'hrm.leaves',
          category: 'leaves',
          subMenu: [
            { name: 'Leave Requests', icon: <ArrowRightOnRectangleIcon />, route: 'leaves', access: 'hrm.leaves.leave-requests.view' },
            { name: 'My Leaves', icon: <UserIcon />, route: 'leaves-employee', access: 'hrm.leaves.leave-requests.create' },
            { name: 'Leave Types', icon: <DocumentTextIcon />, route: 'leave-types', access: 'hrm.leaves.leave-types.view' },
            { name: 'Leave Balances', icon: <ChartPieIcon />, route: 'leave-balances', access: 'hrm.leaves.leave-balances.view' },
            { name: 'Leave Policies', icon: <Cog6ToothIcon />, route: 'leave-settings', access: 'hrm.leaves.leave-policies.manage' },
            { name: 'Leave Analytics', icon: <ChartBarSquareIcon />, route: 'leave-summary', access: 'hrm.leaves.leave-requests.view' },
          ]
        },
        
        // 2.4 Payroll
        {
          name: 'Payroll',
          icon: <CurrencyDollarIcon />,
          access: 'hrm.payroll',
          category: 'payroll',
          subMenu: [
            { name: 'Payroll Run', icon: <HomeIcon />, route: 'hr.payroll.index', access: 'hrm.payroll.payroll-run.view' },
            { name: 'Generate Payroll', icon: <DocumentTextIcon />, route: 'hr.payroll.create', access: 'hrm.payroll.payroll-run.execute' },
            { name: 'Payslips', icon: <DocumentDuplicateIcon />, route: 'hr.selfservice.payslips', access: 'hrm.payroll.payslips.view' },
            { name: 'Salary Structures', icon: <CubeIcon />, route: 'hr.payroll.structures', access: 'hrm.payroll.salary-structures.view' },
            { name: 'Salary Components', icon: <CurrencyDollarIcon />, route: 'hr.payroll.components', access: 'hrm.payroll.salary-components.view' },
            { name: 'Loans & Advances', icon: <BanknotesIcon />, route: 'hr.payroll.loans', access: 'hrm.payroll.loans.view' },
            { name: 'Payroll Reports', icon: <ChartBarSquareIcon />, route: 'hr.payroll.reports', access: 'hrm.payroll.payroll-run.view' },
          ]
        },
        
        // 2.5 Recruitment
        {
          name: 'Recruitment',
          icon: <BriefcaseIcon />,
          access: 'hrm.recruitment',
          category: 'recruitment',
          subMenu: [
            { name: 'Job Openings', icon: <BriefcaseIcon />, route: 'hr.recruitment.index', access: 'hrm.recruitment.job-openings.view' },
            { name: 'Applicants', icon: <UserGroupIcon />, route: 'hr.recruitment.applicants', access: 'hrm.recruitment.applicants.view' },
            { name: 'Candidate Pipeline', icon: <ChartBarSquareIcon />, route: 'hr.recruitment.pipeline', access: 'hrm.recruitment.candidate-pipeline.view' },
            { name: 'Interview Schedule', icon: <CalendarIcon />, route: 'hr.recruitment.interviews', access: 'hrm.recruitment.interview-scheduling.view' },
            { name: 'Offer Letters', icon: <DocumentTextIcon />, route: 'hr.recruitment.offers', access: 'hrm.recruitment.offer-letters.create' },
          ]
        },
        
        // 2.6 Performance Management
        {
          name: 'Performance',
          icon: <ChartBarSquareIcon />,
          access: 'hrm.performance',
          category: 'performance',
          subMenu: [
            { name: 'KPI Setup', icon: <ChartBarSquareIcon />, route: 'hr.performance.kpis', access: 'hrm.performance.kpi-setup.view' },
            { name: 'Appraisal Cycles', icon: <ClipboardDocumentCheckIcon />, route: 'hr.performance.appraisals', access: 'hrm.performance.appraisal-cycles.view' },
            { name: '360° Reviews', icon: <UserGroupIcon />, route: 'hr.performance.360-reviews', access: 'hrm.performance.reviews-360.view' },
            { name: 'Performance Reports', icon: <DocumentTextIcon />, route: 'hr.performance.reports', access: 'hrm.performance.performance-reports.view' },
          ]
        },
        
        // 2.7 Training & Development
        {
          name: 'Training',
          icon: <AcademicCapIcon />,
          access: 'hrm.training',
          category: 'training',
          subMenu: [
            { name: 'Training Programs', icon: <AcademicCapIcon />, route: 'hr.training.programs', access: 'hrm.training.training-programs.view' },
            { name: 'Training Sessions', icon: <CalendarIcon />, route: 'hr.training.sessions', access: 'hrm.training.training-sessions.view' },
            { name: 'Trainers', icon: <UserIcon />, route: 'hr.training.trainers', access: 'hrm.training.trainers.view' },
            { name: 'Certifications', icon: <ShieldCheckIcon />, route: 'hr.training.certifications', access: 'hrm.training.certifications.generate' },
          ]
        },
        
        // 2.8 HR Analytics
        {
          name: 'HR Analytics',
          icon: <ChartPieIcon />,
          access: 'hrm.hr-analytics',
          category: 'analytics',
          subMenu: [
            { name: 'Workforce Overview', icon: <UserGroupIcon />, route: 'hr.analytics.workforce', access: 'hrm.hr-analytics.workforce-overview.view' },
            { name: 'Turnover Analytics', icon: <ArrowPathIcon />, route: 'hr.analytics.turnover', access: 'hrm.hr-analytics.turnover-analytics.view' },
            { name: 'Attendance Insights', icon: <CalendarDaysIcon />, route: 'hr.analytics.attendance', access: 'hrm.hr-analytics.attendance-insights.view' },
            { name: 'Payroll Analysis', icon: <CurrencyDollarIcon />, route: 'hr.analytics.payroll', access: 'hrm.hr-analytics.payroll-cost-analysis.view' },
            { name: 'Recruitment Funnel', icon: <BriefcaseIcon />, route: 'hr.analytics.recruitment', access: 'hrm.hr-analytics.recruitment-funnel.view' },
            { name: 'Performance Insights', icon: <ChartBarSquareIcon />, route: 'hr.analytics.performance', access: 'hrm.hr-analytics.performance-insights.view' },
          ]
        },
      ]
    },



    /*
    |--------------------------------------------------------------------------
    | 3. CRM Module (Customer Relationship Management)
    | Matches: config/modules.php -> hierarchy -> crm
    | Section 3 - 10 Submodules: Leads, Contacts, Deals, Activities, Campaigns,
    |             Support Desk, Knowledge Base, Live Chat, CRM Settings, CRM Analytics
    |--------------------------------------------------------------------------
    */
    {
      name: 'CRM',
      icon: <UserIcon className="" />,
      module: 'crm',
      access: 'crm',
      priority: 20,
      subMenu: [
        // 3.1 Leads
        {
          name: 'Leads',
          icon: <UserGroupIcon />,
          access: 'crm.leads',
          category: 'leads',
          subMenu: [
            { name: 'Lead List', icon: <UserGroupIcon />, route: 'crm.leads.index', access: 'crm.leads.lead-list.view' },
            { name: 'Lead Pipeline', icon: <ChartBarSquareIcon />, route: 'crm.leads.pipeline', access: 'crm.leads.lead-pipeline.view' },
            { name: 'Lead Sources', icon: <MapPinIcon />, route: 'crm.leads.sources', access: 'crm.leads.lead-sources.view' },
          ]
        },
        
        // 3.2 Contacts & Accounts
        {
          name: 'Contacts',
          icon: <UsersIcon />,
          access: 'crm.contacts',
          category: 'contacts',
          subMenu: [
            { name: 'All Contacts', icon: <UsersIcon />, route: 'crm.contacts.index', access: 'crm.contacts.contact-list.view' },
            { name: 'Accounts', icon: <BuildingOffice2Icon />, route: 'crm.accounts.index', access: 'crm.contacts.accounts.view' },
            { name: 'Segments', icon: <UserGroupIcon />, route: 'crm.contacts.segments', access: 'crm.contacts.contact-segmentation.view' },
          ]
        },
        
        // 3.3 Deals & Sales Pipeline
        {
          name: 'Deals',
          icon: <BanknotesIcon />,
          access: 'crm.deals',
          category: 'deals',
          subMenu: [
            { name: 'Deal List', icon: <BanknotesIcon />, route: 'crm.deals.index', access: 'crm.deals.deal-list.view' },
            { name: 'Deal Board', icon: <ChartBarSquareIcon />, route: 'crm.deals.board', access: 'crm.deals.deal-board.view' },
            { name: 'Pipeline Stages', icon: <ArrowPathIcon />, route: 'crm.deals.stages', access: 'crm.deals.pipeline-stages.view' },
            { name: 'Forecast', icon: <ChartPieIcon />, route: 'crm.deals.forecast', access: 'crm.deals.forecasting.view' },
          ]
        },
        
        // 3.4 Activities & Engagement
        {
          name: 'Activities',
          icon: <PhoneIcon />,
          access: 'crm.activities',
          category: 'activities',
          subMenu: [
            { name: 'All Activities', icon: <ClipboardDocumentCheckIcon />, route: 'crm.activities.index', access: 'crm.activities.activity-list.view' },
            { name: 'Calls', icon: <PhoneIcon />, route: 'crm.activities.calls', access: 'crm.activities.calls.view' },
            { name: 'Meetings', icon: <CalendarIcon />, route: 'crm.activities.meetings', access: 'crm.activities.meetings.view' },
            { name: 'Templates', icon: <DocumentDuplicateIcon />, route: 'crm.activities.templates', access: 'crm.activities.activity-templates.view' },
          ]
        },
        
        // 3.5 Campaigns
        {
          name: 'Campaigns',
          icon: <MegaphoneIcon />,
          access: 'crm.campaigns',
          category: 'campaigns',
          subMenu: [
            { name: 'All Campaigns', icon: <MegaphoneIcon />, route: 'crm.campaigns.index', access: 'crm.campaigns.campaign-list.view' },
            { name: 'Campaign Builder', icon: <DocumentTextIcon />, route: 'crm.campaigns.builder', access: 'crm.campaigns.campaign-builder.view' },
            { name: 'Segments', icon: <UserGroupIcon />, route: 'crm.campaigns.segments', access: 'crm.campaigns.audience-segments.view' },
            { name: 'Email Templates', icon: <EnvelopeIcon />, route: 'crm.campaigns.email-templates', access: 'crm.campaigns.email-templates.view' },
            { name: 'Analytics', icon: <ChartBarSquareIcon />, route: 'crm.campaigns.analytics', access: 'crm.campaigns.campaign-analytics.view' },
          ]
        },
        
        // 3.6 Support Desk
        {
          name: 'Support Desk',
          icon: <TicketIcon />,
          access: 'crm.support-desk',
          category: 'support',
          subMenu: [
            { name: 'Tickets', icon: <TicketIcon />, route: 'crm.support.tickets', access: 'crm.support-desk.ticket-list.view' },
            { name: 'Categories', icon: <FolderIcon />, route: 'crm.support.categories', access: 'crm.support-desk.ticket-categories.view' },
            { name: 'SLA Rules', icon: <ClockIcon />, route: 'crm.support.sla', access: 'crm.support-desk.sla-rules.view' },
            { name: 'Dashboard', icon: <ChartPieIcon />, route: 'crm.support.dashboard', access: 'crm.support-desk.support-dashboard.view' },
          ]
        },
        
        // 3.7 Knowledge Base
        {
          name: 'Knowledge Base',
          icon: <FolderIcon />,
          access: 'crm.knowledge-base',
          category: 'kb',
          subMenu: [
            { name: 'Articles', icon: <DocumentTextIcon />, route: 'crm.kb.articles', access: 'crm.knowledge-base.kb-articles.view' },
            { name: 'Categories', icon: <FolderIcon />, route: 'crm.kb.categories', access: 'crm.knowledge-base.kb-categories.manage' },
          ]
        },
        
        // 3.8 Live Chat
        {
          name: 'Live Chat',
          icon: <PhoneIcon />,
          access: 'crm.live-chat',
          category: 'chat',
          subMenu: [
            { name: 'Chat Inbox', icon: <EnvelopeIcon />, route: 'crm.chat.inbox', access: 'crm.live-chat.chat-inbox.view' },
            { name: 'Visitors', icon: <UserGroupIcon />, route: 'crm.chat.visitors', access: 'crm.live-chat.visitor-tracking.view' },
            { name: 'Chatbot', icon: <ComputerDesktopIcon />, route: 'crm.chat.chatbot', access: 'crm.live-chat.chatbot.manage' },
            { name: 'Widget Settings', icon: <Cog6ToothIcon />, route: 'crm.chat.widget', access: 'crm.live-chat.chat-widget.configure' },
          ]
        },
        
        // 3.9 CRM Settings
        {
          name: 'CRM Settings',
          icon: <Cog6ToothIcon />,
          access: 'crm.crm-settings',
          category: 'settings',
          subMenu: [
            { name: 'General', icon: <Cog6ToothIcon />, route: 'crm.settings.index', access: 'crm.crm-settings.settings-general.view' },
            { name: 'Pipelines', icon: <ArrowPathIcon />, route: 'crm.settings.pipelines', access: 'crm.crm-settings.pipelines.manage' },
            { name: 'Activity Types', icon: <ClipboardDocumentCheckIcon />, route: 'crm.settings.activity-types', access: 'crm.crm-settings.activity-types.manage' },
            { name: 'Custom Fields', icon: <DocumentDuplicateIcon />, route: 'crm.settings.custom-fields', access: 'crm.crm-settings.custom-fields.manage' },
            { name: 'Integrations', icon: <CubeIcon />, route: 'crm.settings.integrations', access: 'crm.crm-settings.integrations.configure' },
          ]
        },
        
        // 3.10 CRM Analytics
        {
          name: 'CRM Analytics',
          icon: <ChartPieIcon />,
          access: 'crm.crm-analytics',
          category: 'analytics',
          subMenu: [
            { name: 'Lead Insights', icon: <UserGroupIcon />, route: 'crm.analytics.leads', access: 'crm.crm-analytics.lead-insights.view' },
            { name: 'Deal Forecast', icon: <BanknotesIcon />, route: 'crm.analytics.forecast', access: 'crm.crm-analytics.deal-forecast.view' },
            { name: 'Revenue Pipeline', icon: <CurrencyDollarIcon />, route: 'crm.analytics.revenue', access: 'crm.crm-analytics.revenue-pipeline.view' },
            { name: 'Campaign Performance', icon: <MegaphoneIcon />, route: 'crm.analytics.campaigns', access: 'crm.crm-analytics.campaign-performance.view' },
            { name: 'Support Insights', icon: <TicketIcon />, route: 'crm.analytics.support', access: 'crm.crm-analytics.support-insights.view' },
          ]
        },
      ]
    },

    /*
    |--------------------------------------------------------------------------
    | 4. ERP Module (Enterprise Resource Planning)
    | Matches: config/modules.php -> hierarchy -> erp
    | Section 4 - 8 Submodules: Procurement, Inventory, Finance & Accounting,
    |             Sales & Distribution, Manufacturing, Project & Job Costing,
    |             Asset Management, Supply Chain
    |--------------------------------------------------------------------------
    */
    {
      name: 'ERP',
      icon: <BuildingOffice2Icon className="" />,
      module: 'erp',
      access: 'erp',
      priority: 25,
      subMenu: [
        // 4.1 Procurement / Purchase Management
        {
          name: 'Procurement',
          icon: <ShoppingCartIcon />,
          access: 'erp.procurement',
          category: 'procurement',
          subMenu: [
            { name: 'Purchase Requisitions', icon: <DocumentTextIcon />, route: 'erp.procurement.requisitions', access: 'erp.procurement.purchase-requisitions.view' },
            { name: 'Purchase Orders', icon: <ClipboardDocumentCheckIcon />, route: 'erp.procurement.orders', access: 'erp.procurement.purchase-orders.view' },
            { name: 'Suppliers', icon: <BuildingStorefrontIcon />, route: 'erp.procurement.suppliers', access: 'erp.procurement.suppliers.view' },
            { name: 'GRN', icon: <DocumentCheckIcon />, route: 'erp.procurement.grn', access: 'erp.procurement.grn.view' },
            { name: 'Purchase Returns', icon: <ArrowPathIcon />, route: 'erp.procurement.returns', access: 'erp.procurement.purchase-returns.view' },
          ]
        },

        // 4.2 Inventory & Warehouse Management
        {
          name: 'Inventory',
          icon: <ArchiveBoxIcon />,
          access: 'erp.inventory',
          category: 'inventory',
          subMenu: [
            { name: 'Warehouses', icon: <BuildingOffice2Icon />, route: 'erp.inventory.warehouses', access: 'erp.inventory.warehouses.view' },
            { name: 'Stock Items', icon: <CubeIcon />, route: 'erp.inventory.items', access: 'erp.inventory.stock-items.view' },
            { name: 'Stock Adjustment', icon: <QueueListIcon />, route: 'erp.inventory.adjustments', access: 'erp.inventory.stock-adjustment.view' },
            { name: 'Stock Transfer', icon: <ArrowsRightLeftIcon />, route: 'erp.inventory.transfers', access: 'erp.inventory.stock-transfer.view' },
            { name: 'Batches & Lots', icon: <FolderIcon />, route: 'erp.inventory.batches', access: 'erp.inventory.batches-lots.view' },
            { name: 'Stock Reports', icon: <ChartBarSquareIcon />, route: 'erp.inventory.reports', access: 'erp.inventory.stock-reports.view' },
          ]
        },

        // 4.3 Finance & Accounting
        {
          name: 'Finance & Accounting',
          icon: <CalculatorIcon />,
          access: 'erp.finance-accounting',
          category: 'finance',
          subMenu: [
            { name: 'Chart of Accounts', icon: <ClipboardDocumentListIcon />, route: 'erp.finance.coa', access: 'erp.finance-accounting.chart-of-accounts.view' },
            { name: 'General Ledger', icon: <DocumentTextIcon />, route: 'erp.finance.ledger', access: 'erp.finance-accounting.general-ledger.view' },
            { name: 'Journals', icon: <DocumentDuplicateIcon />, route: 'erp.finance.journals', access: 'erp.finance-accounting.journals.view' },
            { name: 'Accounts Payable', icon: <BanknotesIcon />, route: 'erp.finance.payable', access: 'erp.finance-accounting.accounts-payable.view' },
            { name: 'Accounts Receivable', icon: <CurrencyDollarIcon />, route: 'erp.finance.receivable', access: 'erp.finance-accounting.accounts-receivable.view' },
            { name: 'Tax Management', icon: <ReceiptPercentIcon />, route: 'erp.finance.taxes', access: 'erp.finance-accounting.tax-management.view' },
            { name: 'Financial Reports', icon: <ChartPieIcon />, route: 'erp.finance.reports', access: 'erp.finance-accounting.financial-reports.view' },
          ]
        },

        // 4.4 Sales & Distribution
        {
          name: 'Sales & Distribution',
          icon: <CurrencyDollarIcon />,
          access: 'erp.sales-distribution',
          category: 'sales',
          subMenu: [
            { name: 'Quotations', icon: <DocumentTextIcon />, route: 'erp.sales.quotations', access: 'erp.sales-distribution.quotations.view' },
            { name: 'Sales Orders', icon: <ClipboardDocumentCheckIcon />, route: 'erp.sales.orders', access: 'erp.sales-distribution.sales-orders.view' },
            { name: 'Delivery Notes', icon: <TruckIcon />, route: 'erp.sales.delivery', access: 'erp.sales-distribution.delivery-notes.view' },
            { name: 'Invoices', icon: <DocumentDuplicateIcon />, route: 'erp.sales.invoices', access: 'erp.sales-distribution.sales-invoices.view' },
            { name: 'Sales Returns', icon: <ArrowPathIcon />, route: 'erp.sales.returns', access: 'erp.sales-distribution.sales-returns.view' },
          ]
        },

        // 4.5 Manufacturing
        {
          name: 'Manufacturing',
          icon: <WrenchScrewdriverIcon />,
          access: 'erp.manufacturing',
          category: 'manufacturing',
          subMenu: [
            { name: 'Bill of Materials', icon: <ClipboardDocumentListIcon />, route: 'erp.manufacturing.bom', access: 'erp.manufacturing.bom.view' },
            { name: 'Work Orders', icon: <ClipboardDocumentCheckIcon />, route: 'erp.manufacturing.work-orders', access: 'erp.manufacturing.work-orders.view' },
            { name: 'Production Planning', icon: <CalendarDaysIcon />, route: 'erp.manufacturing.planning', access: 'erp.manufacturing.production-planning.view' },
            { name: 'Machines', icon: <ComputerDesktopIcon />, route: 'erp.manufacturing.machines', access: 'erp.manufacturing.machine-setup.view' },
            { name: 'Quality Control', icon: <ShieldCheckIcon />, route: 'erp.manufacturing.qc', access: 'erp.manufacturing.quality-control.view' },
          ]
        },

        // 4.6 Project & Job Costing
        {
          name: 'Job Costing',
          icon: <BriefcaseIcon />,
          access: 'erp.job-costing',
          category: 'costing',
          subMenu: [
            { name: 'Projects', icon: <FolderIcon />, route: 'erp.job-costing.projects', access: 'erp.job-costing.erp-projects.view' },
            { name: 'Milestones', icon: <CalendarIcon />, route: 'erp.job-costing.milestones', access: 'erp.job-costing.milestones.view' },
            { name: 'Cost Centers', icon: <ScaleIcon />, route: 'erp.job-costing.cost-centers', access: 'erp.job-costing.cost-centers.view' },
            { name: 'Time & Material', icon: <ClockIcon />, route: 'erp.job-costing.time-material', access: 'erp.job-costing.time-material.view' },
            { name: 'Budgeting', icon: <BanknotesIcon />, route: 'erp.job-costing.budgets', access: 'erp.job-costing.budgeting.view' },
          ]
        },

        // 4.7 Asset Management
        {
          name: 'Asset Management',
          icon: <BuildingOfficeIcon />,
          access: 'erp.asset-management',
          category: 'assets',
          subMenu: [
            { name: 'Fixed Assets', icon: <CubeIcon />, route: 'erp.assets.fixed', access: 'erp.asset-management.fixed-assets.view' },
            { name: 'Depreciation', icon: <ChartBarSquareIcon />, route: 'erp.assets.depreciation', access: 'erp.asset-management.depreciation.view' },
            { name: 'Maintenance Logs', icon: <WrenchScrewdriverIcon />, route: 'erp.assets.maintenance', access: 'erp.asset-management.maintenance-logs.view' },
            { name: 'Asset Transfer', icon: <ArrowsRightLeftIcon />, route: 'erp.assets.transfer', access: 'erp.asset-management.asset-transfer.view' },
            { name: 'Asset Disposal', icon: <ArchiveBoxIcon />, route: 'erp.assets.disposal', access: 'erp.asset-management.asset-disposal.view' },
          ]
        },

        // 4.8 Supply Chain
        {
          name: 'Supply Chain',
          icon: <TruckIcon />,
          access: 'erp.supply-chain',
          category: 'supply',
          subMenu: [
            { name: 'Supplier Performance', icon: <ChartBarSquareIcon />, route: 'erp.supply-chain.performance', access: 'erp.supply-chain.supplier-performance.view' },
            { name: 'Lead Time Analysis', icon: <ClockIcon />, route: 'erp.supply-chain.lead-time', access: 'erp.supply-chain.lead-time.view' },
            { name: 'Freight & Logistics', icon: <TruckIcon />, route: 'erp.supply-chain.freight', access: 'erp.supply-chain.freight-logistics.view' },
            { name: 'Shipment Tracking', icon: <MapPinIcon />, route: 'erp.supply-chain.shipments', access: 'erp.supply-chain.shipment-tracking.view' },
          ]
        },
      ]
    },

    /*
    |--------------------------------------------------------------------------
    | 5. Project Management Module
    | Matches: config/modules.php -> hierarchy -> project
    | Section 5 - 10 Submodules: Projects, Tasks, Sprints, Teams & Resources,
    |             Time Tracking, Documents, Risks & Issues, Project Financials,
    |             Reports & Dashboards, Settings
    |--------------------------------------------------------------------------
    */
    {
      name: 'Projects',
      icon: <BriefcaseIcon className="" />,
      module: 'project',
      access: 'project',
      priority: 30,
      subMenu: [
        // 5.2.1 Projects
        {
          name: 'Projects',
          icon: <FolderIcon />,
          access: 'project.projects',
          category: 'projects',
          subMenu: [
            { name: 'All Projects', icon: <FolderIcon />, route: 'project-management.projects.index', access: 'project.projects.project-list.view' },
            { name: 'Timeline (Gantt)', icon: <ChartBarSquareIcon />, route: 'project-management.timeline', access: 'project.projects.timeline-gantt.view' },
          ]
        },

        // 5.2.2 Tasks & Work Items
        {
          name: 'Tasks',
          icon: <ClipboardDocumentCheckIcon />,
          access: 'project.tasks',
          category: 'tasks',
          subMenu: [
            { name: 'Task List', icon: <ClipboardDocumentCheckIcon />, route: 'project-management.tasks.index', access: 'project.tasks.task-list.view' },
            { name: 'Kanban Board', icon: <ViewColumnsIcon />, route: 'project-management.tasks.kanban', access: 'project.tasks.kanban-board.view' },
          ]
        },

        // 5.2.3 Sprints & Agile Boards
        {
          name: 'Sprints',
          icon: <RectangleStackIcon />,
          access: 'project.sprints',
          category: 'sprints',
          subMenu: [
            { name: 'Sprint List', icon: <RectangleStackIcon />, route: 'project-management.sprints.index', access: 'project.sprints.sprint-list.view' },
            { name: 'Backlog', icon: <QueueListIcon />, route: 'project-management.backlog', access: 'project.sprints.backlog.view' },
            { name: 'Burndown Chart', icon: <ChartPieIcon />, route: 'project-management.sprints.burndown', access: 'project.sprints.burndown-chart.view' },
          ]
        },

        // 5.2.4 Teams & Resources
        {
          name: 'Teams & Resources',
          icon: <UserGroupIcon />,
          access: 'project.teams-resources',
          category: 'teams',
          subMenu: [
            { name: 'Teams', icon: <UserGroupIcon />, route: 'project-management.teams.index', access: 'project.teams-resources.team-list.view' },
            { name: 'Resource Allocation', icon: <ChartBarSquareIcon />, route: 'project-management.resources.allocation', access: 'project.teams-resources.resource-allocation.view' },
            { name: 'Availability', icon: <CalendarIcon />, route: 'project-management.resources.availability', access: 'project.teams-resources.availability-calendar.view' },
          ]
        },

        // 5.2.5 Time Tracking
        {
          name: 'Time Tracking',
          icon: <ClockIcon />,
          access: 'project.time-tracking',
          category: 'time',
          subMenu: [
            { name: 'Timesheet', icon: <ClockIcon />, route: 'project-management.time.timesheet', access: 'project.time-tracking.timesheet.view' },
            { name: 'Time Entries', icon: <ClipboardDocumentListIcon />, route: 'project-management.time.entries', access: 'project.time-tracking.time-entries.view' },
            { name: 'Time Approval', icon: <DocumentCheckIcon />, route: 'project-management.time.approval', access: 'project.time-tracking.time-approval.view' },
            { name: 'Billable Tracking', icon: <CurrencyDollarIcon />, route: 'project-management.time.billable', access: 'project.time-tracking.billable-tracking.view' },
          ]
        },

        // 5.2.6 Documents & Files
        {
          name: 'Documents',
          icon: <DocumentIcon />,
          access: 'project.documents',
          category: 'documents',
          subMenu: [
            { name: 'File Library', icon: <FolderIcon />, route: 'project-management.documents.index', access: 'project.documents.file-library.view' },
          ]
        },

        // 5.2.7 Risks & Issues
        {
          name: 'Risks & Issues',
          icon: <ExclamationTriangleIcon />,
          access: 'project.risks-issues',
          category: 'risks',
          subMenu: [
            { name: 'Risk Register', icon: <ExclamationTriangleIcon />, route: 'project-management.risks.index', access: 'project.risks-issues.risk-register.view' },
            { name: 'Issue Log', icon: <TicketIcon />, route: 'project-management.issues.index', access: 'project.risks-issues.issue-log.view' },
            { name: 'Risk Matrix', icon: <ChartPieIcon />, route: 'project-management.risks.matrix', access: 'project.risks-issues.risk-matrix.view' },
          ]
        },

        // 5.2.8 Project Financials
        {
          name: 'Financials',
          icon: <BanknotesIcon />,
          access: 'project.project-financials',
          category: 'financials',
          subMenu: [
            { name: 'Budget', icon: <ScaleIcon />, route: 'project-management.financials.budget', access: 'project.project-financials.budget.view' },
            { name: 'Cost Tracking', icon: <CurrencyDollarIcon />, route: 'project-management.financials.costs', access: 'project.project-financials.cost-tracking.view' },
            { name: 'Expenses', icon: <CreditCardIcon />, route: 'project-management.financials.expenses', access: 'project.project-financials.expense-list.view' },
            { name: 'Revenue', icon: <BanknotesIcon />, route: 'project-management.financials.revenue', access: 'project.project-financials.revenue.view' },
            { name: 'Profitability', icon: <ChartPieIcon />, route: 'project-management.financials.profitability', access: 'project.project-financials.profitability.view' },
          ]
        },

        // 5.2.9 Reports & Dashboards
        {
          name: 'Reports',
          icon: <ChartBarSquareIcon />,
          access: 'project.reports-dashboards',
          category: 'reports',
          subMenu: [
            { name: 'Progress Reports', icon: <ChartBarSquareIcon />, route: 'project-management.reports.progress', access: 'project.reports-dashboards.progress-reports.view' },
            { name: 'Task Metrics', icon: <ClipboardDocumentCheckIcon />, route: 'project-management.reports.tasks', access: 'project.reports-dashboards.task-metrics.view' },
            { name: 'Team Performance', icon: <UserGroupIcon />, route: 'project-management.reports.team', access: 'project.reports-dashboards.team-performance.view' },
            { name: 'Sprint Analytics', icon: <ChartPieIcon />, route: 'project-management.reports.sprints', access: 'project.reports-dashboards.sprint-analytics.view' },
            { name: 'Risk Heatmaps', icon: <ExclamationTriangleIcon />, route: 'project-management.reports.risks', access: 'project.reports-dashboards.risk-heatmaps.view' },
            { name: 'Time Charts', icon: <ClockIcon />, route: 'project-management.reports.time', access: 'project.reports-dashboards.time-charts.view' },
          ]
        },

        // 5.2.10 Settings
        {
          name: 'PM Settings',
          icon: <Cog6ToothIcon />,
          access: 'project.pm-settings',
          category: 'settings',
          subMenu: [
            { name: 'Task Statuses', icon: <TagIcon />, route: 'project-management.settings.statuses', access: 'project.pm-settings.task-statuses.view' },
            { name: 'Priority Levels', icon: <AdjustmentsHorizontalIcon />, route: 'project-management.settings.priorities', access: 'project.pm-settings.priority-levels.view' },
            { name: 'Labels', icon: <TagIcon />, route: 'project-management.settings.labels', access: 'project.pm-settings.labels.view' },
            { name: 'Custom Fields', icon: <DocumentDuplicateIcon />, route: 'project-management.settings.custom-fields', access: 'project.pm-settings.custom-fields.view' },
            { name: 'Automation', icon: <ArrowPathIcon />, route: 'project-management.settings.automation', access: 'project.pm-settings.automation-rules.view' },
            { name: 'SLA Settings', icon: <ClockIcon />, route: 'project-management.settings.sla', access: 'project.pm-settings.sla-settings.view' },
          ]
        },
      ]
    },

    /*
    |--------------------------------------------------------------------------
    | 6. Accounting & Finance Module (14 Submodules)
    | Matches: config/modules.php -> hierarchy -> finance
    |--------------------------------------------------------------------------
    */
    {
      name: 'Accounting & Finance',
      icon: <BanknotesIcon className="" />,
      module: 'finance',
      access: 'finance',
      priority: 40,
      subMenu: [
        // 6.1 Dashboard
        {
          name: 'Dashboard',
          icon: <HomeIcon />,
          access: 'finance.accounting-dashboard',
          subMenu: [
            { name: 'Accounting Dashboard', icon: <ChartBarSquareIcon />, route: 'finance.dashboard.index', access: 'finance.accounting-dashboard.view' },
          ]
        },

        // 6.2 Chart of Accounts
        {
          name: 'Chart of Accounts',
          icon: <BookOpenIcon />,
          access: 'finance.chart-of-accounts',
          subMenu: [
            { name: 'Account List', icon: <DocumentTextIcon />, route: 'finance.coa.index', access: 'finance.chart-of-accounts.account-list.view' },
            { name: 'Account Types', icon: <TagIcon />, route: 'finance.coa.types', access: 'finance.chart-of-accounts.account-types.view' },
            { name: 'Account Hierarchy', icon: <FolderIcon />, route: 'finance.coa.hierarchy', access: 'finance.chart-of-accounts.account-hierarchy.view' },
            { name: 'Opening Balances', icon: <CalculatorIcon />, route: 'finance.coa.opening-balances', access: 'finance.chart-of-accounts.opening-balances.view' },
          ]
        },

        // 6.3 General Ledger
        {
          name: 'General Ledger',
          icon: <BookOpenIcon />,
          access: 'finance.general-ledger',
          subMenu: [
            { name: 'Ledger Accounts', icon: <DocumentTextIcon />, route: 'finance.ledger.accounts', access: 'finance.general-ledger.ledger-accounts.view' },
            { name: 'Reconciliation', icon: <ScaleIcon />, route: 'finance.ledger.reconciliation', access: 'finance.general-ledger.ledger-reconciliation.view' },
          ]
        },

        // 6.4 Journals
        {
          name: 'Journals',
          icon: <DocumentPlusIcon />,
          access: 'finance.journals',
          subMenu: [
            { name: 'Journal Entries', icon: <DocumentTextIcon />, route: 'finance.journals.entries', access: 'finance.journals.journal-entries.view' },
            { name: 'Recurring Journals', icon: <ArrowPathIcon />, route: 'finance.journals.recurring', access: 'finance.journals.recurring-journals.view' },
            { name: 'Journal Templates', icon: <DocumentDuplicateIcon />, route: 'finance.journals.templates', access: 'finance.journals.journal-templates.view' },
            { name: 'Journal Approval', icon: <ShieldCheckIcon />, route: 'finance.journals.approval', access: 'finance.journals.journal-approval.view' },
          ]
        },

        // 6.5 Accounts Payable
        {
          name: 'Accounts Payable',
          icon: <ArrowUpTrayIcon />,
          access: 'finance.accounts-payable',
          subMenu: [
            { name: 'Vendor Bills', icon: <DocumentTextIcon />, route: 'finance.ap.bills', access: 'finance.accounts-payable.vendor-bills.view' },
            { name: 'Vendor Payments', icon: <BanknotesIcon />, route: 'finance.ap.payments', access: 'finance.accounts-payable.vendor-payments.view' },
            { name: 'Debit Notes', icon: <DocumentDuplicateIcon />, route: 'finance.ap.debit-notes', access: 'finance.accounts-payable.debit-notes.view' },
            { name: 'Vendor Management', icon: <BuildingOffice2Icon />, route: 'finance.ap.vendors', access: 'finance.accounts-payable.vendor-management.view' },
            { name: 'AP Aging', icon: <ClockIcon />, route: 'finance.ap.aging', access: 'finance.accounts-payable.ap-aging-report.view' },
          ]
        },

        // 6.6 Accounts Receivable
        {
          name: 'Accounts Receivable',
          icon: <ArrowDownTrayIcon />,
          access: 'finance.accounts-receivable',
          subMenu: [
            { name: 'Sales Invoices', icon: <DocumentTextIcon />, route: 'finance.ar.invoices', access: 'finance.accounts-receivable.sales-invoices.view' },
            { name: 'Customer Payments', icon: <BanknotesIcon />, route: 'finance.ar.payments', access: 'finance.accounts-receivable.customer-payments.view' },
            { name: 'Credit Notes', icon: <DocumentDuplicateIcon />, route: 'finance.ar.credit-notes', access: 'finance.accounts-receivable.credit-notes.view' },
            { name: 'Customer Management', icon: <UserGroupIcon />, route: 'finance.ar.customers', access: 'finance.accounts-receivable.customer-management.view' },
            { name: 'AR Aging', icon: <ClockIcon />, route: 'finance.ar.aging', access: 'finance.accounts-receivable.ar-aging-report.view' },
          ]
        },

        // 6.7 Banking
        {
          name: 'Banking',
          icon: <BuildingLibraryIcon />,
          access: 'finance.banking',
          subMenu: [
            { name: 'Bank Accounts', icon: <CreditCardIcon />, route: 'finance.banking.accounts', access: 'finance.banking.bank-accounts.view' },
            { name: 'Bank Feeds', icon: <ArrowPathIcon />, route: 'finance.banking.feeds', access: 'finance.banking.bank-feeds.view' },
            { name: 'Bank Reconciliation', icon: <ScaleIcon />, route: 'finance.banking.reconciliation', access: 'finance.banking.bank-reconciliation.view' },
            { name: 'Bank Statements', icon: <DocumentTextIcon />, route: 'finance.banking.statements', access: 'finance.banking.bank-statements.view' },
          ]
        },

        // 6.8 Cash Management
        {
          name: 'Cash Management',
          icon: <BanknotesIcon />,
          access: 'finance.cash-management',
          subMenu: [
            { name: 'Petty Cash', icon: <CurrencyDollarIcon />, route: 'finance.cash.petty', access: 'finance.cash-management.petty-cash.view' },
            { name: 'Cash Transfers', icon: <ArrowsRightLeftIcon />, route: 'finance.cash.transfers', access: 'finance.cash-management.cash-transfers.view' },
            { name: 'Cash Disbursements', icon: <ArrowUpTrayIcon />, route: 'finance.cash.disbursements', access: 'finance.cash-management.cash-disbursements.view' },
            { name: 'Cash Receipts', icon: <ArrowDownTrayIcon />, route: 'finance.cash.receipts', access: 'finance.cash-management.cash-receipts.view' },
          ]
        },

        // 6.9 Budgeting
        {
          name: 'Budgeting',
          icon: <ScaleIcon />,
          access: 'finance.budgeting',
          subMenu: [
            { name: 'Budget Creation', icon: <DocumentPlusIcon />, route: 'finance.budgeting.create', access: 'finance.budgeting.budget-creation.view' },
            { name: 'Variance Analysis', icon: <ChartBarSquareIcon />, route: 'finance.budgeting.variance', access: 'finance.budgeting.variance-analysis.view' },
            { name: 'Budget vs Actual', icon: <ChartPieIcon />, route: 'finance.budgeting.comparison', access: 'finance.budgeting.budget-vs-actual.view' },
          ]
        },

        // 6.10 Fixed Assets
        {
          name: 'Fixed Assets',
          icon: <BuildingOfficeIcon />,
          access: 'finance.fixed-assets',
          subMenu: [
            { name: 'Assets', icon: <CubeIcon />, route: 'finance.assets.index', access: 'finance.fixed-assets.assets.view' },
            { name: 'Depreciation', icon: <ChartBarSquareIcon />, route: 'finance.assets.depreciation', access: 'finance.fixed-assets.depreciation.view' },
            { name: 'Asset Transfer', icon: <ArrowsRightLeftIcon />, route: 'finance.assets.transfer', access: 'finance.fixed-assets.asset-transfer.view' },
            { name: 'Asset Disposal', icon: <ArchiveBoxIcon />, route: 'finance.assets.disposal', access: 'finance.fixed-assets.asset-disposal.view' },
            { name: 'Asset Register', icon: <DocumentTextIcon />, route: 'finance.assets.register', access: 'finance.fixed-assets.asset-register.view' },
          ]
        },

        // 6.11 Tax Management
        {
          name: 'Tax Management',
          icon: <ReceiptPercentIcon />,
          access: 'finance.tax-management',
          subMenu: [
            { name: 'Tax Rules', icon: <DocumentTextIcon />, route: 'finance.tax.rules', access: 'finance.tax-management.tax-rules.view' },
            { name: 'Tax Groups', icon: <FolderIcon />, route: 'finance.tax.groups', access: 'finance.tax-management.tax-groups.view' },
            { name: 'Tax Returns', icon: <DocumentDuplicateIcon />, route: 'finance.tax.returns', access: 'finance.tax-management.tax-returns.view' },
            { name: 'Withholding Tax', icon: <CalculatorIcon />, route: 'finance.tax.withholding', access: 'finance.tax-management.withholding-tax.view' },
            { name: 'Tax Audit', icon: <ShieldCheckIcon />, route: 'finance.tax.audit', access: 'finance.tax-management.tax-audit.view' },
          ]
        },

        // 6.12 Financial Statements
        {
          name: 'Financial Statements',
          icon: <DocumentChartBarIcon />,
          access: 'finance.financial-statements',
          subMenu: [
            { name: 'Trial Balance', icon: <ScaleIcon />, route: 'finance.statements.trial-balance', access: 'finance.financial-statements.trial-balance.view' },
            { name: 'Profit & Loss', icon: <ChartBarSquareIcon />, route: 'finance.statements.profit-loss', access: 'finance.financial-statements.profit-loss.view' },
            { name: 'Balance Sheet', icon: <DocumentTextIcon />, route: 'finance.statements.balance-sheet', access: 'finance.financial-statements.balance-sheet.view' },
            { name: 'Cash Flow Statement', icon: <BanknotesIcon />, route: 'finance.statements.cashflow', access: 'finance.financial-statements.cashflow-statement.view' },
            { name: 'Equity Statement', icon: <ChartPieIcon />, route: 'finance.statements.equity', access: 'finance.financial-statements.equity-statement.view' },
            { name: 'Custom Reports', icon: <DocumentDuplicateIcon />, route: 'finance.statements.custom', access: 'finance.financial-statements.custom-reports.view' },
          ]
        },

        // 6.13 Audit & Compliance
        {
          name: 'Audit & Compliance',
          icon: <ShieldCheckIcon />,
          access: 'finance.audit-compliance',
          subMenu: [
            { name: 'Audit Log', icon: <ClipboardDocumentCheckIcon />, route: 'finance.audit.log', access: 'finance.audit-compliance.audit-log.view' },
            { name: 'Document Attachments', icon: <FolderIcon />, route: 'finance.audit.documents', access: 'finance.audit-compliance.document-attachments.view' },
            { name: 'Approval Logs', icon: <DocumentTextIcon />, route: 'finance.audit.approvals', access: 'finance.audit-compliance.approval-logs.view' },
            { name: 'Period Closing', icon: <CalendarIcon />, route: 'finance.audit.period-closing', access: 'finance.audit-compliance.period-closing.view' },
            { name: 'Year-End Closing', icon: <CalendarDaysIcon />, route: 'finance.audit.year-end', access: 'finance.audit-compliance.year-end-closing.view' },
          ]
        },

        // 6.14 Finance Settings
        {
          name: 'Finance Settings',
          icon: <Cog6ToothIcon />,
          access: 'finance.finance-settings',
          category: 'settings',
          subMenu: [
            { name: 'Fiscal Year', icon: <CalendarIcon />, route: 'finance.settings.fiscal-year', access: 'finance.finance-settings.fiscal-year.view' },
            { name: 'Payment Terms', icon: <ClockIcon />, route: 'finance.settings.payment-terms', access: 'finance.finance-settings.payment-terms.view' },
            { name: 'Currency', icon: <CurrencyDollarIcon />, route: 'finance.settings.currency', access: 'finance.finance-settings.currency.view' },
            { name: 'Exchange Rates', icon: <ArrowsRightLeftIcon />, route: 'finance.settings.exchange-rates', access: 'finance.finance-settings.exchange-rates.view' },
            { name: 'CoA Presets', icon: <BookOpenIcon />, route: 'finance.settings.coa-presets', access: 'finance.finance-settings.coa-presets.view' },
            { name: 'Tax Config', icon: <ReceiptPercentIcon />, route: 'finance.settings.tax-config', access: 'finance.finance-settings.tax-configuration.view' },
            { name: 'Journal Prefixes', icon: <DocumentTextIcon />, route: 'finance.settings.journal-prefixes', access: 'finance.finance-settings.journal-prefixes.view' },
            { name: 'Approval Workflows', icon: <ShieldCheckIcon />, route: 'finance.settings.approval-workflows', access: 'finance.finance-settings.approval-workflows.view' },
          ]
        },
      ]
    },

    // 5. Event Management (Legacy)
    ...(can('event.view', auth, permissions) ? [{
      name: 'Events',
      icon: <CalendarIcon className="" />,
      priority: 35,
      module: 'events',
      subMenu: [
        { name: 'All Events', icon: <CalendarIcon />, route: 'events.index' },
        { name: 'New Event', icon: <CalendarDaysIcon />, route: 'events.create' },
      ]
    }] : []),

    // 6. DMS (Document Management System)
    ...(can('dms.view', auth, permissions) ? [{
      name: 'Documents',
      icon: <FolderIcon className="" />,
      priority: 45,
      module: 'dms',
      access: 'dms',
      subMenu: [
        { name: 'Overview', icon: <HomeIcon />, route: 'dms.index', access: 'dms.documents.view' },
        { name: 'Document Library', icon: <DocumentTextIcon />, route: 'dms.documents', access: 'dms.documents.view' },
        { name: 'Version Control', icon: <ClockIcon />, route: 'dms.versions', access: 'dms.versions.view' },
        { name: 'Folders', icon: <FolderIcon />, route: 'dms.folders', access: 'dms.folders.view' },
        { name: 'Shared Documents', icon: <ShareIcon />, route: 'dms.shared', access: 'dms.sharing.view' },
        { name: 'Workflows', icon: <ArrowPathIcon />, route: 'dms.workflows', access: 'dms.workflows.view' },
        { name: 'Templates', icon: <DocumentDuplicateIcon />, route: 'dms.templates', access: 'dms.templates.view' },
        { name: 'E-Signatures', icon: <PencilSquareIcon />, route: 'dms.signatures', access: 'dms.e-signatures.view' },
        { name: 'Audit Trail', icon: <ClipboardDocumentCheckIcon />, route: 'dms.audit', access: 'dms.audit-trail.view' },
        { name: 'Search', icon: <MagnifyingGlassIcon />, route: 'dms.search', access: 'dms.search.view' },
        { name: 'Analytics', icon: <ChartBarSquareIcon />, route: 'dms.analytics', access: 'dms.dms-analytics.view' },
        { name: 'Settings', icon: <Cog6ToothIcon />, route: 'dms.settings', access: 'dms.dms-settings.view' },
      ]
    }] : []),

    // 7. POS (Point of Sale)
    ...(can('pos.view', auth, permissions) ? [{
      name: 'POS',
      icon: <ShoppingCartIcon className="" />,
      priority: 55,
      module: 'pos',
      subMenu: [
        { name: 'Sales', icon: <ShoppingCartIcon />, route: 'pos.sales.index' },
        { name: 'Orders', icon: <ClipboardDocumentCheckIcon />, route: 'pos.orders.index' },
        { name: 'Cashier', icon: <CreditCardIcon />, route: 'pos.cashier' },
        { name: 'Reports', icon: <ChartBarSquareIcon />, route: 'pos.dashboard' },
      ]
    }] : []),

    /*
    |--------------------------------------------------------------------------
    | 7. Inventory Management Module (15 Submodules)
    | Matches: config/modules.php -> hierarchy -> inventory
    |--------------------------------------------------------------------------
    */
    {
      name: 'Inventory',
      icon: <ArchiveBoxIcon className="" />,
      module: 'inventory',
      access: 'inventory',
      priority: 50,
      subMenu: [
        // 7.1 Dashboard
        {
          name: 'Dashboard',
          icon: <ChartBarSquareIcon />,
          access: 'inventory.dashboard',
          subMenu: [
            { name: 'Inventory Dashboard', icon: <HomeIcon />, route: 'inventory.dashboard.index', access: 'inventory.dashboard.inventory-dashboard.view' },
          ]
        },

        // 7.2 Items / Products
        {
          name: 'Items / Products',
          icon: <CubeIcon />,
          access: 'inventory.items',
          subMenu: [
            { name: 'Item List', icon: <DocumentTextIcon />, route: 'inventory.items.index', access: 'inventory.items.item-list.view' },
            { name: 'Item Variants', icon: <TagIcon />, route: 'inventory.items.variants', access: 'inventory.items.item-variants.view' },
            { name: 'Item Attributes', icon: <AdjustmentsHorizontalIcon />, route: 'inventory.items.attributes', access: 'inventory.items.item-attributes.view' },
            { name: 'Images & Attachments', icon: <DocumentDuplicateIcon />, route: 'inventory.items.images', access: 'inventory.items.item-images.view' },
          ]
        },

        // 7.3 Categories
        {
          name: 'Categories',
          icon: <FolderIcon />,
          access: 'inventory.categories',
          subMenu: [
            { name: 'Category List', icon: <DocumentTextIcon />, route: 'inventory.categories.index', access: 'inventory.categories.category-list.view' },
            { name: 'Category Hierarchy', icon: <FolderIcon />, route: 'inventory.categories.hierarchy', access: 'inventory.categories.category-hierarchy.view' },
          ]
        },

        // 7.4 Warehouses
        {
          name: 'Warehouses',
          icon: <BuildingStorefrontIcon />,
          access: 'inventory.warehouses',
          subMenu: [
            { name: 'Warehouse List', icon: <BuildingStorefrontIcon />, route: 'inventory.warehouses.index', access: 'inventory.warehouses.warehouse-list.view' },
            { name: 'Bin Locations', icon: <MapPinIcon />, route: 'inventory.warehouses.bins', access: 'inventory.warehouses.bin-locations.view' },
            { name: 'Warehouse Managers', icon: <UserGroupIcon />, route: 'inventory.warehouses.managers', access: 'inventory.warehouses.warehouse-managers.view' },
            { name: 'Stock Capacity', icon: <ChartBarSquareIcon />, route: 'inventory.warehouses.capacity', access: 'inventory.warehouses.stock-capacity.view' },
          ]
        },

        // 7.5 Stock In / Stock Out
        {
          name: 'Stock In / Out',
          icon: <ArrowsRightLeftIcon />,
          access: 'inventory.stock-in-out',
          subMenu: [
            { name: 'Goods Receipt (GRN)', icon: <ArrowDownTrayIcon />, route: 'inventory.stock.grn', access: 'inventory.stock-in-out.grn-list.view' },
            { name: 'Stock Out / Deliveries', icon: <ArrowUpTrayIcon />, route: 'inventory.stock.out', access: 'inventory.stock-in-out.stock-out-list.view' },
            { name: 'Delivery Orders', icon: <TruckIcon />, route: 'inventory.stock.delivery-orders', access: 'inventory.stock-in-out.delivery-orders.view' },
            { name: 'Issue to Production', icon: <WrenchScrewdriverIcon />, route: 'inventory.stock.production-issue', access: 'inventory.stock-in-out.issue-to-production.view' },
            { name: 'Issue to Department', icon: <BuildingOffice2Icon />, route: 'inventory.stock.department-issue', access: 'inventory.stock-in-out.issue-to-department.view' },
          ]
        },

        // 7.6 Stock Transfers
        {
          name: 'Stock Transfers',
          icon: <ArrowPathIcon />,
          access: 'inventory.stock-transfers',
          subMenu: [
            { name: 'Transfer List', icon: <DocumentTextIcon />, route: 'inventory.transfers.index', access: 'inventory.stock-transfers.transfer-list.view' },
            { name: 'Pick List', icon: <ClipboardDocumentCheckIcon />, route: 'inventory.transfers.pick-list', access: 'inventory.stock-transfers.pick-list.view' },
          ]
        },

        // 7.7 Stock Adjustments
        {
          name: 'Stock Adjustments',
          icon: <AdjustmentsHorizontalIcon />,
          access: 'inventory.stock-adjustments',
          subMenu: [
            { name: 'Adjustment List', icon: <DocumentTextIcon />, route: 'inventory.adjustments.index', access: 'inventory.stock-adjustments.adjustment-list.view' },
            { name: 'Adjustment Reasons', icon: <TagIcon />, route: 'inventory.adjustments.reasons', access: 'inventory.stock-adjustments.adjustment-reasons.view' },
            { name: 'Audit Log', icon: <ShieldCheckIcon />, route: 'inventory.adjustments.audit', access: 'inventory.stock-adjustments.adjustment-audit-log.view' },
          ]
        },

        // 7.8 Batches / Lots / Serials
        {
          name: 'Batches / Serials',
          icon: <QueueListIcon />,
          access: 'inventory.batches-serials',
          subMenu: [
            { name: 'Batches / Lots', icon: <QueueListIcon />, route: 'inventory.batches.index', access: 'inventory.batches-serials.batch-list.view' },
            { name: 'Serial Numbers', icon: <DocumentTextIcon />, route: 'inventory.serials.index', access: 'inventory.batches-serials.serial-list.view' },
          ]
        },

        // 7.9 Barcodes
        {
          name: 'Barcodes',
          icon: <QrCodeIcon />,
          access: 'inventory.barcodes',
          subMenu: [
            { name: 'Barcode Generator', icon: <QrCodeIcon />, route: 'inventory.barcodes.index', access: 'inventory.barcodes.barcode-generator.view' },
            { name: 'QR Code Generator', icon: <QrCodeIcon />, route: 'inventory.barcodes.qr', access: 'inventory.barcodes.qr-code-generator.view' },
            { name: 'Label Printer Settings', icon: <Cog6ToothIcon />, route: 'inventory.barcodes.printer', access: 'inventory.barcodes.label-printer.view' },
          ]
        },

        // 7.10 Units of Measure
        {
          name: 'Units of Measure',
          icon: <ScaleIcon />,
          access: 'inventory.units-of-measure',
          subMenu: [
            { name: 'UoM List', icon: <DocumentTextIcon />, route: 'inventory.uom.index', access: 'inventory.units-of-measure.uom-list.view' },
            { name: 'UoM Conversions', icon: <ArrowsRightLeftIcon />, route: 'inventory.uom.conversions', access: 'inventory.units-of-measure.uom-conversions.view' },
          ]
        },

        // 7.11 Vendors
        {
          name: 'Vendors',
          icon: <TruckIcon />,
          access: 'inventory.vendors',
          subMenu: [
            { name: 'Vendor List', icon: <UserGroupIcon />, route: 'inventory.vendors.index', access: 'inventory.vendors.vendor-list.view' },
            { name: 'Vendor Price Lists', icon: <CurrencyDollarIcon />, route: 'inventory.vendors.prices', access: 'inventory.vendors.vendor-price-lists.view' },
            { name: 'Purchase History', icon: <ClockIcon />, route: 'inventory.vendors.history', access: 'inventory.vendors.vendor-purchase-history.view' },
          ]
        },

        // 7.12 Price Lists
        {
          name: 'Price Lists',
          icon: <CurrencyDollarIcon />,
          access: 'inventory.price-lists',
          subMenu: [
            { name: 'Price List Management', icon: <DocumentTextIcon />, route: 'inventory.price-lists.index', access: 'inventory.price-lists.price-list-list.view' },
            { name: 'Purchase Prices', icon: <ArrowDownTrayIcon />, route: 'inventory.price-lists.purchase', access: 'inventory.price-lists.purchase-price-list.view' },
            { name: 'Sales Prices', icon: <ArrowUpTrayIcon />, route: 'inventory.price-lists.sales', access: 'inventory.price-lists.sales-price-list.view' },
            { name: 'Discount Levels', icon: <ReceiptPercentIcon />, route: 'inventory.price-lists.discounts', access: 'inventory.price-lists.discount-levels.view' },
          ]
        },

        // 7.13 Reorder Rules
        {
          name: 'Reorder Rules',
          icon: <ArrowPathIcon />,
          access: 'inventory.reorder-rules',
          subMenu: [
            { name: 'Reorder Rules List', icon: <DocumentTextIcon />, route: 'inventory.reorder-rules.index', access: 'inventory.reorder-rules.reorder-rules-list.view' },
            { name: 'Purchase Recommendations', icon: <ShoppingBagIcon />, route: 'inventory.reorder-rules.recommendations', access: 'inventory.reorder-rules.purchase-recommendations.view' },
          ]
        },

        // 7.14 Stock Reports
        {
          name: 'Stock Reports',
          icon: <ChartBarSquareIcon />,
          access: 'inventory.stock-reports',
          subMenu: [
            { name: 'Stock Ledger', icon: <BookOpenIcon />, route: 'inventory.reports.ledger', access: 'inventory.stock-reports.stock-ledger.view' },
            { name: 'Item-wise Stock', icon: <CubeIcon />, route: 'inventory.reports.item-wise', access: 'inventory.stock-reports.item-wise-stock.view' },
            { name: 'Warehouse-wise Stock', icon: <BuildingStorefrontIcon />, route: 'inventory.reports.warehouse-wise', access: 'inventory.stock-reports.warehouse-wise-stock.view' },
            { name: 'Stock Valuation', icon: <CalculatorIcon />, route: 'inventory.reports.valuation', access: 'inventory.stock-reports.stock-valuation-report.view' },
            { name: 'Fast Movers', icon: <ArrowPathIcon />, route: 'inventory.reports.fast-moving', access: 'inventory.stock-reports.fast-moving-report.view' },
            { name: 'Slow Movers', icon: <ClockIcon />, route: 'inventory.reports.slow-moving', access: 'inventory.stock-reports.slow-moving-report.view' },
            { name: 'Dead Stock', icon: <ArchiveBoxIcon />, route: 'inventory.reports.dead-stock', access: 'inventory.stock-reports.dead-stock-report.view' },
            { name: 'Expiry Report', icon: <CalendarIcon />, route: 'inventory.reports.expiry', access: 'inventory.stock-reports.expiry-report.view' },
            { name: 'Serial Tracking', icon: <QueueListIcon />, route: 'inventory.reports.serial-tracking', access: 'inventory.stock-reports.serial-tracking-report.view' },
            { name: 'Cycle Count', icon: <DocumentCheckIcon />, route: 'inventory.reports.cycle-count', access: 'inventory.stock-reports.cycle-count-report.view' },
            { name: 'FIFO/LIFO Valuation', icon: <ScaleIcon />, route: 'inventory.reports.fifo-lifo', access: 'inventory.stock-reports.fifo-lifo-valuation.view' },
          ]
        },

        // 7.15 Settings
        {
          name: 'Settings',
          icon: <Cog6ToothIcon />,
          access: 'inventory.inventory-settings',
          category: 'settings',
          subMenu: [
            { name: 'Category Settings', icon: <FolderIcon />, route: 'inventory.settings.categories', access: 'inventory.inventory-settings.category-settings.view' },
            { name: 'Warehouse Settings', icon: <BuildingStorefrontIcon />, route: 'inventory.settings.warehouses', access: 'inventory.inventory-settings.warehouse-settings.view' },
            { name: 'Valuation Method', icon: <CalculatorIcon />, route: 'inventory.settings.valuation', access: 'inventory.inventory-settings.valuation-method.view' },
            { name: 'Stock Aging', icon: <ClockIcon />, route: 'inventory.settings.aging', access: 'inventory.inventory-settings.stock-aging.view' },
            { name: 'Default UoM', icon: <ScaleIcon />, route: 'inventory.settings.default-uom', access: 'inventory.inventory-settings.default-uom.view' },
            { name: 'Auto Codes', icon: <DocumentTextIcon />, route: 'inventory.settings.auto-codes', access: 'inventory.inventory-settings.auto-generated-codes.view' },
            { name: 'Barcode Settings', icon: <QrCodeIcon />, route: 'inventory.settings.barcodes', access: 'inventory.inventory-settings.barcode-settings.view' },
            { name: 'Adjustment Reasons', icon: <TagIcon />, route: 'inventory.settings.adjustment-reasons', access: 'inventory.inventory-settings.adjustment-reason-settings.view' },
            { name: 'Integrations', icon: <ArrowsRightLeftIcon />, route: 'inventory.settings.integrations', access: 'inventory.inventory-settings.integration-settings.view' },
          ]
        },
      ]
    },

    /*
    |--------------------------------------------------------------------------
    | 8. E-commerce Module (15 Submodules)
    | Matches: config/modules.php -> hierarchy -> ecommerce
    |--------------------------------------------------------------------------
    */
    {
      name: 'E-commerce',
      icon: <ShoppingCartIcon className="" />,
      module: 'ecommerce',
      access: 'ecommerce',
      priority: 60,
      subMenu: [
        // 8.1 Dashboard
        {
          name: 'Dashboard',
          icon: <ChartBarSquareIcon />,
          access: 'ecommerce.dashboard',
          subMenu: [
            { name: 'E-commerce Dashboard', icon: <HomeIcon />, route: 'ecommerce.dashboard.index', access: 'ecommerce.dashboard.ecommerce-dashboard.view' },
          ]
        },

        // 8.2 Catalog
        {
          name: 'Catalog',
          icon: <CubeIcon />,
          access: 'ecommerce.catalog',
          subMenu: [
            { name: 'Products (SKUs)', icon: <CubeIcon />, route: 'ecommerce.catalog.products', access: 'ecommerce.catalog.product-list.view' },
            { name: 'Product Variants', icon: <TagIcon />, route: 'ecommerce.catalog.variants', access: 'ecommerce.catalog.product-variants.view' },
            { name: 'Collections / Categories', icon: <FolderIcon />, route: 'ecommerce.catalog.collections', access: 'ecommerce.catalog.collections.view' },
            { name: 'Attributes', icon: <AdjustmentsHorizontalIcon />, route: 'ecommerce.catalog.attributes', access: 'ecommerce.catalog.attributes.view' },
            { name: 'Product Bundles', icon: <ArchiveBoxIcon />, route: 'ecommerce.catalog.bundles', access: 'ecommerce.catalog.product-bundles.view' },
            { name: 'Digital Products', icon: <ArrowDownTrayIcon />, route: 'ecommerce.catalog.digital', access: 'ecommerce.catalog.digital-products.view' },
            { name: 'Product Templates', icon: <DocumentDuplicateIcon />, route: 'ecommerce.catalog.templates', access: 'ecommerce.catalog.product-templates.view' },
          ]
        },

        // 8.3 Orders
        {
          name: 'Orders',
          icon: <ClipboardDocumentListIcon />,
          access: 'ecommerce.orders',
          subMenu: [
            { name: 'Order List', icon: <DocumentTextIcon />, route: 'ecommerce.orders.index', access: 'ecommerce.orders.order-list.view' },
            { name: 'Draft / Quote Orders', icon: <DocumentDuplicateIcon />, route: 'ecommerce.orders.drafts', access: 'ecommerce.orders.draft-orders.view' },
            { name: 'Fulfillment', icon: <TruckIcon />, route: 'ecommerce.orders.fulfillment', access: 'ecommerce.orders.fulfillment.view' },
            { name: 'Manual Order Entry', icon: <DocumentPlusIcon />, route: 'ecommerce.orders.manual', access: 'ecommerce.orders.manual-entry.view' },
          ]
        },

        // 8.4 Customers
        {
          name: 'Customers',
          icon: <UserGroupIcon />,
          access: 'ecommerce.customers',
          subMenu: [
            { name: 'Customer Directory', icon: <UserGroupIcon />, route: 'ecommerce.customers.index', access: 'ecommerce.customers.customer-list.view' },
            { name: 'Customer Groups', icon: <UsersIcon />, route: 'ecommerce.customers.groups', access: 'ecommerce.customers.customer-groups.view' },
            { name: 'Loyalty Points', icon: <StarIcon />, route: 'ecommerce.customers.loyalty', access: 'ecommerce.customers.loyalty-points.view' },
          ]
        },

        // 8.5 Cart & Checkout
        {
          name: 'Cart & Checkout',
          icon: <ShoppingCartIcon />,
          access: 'ecommerce.cart-checkout',
          subMenu: [
            { name: 'Cart Management', icon: <ShoppingCartIcon />, route: 'ecommerce.cart-checkout.carts', access: 'ecommerce.cart-checkout.cart-management.view' },
            { name: 'Checkout Configuration', icon: <Cog6ToothIcon />, route: 'ecommerce.cart-checkout.config', access: 'ecommerce.cart-checkout.checkout-config.view' },
            { name: 'Address Validation', icon: <MapPinIcon />, route: 'ecommerce.cart-checkout.address-validation', access: 'ecommerce.cart-checkout.address-validation.view' },
            { name: 'Multi-Shipping', icon: <TruckIcon />, route: 'ecommerce.cart-checkout.multi-shipping', access: 'ecommerce.cart-checkout.multi-shipping.view' },
            { name: 'Tax Calculation', icon: <ReceiptPercentIcon />, route: 'ecommerce.cart-checkout.tax', access: 'ecommerce.cart-checkout.tax-hooks.view' },
          ]
        },

        // 8.6 Promotions & Discounts
        {
          name: 'Promotions',
          icon: <GiftIcon />,
          access: 'ecommerce.promotions',
          subMenu: [
            { name: 'Coupons', icon: <TicketIcon />, route: 'ecommerce.promotions.coupons', access: 'ecommerce.promotions.coupon-list.view' },
            { name: 'Automatic Discounts', icon: <ReceiptPercentIcon />, route: 'ecommerce.promotions.automatic', access: 'ecommerce.promotions.automatic-discounts.view' },
            { name: 'BOGO / Bundle Promos', icon: <GiftIcon />, route: 'ecommerce.promotions.bogo', access: 'ecommerce.promotions.bogo-promotions.view' },
            { name: 'Campaign Scheduling', icon: <CalendarIcon />, route: 'ecommerce.promotions.campaigns', access: 'ecommerce.promotions.campaign-scheduling.view' },
            { name: 'Stacking Rules', icon: <AdjustmentsHorizontalIcon />, route: 'ecommerce.promotions.stacking', access: 'ecommerce.promotions.stacking-rules.view' },
          ]
        },

        // 8.7 Pricing & Price Lists
        {
          name: 'Pricing',
          icon: <CurrencyDollarIcon />,
          access: 'ecommerce.pricing',
          subMenu: [
            { name: 'Base Pricing', icon: <CurrencyDollarIcon />, route: 'ecommerce.pricing.base', access: 'ecommerce.pricing.base-pricing.view' },
            { name: 'Tiered Pricing', icon: <ChartBarSquareIcon />, route: 'ecommerce.pricing.tiered', access: 'ecommerce.pricing.tiered-pricing.view' },
            { name: 'Customer Price Lists', icon: <UserGroupIcon />, route: 'ecommerce.pricing.customer-lists', access: 'ecommerce.pricing.customer-price-lists.view' },
            { name: 'Multi-Currency', icon: <BanknotesIcon />, route: 'ecommerce.pricing.currency', access: 'ecommerce.pricing.multi-currency.view' },
            { name: 'Price History', icon: <ClockIcon />, route: 'ecommerce.pricing.history', access: 'ecommerce.pricing.price-history.view' },
          ]
        },

        // 8.8 Shipping & Fulfillment
        {
          name: 'Shipping',
          icon: <TruckIcon />,
          access: 'ecommerce.shipping',
          subMenu: [
            { name: 'Shipping Methods', icon: <TruckIcon />, route: 'ecommerce.shipping.methods', access: 'ecommerce.shipping.shipping-methods.view' },
            { name: 'Carrier Integrations', icon: <ArrowsRightLeftIcon />, route: 'ecommerce.shipping.carriers', access: 'ecommerce.shipping.carrier-integrations.view' },
            { name: 'Shipments & Labels', icon: <DocumentTextIcon />, route: 'ecommerce.shipping.shipments', access: 'ecommerce.shipping.shipment-creation.view' },
            { name: 'Rate Calculator', icon: <CalculatorIcon />, route: 'ecommerce.shipping.rate-calculator', access: 'ecommerce.shipping.rate-calculator.view' },
            { name: 'Fulfillment Centers', icon: <BuildingStorefrontIcon />, route: 'ecommerce.shipping.fulfillment-centers', access: 'ecommerce.shipping.fulfillment-centers.view' },
          ]
        },

        // 8.9 Payments
        {
          name: 'Payments',
          icon: <CreditCardIcon />,
          access: 'ecommerce.payments',
          subMenu: [
            { name: 'Payment Gateways', icon: <CreditCardIcon />, route: 'ecommerce.payments.gateways', access: 'ecommerce.payments.payment-gateways.view' },
            { name: 'Transactions', icon: <BanknotesIcon />, route: 'ecommerce.payments.transactions', access: 'ecommerce.payments.payment-transactions.view' },
            { name: 'Refunds', icon: <ArrowUturnLeftIcon />, route: 'ecommerce.payments.refunds', access: 'ecommerce.payments.refunds.view' },
            { name: 'Fraud Checks', icon: <ShieldCheckIcon />, route: 'ecommerce.payments.fraud', access: 'ecommerce.payments.fraud-checks.view' },
            { name: 'Stored Methods', icon: <CreditCardIcon />, route: 'ecommerce.payments.stored-methods', access: 'ecommerce.payments.stored-payment-methods.view' },
          ]
        },

        // 8.10 Inventory Integration
        {
          name: 'Inventory Integration',
          icon: <ArrowsRightLeftIcon />,
          access: 'ecommerce.inventory-integration',
          subMenu: [
            { name: 'SKU Sync', icon: <ArrowPathIcon />, route: 'ecommerce.inventory-integration.sync', access: 'ecommerce.inventory-integration.sku-sync.view' },
            { name: 'Backorder Rules', icon: <ClockIcon />, route: 'ecommerce.inventory-integration.backorder', access: 'ecommerce.inventory-integration.backorder-rules.view' },
            { name: 'Safety Stock', icon: <ShieldCheckIcon />, route: 'ecommerce.inventory-integration.safety-stock', access: 'ecommerce.inventory-integration.safety-stock.view' },
            { name: 'Integration Adapters', icon: <ArrowsRightLeftIcon />, route: 'ecommerce.inventory-integration.adapters', access: 'ecommerce.inventory-integration.integration-adapters.view' },
          ]
        },

        // 8.11 Returns & RMA
        {
          name: 'Returns & RMA',
          icon: <ArrowUturnLeftIcon />,
          access: 'ecommerce.returns-rma',
          subMenu: [
            { name: 'RMA Requests', icon: <DocumentTextIcon />, route: 'ecommerce.returns.index', access: 'ecommerce.returns-rma.rma-list.view' },
            { name: 'Authorization Workflow', icon: <ShieldCheckIcon />, route: 'ecommerce.returns.authorization', access: 'ecommerce.returns-rma.return-authorization.view' },
            { name: 'Refund / Exchange', icon: <ArrowsRightLeftIcon />, route: 'ecommerce.returns.process', access: 'ecommerce.returns-rma.refund-exchange.view' },
            { name: 'RMA Audit Trail', icon: <ClipboardDocumentCheckIcon />, route: 'ecommerce.returns.audit', access: 'ecommerce.returns-rma.rma-audit.view' },
          ]
        },

        // 8.12 Reviews & Ratings
        {
          name: 'Reviews & Ratings',
          icon: <StarIcon />,
          access: 'ecommerce.reviews',
          subMenu: [
            { name: 'Moderation Queue', icon: <DocumentCheckIcon />, route: 'ecommerce.reviews.index', access: 'ecommerce.reviews.review-list.view' },
            { name: 'Rating Aggregation', icon: <ChartBarSquareIcon />, route: 'ecommerce.reviews.ratings', access: 'ecommerce.reviews.rating-aggregation.view' },
            { name: 'Review Widgets', icon: <ComputerDesktopIcon />, route: 'ecommerce.reviews.widgets', access: 'ecommerce.reviews.review-widgets.view' },
          ]
        },

        // 8.13 Storefront / CMS
        {
          name: 'Storefront / CMS',
          icon: <ComputerDesktopIcon />,
          access: 'ecommerce.storefront',
          subMenu: [
            { name: 'Page Management', icon: <DocumentTextIcon />, route: 'ecommerce.storefront.pages', access: 'ecommerce.storefront.page-management.view' },
            { name: 'Static Pages', icon: <DocumentDuplicateIcon />, route: 'ecommerce.storefront.static', access: 'ecommerce.storefront.static-pages.view' },
            { name: 'Banners', icon: <MegaphoneIcon />, route: 'ecommerce.storefront.banners', access: 'ecommerce.storefront.banners.view' },
            { name: 'SEO Meta', icon: <GlobeAltIcon />, route: 'ecommerce.storefront.seo', access: 'ecommerce.storefront.seo-management.view' },
            { name: 'Multi-Store / Language', icon: <GlobeAltIcon />, route: 'ecommerce.storefront.multi-store', access: 'ecommerce.storefront.multi-store.view' },
            { name: 'Theme Settings', icon: <Cog6ToothIcon />, route: 'ecommerce.storefront.theme', access: 'ecommerce.storefront.theme-settings.view' },
            { name: 'Widgets & Blocks', icon: <ViewColumnsIcon />, route: 'ecommerce.storefront.widgets', access: 'ecommerce.storefront.widgets-blocks.view' },
          ]
        },

        // 8.14 Analytics & Reports
        {
          name: 'Analytics & Reports',
          icon: <ChartBarSquareIcon />,
          access: 'ecommerce.analytics',
          subMenu: [
            { name: 'Sales Reports', icon: <ChartBarSquareIcon />, route: 'ecommerce.analytics.sales', access: 'ecommerce.analytics.sales-reports.view' },
            { name: 'Customer LTV', icon: <UserGroupIcon />, route: 'ecommerce.analytics.ltv', access: 'ecommerce.analytics.customer-ltv.view' },
            { name: 'Conversion Funnel', icon: <ChartPieIcon />, route: 'ecommerce.analytics.conversion', access: 'ecommerce.analytics.conversion-funnel.view' },
            { name: 'Refund Reports', icon: <ArrowUturnLeftIcon />, route: 'ecommerce.analytics.refunds', access: 'ecommerce.analytics.refund-reports.view' },
            { name: 'Tax Reports', icon: <ReceiptPercentIcon />, route: 'ecommerce.analytics.tax', access: 'ecommerce.analytics.tax-reports.view' },
          ]
        },

        // 8.15 Settings & Integrations
        {
          name: 'Settings',
          icon: <Cog6ToothIcon />,
          access: 'ecommerce.ecommerce-settings',
          category: 'settings',
          subMenu: [
            { name: 'Store Settings', icon: <BuildingStorefrontIcon />, route: 'ecommerce.settings.store', access: 'ecommerce.ecommerce-settings.store-settings.view' },
            { name: 'Currencies & Tax Zones', icon: <CurrencyDollarIcon />, route: 'ecommerce.settings.currency-tax', access: 'ecommerce.ecommerce-settings.currency-tax-zones.view' },
            { name: 'Webhooks & API Keys', icon: <ArrowsRightLeftIcon />, route: 'ecommerce.settings.webhooks', access: 'ecommerce.ecommerce-settings.webhooks.view' },
            { name: 'Channel Management', icon: <GlobeAltIcon />, route: 'ecommerce.settings.channels', access: 'ecommerce.ecommerce-settings.channel-management.view' },
            { name: 'GDPR / Privacy', icon: <ShieldCheckIcon />, route: 'ecommerce.settings.gdpr', access: 'ecommerce.ecommerce-settings.gdpr-privacy.view' },
            { name: 'Analytics Tracking', icon: <ChartPieIcon />, route: 'ecommerce.settings.tracking', access: 'ecommerce.ecommerce-settings.analytics-tracking.view' },
            { name: 'API Documentation', icon: <DocumentTextIcon />, route: 'ecommerce.settings.api-docs', access: 'ecommerce.ecommerce-settings.api-docs.view' },
          ]
        },
      ]
    },

    // 9. Analytics
    {
      name: 'Analytics',
      icon: <PresentationChartLineIcon className="" />,
      priority: 85,
      module: 'analytics',
      access: 'analytics',
      subMenu: [
        // 9.1 Overview Dashboard
        {
          name: 'Dashboard',
          icon: <ChartPieIcon />,
          access: 'analytics.overview-dashboard',
          subMenu: [
            { name: 'Dashboard Overview', icon: <ChartPieIcon />, route: 'analytics.dashboard.index', access: 'analytics.overview-dashboard.dashboard.view' },
            { name: 'Sales Summary', icon: <CurrencyDollarIcon />, route: 'analytics.dashboard.sales', access: 'analytics.overview-dashboard.sales-summary.view' },
            { name: 'Revenue KPIs', icon: <ArrowTrendingUpIcon />, route: 'analytics.dashboard.revenue-kpis', access: 'analytics.overview-dashboard.revenue-kpis.view' },
            { name: 'Retention Overview', icon: <ArrowPathIcon />, route: 'analytics.dashboard.retention', access: 'analytics.overview-dashboard.retention-overview.view' },
            { name: 'Geo Distribution', icon: <GlobeAltIcon />, route: 'analytics.dashboard.geo', access: 'analytics.overview-dashboard.geo-distribution.view' },
            { name: 'Real-Time', icon: <ClockIcon />, route: 'analytics.dashboard.realtime', access: 'analytics.overview-dashboard.real-time.view' },
          ]
        },
        // 9.2 Acquisition Analytics
        {
          name: 'Acquisition',
          icon: <ArrowTrendingUpIcon />,
          access: 'analytics.acquisition',
          subMenu: [
            { name: 'Traffic Sources', icon: <GlobeAltIcon />, route: 'analytics.acquisition.traffic', access: 'analytics.acquisition.traffic-sources.view' },
            { name: 'Campaign Performance', icon: <MegaphoneIcon />, route: 'analytics.acquisition.campaigns', access: 'analytics.acquisition.campaign-performance.view' },
            { name: 'UTM Tracking', icon: <TagIcon />, route: 'analytics.acquisition.utm', access: 'analytics.acquisition.utm-tracking.view' },
            { name: 'New vs Returning', icon: <UsersIcon />, route: 'analytics.acquisition.new-returning', access: 'analytics.acquisition.new-vs-returning.view' },
            { name: 'Geographic Breakdown', icon: <MapPinIcon />, route: 'analytics.acquisition.geo', access: 'analytics.acquisition.geo-breakdown.view' },
            { name: 'Device Breakdown', icon: <ComputerDesktopIcon />, route: 'analytics.acquisition.devices', access: 'analytics.acquisition.device-breakdown.view' },
          ]
        },
        // 9.3 Behavior Analytics
        {
          name: 'Behavior',
          icon: <CursorArrowRaysIcon />,
          access: 'analytics.behavior',
          subMenu: [
            { name: 'Page Views', icon: <DocumentTextIcon />, route: 'analytics.behavior.pageviews', access: 'analytics.behavior.page-views.view' },
            { name: 'Heatmaps', icon: <ChartPieIcon />, route: 'analytics.behavior.heatmaps', access: 'analytics.behavior.heatmaps.view' },
            { name: 'Scroll & Click', icon: <CursorArrowRaysIcon />, route: 'analytics.behavior.scroll-click', access: 'analytics.behavior.scroll-click.view' },
            { name: 'Event Stream', icon: <QueueListIcon />, route: 'analytics.behavior.event-stream', access: 'analytics.behavior.event-stream.view' },
            { name: 'Event Explorer', icon: <MagnifyingGlassIcon />, route: 'analytics.behavior.event-explorer', access: 'analytics.behavior.event-explorer.view' },
            { name: 'Event Funnels', icon: <FunnelIcon />, route: 'analytics.behavior.event-funnels', access: 'analytics.behavior.event-funnels.view' },
          ]
        },
        // 9.4 Conversion Analytics
        {
          name: 'Conversion',
          icon: <FunnelIcon />,
          access: 'analytics.conversion',
          subMenu: [
            { name: 'Funnel Analysis', icon: <FunnelIcon />, route: 'analytics.conversion.funnel', access: 'analytics.conversion.funnel-analysis.view' },
            { name: 'Checkout Conversion', icon: <ShoppingCartIcon />, route: 'analytics.conversion.checkout', access: 'analytics.conversion.checkout-conversion.view' },
            { name: 'Feature Adoption', icon: <CubeIcon />, route: 'analytics.conversion.feature-adoption', access: 'analytics.conversion.feature-adoption.view' },
            { name: 'Drop-off Analysis', icon: <ExclamationTriangleIcon />, route: 'analytics.conversion.dropoff', access: 'analytics.conversion.drop-off.view' },
            { name: 'A/B Test Results', icon: <BeakerIcon />, route: 'analytics.conversion.ab-tests', access: 'analytics.conversion.ab-test-results.view' },
          ]
        },
        // 9.5 Revenue & Finance Analytics
        {
          name: 'Revenue & Finance',
          icon: <BanknotesIcon />,
          access: 'analytics.revenue-finance',
          subMenu: [
            { name: 'MRR / ARR', icon: <ArrowTrendingUpIcon />, route: 'analytics.revenue.mrr-arr', access: 'analytics.revenue-finance.mrr-arr.view' },
            { name: 'LTV Analysis', icon: <CurrencyDollarIcon />, route: 'analytics.revenue.ltv', access: 'analytics.revenue-finance.ltv-analysis.view' },
            { name: 'Cohort Revenue', icon: <UsersIcon />, route: 'analytics.revenue.cohort', access: 'analytics.revenue-finance.cohort-revenue.view' },
            { name: 'ARPU Tracking', icon: <UserIcon />, route: 'analytics.revenue.arpu', access: 'analytics.revenue-finance.arpu-tracking.view' },
            { name: 'Churn Revenue', icon: <ExclamationTriangleIcon />, route: 'analytics.revenue.churn', access: 'analytics.revenue-finance.churn-revenue.view' },
            { name: 'Refunds & Disputes', icon: <ArrowUturnLeftIcon />, route: 'analytics.revenue.refunds', access: 'analytics.revenue-finance.refunds-disputes.view' },
            { name: 'Tax Analytics', icon: <ReceiptPercentIcon />, route: 'analytics.revenue.tax', access: 'analytics.revenue-finance.tax-analytics.view' },
            { name: 'Profitability', icon: <ChartBarSquareIcon />, route: 'analytics.revenue.profitability', access: 'analytics.revenue-finance.profitability.view' },
          ]
        },
        // 9.6 Product Analytics
        {
          name: 'Product Analytics',
          icon: <CubeIcon />,
          access: 'analytics.product-analytics',
          subMenu: [
            { name: 'Feature Usage', icon: <CubeIcon />, route: 'analytics.product.feature-usage', access: 'analytics.product-analytics.feature-usage.view' },
            { name: 'Module Adoption', icon: <ViewColumnsIcon />, route: 'analytics.product.module-adoption', access: 'analytics.product-analytics.module-adoption.view' },
            { name: 'Engagement Time', icon: <ClockIcon />, route: 'analytics.product.engagement', access: 'analytics.product-analytics.engagement-time.view' },
            { name: 'Power Users', icon: <StarIcon />, route: 'analytics.product.power-users', access: 'analytics.product-analytics.power-users.view' },
            { name: 'Stickiness Metrics', icon: <ArrowPathIcon />, route: 'analytics.product.stickiness', access: 'analytics.product-analytics.stickiness.view' },
          ]
        },
        // 9.7 Customer Analytics
        {
          name: 'Customer Analytics',
          icon: <UserGroupIcon />,
          access: 'analytics.customers',
          subMenu: [
            { name: 'Customer Segments', icon: <UsersIcon />, route: 'analytics.customer.segments', access: 'analytics.customers.segments.view' },
            { name: 'Cohort Analysis', icon: <UserGroupIcon />, route: 'analytics.customer.cohorts', access: 'analytics.customers.cohorts.view' },
            { name: 'RFM Analysis', icon: <ChartBarSquareIcon />, route: 'analytics.customer.rfm', access: 'analytics.customers.rfm-analysis.view' },
            { name: 'User Journeys', icon: <ArrowPathIcon />, route: 'analytics.customer.journeys', access: 'analytics.customers.user-journeys.view' },
            { name: 'Churn Prediction', icon: <ExclamationTriangleIcon />, route: 'analytics.customer.churn-prediction', access: 'analytics.customers.churn-prediction.view' },
            { name: 'Inactive Users', icon: <UserIcon />, route: 'analytics.customer.inactive', access: 'analytics.customers.inactive-users.view' },
          ]
        },
        // 9.8 Operational Analytics
        {
          name: 'Operational',
          icon: <ClipboardDocumentCheckIcon />,
          access: 'analytics.operations',
          subMenu: [
            { name: 'SLA Compliance', icon: <ShieldCheckIcon />, route: 'analytics.operational.sla', access: 'analytics.operations.sla-compliance.view' },
            { name: 'Support Performance', icon: <TicketIcon />, route: 'analytics.operational.support', access: 'analytics.operations.support-performance.view' },
            { name: 'ERP KPIs', icon: <CalculatorIcon />, route: 'analytics.operational.erp-kpis', access: 'analytics.operations.erp-kpis.view' },
            { name: 'Fulfillment Metrics', icon: <TruckIcon />, route: 'analytics.operational.fulfillment', access: 'analytics.operations.fulfillment-metrics.view' },
            { name: 'HR Analytics', icon: <UserGroupIcon />, route: 'analytics.operational.hr', access: 'analytics.operations.hr-analytics.view' },
          ]
        },
        // 9.9 Custom Reports
        {
          name: 'Custom Reports',
          icon: <PresentationChartBarIcon />,
          access: 'analytics.custom-reports',
          subMenu: [
            { name: 'Report Builder', icon: <WrenchScrewdriverIcon />, route: 'analytics.reports.builder', access: 'analytics.custom-reports.report-builder.view' },
            { name: 'Dimensions & Metrics', icon: <QueueListIcon />, route: 'analytics.reports.dimensions', access: 'analytics.custom-reports.dimensions-metrics.view' },
            { name: 'Filters & Segments', icon: <AdjustmentsHorizontalIcon />, route: 'analytics.reports.filters', access: 'analytics.custom-reports.filters-segments.view' },
            { name: 'Chart Types', icon: <ChartPieIcon />, route: 'analytics.reports.charts', access: 'analytics.custom-reports.chart-types.view' },
            { name: 'Save & Share', icon: <DocumentDuplicateIcon />, route: 'analytics.reports.share', access: 'analytics.custom-reports.save-share.view' },
            { name: 'Export Reports', icon: <ArrowUpTrayIcon />, route: 'analytics.reports.export', access: 'analytics.custom-reports.export-reports.view' },
          ]
        },
        // 9.10 Scheduled Reports
        {
          name: 'Scheduled Reports',
          icon: <CalendarDaysIcon />,
          access: 'analytics.scheduled-reports',
          subMenu: [
            { name: 'Report Scheduling', icon: <CalendarIcon />, route: 'analytics.scheduled.manage', access: 'analytics.scheduled-reports.report-scheduling.view' },
            { name: 'Email Reports', icon: <EnvelopeIcon />, route: 'analytics.scheduled.email', access: 'analytics.scheduled-reports.email-reports.view' },
            { name: 'Slack / Telegram', icon: <PhoneIcon />, route: 'analytics.scheduled.messaging', access: 'analytics.scheduled-reports.slack-telegram.view' },
            { name: 'Cron Triggers', icon: <ClockIcon />, route: 'analytics.scheduled.cron', access: 'analytics.scheduled-reports.cron-triggers.view' },
          ]
        },
        // 9.11 Data Explorer
        {
          name: 'Data Explorer',
          icon: <MagnifyingGlassIcon />,
          access: 'analytics.data-explorer',
          subMenu: [
            { name: 'SQL Query Runner', icon: <DocumentTextIcon />, route: 'analytics.explorer.sql', access: 'analytics.data-explorer.sql-runner.view' },
            { name: 'Visual Query', icon: <ViewColumnsIcon />, route: 'analytics.explorer.visual', access: 'analytics.data-explorer.visual-builder.view' },
            { name: 'Datasets', icon: <ArchiveBoxIcon />, route: 'analytics.explorer.datasets', access: 'analytics.data-explorer.dataset-picker.view' },
            { name: 'Saved Queries', icon: <DocumentDuplicateIcon />, route: 'analytics.explorer.saved', access: 'analytics.data-explorer.saved-queries.view' },
          ]
        },
        // 9.12 Integrations
        {
          name: 'Integrations',
          icon: <ArrowsRightLeftIcon />,
          access: 'analytics.integrations',
          subMenu: [
            { name: 'Google Analytics', icon: <ChartBarSquareIcon />, route: 'analytics.integrations.google', access: 'analytics.integrations.google-analytics.view' },
            { name: 'Meta Pixel', icon: <GlobeAltIcon />, route: 'analytics.integrations.meta', access: 'analytics.integrations.meta-pixel.view' },
            { name: 'Segment', icon: <CubeIcon />, route: 'analytics.integrations.segment', access: 'analytics.integrations.segment.view' },
            { name: 'Mixpanel', icon: <ChartPieIcon />, route: 'analytics.integrations.mixpanel', access: 'analytics.integrations.mixpanel.view' },
            { name: 'Data Warehouses', icon: <BuildingLibraryIcon />, route: 'analytics.integrations.warehouses', access: 'analytics.integrations.warehouse-sync.view' },
            { name: 'Webhooks', icon: <ArrowsRightLeftIcon />, route: 'analytics.integrations.webhooks', access: 'analytics.integrations.webhooks.view' },
          ]
        },
        // 9.13 Analytics Settings
        {
          name: 'Settings',
          icon: <Cog6ToothIcon />,
          access: 'analytics.analytics-settings',
          subMenu: [
            { name: 'Event Naming', icon: <TagIcon />, route: 'analytics.settings.events', access: 'analytics.analytics-settings.event-naming.view' },
            { name: 'Funnel Definitions', icon: <FunnelIcon />, route: 'analytics.settings.funnels', access: 'analytics.analytics-settings.funnel-definitions.view' },
            { name: 'Attribution Models', icon: <ArrowPathIcon />, route: 'analytics.settings.attribution', access: 'analytics.analytics-settings.attribution-models.view' },
            { name: 'Retention Rules', icon: <ClockIcon />, route: 'analytics.settings.retention', access: 'analytics.analytics-settings.retention-rules.view' },
            { name: 'Data Sampling', icon: <AdjustmentsHorizontalIcon />, route: 'analytics.settings.sampling', access: 'analytics.analytics-settings.data-sampling.view' },
            { name: 'Anomaly Detection', icon: <ExclamationTriangleIcon />, route: 'analytics.settings.anomaly', access: 'analytics.analytics-settings.anomaly-detection.view' },
          ]
        },
      ]
    },

    // 10. Integrations
    {
      name: 'Integrations',
      icon: <ArrowsRightLeftIcon className="" />,
      priority: 86,
      module: 'integrations',
      access: 'integrations',
      subMenu: [
        // 10.1 Third-Party Connectors
        {
          name: 'Third-Party Connectors',
          icon: <LinkIcon />,
          access: 'integrations.third-party-connectors',
          subMenu: [
            { name: 'Connector Dashboard', icon: <LinkIcon />, route: 'integrations.connectors.index', access: 'integrations.third-party-connectors.connector-dashboard.view' },
            { name: 'Payment Gateways', icon: <CreditCardIcon />, route: 'integrations.connectors.payments', access: 'integrations.third-party-connectors.payment-gateways.view' },
            { name: 'Stripe', icon: <CreditCardIcon />, route: 'integrations.connectors.payments.stripe', access: 'integrations.third-party-connectors.stripe-config.view' },
            { name: 'PayPal', icon: <CreditCardIcon />, route: 'integrations.connectors.payments.paypal', access: 'integrations.third-party-connectors.paypal-config.view' },
            { name: 'SSLCOMMERZ', icon: <CreditCardIcon />, route: 'integrations.connectors.payments.sslcommerz', access: 'integrations.third-party-connectors.sslcommerz-config.view' },
            { name: 'bKash/Nagad', icon: <PhoneIcon />, route: 'integrations.connectors.payments.mobile-wallet', access: 'integrations.third-party-connectors.bkash-nagad-config.view' },
            { name: 'Communication Providers', icon: <EnvelopeIcon />, route: 'integrations.connectors.communication', access: 'integrations.third-party-connectors.communication-providers.view' },
            { name: 'SMTP Email', icon: <EnvelopeIcon />, route: 'integrations.connectors.communication.smtp', access: 'integrations.third-party-connectors.smtp-email.view' },
            { name: 'SMS Providers', icon: <PhoneIcon />, route: 'integrations.connectors.communication.sms', access: 'integrations.third-party-connectors.sms-providers.view' },
            { name: 'WhatsApp', icon: <ChatBubbleLeftRightIcon />, route: 'integrations.connectors.communication.whatsapp', access: 'integrations.third-party-connectors.whatsapp-config.view' },
            { name: 'Cloud Storage', icon: <CloudIcon />, route: 'integrations.connectors.storage', access: 'integrations.third-party-connectors.cloud-storage.view' },
            { name: 'AWS S3', icon: <CloudIcon />, route: 'integrations.connectors.storage.s3', access: 'integrations.third-party-connectors.aws-s3-config.view' },
            { name: 'Google Cloud', icon: <CloudIcon />, route: 'integrations.connectors.storage.gcs', access: 'integrations.third-party-connectors.gcs-config.view' },
          ]
        },
        // 10.2 Productivity Integrations
        {
          name: 'Productivity',
          icon: <CalendarDaysIcon />,
          access: 'integrations.productivity-integrations',
          subMenu: [
            { name: 'Productivity Dashboard', icon: <CalendarDaysIcon />, route: 'integrations.productivity.index', access: 'integrations.productivity-integrations.productivity-dashboard.view' },
            { name: 'Google Workspace', icon: <GlobeAltIcon />, route: 'integrations.productivity.google', access: 'integrations.productivity-integrations.google-workspace.view' },
            { name: 'Microsoft 365', icon: <ComputerDesktopIcon />, route: 'integrations.productivity.microsoft', access: 'integrations.productivity-integrations.microsoft-365.view' },
            { name: 'Slack', icon: <ChatBubbleLeftRightIcon />, route: 'integrations.productivity.slack', access: 'integrations.productivity-integrations.slack-integration.view' },
            { name: 'Microsoft Teams', icon: <ChatBubbleLeftRightIcon />, route: 'integrations.productivity.teams', access: 'integrations.productivity-integrations.teams-integration.view' },
          ]
        },
        // 10.3 API & Webhooks
        {
          name: 'API & Webhooks',
          icon: <KeyIcon />,
          access: 'integrations.api-webhooks',
          subMenu: [
            { name: 'API Dashboard', icon: <KeyIcon />, route: 'integrations.api.index', access: 'integrations.api-webhooks.api-dashboard.view' },
            { name: 'API Keys', icon: <KeyIcon />, route: 'integrations.api.keys', access: 'integrations.api-webhooks.api-keys.view' },
            { name: 'Outgoing Webhooks', icon: <ArrowUpTrayIcon />, route: 'integrations.api.webhooks', access: 'integrations.api-webhooks.outgoing-webhooks.view' },
            { name: 'Webhook Events', icon: <TagIcon />, route: 'integrations.api.webhooks.events', access: 'integrations.api-webhooks.webhook-events.view' },
            { name: 'Delivery Logs', icon: <DocumentTextIcon />, route: 'integrations.api.webhooks.logs', access: 'integrations.api-webhooks.webhook-delivery-logs.view' },
            { name: 'Incoming Webhooks', icon: <ArrowDownTrayIcon />, route: 'integrations.api.incoming', access: 'integrations.api-webhooks.incoming-webhooks.view' },
          ]
        },
        // 10.4 Data Sync Engines
        {
          name: 'Data Sync',
          icon: <ServerStackIcon />,
          access: 'integrations.data-sync',
          subMenu: [
            { name: 'Sync Dashboard', icon: <ArrowPathIcon />, route: 'integrations.sync.index', access: 'integrations.data-sync.sync-dashboard.view' },
            { name: 'CRM Sync', icon: <UsersIcon />, route: 'integrations.sync.crm', access: 'integrations.data-sync.crm-sync.view' },
            { name: 'HubSpot', icon: <UsersIcon />, route: 'integrations.sync.crm.hubspot', access: 'integrations.data-sync.hubspot-sync.view' },
            { name: 'Zoho CRM', icon: <UsersIcon />, route: 'integrations.sync.crm.zoho', access: 'integrations.data-sync.zoho-sync.view' },
            { name: 'Salesforce', icon: <UsersIcon />, route: 'integrations.sync.crm.salesforce', access: 'integrations.data-sync.salesforce-sync.view' },
            { name: 'E-commerce Sync', icon: <ShoppingCartIcon />, route: 'integrations.sync.ecommerce', access: 'integrations.data-sync.ecommerce-sync.view' },
            { name: 'Shopify', icon: <ShoppingCartIcon />, route: 'integrations.sync.ecommerce.shopify', access: 'integrations.data-sync.shopify-sync.view' },
            { name: 'WooCommerce', icon: <ShoppingCartIcon />, route: 'integrations.sync.ecommerce.woocommerce', access: 'integrations.data-sync.woocommerce-sync.view' },
            { name: 'Accounting Sync', icon: <CalculatorIcon />, route: 'integrations.sync.accounting', access: 'integrations.data-sync.accounting-sync.view' },
            { name: 'QuickBooks', icon: <CalculatorIcon />, route: 'integrations.sync.accounting.quickbooks', access: 'integrations.data-sync.quickbooks-sync.view' },
            { name: 'Xero', icon: <CalculatorIcon />, route: 'integrations.sync.accounting.xero', access: 'integrations.data-sync.xero-sync.view' },
          ]
        },
        // 10.5 Developer Tools
        {
          name: 'Developer Tools',
          icon: <WrenchScrewdriverIcon />,
          access: 'integrations.developer-tools',
          subMenu: [
            { name: 'Developer Dashboard', icon: <WrenchScrewdriverIcon />, route: 'integrations.developer.index', access: 'integrations.developer-tools.dev-dashboard.view' },
            { name: 'Webhook Tester', icon: <BeakerIcon />, route: 'integrations.developer.webhook-tester', access: 'integrations.developer-tools.webhook-tester.view' },
            { name: 'API Playground', icon: <ComputerDesktopIcon />, route: 'integrations.developer.api-playground', access: 'integrations.developer-tools.api-playground.view' },
            { name: 'API Documentation', icon: <DocumentTextIcon />, route: 'integrations.developer.docs', access: 'integrations.developer-tools.api-docs-viewer.view' },
            { name: 'Integration Logs', icon: <DocumentTextIcon />, route: 'integrations.developer.logs', access: 'integrations.developer-tools.integration-logs.view' },
            { name: 'Request Inspector', icon: <MagnifyingGlassIcon />, route: 'integrations.developer.inspector', access: 'integrations.developer-tools.request-inspector.view' },
          ]
        },
      ]
    },

    /*
    |--------------------------------------------------------------------------
    | Section 11 - Support & Ticketing
    |--------------------------------------------------------------------------
    | Help desk, ticket management, knowledge base, SLA management,
    | multi-channel support, and customer feedback
    */
    {
      name: 'Support & Ticketing',
      icon: <TicketIcon className="" />,
      priority: 85,
      module: 'support',
      access: 'support',
      subMenu: [
        // 11.1 Ticket Management
        {
          name: 'Ticket Management',
          icon: <TicketIcon />,
          access: 'support.ticket-management',
          subMenu: [
            { name: 'All Tickets', icon: <TicketIcon />, route: 'support.tickets.index', access: 'support.ticket-management.all-tickets.view' },
            { name: 'My Tickets', icon: <UserIcon />, route: 'support.tickets.my', access: 'support.ticket-management.my-tickets.view' },
            { name: 'Assigned Tickets', icon: <UsersIcon />, route: 'support.tickets.assigned', access: 'support.ticket-management.assigned-tickets.view' },
            { name: 'SLA Violations', icon: <ExclamationTriangleIcon />, route: 'support.tickets.sla-violations', access: 'support.ticket-management.sla-violations.view' },
            { name: 'Categories', icon: <TagIcon />, route: 'support.tickets.categories', access: 'support.ticket-management.ticket-categories.view' },
            { name: 'Priorities', icon: <AdjustmentsHorizontalIcon />, route: 'support.tickets.priorities', access: 'support.ticket-management.ticket-priorities.view' },
          ]
        },
        // 11.2 Department & Agent Management
        {
          name: 'Departments & Agents',
          icon: <UserGroupIcon />,
          access: 'support.department-agent',
          subMenu: [
            { name: 'Departments', icon: <BuildingOffice2Icon />, route: 'support.departments.index', access: 'support.department-agent.departments.view' },
            { name: 'Support Agents', icon: <UsersIcon />, route: 'support.agents.index', access: 'support.department-agent.agents.view' },
            { name: 'Agent Roles', icon: <ShieldCheckIcon />, route: 'support.agent-roles.index', access: 'support.department-agent.agent-roles.view' },
            { name: 'Schedules', icon: <ClockIcon />, route: 'support.schedules.index', access: 'support.department-agent.schedules.view' },
            { name: 'Auto-Assign Rules', icon: <ArrowPathIcon />, route: 'support.auto-assign.index', access: 'support.department-agent.auto-assign.view' },
          ]
        },
        // 11.3 Routing & SLA
        {
          name: 'Routing & SLA',
          icon: <ClockIcon />,
          access: 'support.routing-sla',
          subMenu: [
            { name: 'SLA Policies', icon: <ClockIcon />, route: 'support.sla.policies', access: 'support.routing-sla.sla-policies.view' },
            { name: 'Routing Rules', icon: <ArrowPathIcon />, route: 'support.sla.routing', access: 'support.routing-sla.routing-rules.view' },
            { name: 'Escalation Rules', icon: <ArrowTrendingUpIcon />, route: 'support.sla.escalation', access: 'support.routing-sla.escalation-rules.view' },
          ]
        },
        // 11.4 Knowledge Base
        {
          name: 'Knowledge Base',
          icon: <BookOpenIcon />,
          access: 'support.knowledge-base',
          subMenu: [
            { name: 'KB Categories', icon: <FolderIcon />, route: 'support.kb.categories', access: 'support.knowledge-base.kb-categories.view' },
            { name: 'KB Articles', icon: <DocumentTextIcon />, route: 'support.kb.articles', access: 'support.knowledge-base.kb-articles.view' },
            { name: 'Article Templates', icon: <DocumentDuplicateIcon />, route: 'support.kb.templates', access: 'support.knowledge-base.article-templates.view' },
            { name: 'Article Analytics', icon: <ChartBarSquareIcon />, route: 'support.kb.analytics', access: 'support.knowledge-base.article-analytics.view' },
          ]
        },
        // 11.5 Canned Responses
        {
          name: 'Canned Responses',
          icon: <DocumentDuplicateIcon />,
          access: 'support.canned-responses',
          subMenu: [
            { name: 'Response Templates', icon: <DocumentDuplicateIcon />, route: 'support.canned.templates', access: 'support.canned-responses.response-templates.view' },
            { name: 'Macro Categories', icon: <TagIcon />, route: 'support.canned.categories', access: 'support.canned-responses.macro-categories.view' },
          ]
        },
        // 11.6 Reporting & Analytics
        {
          name: 'Analytics',
          icon: <ChartBarSquareIcon />,
          access: 'support.support-analytics',
          subMenu: [
            { name: 'Ticket Volume', icon: <ChartBarSquareIcon />, route: 'support.analytics.volume', access: 'support.support-analytics.ticket-volume.view' },
            { name: 'Agent Performance', icon: <UsersIcon />, route: 'support.analytics.agents', access: 'support.support-analytics.agent-performance.view' },
            { name: 'SLA Compliance', icon: <ClockIcon />, route: 'support.analytics.sla', access: 'support.support-analytics.sla-compliance.view' },
            { name: 'Customer Satisfaction', icon: <StarIcon />, route: 'support.analytics.csat', access: 'support.support-analytics.csat-reports.view' },
          ]
        },
        // 11.7 Customer Feedback
        {
          name: 'Customer Feedback',
          icon: <StarIcon />,
          access: 'support.customer-feedback',
          subMenu: [
            { name: 'CSAT Ratings', icon: <StarIcon />, route: 'support.feedback.ratings', access: 'support.customer-feedback.csat-ratings.view' },
            { name: 'Feedback Forms', icon: <ClipboardDocumentListIcon />, route: 'support.feedback.forms', access: 'support.customer-feedback.feedback-forms.view' },
            { name: 'Satisfaction Logs', icon: <DocumentTextIcon />, route: 'support.feedback.logs', access: 'support.customer-feedback.satisfaction-logs.view' },
          ]
        },
        // 11.8 Multi-Channel Support
        {
          name: 'Multi-Channel',
          icon: <ChatBubbleLeftRightIcon />,
          access: 'support.multi-channel',
          subMenu: [
            { name: 'Email-to-Ticket', icon: <EnvelopeIcon />, route: 'support.channels.email', access: 'support.multi-channel.email-channel.view' },
            { name: 'Chat Widget', icon: <ChatBubbleLeftRightIcon />, route: 'support.channels.chat', access: 'support.multi-channel.chat-widget.view' },
            { name: 'WhatsApp Support', icon: <PhoneIcon />, route: 'support.channels.whatsapp', access: 'support.multi-channel.whatsapp-channel.view' },
            { name: 'SMS Support', icon: <PhoneIcon />, route: 'support.channels.sms', access: 'support.multi-channel.sms-channel.view' },
            { name: 'Channel Logs', icon: <DocumentTextIcon />, route: 'support.channels.logs', access: 'support.multi-channel.channel-logs.view' },
          ]
        },
        // 11.9 Admin Tools
        {
          name: 'Admin Tools',
          icon: <WrenchScrewdriverIcon />,
          access: 'support.support-admin-tools',
          subMenu: [
            { name: 'Ticket Tags', icon: <TagIcon />, route: 'support.tools.tags', access: 'support.support-admin-tools.ticket-tags.view' },
            { name: 'Custom Fields', icon: <AdjustmentsHorizontalIcon />, route: 'support.tools.fields', access: 'support.support-admin-tools.custom-fields.view' },
            { name: 'Ticket Forms', icon: <ClipboardDocumentListIcon />, route: 'support.tools.forms', access: 'support.support-admin-tools.ticket-forms.view' },
          ]
        },
      ]
    },

    // 11. SCM (Supply Chain Management)
    ...(can('scm.view', auth, permissions) ? [{
      name: 'SCM',
      icon: <TruckIcon className="" />,
      priority: 70,
      module: 'scm',
      subMenu: [
        { name: 'Suppliers', icon: <UserGroupIcon />, route: 'scm.suppliers.index' },
        { name: 'Purchases', icon: <ShoppingBagIcon />, route: 'scm.purchases.index' },
        { name: 'Logistics', icon: <TruckIcon />, route: 'scm.logistics.index' },
        { name: 'Analytics', icon: <ChartBarSquareIcon />, route: 'scm.dashboard' },
      ]
    }] : []),

    // 10. Helpdesk
    ...(can('helpdesk.view', auth, permissions) ? [{
      name: 'Helpdesk',
      icon: <TicketIcon className="" />,
      priority: 80,
      module: 'helpdesk',
      subMenu: [
        { name: 'Tickets', icon: <TicketIcon />, route: 'helpdesk.tickets.index' },
        { name: 'KB', icon: <FolderIcon />, route: 'helpdesk.knowledge.index' },
        { name: 'Analytics', icon: <ChartBarSquareIcon />, route: 'helpdesk.dashboard' },
      ]
    }] : []),

    // 11. Compliance
    ...(can('compliance.view', auth, permissions) ? [{
      name: 'Compliance',
      icon: <ShieldExclamationIcon className="" />,
      priority: 90,
      module: 'compliance',
      access: 'compliance',
      subMenu: [
        { name: 'Dashboard', icon: <ChartBarSquareIcon />, route: 'compliance.dashboard', access: 'compliance.dashboard.view' },
        { name: 'Policies & Procedures', icon: <DocumentTextIcon />, route: 'compliance.policies.index', access: 'compliance.policies.view' },
        { name: 'Risk Register', icon: <ShieldCheckIcon />, route: 'compliance.risks.index', access: 'compliance.risks.view' },
        { name: 'Compliance Audits', icon: <ClipboardDocumentCheckIcon />, route: 'compliance.audits.index', access: 'compliance.compliance-audits.view' },
        { name: 'Regulatory Requirements', icon: <DocumentCheckIcon />, route: 'compliance.requirements.index', access: 'compliance.requirements.view' },
        { name: 'Compliance Documents', icon: <FolderIcon />, route: 'compliance.documents.index', access: 'compliance.documents.view' },
        { name: 'Training & Awareness', icon: <AcademicCapIcon />, route: 'compliance.training.index', access: 'compliance.training.view' },
        { name: 'Certifications', icon: <CheckBadgeIcon />, route: 'compliance.certifications.index', access: 'compliance.certifications.view' },
        { name: 'Reports & Analytics', icon: <DocumentChartBarIcon />, route: 'compliance.reports.index', access: 'compliance.reports.view' },
      ]
    }] : []),

    // 12. Quality Management
    ...(can('quality.view', auth, permissions) ? [{
      name: 'Quality',
      icon: <BeakerIcon className="" />,
      priority: 95,
      module: 'quality',
      access: 'quality',
      subMenu: [
        { name: 'Dashboard', icon: <ChartBarSquareIcon />, route: 'quality.dashboard', access: 'quality.dashboard.view' },
        { name: 'Inspections', icon: <ClipboardDocumentCheckIcon />, route: 'quality.inspections.index', access: 'quality.inspections.view' },
        { name: 'NCRs', icon: <DocumentTextIcon />, route: 'quality.ncrs.index', access: 'quality.ncr.view' },
        { name: 'CAPA', icon: <ArrowPathIcon />, route: 'quality.capa.index', access: 'quality.capa.view' },
        { name: 'Calibrations', icon: <WrenchIcon />, route: 'quality.calibrations.index', access: 'quality.calibrations.view' },
        { name: 'Quality Audits', icon: <DocumentMagnifyingGlassIcon />, route: 'quality.audits.index', access: 'quality.audits.view' },
        { name: 'Certifications', icon: <CheckBadgeIcon />, route: 'quality.certifications.index', access: 'quality.certifications.view' },
        { name: 'Analytics', icon: <ChartPieIcon />, route: 'quality.analytics', access: 'quality.quality-analytics.view' },
        { name: 'Settings', icon: <Cog6ToothIcon />, route: 'quality.settings', access: 'quality.quality-settings.view' },
      ]
    }] : []),

    /*
    |--------------------------------------------------------------------------
    | Core Module - Users & Authentication
    |--------------------------------------------------------------------------
    */
    {
      name: 'Users & Auth',
      icon: <UsersIcon className="" />,
      module: 'core',
      access: 'core.users',
      priority: 110,
      subMenu: [
        { name: 'User Management', icon: <UsersIcon />, route: 'users', access: 'core.users.user-list.view' },
      ]
    },

    /*
    |--------------------------------------------------------------------------
    | Core Module - Access Control (Roles & Module Access)
    |--------------------------------------------------------------------------
    */
    {
      name: 'Access Control',
      icon: <ShieldCheckIcon className="" />,
      module: 'core',
      access: 'core.roles',
      priority: 111,
      subMenu: [
        { name: 'Role Management', icon: <ShieldCheckIcon />, route: 'admin.roles-management', access: 'core.roles.role-list.view' },
        { name: 'Module Access', icon: <CubeIcon />, route: 'modules.index', access: 'core.module-access.module-list.view' },
      ]
    },

    /*
    |--------------------------------------------------------------------------
    | Core Module - Settings
    |--------------------------------------------------------------------------
    */
    {
      name: 'Settings',
      icon: <Cog6ToothIcon className="" />,
      module: 'core',
      access: 'core.settings',
      priority: 112,
      subMenu: [
        { name: 'General Settings', icon: <Cog6ToothIcon />, route: 'admin.settings.company', access: 'core.settings.general.view' },
      ]
    },
  ];

  // Super Admin sees all items - no filtering needed
  if (isSuperAdmin) {
    return pages.sort((a, b) => (a.priority || 999) - (b.priority || 999));
  }

  // Filter pages based on user's module access
  const filteredPages = pages.filter(page => {
    // Check module-level access using either access property or legacy permissions
    if (page.access) {
      return can(page.access, auth, permissions);
    }
    if (page.module) {
      return can(page.module, auth, permissions);
    }
    return true;
  }).map(page => {
    // Filter submenus based on access
    if (page.subMenu && page.subMenu.length > 0) {
      const filteredSubMenu = page.subMenu.filter(item => {
        if (item.access) {
          return can(item.access, auth, permissions);
        }
        return true;
      }).map(item => {
        // Filter nested submenus (for HRM nested structure)
        if (item.subMenu && item.subMenu.length > 0) {
          const filteredNestedSubMenu = item.subMenu.filter(nested => {
            if (nested.access) {
              return can(nested.access, auth, permissions);
            }
            return true;
          });
          
          if (filteredNestedSubMenu.length === 0) {
            return null;
          }
          
          return { ...item, subMenu: filteredNestedSubMenu };
        }
        return item;
      }).filter(Boolean);

      // Only include the page if it has accessible sub-items or a direct route
      if (filteredSubMenu.length === 0 && !page.route) {
        return null;
      }

      return { ...page, subMenu: filteredSubMenu };
    }
    return page;
  }).filter(Boolean);

  return filteredPages.sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

// Re-export access utilities for convenience
export { hasAccess, isAuthSuperAdmin } from '@/utils/moduleAccessUtils';

/**
 * Check if user can access a tenant page/action
 * 
 * Usage in components:
 * if (canAccessPage('hr.employees.list.view', auth)) { ... }
 * 
 * @param {string} accessPath - Full access path (e.g., 'hr.employees.list.view')
 * @param {Object} auth - Auth object from Inertia usePage().props
 * @returns {boolean} True if user has access
 */
export const canAccessPage = (accessPath, auth = null) => {
  return hasAccess(accessPath, auth);
};

/**
 * Check if user can perform a tenant action
 * Supports both new module access paths and legacy permissions
 * 
 * Usage:
 * if (canAction('hr', 'employees', 'create', auth)) { ... }
 * 
 * @param {string} module - Module code
 * @param {string} subModule - SubModule code
 * @param {string} action - Action code (view, create, update, delete, etc.)
 * @param {Object} auth - Auth object
 * @returns {boolean}
 */
export const canAction = (module, subModule, action, auth = null) => {
  // Try full path first
  const fullPath = `${module}.${subModule}.${action}`;
  if (hasAccess(fullPath, auth)) return true;
  
  // Try shorter paths
  return hasAccess(`${module}.${subModule}`, auth) || hasAccess(module, auth);
};

// Utility functions for navigation management

// Get pages by module for better organization
export const getPagesByModule = (roles, permissions, auth = null) => {
  const pages = getPages(roles, permissions, auth);
  const modules = {};
  
  pages.forEach(page => {
    const module = page.module || 'core';
    if (!modules[module]) {
      modules[module] = [];
    }
    modules[module].push(page);
  });
  
  return modules;
};

// Get pages sorted by priority
export const getPagesByPriority = (roles, permissions, auth = null) => {
  return getPages(roles, permissions, auth).sort((a, b) => (a.priority || 999) - (b.priority || 999));
};

// Get navigation breadcrumb path
export const getNavigationPath = (currentRoute, roles, permissions, auth = null) => {
  const pages = getPages(roles, permissions, auth);
  const path = [];
  // Find the current page in the navigation structure
  const findPageInMenu = (menuItems, targetRoute, currentPath = []) => {
    for (const item of menuItems) {
      const newPath = [...currentPath, item];
      if (item.route === targetRoute) {
        return newPath;
      }
      if (item.subMenu) {
        const result = findPageInMenu(item.subMenu, targetRoute, newPath);
        if (result) return result;
      }
    }
    return null;
  };
  return findPageInMenu(pages, currentRoute) || [];
};

export default getPages;
