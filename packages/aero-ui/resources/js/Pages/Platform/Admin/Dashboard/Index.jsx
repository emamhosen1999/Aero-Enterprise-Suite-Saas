import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import App from '@/Layouts/App';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Button, 
  Chip, 
  Card, 
  CardBody, 
  CardHeader, 
  CardFooter,
  Input, 
  Divider, 
  Progress, 
  Skeleton,
  Avatar,
  AvatarGroup,
  Badge,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
  CircularProgress,
  Tabs,
  Tab,
} from '@heroui/react';
import {
  BuildingOffice2Icon,
  Squares2X2Icon,
  BoltIcon,
  LifebuoyIcon,
  UsersIcon,
  ArrowUpRightIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  PresentationChartLineIcon,
  CurrencyDollarIcon,
  ServerStackIcon,
  CpuChipIcon,
  GlobeAltIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  BellAlertIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CloudIcon,
  CubeIcon,
  CommandLineIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ChartPieIcon,
  RocketLaunchIcon,
  FireIcon,
  StarIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  XCircleIcon,
  CheckBadgeIcon,
  SignalIcon,
  CircleStackIcon,
  AcademicCapIcon,
  BanknotesIcon,
  TruckIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  InboxStackIcon,
  PhoneIcon,
  TagIcon,
  ArchiveBoxIcon,
  BeakerIcon,
  HomeModernIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolidIcon,
  ExclamationTriangleIcon as ExclamationTriangleSolidIcon,
  XCircleIcon as XCircleSolidIcon,
} from '@heroicons/react/24/solid';

// ═══════════════════════════════════════════════════════════════════════════════
// THEME UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const getThemeRadius = () => {
  if (typeof window === 'undefined') return 'lg';
  const rootStyles = getComputedStyle(document.documentElement);
  const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
  const radiusValue = parseInt(borderRadius);
  if (radiusValue === 0) return 'none';
  if (radiusValue <= 4) return 'sm';
  if (radiusValue <= 8) return 'md';
  if (radiusValue <= 12) return 'lg';
  return 'xl';
};

// Consistent card styling - matches tenant dashboard
const getCardStyle = (accentColor = 'var(--theme-primary)') => ({
  border: `var(--borderWidth, 2px) solid transparent`,
  borderRadius: `var(--borderRadius, 12px)`,
  fontFamily: `var(--fontFamily, "Inter")`,
  background: `linear-gradient(135deg, 
    var(--theme-content1, #FAFAFA) 20%, 
    var(--theme-content2, #F4F4F5) 10%, 
    var(--theme-content3, #F1F3F4) 20%)`,
  boxShadow: `0 4px 12px rgba(0, 0, 0, 0.05)`,
});

// Card style with accent border (for highlighted cards)
const getAccentCardStyle = (accentColor = 'var(--theme-primary)') => ({
  border: `var(--borderWidth, 2px) solid color-mix(in srgb, ${accentColor} 25%, transparent)`,
  borderRadius: `var(--borderRadius, 12px)`,
  fontFamily: `var(--fontFamily, "Inter")`,
  background: `linear-gradient(135deg, 
    var(--theme-content1, #FAFAFA) 20%, 
    var(--theme-content2, #F4F4F5) 10%, 
    var(--theme-content3, #F1F3F4) 20%)`,
  boxShadow: `0 4px 12px rgba(0, 0, 0, 0.05)`,
});

const getHeaderStyle = (accentColor = 'var(--theme-primary)') => ({
  borderColor: `var(--theme-divider)`,
  background: `transparent`,
});

const getItemStyle = (accentColor = 'var(--theme-primary)') => ({
  borderRadius: `var(--borderRadius, 12px)`,
  border: `var(--borderWidth, 1px) solid color-mix(in srgb, ${accentColor} 15%, var(--theme-divider))`,
  background: `linear-gradient(135deg, 
    var(--theme-content1, #FAFAFA) 0%, 
    var(--theme-content2, #F4F4F5) 100%)`,
  boxShadow: `0 2px 6px rgba(0, 0, 0, 0.04)`,
});

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT DATA
// ═══════════════════════════════════════════════════════════════════════════════

const defaultPlatformStats = {
  totalTenants: 156,
  activeTenants: 148,
  totalUsers: 12840,
  activeUsers: 9650,
  mrr: 428500,
  arr: 5142000,
  mrrGrowth: 12.5,
  churnRate: 2.1,
  avgRevenuePerTenant: 2748,
  totalStorage: '2.8 TB',
  apiCalls: '48.2M',
  uptime: 99.98,
};

