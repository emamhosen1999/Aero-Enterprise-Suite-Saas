<?php

namespace Aero\Platform\Console\Commands;

use Illuminate\Console\Command;

/**
 * Build Assets Command
 * 
 * Simplified asset building for SaaS deployments.
 * 
 * Since the host app's vite.config.js already points to vendor/aero/* packages,
 * we just need to run the host app's build command.
 * 
 * Usage: php artisan aero:build-assets
 */
class PublishAssets extends Command
{
    protected $signature = 'aero:publish-assets 
                            {--force : Force overwrite existing assets}';

    protected $description = 'Publish pre-built assets from Aero packages to host application';

    public function handle(): int
    {
        $force = $this->option('force');

        $this->info('📦 Publishing Aero Platform Assets...');
        $this->newLine();

        // Call Laravel's native vendor:publish with our tag
        $tags = ['aero-platform-assets'];
        
        foreach ($tags as $tag) {
            $this->call('vendor:publish', [
                '--tag' => $tag,
                '--force' => $force
            ]);
        }

        $this->newLine();
        $this->info('✅ Platform assets published successfully!');
        $this->line('   Location: public/vendor/aero-platform/');
        $this->newLine();
        $this->info('💡 Run "php artisan optimize:clear" to clear caches.');
        
        return self::SUCCESS;
    }
}
