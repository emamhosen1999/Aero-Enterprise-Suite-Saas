# Release Notes — Aero HRM

## Tested Environments
- Windows 11 + Laragon (PHP 8.2, MySQL 8)
- Node 18, Composer 2

## Known Considerations
- Ensure `public/` is your document root
- After upgrades, clear caches: `config:clear`, `route:clear`, `cache:clear`
- In SaaS mode, set `PLATFORM_DOMAIN` and `ADMIN_DOMAIN` correctly

## Upgrade Guidance
- Backup DB and `.env`
- Run migrations and asset builds
- Validate key HR flows post-deploy
