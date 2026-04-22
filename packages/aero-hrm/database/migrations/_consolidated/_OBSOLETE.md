# aero-hrm Migration Consolidation — Obsolete Files

These files have been absorbed into the consolidated migrations.
**Safe to delete after verifying the `_consolidated/` files run cleanly on a fresh migrate.**

---

## GOD-MIGRATION SPLIT
`2025_12_02_121546_create_hrm_core_tables.php` has been split into 7 focused files:

| New File | Domain |
|---|---|
| `2025_12_02_100000_create_hrm_employee_core_tables.php` | departments, designations, employees, documents, contacts |
| `2025_12_02_110000_create_hrm_attendance_tables.php`    | attendance_settings, attendance_types, attendances |
| `2025_12_02_120000_create_hrm_leave_tables.php`         | leave_settings, leaves, leave_balances, holidays, accruals |
| `2025_12_02_130000_create_hrm_payroll_tables.php`       | grades, salary_components, tax_slabs, payrolls, payslips |
| `2025_12_02_140000_create_hrm_recruitment_tables.php`   | job_types, jobs_recruitment, job_hiring_stages, applications, interviews |
| `2025_12_02_150000_create_hrm_performance_tables.php`   | kpis, performance_reviews, pip_plans, pip_goals |
| `2025_12_02_160000_create_hrm_training_tables.php`      | shift_schedules, task_templates, training_*, employee_skills |

**DELETE ORIGINAL:** `2025_12_02_121546_create_hrm_core_tables.php`

---

## STANDALONE MIGRATIONS NOW GROUPED INTO DOMAIN FILES (DELETE THESE)

### Grouped into `_create_hrm_employee_core_tables.php`:
- `2026_01_07_000001_add_missing_columns_to_departments_table.php` — code, location, established_date merged
- `2026_01_07_000002_add_parent_id_to_designations_table.php` — parent_id FK merged
- `2026_01_11_000003_add_personal_info_to_employees_table.php` — personal/document cols merged
- `2026_04_22_040116_add_demographic_columns_to_employees_table.php` — gender/date_of_birth merged
  ⚠️  `gender` DUPLICATE RESOLVED: single `string('gender', 20)` definition kept

### Grouped into `_create_hrm_payroll_tables.php`:
- `2025_12_02_134314_create_salary_components_table.php`
- `2025_12_02_134324_create_employee_salary_structures_table.php`
- `2025_12_02_133657_create_tax_configuration_tables.php`
- `2025_12_02_153410_create_grades_table.php`

### Grouped into `_create_hrm_recruitment_tables.php`:
- `2025_12_02_153442_create_job_types_table.php`
- `2026_01_21_000002_update_recruitment_tables.php` — sequence, required_actions, is_final, created_by merged
- `2026_01_26_051223_add_deleted_at_to_job_hiring_stages_table.php` — softDeletes merged

### Grouped into `_create_hrm_performance_tables.php`:
- `2026_04_22_041735_add_soft_deletes_to_performance_reviews_table.php` — softDeletes merged
- `2026_04_21_000002_create_pip_plans_table.php` — grouped
- `2026_04_21_000003_create_pip_goals_table.php` — grouped

### Grouped into `_create_hrm_leave_tables.php`:
- `2026_04_21_000004_create_leave_accrual_rules_table.php` — grouped
- `2026_04_21_000005_create_leave_accrual_transactions_table.php` — grouped

### Grouped into `_create_hrm_training_tables.php`:
- `2025_12_02_153454_create_shift_schedules_table.php`
- `2025_12_02_121600_create_task_templates_table.php`

---

## ONBOARDING/OFFBOARDING — 6 files → 1 (DELETE THESE):
- `2025_12_31_000001_create_onboardings_table.php`
- `2025_12_31_000002_create_onboarding_tasks_table.php`
- `2025_12_31_000003_add_missing_columns_to_onboardings_table.php`
- `2025_12_31_000004_add_missing_columns_to_onboarding_tasks_table.php`
- `2025_12_31_000005_create_onboarding_offboarding_steps_tables.php`
- `2025_12_31_000006_create_checklists_table.php`

**Replaced by:** `2025_12_31_000001_create_hrm_onboarding_offboarding_tables.php`

---