const defaultModules = [
  { id: 'hr', name: 'HR Management', icon: UserGroupIcon, activeCount: 142, color: '#0ea5e9', status: 'active' },
  { id: 'project', name: 'Project Management', icon: ClipboardDocumentCheckIcon, activeCount: 128, color: '#8b5cf6', status: 'active' },
  { id: 'crm', name: 'CRM', icon: UsersIcon, activeCount: 98, color: '#10b981', status: 'active' },
  { id: 'dms', name: 'Document Management', icon: DocumentTextIcon, activeCount: 134, color: '#f59e0b', status: 'active' },
  { id: 'quality', name: 'Quality Control', icon: BeakerIcon, activeCount: 76, color: '#ef4444', status: 'active' },
  { id: 'compliance', name: 'Compliance', icon: ShieldCheckIcon, activeCount: 89, color: '#06b6d4', status: 'active' },
  { id: 'finance', name: 'Finance & Accounting', icon: BanknotesIcon, activeCount: 112, color: '#84cc16', status: 'active' },
  { id: 'scm', name: 'Supply Chain', icon: TruckIcon, activeCount: 67, color: '#f97316', status: 'active' },
  { id: 'pos', name: 'Point of Sale', icon: CreditCardIcon, activeCount: 45, color: '#ec4899', status: 'active' },
  { id: 'lms', name: 'Learning Management', icon: AcademicCapIcon, activeCount: 54, color: '#6366f1', status: 'beta' },
  { id: 'helpdesk', name: 'Helpdesk', icon: LifebuoyIcon, activeCount: 82, color: '#14b8a6', status: 'active' },
  { id: 'analytics', name: 'Analytics', icon: ChartBarIcon, activeCount: 156, color: '#a855f7', status: 'active' },
];

const defaultSubscriptionPlans = [
  { name: 'Starter', count: 45, mrr: 22500, color: '#94a3b8', price: 500 },
  { name: 'Growth', count: 62, mrr: 124000, color: '#0ea5e9', price: 2000 },
  { name: 'Professional', count: 38, mrr: 190000, color: '#8b5cf6', price: 5000 },
  { name: 'Enterprise', count: 11, mrr: 110000, color: '#f59e0b', price: 10000 },
];

const defaultTenantsByRegion = [
  { region: 'Asia Pacific', count: 68, percentage: 43.6, growth: 18.2 },
  { region: 'North America', count: 42, percentage: 26.9, growth: 12.5 },
  { region: 'Europe', count: 31, percentage: 19.9, growth: 8.7 },
  { region: 'Middle East', count: 10, percentage: 6.4, growth: 24.3 },
  { region: 'Others', count: 5, percentage: 3.2, growth: 5.1 },
];

const defaultRecentTenants = [
  { id: 1, name: 'Nexus Technologies', domain: 'nexus', plan: 'Enterprise', status: 'active', users: 245, createdAt: '2 hours ago', logo: null },
  { id: 2, name: 'Global Logistics Inc', domain: 'globallog', plan: 'Professional', status: 'trial', users: 89, createdAt: '5 hours ago', logo: null },
  { id: 3, name: 'HealthCare Plus', domain: 'hcplus', plan: 'Growth', status: 'active', users: 156, createdAt: '1 day ago', logo: null },
  { id: 4, name: 'EduTech Solutions', domain: 'edutech', plan: 'Starter', status: 'pending', users: 34, createdAt: '2 days ago', logo: null },
  { id: 5, name: 'FinServ Corp', domain: 'finserv', plan: 'Enterprise', status: 'active', users: 312, createdAt: '3 days ago', logo: null },
];

const defaultSystemHealth = {
  cpu: 42,
  memory: 68,
  disk: 54,
  network: 23,
  database: 31,
  cache: 45,
  queue: 12,
  services: [
    { name: 'API Gateway', status: 'healthy', latency: '23ms' },
    { name: 'Authentication', status: 'healthy', latency: '15ms' },
    { name: 'Database Cluster', status: 'healthy', latency: '8ms' },
    { name: 'Cache Server', status: 'healthy', latency: '2ms' },
    { name: 'Queue Worker', status: 'healthy', latency: '45ms' },
    { name: 'File Storage', status: 'warning', latency: '156ms' },
    { name: 'Email Service', status: 'healthy', latency: '89ms' },
    { name: 'Search Engine', status: 'healthy', latency: '34ms' },
  ],
};

