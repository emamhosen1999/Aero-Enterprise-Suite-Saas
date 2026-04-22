# aero-core Migration Consolidation — Obsolete Files

These files have been absorbed into the consolidated migrations.
**Safe to delete after verifying the `_consolidated/` files run cleanly on a fresh migrate.**

## Absorbed → `_consolidated/0001_01_01_000002_create_users_table.php`
- `2024_01_16_000002_add_two_factor_columns_to_users_table.php`
  - Reason: `two_factor_secret`, `two_factor_recovery_codes`, `two_factor_confirmed_at` already present in original create file.
- `2025_12_03_150826_add_phone_verification_to_users_table.php`
  - Reason: `phone_verified_at`, `phone_verification_code`, `phone_verification_sent_at` merged into create file.

## Absorbed → `_consolidated/2025_12_02_202539_create_user_devices_table.php`
- `2026_01_28_000001_add_device_salt_to_user_devices_table.php`
  - Reason: `device_salt`, `token_timestamp` merged into create file.

## Absorbed → `_consolidated/2025_11_29_000000_create_permission_tables.php`
- `2025_12_04_110855_add_scope_and_protection_to_rbac_tables.php`
  - Reason: `scope`, `is_protected`, `tenant_id` indexes merged into create file.
- `2025_12_30_100218_add_is_active_to_roles_table.php`
  - Reason: `is_active` merged into create file.
- `2026_01_11_000001_add_default_dashboard_to_roles_table.php`
  - Reason: `default_dashboard`, `priority` merged into create file.
  - ⚠️  ACTION REQUIRED: Move `seedDefaultDashboards()` logic to `database/seeders/RoleSeeder.php`.

## Absorbed — `2026_01_28_000002_add_hmac_token_to_password_reset_tokens_secure_table.php`
  - This file targets `password_reset_tokens_secure` which is a non-standard table.
  - No consolidated file created. If that table exists in your system, keep this file as-is
    or merge it into whichever migration creates `password_reset_tokens_secure`.

## Files NOT changed (clean, standalone, no consolidation needed)
All other migrations in this directory are standalone creates with no additive patches.
