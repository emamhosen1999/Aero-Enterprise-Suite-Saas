/**
 * Module System - Feature Flags for Inertia.js
 * 
 * A comprehensive system for managing module/feature availability
 * in the React frontend based on enabled modules from the backend.
 * 
 * @module FeatureFlags
 * 
 * USAGE OVERVIEW:
 * ================
 * 
 * 1. CUSTOM HOOK (Simple checks)
 * ------------------------------
 * import { useModule, useModuleEnabled } from '@/Hooks/useModule';
 * 
 * // Full hook with all features
 * const { isEnabled, hasAll, hasAny, checkModule } = useModule('crm');
 * 
 * // Simple boolean check
 * const crmEnabled = useModuleEnabled('crm');
 * 
 * // Multiple modules
 * const { hasAll, hasAny } = useModule(['crm', 'hrm']);
 * 
 * 
 * 2. REQUIRE MODULE COMPONENT (Conditional rendering)
 * ---------------------------------------------------
 * import RequireModule, { RequireModuleDisabled } from '@/Components/RequireModule';
 * 
 * // Hide content if module disabled
 * <RequireModule module="crm">
 *   <CRMDashboard />
 * </RequireModule>
 * 
 * // Show locked state instead of hiding
 * <RequireModule module="analytics" showLocked>
 *   <AnalyticsPanel />
 * </RequireModule>
 * 
 * // Custom fallback
 * <RequireModule module="crm" fallback={<UpgradePrompt />}>
 *   <CRMFeature />
 * </RequireModule>
 * 
 * // Require ALL modules
 * <RequireModule module={['crm', 'analytics']} requireAll>
 *   <IntegratedDashboard />
 * </RequireModule>
 * 
 * // Show content when module is DISABLED (for upsells)
 * <RequireModuleDisabled module="analytics">
 *   <UpgradeToAnalyticsPromo />
 * </RequireModuleDisabled>
 * 
 * 
 * 3. MODULE CONTEXT (App-wide state)
 * ----------------------------------
 * import { ModuleProvider, useModuleContext } from '@/Context/ModuleContext';
 * 
 * // Wrap your app
 * <ModuleProvider>
 *   <App />
 * </ModuleProvider>
 * 
 * // Use in components
 * const { 
 *   isModuleEnabled, 
 *   enabledModules,
 *   getModuleInfo,
 *   filterNavigationByModules 
 * } = useModuleContext();
 * 
 * 
 * 4. NAVIGATION INTEGRATION
 * -------------------------
 * import ModuleAwareSidebar, { ModuleNavLink } from '@/Components/Navigation/ModuleAwareSidebar';
 * 
 * // Use the ready-made sidebar
 * <ModuleAwareSidebar showLockedModules={false} />
 * 
 * // Or individual links
 * <ModuleNavLink 
 *   module="crm" 
 *   href="/crm" 
 *   icon={UserCircleIcon} 
 *   label="CRM" 
 * />
 * 
 * 
 * BACKEND INTEGRATION:
 * ====================
 * 
 * The system expects the backend to share enabled modules via Inertia props.
 * In HandleInertiaRequests.php:
 * 
 * protected function shareTenantProps(Request $request): array
 * {
 *     return [
 *         'auth' => [
 *             // ...
 *             'accessibleModules' => fn () => $user
 *                 ? app(ModulePermissionService::class)->getNavigationForUser($user)
 *                 : [],
 *             // OR simpler version:
 *             'enabled_modules' => ['hrm', 'crm', 'project'],
 *         ],
 *     ];
 * }
 * 
 * 
 * MODULE CODES:
 * =============
 * - hrm: Human Resource Management
 * - crm: Customer Relationship Management  
 * - project: Project Management
 * - finance: Financial Management
 * - inventory: Inventory Management
 * - pos: Point of Sale
 * - dms: Document Management System
 * - quality: Quality Management
 * - analytics: Business Analytics
 * - compliance: Regulatory Compliance
 */

// Hooks
export { 
    useModule, 
    useModuleEnabled, 
    useEnabledModules 
} from '@/Hooks/useModule';

// Navigation Hooks
export {
    useNavigation,
    useModuleAccess,
    useModuleNavigation,
} from '@/Hooks/useNavigation';

// Components
export { 
    default as RequireModule,
    RequireModuleDisabled,
    withModuleGuard,
} from '@/Components/RequireModule';

// Feature Gate (Premium locked UI)
export {
    default as FeatureGate,
    FeatureGateInline,
    withFeatureGate,
} from '@/Components/FeatureGate';

// Context
export { 
    ModuleProvider,
    useModuleContext,
    useModuleCheck,
    AVAILABLE_MODULES,
    MODULE_METADATA,
} from '@/Context/ModuleContext';

// Navigation Configuration
export {
    navigationConfig,
    settingsNavigationConfig,
    MODULES,
} from '@/Configs/navigation';

// Navigation Utilities (Legacy Compatibility)
export {
    getIcon,
    convertToLegacyFormat,
    convertNavigationToPages,
    useLegacyPages,
} from '@/Configs/navigationUtils';

// Navigation Components
export {
    default as ModuleAwareSidebar,
    ModuleNavLink,
    ModuleNavSection,
} from '@/Components/Navigation/ModuleAwareSidebar';
