# Migration Organization Guide

## Overview

This document explains the migration organization strategy for the Aero Enterprise Suite SaaS application, which uses a **multi-tenant architecture** with separate databases for the central/landlord context and individual tenant contexts.

## Architecture Summary

### Database Structure
- **Central Database** (`eos365` or configured name): Stores platform-level data
  - Tenants, domains, plans, subscriptions
  - Landlord users (platform administrators)
  - Platform settings and statistics
  - Module definitions and configurations
  
- **Tenant Databases** (`tenant{id}`): Each tenant has isolated database
  - Tenant users, employees, departments
  - HRM, payroll, attendance data
  - Tenant-specific settings and invitations
  - Application data specific to each tenant

### Migration Folders

#### 1. Root Migrations (`database/migrations/`)
**Purpose:** Migrations for the **central/landlord database**

**Total:** 40 migrations

**Contains:**
- Tenant management tables (tenants, domains)
- Subscription and billing tables (plans, subscriptions, usage_records)
- Platform settings and statistics
- Landlord user authentication (landlord_users, landlord_password_reset_tokens)
- Module hierarchy definitions (modules, sub_modules, module_components, module_component_actions)
- Central queue and job tables (jobs, failed_jobs)
- Central error and notification logs
- Finance integration tables (for cross-tenant finance management)

**Configuration:**
- Runs via standard `php artisan migrate` command
- Uses the `central` database connection (configured in `config/database.php`)

#### 2. Tenant Migrations (`database/migrations/tenant/`)
**Purpose:** Migrations for **each tenant's isolated database**

**Total:** 18 migrations

**Contains:**
- User authentication and sessions (users, password_reset_tokens, sessions)
- Employee and HRM core tables (employees, departments, designations)
- Attendance and leave management
- Payroll and salary structures
- Tax configurations
- Training and performance management
- Recruitment and job applications
- Tenant-specific system settings
- User device tracking and security

**Configuration:**
- Runs via `php artisan tenants:migrate` command
- Configured in `config/tenancy.php` at line 191:
  ```php
  'migration_parameters' => [
      '--force' => true,
      '--path' => [database_path('migrations/tenant')],
      '--realpath' => true,
  ],
  ```

## Intentional Duplicate Migrations

Some migrations exist in **BOTH** folders because they're needed in both contexts. These are intentional and properly designed:

### 1. Media Table (`2024_07_27_061640_create_media_table.php`)
**Why duplicate:** Spatie Media Library is used in both contexts
- **Central:** For platform-level media (tenant logos, platform assets)
- **Tenant:** For tenant-specific media (employee photos, documents)
- **Status:** ✓ Intentional - Correctly duplicated

### 2. Permission Tables (`2025_11_29_000000_create_permission_tables.php`)
**Why duplicate:** Spatie Permission package used in both contexts
- **Central:** For landlord user roles/permissions (super_admin, admin, support)
- **Tenant:** For tenant user roles/permissions (admin, manager, employee)
- **Note:** This migration uses Spatie's package migration, identical in both contexts
- **Status:** ✓ Intentional - Correctly duplicated

### 3. Grades Table (`2025_12_02_153410_create_grades_table.php`)
**Why duplicate:** Lookup/reference table needed in both contexts
- **Central:** For platform-level grade definitions
- **Tenant:** For tenant-specific grade usage
- **Status:** ✓ Intentional - Correctly duplicated (lookup table)

### 4. Job Types Table (`2025_12_02_153442_create_job_types_table.php`)
**Why duplicate:** Lookup/reference table needed in both contexts
- **Central:** For platform-level job type definitions
- **Tenant:** For tenant-specific job type usage
- **Status:** ✓ Intentional - Correctly duplicated (lookup table)

### 5. RBAC Scope Tables (`2025_12_04_110855_add_scope_and_protection_to_rbac_tables.php`)
**Why duplicate:** Adds columns to permission tables in both contexts
- **Central:** Updates landlord permission tables
- **Tenant:** Updates tenant permission tables
- **Status:** ✓ Intentional - Correctly duplicated (modifies tables in both contexts)

### 6. Role Module Access Table (`2025_12_05_000741_create_role_module_access_table.php`)
**Why duplicate:** Different implementations for cross-database references
- **Central Version:** Has foreign key constraints to `modules`, `sub_modules`, etc.
- **Tenant Version:** Uses unsigned big integers WITHOUT foreign keys (cross-database reference)
  - Module hierarchy is stored in central database
  - Tenant roles reference these via IDs but can't have FK constraints across databases
- **Status:** ✓ Intentional - Different implementations for architectural reasons

## Table Name Conflicts (Expected)

### Sessions Table
- **Created in:** Both contexts
- **Root:** Created by `2025_12_01_131931_update_landlord_users_table_to_match_users_structure.php`
- **Tenant:** Created by `0001_01_01_000002_create_users_table.php`
- **Reason:** Separate session tracking for landlord users vs tenant users
- **Status:** ✓ Expected - Isolated by database context

