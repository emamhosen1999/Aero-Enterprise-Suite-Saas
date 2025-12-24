# Aero HRM — Human Resource Management (Laravel + Inertia)

Aero HRM is a modern HR management module built on Laravel 11, Inertia.js v2, React 18, Tailwind CSS v4, and HeroUI. It supports SaaS multi-tenant deployments and can run as a standalone HR app. This documentation is designed for your Codecanyon listing and customer onboarding.

## Tech Stack
- Laravel 11 (PHP 8.2+)
- Inertia.js v2 + React 18
- Tailwind CSS v4 + HeroUI
- MySQL/MariaDB
- Composer 2, Node.js 18+

## Core Features
- Employee management: departments, designations, profiles
- Leave management: leave types, requests, approvals, bulk operations
- Timesheets and attendance (list, filters, table views)
- Role-based access control (RBAC)
- Search, filters, pagination, dark mode UI

## Deployment Modes
- SaaS (multi-tenant): per-tenant data isolation (subdomain-based)
- Standalone: single-tenant HR system

## Quick Start
See Installation.md for full steps. Summary:

```bash
# 1) Configure .env
# 2) Install dependencies
composer install --no-dev --prefer-dist
npm ci && npm run build

# 3) App setup
php artisan key:generate
php artisan migrate --force

# 4) (SaaS only) Tenants
php artisan tenant:create
php artisan tenant:migrate
```

## Packaging for Codecanyon
See Packaging.md for how we build the release ZIP with only the files buyers need.

## Documentation Index
- Installation.md
- Features.md
- Packaging.md
- Changelog.md
- FAQ.md
- Support.md
- ReleaseNotes.md
- License.md
