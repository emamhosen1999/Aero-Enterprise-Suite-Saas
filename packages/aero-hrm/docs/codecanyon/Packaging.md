# Packaging Guide (Codecanyon Release)

This shows how the release ZIP is built from the monorepo.

## Overview
Aero HRM ships either as:
- Standalone HR app (recommended for Codecanyon buyers)
- SaaS module bundled with platform (for advanced users)

## Windows (PowerShell) — Standalone HRM
Use the helper script to assemble a clean release:

```powershell
# From the monorepo root
# Builds standalone HRM app into dist folder
./scripts/build-hrm-standalone.ps1
```

The script will:
- Copy necessary package files (HRM + core + UI dependencies)
- Clean dev-only files
- Prepare `public/` assets via Vite build
- Produce `aero-hrm-release.zip`

## Linux/macOS (Manual or Shell)
If a shell script is preferred, use:

```bash
# Example build
./scripts/build-saas.sh
# Or build a single module using build-module.ps1 equivalent logic
```

## What To Include
- `public/`
- `app/`, `bootstrap/`, `config/`, `database/`, `resources/`, `routes/`, `storage/`
- `composer.json`, `package.json`, `vite.config.js`
- `README + docs`

## What To Exclude
- `.git`, CI configs, node_modules, vendor (buyers run install)
- Test files unless intentional

## Final QA Checklist
- Fresh unzip boots with `composer install`, `npm ci`, `php artisan migrate`
- Admin user can be created
- Assets load (Vite manifest present)
- Basic HR flows (employees, leaves, timesheets) run