## Migration Verification Checklist

### Central Database Tables (Should be in root migrations/)
- [x] `tenants` - Tenant registry
- [x] `domains` - Tenant domain mappings
- [x] `plans` - Subscription plans
- [x] `subscriptions` - Tenant subscriptions
- [x] `subscription_items` - Line items for subscriptions
- [x] `landlord_users` - Platform administrators
- [x] `landlord_password_reset_tokens` - Password resets for admins
- [x] `platform_settings` - Platform configuration
- [x] `tenant_stats` - Tenant usage statistics
- [x] `platform_stats_daily` - Platform analytics
- [x] `modules` - Module definitions
- [x] `sub_modules` - Sub-module definitions
- [x] `module_components` - Component definitions
- [x] `module_component_actions` - Action definitions
- [x] `plan_module` - Plan-Module pivot table
- [x] `role_module_access` - Platform role-module mapping (with FKs)
- [x] `jobs` - Queue jobs (central queue)
- [x] `failed_jobs` - Failed jobs tracking
- [x] `cache` - Cache table
- [x] `cache_locks` - Cache locks
- [x] `media` - Platform media files
- [x] `roles` - Landlord roles (Spatie)
- [x] `permissions` - Landlord permissions (Spatie)
- [x] `model_has_permissions` - Landlord permission assignments
- [x] `model_has_roles` - Landlord role assignments
- [x] `role_has_permissions` - Landlord role-permission pivot
- [x] `usage_records` - Metered billing records
- [x] `usage_aggregates` - Usage summaries
- [x] `usage_limits` - Usage caps
- [x] `usage_alerts` - Usage notifications
- [x] `notification_logs` - Platform notifications
- [x] `error_logs` - Platform error tracking
- [x] `grades` - Grade definitions (shared)
- [x] `job_types` - Job type definitions (shared)
- [x] `tenant_billing_addresses` - Billing information
- [x] `finance_accounts` - Central finance accounts
- [x] `finance_journal_entries` - Central finance journals
- [x] `finance_journal_entry_lines` - Journal entry lines
- [x] `integrations_connectors` - Integration configs
- [x] `integrations_webhooks` - Webhook endpoints
- [x] `integrations_webhook_logs` - Webhook logs
- [x] `integrations_api_keys` - API key management

### Tenant Database Tables (Should be in tenant migrations/)
- [x] `users` - Tenant users
- [x] `password_reset_tokens` - Password resets for tenant users
- [x] `sessions` - Tenant user sessions
- [x] `user_sessions_tracking` - Session tracking
- [x] `authentication_events` - Auth event logging
- [x] `media` - Tenant media files
- [x] `roles` - Tenant roles (Spatie)
- [x] `permissions` - Tenant permissions (Spatie)
- [x] `model_has_permissions` - Tenant permission assignments
- [x] `model_has_roles` - Tenant role assignments
- [x] `role_has_permissions` - Tenant role-permission pivot
- [x] `role_module_access` - Tenant role-module mapping (no FKs, cross-DB refs)
- [x] `system_settings` - Tenant settings
- [x] `tenant_invitations` - Team member invitations
- [x] `departments` - Organization departments
- [x] `designations` - Job titles/positions
- [x] `employees` - Employee master data
- [x] `employee_personal_documents` - Employee documents
- [x] `emergency_contacts` - Emergency contact info
- [x] `employee_addresses` - Employee addresses
- [x] `employee_education` - Education history
- [x] `employee_work_experience` - Work history
- [x] `employee_bank_details` - Banking information
- [x] `employee_dependents` - Dependent information
- [x] `employee_certifications` - Certifications
- [x] `employee_skills` - Skills tracking
- [x] `attendance_settings` - Attendance configuration
- [x] `attendance_types` - Attendance type definitions
- [x] `attendances` - Attendance records
- [x] `shift_schedules` - Work shift definitions
- [x] `employee_shift_schedule` - Employee shift assignments
- [x] `leave_settings` - Leave configuration
- [x] `leaves` - Leave requests
- [x] `leave_balances` - Leave balance tracking
- [x] `holidays` - Holiday calendar
- [x] `salary_components` - Salary component definitions
- [x] `employee_salary_structures` - Employee salary breakdowns
- [x] `salary_templates` - Reusable salary templates
- [x] `salary_template_components` - Template components
- [x] `salary_revisions` - Salary change history
- [x] `tax_slabs` - Income tax slabs
- [x] `professional_tax_slabs` - Professional tax slabs
- [x] `tax_exemptions` - Tax exemption rules
- [x] `tax_deductions` - Tax deduction rules
- [x] `tax_settings` - Tax configuration
- [x] `employee_tax_declarations` - Employee tax declarations
- [x] `payrolls` - Payroll runs
- [x] `payroll_allowances` - Payroll allowances
- [x] `payroll_deductions` - Payroll deductions
- [x] `payslips` - Generated payslips
- [x] `jobs_recruitment` - Job postings
- [x] `job_hiring_stages` - Hiring pipeline stages
- [x] `job_applications` - Job applications
- [x] `job_application_stage_history` - Application stage tracking
- [x] `job_interviews` - Interview scheduling
- [x] `job_interview_interviewers` - Interview panel
- [x] `job_interview_feedback` - Interview feedback
- [x] `job_offers` - Job offers
- [x] `kpis` - KPI definitions
- [x] `kpi_values` - KPI measurements
- [x] `performance_review_templates` - Review templates
- [x] `performance_reviews` - Performance reviews
- [x] `training_categories` - Training categories
- [x] `training_sessions` - Training sessions
- [x] `training_enrollments` - Training enrollments
- [x] `training_feedback` - Training feedback
- [x] `training_materials` - Training materials
- [x] `training_assignments` - Training assignments
- [x] `training_assignment_submissions` - Assignment submissions
- [x] `grades` - Grade lookup (tenant instance)
- [x] `job_types` - Job type lookup (tenant instance)
- [x] `failed_login_attempts` - Security tracking
- [x] `user_devices` - Device management