const defaultRecentActivity = [
  { type: 'tenant_created', message: 'New tenant "Nexus Technologies" registered', time: '2 hours ago', icon: BuildingOffice2Icon, color: 'success' },
  { type: 'subscription_upgraded', message: 'Global Logistics upgraded to Professional plan', time: '4 hours ago', icon: ArrowTrendingUpIcon, color: 'primary' },
  { type: 'alert', message: 'High API usage detected for tenant "DataFlow"', time: '6 hours ago', icon: ExclamationTriangleIcon, color: 'warning' },
  { type: 'maintenance', message: 'Scheduled maintenance completed successfully', time: '8 hours ago', icon: WrenchScrewdriverIcon, color: 'secondary' },
  { type: 'subscription_cancelled', message: 'Tenant "OldCorp" subscription ended', time: '1 day ago', icon: XCircleIcon, color: 'danger' },
  { type: 'module_enabled', message: 'LMS module enabled for 12 tenants', time: '1 day ago', icon: CubeIcon, color: 'primary' },
];

const defaultAlerts = [
  { id: 1, severity: 'critical', title: 'Database Connection Pool Near Limit', description: 'Connection pool at 85% capacity', time: '5 min ago' },
  { id: 2, severity: 'warning', title: 'Storage Usage High', description: 'Tenant "DataFlow" using 95% of allocated storage', time: '15 min ago' },
  { id: 3, severity: 'info', title: 'Scheduled Maintenance', description: 'System maintenance scheduled for Dec 03, 02:00 UTC', time: '1 hour ago' },
];

const defaultBillingOverview = {
  totalRevenue: 5142000,
  pendingPayments: 45600,
  failedPayments: 12300,
  refunds: 8500,
  invoicesPending: 23,
  invoicesOverdue: 5,
};

