<?php

namespace Aero\Core\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TagMigrationsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'aero:tag-migrations {--dry-run=false}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Tag all migrations with installation metadata (installation_tag, step, critical flag)';

    /**
     * Migration tag patterns (name => tag)
     */
    protected array $tagPatterns = [
        // CORE: Foundation
        'cache_table' => 'core:foundation',
        'jobs_table' => 'core:foundation',

        // CORE: Authentication
        'users_table' => 'core:auth',
        'user_sessions' => 'core:auth',
        'password_reset' => 'core:auth',
        'two_factor' => 'core:auth',
        'user_devices' => 'core:auth',
        'failed_login' => 'core:auth',
        'user_impersonation' => 'core:auth',
        'phone_verification' => 'core:auth',

        // CORE: RBAC
        'permission' => 'core:rbac',
        'roles' => 'core:rbac',
        'role_module_access' => 'core:rbac',

        // CORE: Audit
        'audit_logs' => 'core:audit',
        'notification' => 'core:notifications',

        // PLATFORM: Tenancy
        'tenants' => 'platform:tenancy',
        'domains' => 'platform:tenancy',

        // PLATFORM: Billing
        'plans' => 'platform:billing',
        'subscriptions' => 'platform:billing',

        // PLATFORM: Modules
        'modules' => 'platform:modules',
        'sub_modules' => 'platform:modules',
        'components' => 'platform:modules',
        'module_purchases' => 'platform:modules',
        'module_licenses' => 'platform:modules',

        // PLATFORM: Settings
        'system_settings' => 'platform:settings',
        'app_settings' => 'platform:settings',

        // HRM
        'employees' => 'hrm:base',
        'departments' => 'hrm:base',
        'designations' => 'hrm:base',
        'shifts' => 'hrm:base',
        'salary_components' => 'hrm:payroll',
        'salary_structure' => 'hrm:payroll',
        'leave_type' => 'hrm:leave',

        // Other modules
        'leads' => 'crm:base',
        'projects' => 'project:base',
        'pages' => 'cms:base',
    ];

    /**
     * Critical migrations (if these fail, installation fails)
     */
    protected array $criticalTags = [
        'core:foundation',
        'core:auth',
        'platform:tenancy',
        'platform:modules',
    ];

    /**
     * Installation step mapping
     */
    protected array $stepMapping = [
        'core:foundation' => 1,
        'core:auth' => 2,
        'core:rbac' => 3,
        'platform:tenancy' => 3,
        'platform:billing' => 4,
        'platform:modules' => 5,
        'platform:settings' => 6,
        'platform:cache' => 7,
        'platform:finalize' => 8,
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        $this->info('=== Migration Tagging Command ===');
        $this->newLine();

        // Get all migrations
        $migrations = DB::table('migrations')->get();

        if ($migrations->isEmpty()) {
            $this->warn('No migrations found in database.');

            return 0;
        }

        $this->info("Found {$migrations->count()} migrations.");
        $this->newLine();

        $tagged = 0;
        $untagged = 0;
        $updates = [];

        foreach ($migrations as $migration) {
            $tag = $this->getTagForMigration($migration->migration);
            $step = $tag ? ($this->stepMapping[$tag] ?? null) : null;
            $isCritical = $tag && in_array($tag, $this->criticalTags);

            if (! $tag) {
                $untagged++;
                $this->line("  <fg=yellow>⚠</> {$migration->migration} -> <fg=yellow>UNTAGGED</>");
            } else {
                $tagged++;
                $this->line("  <fg=green>✓</> {$migration->migration} -> <fg=green>{$tag}</> (step: {$step}, critical: ".($isCritical ? 'yes' : 'no').')');

                $updates[] = [
                    'batch' => $migration->batch,
                    'migration' => $migration->migration,
                    'tag' => $tag,
                    'step' => $step,
                    'critical' => $isCritical,
                ];
            }
        }

        $this->newLine();
        $this->info('Results:');
        $this->line("  <fg=green>Tagged:</> {$tagged}");
        $this->line("  <fg=yellow>Untagged:</> {$untagged}");

        if ($dryRun) {
            $this->newLine();
            $this->warn('[DRY RUN] No database changes made. Run without --dry-run to apply tags.');

            return 0;
        }

        if ($this->confirm("Apply {$tagged} tags to database?", true)) {
            $this->newLine();
            $this->info('Applying tags...');

            foreach ($updates as $update) {
                DB::table('migrations')
                    ->where('migration', $update['migration'])
                    ->update([
                        'installation_tag' => $update['tag'],
                        'installation_step' => $update['step'],
                        'is_platform_critical' => $update['critical'],
                    ]);
            }

            $this->newLine();
            $this->info('<fg=green>✓</> Migration tagging complete!');
        }

        return 0;
    }

    /**
     * Get tag for a migration based on filename
     */
    protected function getTagForMigration(string $migrationName): ?string
    {
        $name = strtolower($migrationName);

        // Exact pattern match
        foreach ($this->tagPatterns as $pattern => $tag) {
            if (strpos($name, strtolower($pattern)) !== false) {
                return $tag;
            }
        }

        // Default based on common prefixes
        if (strpos($name, 'create') !== false) {
            return 'core:foundation';
        }

        return null;
    }
}