## Migration Naming Conventions

### Format
`YYYY_MM_DD_HHMMSS_descriptive_action_table_name.php`

### Action Verbs
- `create_` - Creating new table(s)
- `add_` - Adding columns to existing table
- `update_` - Modifying existing columns
- `fix_` - Correcting data or structure issues

### Examples
- ✓ `2025_11_29_000001_create_custom_tenants_table.php`
- ✓ `2025_12_01_002329_add_maintenance_mode_to_platform_settings_table.php`
- ✓ `2025_12_05_221628_fix_company_verification_code_column_lengths.php`

## Best Practices

### 1. Placement Decision
**Ask yourself:** "Which database needs this table?"
- **Platform/Admin features** → Root migrations
- **Tenant-specific features** → Tenant migrations
- **Both contexts** → Duplicate with clear documentation

### 2. Cross-Database References
When tenant tables need to reference central tables:
- Use `unsignedBigInteger()` instead of `foreignId()`
- Do NOT add `constrained()` or foreign key constraints
- Document the cross-database relationship in comments
- Example: `role_module_access` table in tenant database

### 3. Shared Lookup Tables
For reference data needed in both contexts:
- Create duplicate migrations if data should be isolated
- Consider syncing mechanisms if data should be shared
- Document the duplication reason

### 4. Migration Testing
Before deploying:
```bash
# Test central migrations
php artisan migrate:status

# Test tenant migrations (requires tenant setup)
php artisan tenants:migrate --pretend

# Check for conflicts
php artisan migrate:status --database=tenant
```

## Common Pitfalls

### ❌ DON'T: Add tenant-specific migrations to root
```php
// WRONG: Employee table in root migrations/
Schema::create('employees', function (Blueprint $table) {
    // This should be in tenant migrations!
});
```

### ❌ DON'T: Add foreign key constraints across databases
```php
// WRONG: In tenant database referencing central modules table
$table->foreignId('module_id')
    ->constrained('modules')  // modules is in central DB!
    ->cascadeOnDelete();
```

### ✓ DO: Use unsigned integers for cross-database references
```php
// CORRECT: In tenant database referencing central modules table
$table->unsignedBigInteger('module_id')->nullable();
// No foreign key constraint - cross-database reference
```

### ✓ DO: Document duplicate migrations
```php
/**
 * Creates the media table for Spatie Media Library.
 * 
 * NOTE: This migration exists in BOTH root and tenant folders.
 * - Root: For platform-level media (tenant logos, platform assets)
 * - Tenant: For tenant-specific media (employee photos, documents)
 */
```

## Maintenance Commands

### Check Migration Status
```bash
# Central database
php artisan migrate:status

# Tenant databases
php artisan tenants:migrate --pretend
```

### Fresh Migration (Development Only)
```bash
# Central database
php artisan migrate:fresh --seed

# All tenant databases
php artisan tenants:migrate-fresh
```

### Rollback
```bash
# Central database
php artisan migrate:rollback

# Tenant databases
php artisan tenants:rollback
```

## Summary

The migration organization in this project is **correct and intentional**:

✅ **40 root migrations** for central/landlord database  
✅ **18 tenant migrations** for tenant-specific databases  
✅ **6 intentional duplicates** with valid architectural reasons  
✅ **No missing migrations** - all tables have corresponding migrations  
✅ **Proper separation** of concerns between central and tenant contexts  

The duplicate migrations serve specific architectural purposes:
1. **Media** - Spatie library used in both contexts
2. **Permissions** - RBAC in both contexts (platform admin vs tenant users)
3. **Grades & Job Types** - Shared lookup tables
4. **RBAC Scope** - Updates to permission tables in both contexts
5. **Role Module Access** - Different implementations for cross-database references

All migrations are properly placed and there are no organizational issues.
