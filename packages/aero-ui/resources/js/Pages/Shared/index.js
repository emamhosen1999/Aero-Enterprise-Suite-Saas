/**
 * Shared Pages Index
 * 
 * This directory contains context-aware pages that can be used by both
 * tenant (web guard) and platform admin (landlord guard) contexts.
 * 
 * Each component accepts a `context` prop ('tenant' | 'admin') or 
 * `is_platform_context` boolean to adapt its behavior:
 * - Routes and API endpoints
 * - Available features (e.g., invite only in tenant)
 * - Labels and descriptions
 * 
 * Usage in Controllers:
 * 
 * // Platform Admin context
 * return Inertia::render('Shared/Users/Index', [
 *     'context' => 'admin',
 *     'roles' => $roles,
 * ]);
 * 
 * // Tenant context
 * return Inertia::render('Shared/Users/Index', [
 *     'context' => 'tenant',
 *     'roles' => $roles,
 *     'departments' => $departments,
 * ]);
 */

// ===== Core Management Pages =====

// Users Management - context-aware user list with CRUD
export { default as UsersList } from './Users/Index';

// Roles Management - context-aware role and permission management
export { default as RoleManagement } from './Roles/Index';

// Modules Management - context-aware module access control
export { default as ModuleManagement } from './Modules/Index';

// ===== Authentication Pages =====

// Login - works across tenant and platform contexts via relative URLs
export { default as Login } from './Auth/Login';

// Password Reset Flow
export { default as ForgotPassword } from './Auth/ForgotPassword';
export { default as ResetPassword } from './Auth/ResetPassword';

// Email Verification
export { default as VerifyEmail } from './Auth/VerifyEmail';

// User Invitation (tenant-specific but can be used in platform)
export { default as AcceptInvitation } from './Auth/AcceptInvitation';
export { default as InvitationExpired } from './Auth/InvitationExpired';

// Admin Setup (initial platform setup)
export { default as AdminSetup } from './Auth/AdminSetup';

// Role Management - context-aware role & user-role assignment  
export { default as RoleManagement } from './Roles/Index';

// Module Management - context-aware module access control
export { default as ModuleManagement } from './Modules/Index';