## BENEFITS — 5 files → 1 (DELETE THESE):
- `2026_04_22_041743_create_employee_benefits_table.php`
- `2026_04_22_041913_add_missing_columns_to_employee_benefits_table.php` — cost_to_employee, notes merged
- `2026_04_21_000001_create_benefit_open_enrollment_periods_table.php` — period FK merged into benefit_enrollments
- *(benefit_plans and basic benefits from `create_missing_hrm_tables.php` also grouped)*

**Replaced by:** `2026_01_24_000001_create_hrm_benefits_tables.php`

---

## FILES NOT CHANGED (standalone, clean, keep as-is):
- `2025_12_06_160000_create_finance_accounts_table.php`
- `2025_12_06_160100_create_finance_journal_entries_table.php`
- `2026_01_09_000001_create_expense_categories_table.php`
- `2026_01_09_000002_create_expense_claims_table.php`
- `2026_01_09_100001_create_asset_categories_table.php`
- `2026_01_09_100002_create_assets_table.php`
- `2026_01_09_100003_create_asset_allocations_table.php`
- `2026_01_09_130001_create_disciplinary_action_types_table.php`
- `2026_01_09_130002_create_disciplinary_cases_table.php`
- `2026_01_09_130003_create_warnings_table.php`
- `2026_01_12_000001_create_missing_hrm_tables.php` (partially absorbed into benefits — review carefully)
- `2026_01_12_000002_create_ai_analytics_tables.php`
- `2026_01_22_000001_create_hrm_gap_fill_tables.php`
- `2026_01_22_000002_create_hrm_advanced_modules_tables.php`
- `2026_04_06_000001_create_finance_accounts_table.php` (if exists)
- `2026_04_19_000001_create_employee_dashboard_tables.php`
- `2026_04_21_000006_create_shift_swap_requests_table.php`
- `2026_04_21_000007_create_shift_marketplace_listings_table.php`
- `2026_04_21_000008_add_deleted_at_to_safety_trainings_table.php`
- `2026_06_15_100001_add_type_column_to_safety_incidents_table.php`

---

## ⚠️  ACTION REQUIRED AFTER DELETION

1. Run `php artisan migrate:fresh` on a dev environment to validate all consolidated files.
2. Move the `seedDefaultDashboards()` logic to `database/seeders/RoleSeeder.php` (aero-core).
3. Update the `migrations` table in any environment where old files were already run:
   ```sql
   -- Example: remove absorbed migrations from tracking table
   DELETE FROM migrations WHERE migration IN (
     '2024_01_16_000002_add_two_factor_columns_to_users_table',
     '2025_12_03_150826_add_phone_verification_to_users_table',
     '2026_01_28_000001_add_device_salt_to_user_devices_table',
     '2025_12_04_110855_add_scope_and_protection_to_rbac_tables',
     '2025_12_30_100218_add_is_active_to_roles_table',
     '2026_01_11_000001_add_default_dashboard_to_roles_table',
     '2026_01_07_000001_add_missing_columns_to_departments_table',
     '2026_01_07_000002_add_parent_id_to_designations_table',
     '2026_01_11_000003_add_personal_info_to_employees_table',
     '2026_04_22_040116_add_demographic_columns_to_employees_table',
     '2026_01_21_000002_update_recruitment_tables',
     '2026_01_26_051223_add_deleted_at_to_job_hiring_stages_table',
     '2026_04_22_041735_add_soft_deletes_to_performance_reviews_table',
     '2026_04_21_000002_create_pip_plans_table',
     '2026_04_21_000003_create_pip_goals_table',
     '2026_04_21_000004_create_leave_accrual_rules_table',
     '2026_04_21_000005_create_leave_accrual_transactions_table',
     '2025_12_31_000001_create_onboardings_table',
     '2025_12_31_000002_create_onboarding_tasks_table',
     '2025_12_31_000003_add_missing_columns_to_onboardings_table',
     '2025_12_31_000004_add_missing_columns_to_onboarding_tasks_table',
     '2025_12_31_000005_create_onboarding_offboarding_steps_tables',
     '2025_12_31_000006_create_checklists_table',
     '2026_04_22_041743_create_employee_benefits_table',
     '2026_04_22_041913_add_missing_columns_to_employee_benefits_table',
     '2026_04_21_000001_create_benefit_open_enrollment_periods_table'
   );
   ```
