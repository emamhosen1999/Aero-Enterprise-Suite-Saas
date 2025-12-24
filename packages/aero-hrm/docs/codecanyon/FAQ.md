# FAQ — Aero HRM

**Is Aero HRM SaaS-ready?**
- Yes. In SaaS mode, each tenant has isolated data via subdomains.

**Can I run it as a single HR system?**
- Yes. Use the standalone release and normal `.env` DB settings.

**How do I create tenants?**
- Run `php artisan tenant:create` then `php artisan tenant:migrate`.

**My assets don’t load after upload.**
- Run `npm run build`, ensure your vhost points to `public/`.

**Does it support queues?**
- Yes. Configure `queue:work` and `schedule:run` in production.

**Which PHP and Node versions are required?**
- PHP 8.2+, Node 18+, Composer 2+.