const defaultQuickActions = [
  { label: 'Create Tenant', icon: BuildingOffice2Icon, href: '/admin/tenants/create', color: 'primary' },
  { label: 'View Tickets', icon: LifebuoyIcon, href: '/admin/support', color: 'warning' },
  { label: 'System Logs', icon: CommandLineIcon, href: '/admin/logs', color: 'secondary' },
  { label: 'Billing', icon: CreditCardIcon, href: '/admin/billing', color: 'success' },
  { label: 'Analytics', icon: ChartBarIcon, href: '/admin/analytics', color: 'primary' },
  { label: 'Settings', icon: Cog6ToothIcon, href: '/admin/settings', color: 'default' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const DiagonalAccent = ({ color = 'var(--theme-primary)' }) => (
  <span
    aria-hidden
    className="pointer-events-none absolute -right-16 top-0 h-full w-2/3 opacity-15"
    style={{
      background: `linear-gradient(135deg, transparent 0%, ${color} 100%)`,
      filter: 'blur(12px)',
    }}
  />
);

// Platform Status Hero
const PlatformStatusHero = ({ stats, loading, themeRadius }) => (
  <Card className="relative overflow-hidden" style={getCardStyle('var(--theme-primary)')}>
    <DiagonalAccent color="var(--theme-primary)" />
    <CardHeader className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b p-4 sm:p-6" style={getHeaderStyle()}>
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <div 
          className="p-2.5 sm:p-3 flex-shrink-0"
          style={{
            borderRadius: `var(--borderRadius, 12px)`,
            background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%)`,
          }}
        >
          <ServerStackIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">Platform Command Center</h1>
            <Chip color="success" variant="flat" size="sm" startContent={<SignalIcon className="h-3 w-3" />} className="flex-shrink-0">
              All Systems Operational
            </Chip>
          </div>
          <p className="text-xs sm:text-sm text-default-500 truncate">
            Multi-tenant operations suite · Last sync: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap flex-shrink-0">
        <Button as={Link} href={route('admin.analytics.index')} color="primary" radius={themeRadius} size="sm" className="sm:size-md" startContent={<ChartBarIcon className="h-4 w-4" />}>
          Analytics
        </Button>
        <Button variant="bordered" radius={themeRadius} size="sm" className="sm:size-md" startContent={<DocumentArrowDownIcon className="h-4 w-4" />}>
          Export Report
        </Button>
      </div>
    </CardHeader>
    <CardBody className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6">
      {loading ? (
        Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 sm:h-24 rounded-xl" />)
      ) : (
        <>
          <div className="p-3 sm:p-4 text-center" style={getItemStyle()}>
            <p className="text-[10px] sm:text-xs text-default-500 uppercase tracking-wide mb-1 truncate">Active Tenants</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{stats.activeTenants}</p>
            <p className="text-[10px] sm:text-xs text-success flex items-center justify-center gap-1 mt-1">
              <ArrowTrendingUpIcon className="h-3 w-3 flex-shrink-0" /> <span className="truncate">+6 this week</span>
            </p>
          </div>
          <div className="p-3 sm:p-4 text-center" style={getItemStyle()}>
            <p className="text-[10px] sm:text-xs text-default-500 uppercase tracking-wide mb-1 truncate">Active Users</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{stats.activeUsers.toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs text-default-400 mt-1 truncate">{((stats.activeUsers/stats.totalUsers)*100).toFixed(1)}% of total</p>
          </div>
          <div className="p-3 sm:p-4 text-center" style={getItemStyle('var(--theme-success)')}>
            <p className="text-[10px] sm:text-xs text-default-500 uppercase tracking-wide mb-1 truncate">Monthly Revenue</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-success">${(stats.mrr/1000).toFixed(0)}K</p>
            <p className="text-[10px] sm:text-xs text-success flex items-center justify-center gap-1 mt-1">
              <ArrowTrendingUpIcon className="h-3 w-3 flex-shrink-0" /> <span>+{stats.mrrGrowth}%</span>
            </p>
          </div>
          <div className="p-3 sm:p-4 text-center" style={getItemStyle()}>
            <p className="text-[10px] sm:text-xs text-default-500 uppercase tracking-wide mb-1 truncate">Platform Uptime</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{stats.uptime}%</p>
            <p className="text-[10px] sm:text-xs text-default-400 mt-1 truncate">Last 30 days</p>
          </div>
        </>
      )}
    </CardBody>
  </Card>
);

// Key Metrics Grid
const KeyMetricsGrid = ({ stats, loading }) => {
  const metrics = [
    { label: 'Total Tenants', value: stats.totalTenants, icon: BuildingOffice2Icon, color: 'var(--theme-primary)', suffix: '', change: '+8.2%', trend: 'up' },
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: UsersIcon, color: '#0ea5e9', suffix: '', change: '+12.5%', trend: 'up' },
    { label: 'ARR', value: `$${(stats.arr/1000000).toFixed(1)}M`, icon: CurrencyDollarIcon, color: '#10b981', suffix: '', change: '+15.3%', trend: 'up' },
    { label: 'Churn Rate', value: stats.churnRate, icon: ArrowTrendingDownIcon, color: '#ef4444', suffix: '%', change: '-0.3%', trend: 'down' },
    { label: 'Avg Revenue/Tenant', value: `$${stats.avgRevenuePerTenant}`, icon: ChartPieIcon, color: '#8b5cf6', suffix: '', change: '+5.2%', trend: 'up' },
    { label: 'API Calls (30d)', value: stats.apiCalls, icon: BoltIcon, color: '#f59e0b', suffix: '', change: '+22.1%', trend: 'up' },
    { label: 'Storage Used', value: stats.totalStorage, icon: CircleStackIcon, color: '#06b6d4', suffix: '', change: '+8.4%', trend: 'up' },
    { label: 'Active Sessions', value: '2,847', icon: SignalIcon, color: '#ec4899', suffix: '', change: '+3.1%', trend: 'up' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {loading ? (
        metrics.map((_, i) => <Skeleton key={i} className="h-24 sm:h-28 rounded-xl" />)
      ) : (
        metrics.map((metric) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="relative overflow-hidden h-full" style={getCardStyle(metric.color)}>
              <CardBody className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                  <div 
                    className="p-1.5 sm:p-2 flex-shrink-0"
                    style={{
                      borderRadius: `var(--borderRadius, 8px)`,
                      background: `color-mix(in srgb, ${metric.color} 15%, transparent)`,
                    }}
                  >
                    <metric.icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: metric.color }} />
                  </div>
                  <Chip 
                    size="sm" 
                    variant="flat" 
                    className="flex-shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2"
                    color={metric.trend === 'up' ? 'success' : metric.trend === 'down' && metric.label === 'Churn Rate' ? 'success' : 'danger'}
                    startContent={metric.trend === 'up' ? <ArrowTrendingUpIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <ArrowTrendingDownIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                  >
                    {metric.change}
                  </Chip>
                </div>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">{metric.value}{metric.suffix}</p>
                <p className="text-[10px] sm:text-xs text-default-500 mt-1 truncate">{metric.label}</p>
              </CardBody>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  );
};

// Module Usage Grid
const ModuleUsageCard = ({ modules, loading, themeRadius }) => (
  <Card style={getCardStyle()}>
    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b p-3 sm:p-4" style={getHeaderStyle()}>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-default-500">Module Adoption</p>
        <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">Active Modules by Tenant</h3>
      </div>
      <Button as={Link} href={route('admin.modules.index')} size="sm" variant="flat" color="primary" radius={themeRadius} className="flex-shrink-0 w-full sm:w-auto">
        Manage Modules
      </Button>
    </CardHeader>
    <CardBody className="p-3 sm:p-4">
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {Array(12).fill(0).map((_, i) => <Skeleton key={i} className="h-16 sm:h-20 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {modules.map((module) => (
            <motion.div
              key={module.id}
              whileHover={{ scale: 1.03 }}
              className="p-2 sm:p-3 cursor-pointer transition-all"
              style={getItemStyle(module.color)}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                <div 
                  className="p-1.5 sm:p-2 rounded-lg flex-shrink-0"
                  style={{ background: `color-mix(in srgb, ${module.color} 15%, transparent)` }}
                >
                  <module.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: module.color }} />
                </div>
                {module.status === 'beta' && (
                  <Chip size="sm" color="warning" variant="flat" className="text-[10px] px-1.5">Beta</Chip>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground truncate" title={module.name}>{module.name}</p>
              <p className="text-[10px] sm:text-xs text-default-500">{module.activeCount} tenants</p>
            </motion.div>
          ))}
        </div>
      )}
    </CardBody>
  </Card>
);

// Subscription Distribution
const SubscriptionDistributionCard = ({ plans, loading, themeRadius }) => {
  const totalMrr = plans.reduce((acc, p) => acc + p.mrr, 0);
  const totalCount = plans.reduce((acc, p) => acc + p.count, 0);

  return (
    <Card style={getCardStyle('var(--theme-success)')}>
      <CardHeader className="border-b p-3 sm:p-4" style={getHeaderStyle('var(--theme-success)')}>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-default-500">Revenue Distribution</p>
          <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">Subscription Plans</h3>
        </div>
      </CardHeader>
      <CardBody className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 sm:h-16 rounded-lg" />)
        ) : (
          plans.map((plan) => (
            <div key={plan.name} className="p-2 sm:p-3 transition-all hover:scale-[1.01]" style={getItemStyle(plan.color)}>
              <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2 mb-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div 
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                    style={{ background: plan.color }}
                  />
                  <span className="font-medium text-foreground text-xs sm:text-sm truncate">{plan.name}</span>
                  <Chip size="sm" variant="flat" className="hidden sm:flex text-[10px] px-1.5">${plan.price}/mo</Chip>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-foreground flex-shrink-0">{plan.count} tenants</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Progress 
                  value={(plan.mrr / totalMrr) * 100} 
                  color="primary"
                  className="flex-1 h-1.5 sm:h-2"
                  style={{ '--progress-color': plan.color }}
                />
                <span className="text-[10px] sm:text-sm text-default-500 w-16 sm:w-20 text-right flex-shrink-0">
                  ${(plan.mrr/1000).toFixed(0)}K
                </span>
              </div>
            </div>
          ))
        )}
        <Divider />
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-default-500">Total: {totalCount} tenants</span>
          <span className="font-semibold text-success">${(totalMrr/1000).toFixed(0)}K MRR</span>
        </div>
      </CardBody>
    </Card>
  );
};

// Geographic Distribution
const GeographicDistributionCard = ({ regions, loading }) => (
  <Card style={getCardStyle('var(--theme-secondary)')}>
    <CardHeader className="border-b p-3 sm:p-4" style={getHeaderStyle('var(--theme-secondary)')}>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-default-500">Geographic Reach</p>
        <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">Tenants by Region</h3>
      </div>
    </CardHeader>
    <CardBody className="p-3 sm:p-4 space-y-2 sm:space-y-3">
      {loading ? (
        Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 sm:h-12 rounded-lg" />)
      ) : (
        regions.map((region) => (
          <div key={region.region} className="flex items-center gap-2 sm:gap-4 p-1.5 sm:p-2 transition-all hover:bg-content2/50 rounded-lg">
            <div className="w-16 sm:w-24 flex-shrink-0">
              <p className="text-xs sm:text-sm font-medium text-foreground truncate" title={region.region}>{region.region}</p>
            </div>
            <Progress 
              value={region.percentage} 
              color="secondary"
              className="flex-1 h-1.5 sm:h-2"
            />
            <div className="flex items-center gap-1.5 sm:gap-3 text-xs sm:text-sm flex-shrink-0">
              <span className="text-default-500 w-8 sm:w-12 text-right">{region.count}</span>
              <Chip 
                size="sm" 
                variant="flat" 
                color="success"
                className="text-[10px] sm:text-xs px-1 sm:px-2"
                startContent={<ArrowTrendingUpIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
              >
                {region.growth}%
              </Chip>
            </div>
          </div>
        ))
      )}
    </CardBody>
  </Card>
);

// Recent Tenants Table
const RecentTenantsCard = ({ tenants, loading, themeRadius }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'trial': return 'warning';
      case 'pending': return 'default';
      case 'suspended': return 'danger';
      default: return 'default';
    }
  };

  return (
    <Card style={getCardStyle()}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b p-3 sm:p-4" style={getHeaderStyle()}>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-default-500">Recent Activity</p>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">New Tenants</h3>
        </div>
        <Button as={Link} href={route('admin.tenants.index')} size="sm" variant="flat" color="primary" radius={themeRadius} className="flex-shrink-0 w-full sm:w-auto">
          View All
        </Button>
      </CardHeader>
      <CardBody className="p-0">
        {loading ? (
          <div className="p-3 sm:p-4 space-y-3">
            {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 sm:h-16 rounded-lg" />)}
          </div>
        ) : (
          <div className="divide-y divide-divider">
            {tenants.map((tenant) => (
              <div 
                key={tenant.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 hover:bg-content2/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Avatar 
                    name={tenant.name} 
                    size="sm" 
                    className="flex-shrink-0"
                    style={{ 
                      background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%)`,
                      color: 'white',
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-medium text-foreground truncate">{tenant.name}</p>
                    <p className="text-[10px] sm:text-xs text-default-500 truncate">{tenant.domain}.aeos365.com · {tenant.createdAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap flex-shrink-0 ml-8 sm:ml-0">
                  <Chip size="sm" variant="flat" color={getStatusColor(tenant.status)} className="text-[10px] sm:text-xs">
                    {tenant.status}
                  </Chip>
                  <Chip size="sm" variant="bordered" className="text-[10px] sm:text-xs">{tenant.plan}</Chip>
                  <span className="text-xs sm:text-sm text-default-500">{tenant.users} users</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

// System Health Card
const SystemHealthCard = ({ health, loading, themeRadius }) => {
  const getHealthColor = (value) => {
    if (value < 50) return 'success';
    if (value < 75) return 'warning';
    return 'danger';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircleSolidIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success" />;
      case 'warning': return <ExclamationTriangleSolidIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-warning" />;
      case 'critical': return <XCircleSolidIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-danger" />;
      default: return null;
    }
  };

  const resources = [
    { label: 'CPU', value: health.cpu, icon: CpuChipIcon },
    { label: 'Memory', value: health.memory, icon: CircleStackIcon },
    { label: 'Disk', value: health.disk, icon: ServerStackIcon },
    { label: 'Network', value: health.network, icon: GlobeAltIcon },
  ];

  return (
    <Card style={getCardStyle('var(--theme-warning)')}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b p-3 sm:p-4" style={getHeaderStyle('var(--theme-warning)')}>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-default-500">Infrastructure</p>
          <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">System Health</h3>
        </div>
        <Button as={Link} href="/admin/infrastructure" size="sm" variant="flat" color="warning" radius={themeRadius} className="flex-shrink-0 w-full sm:w-auto">
          View Details
        </Button>
      </CardHeader>
      <CardBody className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {loading ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 sm:h-20 rounded-lg" />)}
            </div>
            <Divider />
            <div className="space-y-2">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-8 sm:h-10 rounded-lg" />)}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {resources.map((resource) => (
                <div key={resource.label} className="text-center p-2 sm:p-3" style={getItemStyle()}>
                  <CircularProgress
                    value={resource.value}
                    color={getHealthColor(resource.value)}
                    size="md"
                    showValueLabel
                    classNames={{
                      value: "text-sm sm:text-lg font-semibold",
                    }}
                  />
                  <p className="text-[10px] sm:text-xs text-default-500 mt-1 sm:mt-2">{resource.label}</p>
                </div>
              ))}
            </div>
            <Divider />
            <div className="space-y-1.5 sm:space-y-2">
              {health.services.slice(0, 4).map((service) => (
                <div key={service.name} className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg hover:bg-content2/50 transition-colors">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    {getStatusIcon(service.status)}
                    <span className="text-xs sm:text-sm text-foreground truncate">{service.name}</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-default-500 flex-shrink-0">{service.latency}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};

// Alerts Card
const AlertsCard = ({ alerts, loading, themeRadius }) => {
  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'critical': return { color: 'danger', icon: XCircleSolidIcon, bg: 'var(--theme-danger)' };
      case 'warning': return { color: 'warning', icon: ExclamationTriangleSolidIcon, bg: 'var(--theme-warning)' };
      case 'info': return { color: 'primary', icon: BellAlertIcon, bg: 'var(--theme-primary)' };
      default: return { color: 'default', icon: BellAlertIcon, bg: 'var(--theme-default)' };
    }
  };

  return (
    <Card style={getCardStyle('var(--theme-danger)')}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b p-3 sm:p-4" style={getHeaderStyle('var(--theme-danger)')}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-default-500">Monitoring</p>
            <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">Active Alerts</h3>
          </div>
          <Badge content={alerts.length} color="danger" size="sm">
            <BellAlertIcon className="h-4 w-4 sm:h-5 sm:w-5 text-default-400" />
          </Badge>
        </div>
        <Button size="sm" variant="flat" color="danger" radius={themeRadius} className="flex-shrink-0 w-full sm:w-auto">
          View All
        </Button>
      </CardHeader>
      <CardBody className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {loading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 sm:h-20 rounded-lg" />)
        ) : alerts.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <CheckCircleSolidIcon className="h-10 w-10 sm:h-12 sm:w-12 text-success mx-auto mb-2" />
            <p className="text-default-500 text-sm">No active alerts</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const config = getSeverityConfig(alert.severity);
            return (
              <div 
                key={alert.id} 
                className="p-2 sm:p-3 transition-all hover:scale-[1.01]"
                style={getItemStyle(config.bg)}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div 
                    className="p-1.5 sm:p-2 rounded-lg flex-shrink-0"
                    style={{ background: `color-mix(in srgb, ${config.bg} 15%, transparent)` }}
                  >
                    <config.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: config.bg }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <p className="font-medium text-foreground text-xs sm:text-sm truncate max-w-[180px] sm:max-w-none">{alert.title}</p>
                      <Chip size="sm" color={config.color} variant="flat" className="text-[10px] px-1.5 flex-shrink-0">{alert.severity}</Chip>
                    </div>
                    <p className="text-[10px] sm:text-xs text-default-500 line-clamp-2">{alert.description}</p>
                    <p className="text-[10px] sm:text-xs text-default-400 mt-1">{alert.time}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardBody>
    </Card>
  );
};

// Quick Actions Card
const QuickActionsCard = ({ actions, themeRadius }) => (
  <Card style={getCardStyle()}>
    <CardHeader className="border-b p-3 sm:p-4" style={getHeaderStyle()}>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-default-500">Shortcuts</p>
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Quick Actions</h3>
      </div>
    </CardHeader>
    <CardBody className="p-3 sm:p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            as={Link}
            href={action.href}
            variant="flat"
            color={action.color}
            radius={themeRadius}
            className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm"
            startContent={<action.icon className="h-5 w-5 sm:h-6 sm:w-6" />}
          >
            <span className="truncate max-w-full">{action.label}</span>
          </Button>
        ))}
      </div>
    </CardBody>
  </Card>
);

// Recent Activity Card
const RecentActivityCard = ({ activities, loading, themeRadius }) => (
  <Card style={getCardStyle()}>
    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b p-3 sm:p-4" style={getHeaderStyle()}>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-default-500">Timeline</p>
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Recent Activity</h3>
      </div>
      <Button size="sm" variant="flat" color="primary" radius={themeRadius} className="flex-shrink-0 w-full sm:w-auto">
        View All
      </Button>
    </CardHeader>
    <CardBody className="p-3 sm:p-4">
      {loading ? (
        <div className="space-y-3 sm:space-y-4">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 sm:h-12 rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-2 sm:gap-3">
              <div 
                className="p-1.5 sm:p-2 rounded-lg flex-shrink-0"
                style={{ 
                  background: `color-mix(in srgb, var(--theme-${activity.color}) 15%, transparent)` 
                }}
              >
                <activity.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: `var(--theme-${activity.color})` }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-foreground line-clamp-2">{activity.message}</p>
                <p className="text-[10px] sm:text-xs text-default-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardBody>
  </Card>
);

// Billing Overview Card
const BillingOverviewCard = ({ billing, loading, themeRadius }) => (
  <Card style={getCardStyle('var(--theme-success)')}>
    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b p-3 sm:p-4" style={getHeaderStyle('var(--theme-success)')}>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-default-500">Financials</p>
        <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">Billing Overview</h3>
      </div>
      <Button as={Link} href="/admin/billing" size="sm" variant="flat" color="success" radius={themeRadius} className="flex-shrink-0 w-full sm:w-auto">
        Billing Portal
      </Button>
    </CardHeader>
    <CardBody className="p-3 sm:p-4">
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-14 sm:h-16 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
          <div className="p-2 sm:p-3 text-center" style={getItemStyle('var(--theme-success)')}>
            <CurrencyDollarIcon className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-success" />
            <p className="text-sm sm:text-lg font-bold text-success">${(billing.totalRevenue/1000000).toFixed(2)}M</p>
            <p className="text-[10px] sm:text-xs text-default-500 truncate">Total Revenue (YTD)</p>
          </div>
          <div className="p-2 sm:p-3 text-center" style={getItemStyle('var(--theme-warning)')}>
            <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-warning" />
            <p className="text-sm sm:text-lg font-bold text-warning">${(billing.pendingPayments/1000).toFixed(1)}K</p>
            <p className="text-[10px] sm:text-xs text-default-500 truncate">Pending Payments</p>
          </div>
          <div className="p-2 sm:p-3 text-center" style={getItemStyle('var(--theme-danger)')}>
            <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-danger" />
            <p className="text-sm sm:text-lg font-bold text-danger">${(billing.failedPayments/1000).toFixed(1)}K</p>
            <p className="text-[10px] sm:text-xs text-default-500 truncate">Failed Payments</p>
          </div>
          <div className="p-2 sm:p-3 text-center" style={getItemStyle()}>
            <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-primary" />
            <p className="text-sm sm:text-lg font-bold text-foreground">{billing.invoicesPending}</p>
            <p className="text-[10px] sm:text-xs text-default-500 truncate">Pending Invoices</p>
          </div>
          <div className="p-2 sm:p-3 text-center" style={getItemStyle('var(--theme-danger)')}>
            <BellAlertIcon className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-danger" />
            <p className="text-sm sm:text-lg font-bold text-danger">{billing.invoicesOverdue}</p>
            <p className="text-[10px] sm:text-xs text-default-500 truncate">Overdue Invoices</p>
          </div>
          <div className="p-2 sm:p-3 text-center" style={getItemStyle()}>
            <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-default-500" />
            <p className="text-sm sm:text-lg font-bold text-foreground">${(billing.refunds/1000).toFixed(1)}K</p>
            <p className="text-[10px] sm:text-xs text-default-500 truncate">Refunds (30d)</p>
          </div>
        </div>
      )}
    </CardBody>
  </Card>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const Dashboard = () => {
  const { adminDashboard = {} } = usePage().props;
  
  // Use props or defaults
  const platformStats = adminDashboard.platformStats ?? defaultPlatformStats;
  const modules = adminDashboard.modules ?? defaultModules;
  const subscriptionPlans = adminDashboard.subscriptionPlans ?? defaultSubscriptionPlans;
  const tenantsByRegion = adminDashboard.tenantsByRegion ?? defaultTenantsByRegion;
  const recentTenants = adminDashboard.recentTenants ?? defaultRecentTenants;
  const systemHealth = adminDashboard.systemHealth ?? defaultSystemHealth;
  const recentActivity = adminDashboard.recentActivity ?? defaultRecentActivity;
  const alerts = adminDashboard.alerts ?? defaultAlerts;
  const billingOverview = adminDashboard.billingOverview ?? defaultBillingOverview;
  const quickActions = adminDashboard.quickActions ?? defaultQuickActions;

  const [themeRadius, setThemeRadius] = useState('lg');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const updateRadius = () => setThemeRadius(getThemeRadius());
    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, staggerChildren: 0.1, ease: "easeOut" }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <>
      <Head title="Dashboard - Admin" />
      <motion.div
        key={refreshKey}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full h-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6"
      >
        {/* Platform Status Hero */}
        <motion.div variants={itemVariants}>
          <PlatformStatusHero stats={platformStats} loading={loading} themeRadius={themeRadius} />
        </motion.div>

        {/* Key Metrics Grid */}
        <motion.div variants={itemVariants}>
          <KeyMetricsGrid stats={platformStats} loading={loading} />
        </motion.div>

        {/* Two Column Layout: Modules + Subscriptions */}
        <motion.div variants={itemVariants}>
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ModuleUsageCard modules={modules} loading={loading} themeRadius={themeRadius} />
            </div>
            <div>
              <SubscriptionDistributionCard plans={subscriptionPlans} loading={loading} themeRadius={themeRadius} />
            </div>
          </div>
        </motion.div>

        {/* Three Column Layout: Recent Tenants + System Health + Alerts */}
        <motion.div variants={itemVariants}>
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RecentTenantsCard tenants={recentTenants} loading={loading} themeRadius={themeRadius} />
            </div>
            <div className="space-y-4 sm:space-y-6">
              <SystemHealthCard health={systemHealth} loading={loading} themeRadius={themeRadius} />
            </div>
          </div>
        </motion.div>

        {/* Three Column Layout: Geographic + Billing + Quick Actions */}
        <motion.div variants={itemVariants}>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <GeographicDistributionCard regions={tenantsByRegion} loading={loading} />
            <BillingOverviewCard billing={billingOverview} loading={loading} themeRadius={themeRadius} />
            <QuickActionsCard actions={quickActions} themeRadius={themeRadius} />
          </div>
        </motion.div>

        {/* Two Column Layout: Alerts + Activity */}
        <motion.div variants={itemVariants}>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <AlertsCard alerts={alerts} loading={loading} themeRadius={themeRadius} />
            <RecentActivityCard activities={recentActivity} loading={loading} themeRadius={themeRadius} />
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

Dashboard.layout = (page) => <App>{page}</App>;

export default Dashboard;
