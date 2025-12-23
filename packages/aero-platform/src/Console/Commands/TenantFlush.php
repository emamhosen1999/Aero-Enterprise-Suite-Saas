<?php

namespace Aero\Platform\Console\Commands;

use Aero\Platform\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Aero\Core\Support\TenantCache;

class TenantFlush extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenant:flush
                            {tenant? : The tenant ID to flush (optional, flushes all if not specified)}
                            {--cache : Flush only cache}
                            {--sessions : Flush only sessions}
                            {--views : Flush only compiled views}
                            {--config : Flush only config cache}
                            {--all : Flush everything (default if no options specified)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Flush cache, sessions, and compiled files for a tenant or all tenants';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $tenantId = $this->argument('tenant');
        $flushAll = $this->option('all') || (! $this->option('cache') && ! $this->option('sessions') && ! $this->option('views') && ! $this->option('config'));

        if ($tenantId) {
            $tenant = Tenant::find($tenantId);
            if (! $tenant) {
                $this->error("Tenant '{$tenantId}' not found.");

                return self::FAILURE;
            }
            $this->flushTenant($tenant, $flushAll);
        } else {
            if (! $this->confirm('This will flush cache for ALL tenants. Continue?')) {
                return self::FAILURE;
            }

            $tenants = Tenant::all();
            $bar = $this->output->createProgressBar($tenants->count());
            $bar->start();

            foreach ($tenants as $tenant) {
                $this->flushTenant($tenant, $flushAll, false);
                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $this->info("Flushed cache for {$tenants->count()} tenants.");
        }

        // Flush global Laravel caches
        if ($flushAll || $this->option('config')) {
            Artisan::call('config:clear');
            $this->info('Configuration cache cleared.');
        }

        if ($flushAll || $this->option('views')) {
            Artisan::call('view:clear');
            $this->info('Compiled views cleared.');
        }

        return self::SUCCESS;
    }

    /**
     * Flush cache for a specific tenant.
     */
    protected function flushTenant(Tenant $tenant, bool $flushAll, bool $verbose = true): void
    {
        $flushed = [];

        // Flush tenant-specific cache
        if ($flushAll || $this->option('cache')) {
            $cacheKey = "tenant_{$tenant->id}";

            // Clear tenant-tagged cache
            try {
                TenantCache::tags([$cacheKey])->flush();
                $flushed[] = 'cache';
            } catch (\Exception $e) {
                // Tag-based caching not supported, flush by prefix
                $this->flushCacheByPrefix($tenant->id);
                $flushed[] = 'cache (prefix-based)';
            }

            // Clear tenant permissions cache
            try {
                TenantCache::tags(["tenant-{$tenant->id}-permissions"])->flush();
            } catch (\Exception $e) {
                // Ignore if not supported
            }
        }

        // Flush tenant sessions
        if ($flushAll || $this->option('sessions')) {
            $this->flushTenantSessions($tenant);
            $flushed[] = 'sessions';
        }

        if ($verbose && ! empty($flushed)) {
            $this->info("Tenant [{$tenant->id}]: Flushed ".implode(', ', $flushed));
        }
    }

    /**
     * Flush cache by prefix when tags aren't supported.
     */
    protected function flushCacheByPrefix(string $tenantId): void
    {
        // This is a fallback for file/database cache drivers
        // that don't support tags
        $prefix = "tenant_{$tenantId}_";

        // For Redis with prefix
        if (config('cache.default') === 'redis') {
            $redis = TenantCache::getRedis();
            $keys = $redis->keys(config('cache.prefix').$prefix.'*');
            if (! empty($keys)) {
                $redis->del($keys);
            }
        }
    }

    /**
     * Flush sessions for a specific tenant.
     */
    protected function flushTenantSessions(Tenant $tenant): void
    {
        $driver = config('session.driver');

        if ($driver === 'database') {
            // For database sessions, delete by tenant_id if column exists
            try {
                \DB::table('sessions')
                    ->where('tenant_id', $tenant->id)
                    ->delete();
            } catch (\Exception $e) {
                // tenant_id column might not exist
            }
        } elseif ($driver === 'redis') {
            // For Redis sessions
            try {
                $redis = app('redis')->connection(config('session.connection'));
                $prefix = config('session.prefix', 'laravel_session:').$tenant->id.'_';
                $keys = $redis->keys($prefix.'*');
                if (! empty($keys)) {
                    $redis->del($keys);
                }
            } catch (\Exception $e) {
                // Ignore Redis errors
            }
        }
    }
}
