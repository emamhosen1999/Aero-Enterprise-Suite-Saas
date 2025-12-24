<?php

namespace Aero\Platform\Jobs;

use Aero\Platform\Events\TenantProvisioningStepCompleted;
use Aero\Platform\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Stancl\Tenancy\Jobs\CreateDatabase;
use Stancl\Tenancy\Jobs\MigrateDatabase;
use Throwable;

/**
 * ProvisionTenant Job
 *
 * Handles the asynchronous provisioning of a new tenant, including:
 * - Database creation
 * - Schema migrations
 * - Default roles seeding (permissions are NOT used)
 *
 * NOTE: Admin user creation is NOT done here. The admin user is created
 * on the tenant domain AFTER provisioning completes, during the admin
 * setup step of the registration flow.
 *
 * This job is designed to be queued and processed in the background,
 * allowing the registration flow to complete immediately while the
 * tenant infrastructure is set up asynchronously.
 *
 * The job updates the tenant's provisioning_step at each stage for
 * real-time status tracking and debugging.
 */
class ProvisionTenant implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public array $backoff = [30, 60, 120];

    /**
     * The maximum number of unhandled exceptions to allow before failing.
     */
    public int $maxExceptions = 1;

    /**
     * The tenant to provision.
     */
    public Tenant $tenant;

    /**
     * Create a new job instance.
     *
     * @param  Tenant  $tenant  The tenant to provision
     */
    public function __construct(Tenant $tenant)
    {
        $this->tenant = $tenant;
    }

    /**
     * Execute the job.
     *
     * Provision the tenant through the following steps:
     * 0. Pre-flight validation (plan, modules, database connection)
     * 1. Create the tenant database
     * 2. Run migrations on the tenant database
     * 3. Sync module hierarchy
     * 4. Seed default roles
     * 5. Verify provisioning (check required tables)
     * 6. Activate the tenant
     * 7. Send notification email
     *
     * NOTE: Admin user creation is done AFTER provisioning on the tenant domain.
     *
     * If any step fails, the entire provisioning is rolled back.
     */
    public function handle(): void
    {
        $context = [
            'tenant_id' => $this->tenant->id,
            'tenant_name' => $this->tenant->name,
            'subdomain' => $this->tenant->domains->first()?->domain ?? 'unknown',
        ];

        $this->logStep('🚀 STARTING TENANT PROVISIONING', $context);

        $databaseCreated = false;

        try {
            // Step 0: Pre-flight validation
            $this->logStep('✅ Step 0: Running pre-flight validation', $context);
            $this->validatePrerequisites();
            $this->logStep('✅ Step 0 Complete: Pre-flight validation passed', $context);

            // Step 1: Mark as provisioning
            $this->logStep('📋 Step 1: Marking tenant as provisioning', $context);
            $this->tenant->startProvisioning(Tenant::STEP_CREATING_DB);
            $this->logStep('✅ Step 1 Complete: Tenant marked as provisioning', $context);

            // Step 2: Create the database
            $this->logStep('🗄️  Step 2: Creating tenant database', $context);
            $this->createDatabase();
            $databaseCreated = true;
            $this->logStep('✅ Step 2 Complete: Database created - '.$this->tenant->database()->getName(), $context);

            // Step 3: Run migrations
            $this->logStep('🔄 Step 3: Running database migrations', $context);
            $this->migrateDatabase();
            $this->logStep('✅ Step 3 Complete: Migrations applied successfully', $context);

            // Step 4: Sync module hierarchy
            $this->logStep('📦 Step 4: Syncing module hierarchy', $context);
            $this->syncModuleHierarchy();
            $this->logStep('✅ Step 4 Complete: Module hierarchy synced', $context);

            // Step 5: Seed default roles
            $this->logStep('🔐 Step 5: Seeding default roles', $context);
            $this->seedDefaultRoles();
            $this->logStep('✅ Step 5 Complete: Default roles seeded', $context);

            // Step 6: Verify provisioning
            $this->logStep('🔍 Step 6: Verifying provisioning', $context);
            $this->verifyProvisioning();
            $this->logStep('✅ Step 6 Complete: Provisioning verified', $context);

            // Step 7: Activate the tenant (ready for admin setup on tenant domain)
            $this->logStep('🎉 Step 7: Activating tenant', $context);
            $this->activateTenant();
            $this->logStep('✅ Step 7 Complete: Tenant activated and ready for admin setup', $context);

            // Step 8: Send notification email
            $this->logStep('📧 Step 8: Sending notification email', $context);
            $this->sendWelcomeEmail();
            $this->logStep('✅ Step 8 Complete: Notification email sent', $context);

            $this->logStep('🎊 PROVISIONING COMPLETED SUCCESSFULLY - AWAITING ADMIN SETUP', $context);
        } catch (Throwable $e) {
            $errorContext = array_merge($context, [
                'failed_step' => $this->tenant->provisioning_step,
                'error_message' => $e->getMessage(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
            ]);

            $this->logStep('❌ PROVISIONING FAILED', $errorContext, 'error');
            $this->logStep('⚠️  Error: '.$e->getMessage(), $errorContext, 'error');

            // Rollback: Drop the database if it was created
            if ($databaseCreated) {
                $this->logStep('🔙 Initiating database rollback', $errorContext, 'warning');
                $this->rollbackDatabase();
                $this->logStep('✅ Database rollback completed', $errorContext, 'warning');
            }

            // Re-throw to trigger the failed() method
            throw $e;
        }
    }

    /**
     * Validate prerequisites before starting provisioning.
     * Throws exception if any validation fails.
     */
    protected function validatePrerequisites(): void
    {
        $this->logStep('   → Validating tenant data', []);

        // 1. Validate tenant has a subdomain
        if (empty($this->tenant->subdomain)) {
            throw new \RuntimeException('Tenant subdomain is required for provisioning');
        }

        // 2. Validate tenant has at least one domain
        if ($this->tenant->domains()->count() === 0) {
            throw new \RuntimeException('Tenant must have at least one domain configured');
        }

        // 3. Validate database connection
        try {
            DB::connection()->getPdo();
            $this->logStep('   → Database connection verified', []);
        } catch (\Exception $e) {
            throw new \RuntimeException('Database connection failed: ' . $e->getMessage());
        }

        // 4. Validate tenant has a plan (optional but log warning)
        if (! $this->tenant->plan_id || ! $this->tenant->plan) {
            $this->logStep('   ⚠️  Tenant has no plan assigned - will provision with core only', [], 'warning');
        } else {
            // 5. Validate plan has modules
            $moduleCount = $this->tenant->plan->modules()->count();
            if ($moduleCount === 0) {
                $this->logStep('   ⚠️  Plan has no modules - will provision with core only', [], 'warning');
            } else {
                $this->logStep("   → Plan has {$moduleCount} module(s)", ['module_count' => $moduleCount]);
            }
        }

        // 6. Validate migration paths exist
        $migrationPaths = $this->getTenantMigrationPaths();
        if (empty($migrationPaths)) {
            throw new \RuntimeException('No migration paths found - cannot provision without migrations');
        }

        $this->logStep('   → All prerequisite checks passed', []);
    }

    /**
     * Create the tenant database.
     * 
     * For cPanel hosting (TENANCY_DATABASE_MANAGER=cpanel):
     * - Uses cPanel API to create database
     * - Database name is prefixed with cPanel username
     * 
     * For VPS/Dedicated (default):
     * - Uses standard SQL CREATE DATABASE
     */
    protected function createDatabase(): void
    {
        $this->tenant->updateProvisioningStep(Tenant::STEP_CREATING_DB);

        // Check if using cPanel mode
        if (config('tenancy.cpanel.host') && env('TENANCY_DATABASE_MANAGER') === 'cpanel') {
            $this->createDatabaseViaCpanel();
        } else {
            $this->createDatabaseViaSQL();
        }
    }

    /**
     * Create database using cPanel API.
     */
    protected function createDatabaseViaCpanel(): void
    {
        $cpanelManager = new \Aero\Platform\TenantDatabaseManagers\CpanelDatabaseManager();
        
        // Get the database name that cPanel will create
        $shortDbName = $this->getCpanelShortDatabaseName();
        $fullDbName = config('tenancy.cpanel.username') . '_' . $shortDbName;
        
        $this->logStep("   → Creating database via cPanel API: {$fullDbName}", [
            'database' => $fullDbName,
            'short_name' => $shortDbName,
        ]);

        try {
            $cpanelManager->createDatabase($this->tenant);
            
            // Update tenant with the cPanel database name
            $this->tenant->update([
                'tenancy_db_name' => $fullDbName,
            ]);
            
            $this->logStep("   → Database '{$fullDbName}' created successfully via cPanel", [
                'database' => $fullDbName,
            ]);
        } catch (\Exception $e) {
            throw new \RuntimeException("cPanel database creation failed: " . $e->getMessage());
        }
    }

    /**
     * Create database using standard SQL (for VPS/dedicated servers).
     */
    protected function createDatabaseViaSQL(): void
    {
        $dbName = $this->tenant->database()->getName();

        $this->logStep("   → Creating database: {$dbName}", ['database' => $dbName]);

        CreateDatabase::dispatchSync($this->tenant);

        // Verify database was actually created
        try {
            // Use parameterized query to prevent SQL injection
            $exists = DB::select(
                'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
                [$dbName]
            );
            
            if (empty($exists)) {
                throw new \RuntimeException("Database {$dbName} was not created successfully");
            }
        } catch (\Exception $e) {
            throw new \RuntimeException("Failed to verify database creation: " . $e->getMessage());
        }

        $this->logStep("   → Database '{$dbName}' created successfully", ['database' => $dbName]);
    }

    /**
     * Get the short database name for cPanel (without prefix).
     * Uses subdomain for readability, truncated to fit cPanel limits.
     */
    protected function getCpanelShortDatabaseName(): string
    {
        if ($this->tenant->subdomain) {
            $subdomain = preg_replace('/[^a-z0-9]/i', '', $this->tenant->subdomain);
            return 'tn_' . substr(strtolower($subdomain), 0, 16);
        }
        
        // Fallback: use first 16 chars of UUID
        $shortId = str_replace('-', '', substr($this->tenant->id, 0, 16));
        return 'tn_' . $shortId;
    }

    /**
     * Run migrations on the tenant database.
     * Only runs migrations for:
     * - Core package (always required)
     * - Modules included in the tenant's plan
     */
    protected function migrateDatabase(): void
    {
        $this->logStep('   → Running tenant migrations', []);

        $this->tenant->updateProvisioningStep(Tenant::STEP_MIGRATING);

        // Get dynamic migration paths based on plan modules
        $migrationPaths = $this->getTenantMigrationPaths();

        $this->logStep("   → Migration paths: " . implode(', ', $migrationPaths), [
            'paths' => $migrationPaths,
        ]);

        // Run migrations using tenancy()->run() which properly handles context
        tenancy()->runForMultiple([$this->tenant], function () use ($migrationPaths) {
            // Ensure migrations table exists
            if (! Schema::hasTable('migrations')) {
                Schema::create('migrations', function ($table) {
                    $table->id();
                    $table->string('migration');
                    $table->integer('batch');
                });
                $this->logStep("   → Created migrations table");
            }
            
            $batch = 1;
            
            foreach ($migrationPaths as $path) {
                $absolutePath = base_path($path);
                $this->logStep("   → Running migrations from: {$absolutePath}");
                
                // Get all PHP files from the directory manually
                $files = glob($absolutePath . '/*.php');
                
                if (empty($files)) {
                    $this->logStep("   → No migration files found in: {$absolutePath}");
                    continue;
                }
                
                // Sort files by name (which sorts by date due to Laravel naming convention)
                sort($files);
                
                $this->logStep("   → Found " . count($files) . " migration files");
                
                foreach ($files as $file) {
                    $migrationName = str_replace('.php', '', basename($file));
                    
                    // Check if already ran
                    $alreadyRan = DB::table('migrations')
                        ->where('migration', $migrationName)
                        ->exists();
                    
                    if ($alreadyRan) {
                        continue;
                    }
                    
                    try {
                        // Run the migration using require which handles both named and anonymous classes
                        $migration = require $file;
                        
                        if (is_object($migration)) {
                            // Anonymous class migration (Laravel 9+)
                            $migration->up();
                        }
                        
                        // Record that we ran this migration
                        DB::table('migrations')->insert([
                            'migration' => $migrationName,
                            'batch' => $batch,
                        ]);
                        
                        $this->logStep("   → Migrated: {$migrationName}");
                    } catch (\Throwable $e) {
                        $this->logStep("   ❌ Failed to migrate {$migrationName}: " . $e->getMessage(), [], 'error');
                        throw $e;
                    }
                }
                
                $batch++;
            }
        });

        $this->logStep('   → All migrations completed', []);
    }
    
    /**
     * Get migration class name from file.
     */
    protected function getMigrationClassName(string $file): string
    {
        $content = file_get_contents($file);
        
        // Check for anonymous class migration (Laravel 9+)
        if (preg_match('/return\s+new\s+class/', $content)) {
            return 'anonymous';
        }
        
        // Traditional named class
        if (preg_match('/class\s+(\w+)\s+extends/', $content, $matches)) {
            return $matches[1];
        }
        
        return '';
    }
    
    /**
     * Run a single migration file.
     */
    protected function runMigrationFile(string $file): void
    {
        $migration = require $file;
        
        if (is_object($migration)) {
            // Anonymous class migration
            $migration->up();
        }
    }

    /**
     * Modules that should be excluded from migration loading.
     * These are either already included (core) or don't have migrations (dashboard).
     */
    private const EXCLUDED_MODULES = ['core', 'dashboard'];

    /**
     * Get migration paths for tenant based on their plan's modules.
     * Always includes core, plus any modules in the plan.
     *
     * @return array<string>
     */
    protected function getTenantMigrationPaths(): array
    {
        $paths = [];
        $searchedPaths = [];

        // Always include core migrations (users, roles, permissions, etc.)
        $corePath = 'vendor/aero/core/database/migrations';
        $searchedPaths[] = $corePath;
        
        if (File::exists(base_path($corePath))) {
            $paths[] = $corePath;
            $this->logStep("   → Including core migrations: {$corePath}", []);
        } else {
            // Fallback: try packages directory (for development/non-composer installs)
            $coreDevPath = 'packages/aero-core/database/migrations';
            $searchedPaths[] = $coreDevPath;
            
            if (File::exists(base_path($coreDevPath))) {
                $paths[] = $coreDevPath;
                $this->logStep("   → Including core migrations (dev): {$coreDevPath}", []);
            } else {
                $this->logStep("   ⚠️  Core migrations not found at {$corePath} or {$coreDevPath}", [], 'warning');
            }
        }

        // Get modules from tenant's plan using module_codes attribute (discovered from packages)
        if ($this->tenant->plan) {
            // Use module_codes attribute which contains the list of module codes for this plan
            // This is set in PlanSeeder and doesn't require modules to be registered in central DB
            $planModules = $this->tenant->plan->module_codes ?? [];

            // Ensure it's an array (it's cast as array in Plan model)
            if (is_string($planModules)) {
                $planModules = json_decode($planModules, true) ?? [];
            }

            $this->logStep('   → Plan modules: ' . implode(', ', $planModules), [
                'modules' => $planModules,
            ]);

            foreach ($planModules as $moduleCode) {
                // Skip excluded modules
                if (in_array($moduleCode, self::EXCLUDED_MODULES, true)) {
                    continue;
                }

                // Try vendor path first (production with composer install)
                $modulePath = "vendor/aero/{$moduleCode}/database/migrations";
                if (File::exists(base_path($modulePath))) {
                    $paths[] = $modulePath;
                    $this->logStep("   → Including {$moduleCode} migrations: {$modulePath}", []);
                    continue;
                }

                // Fallback: try packages directory with aero- prefix (development)
                $moduleDevPath = "packages/aero-{$moduleCode}/database/migrations";
                if (File::exists(base_path($moduleDevPath))) {
                    $paths[] = $moduleDevPath;
                    $this->logStep("   → Including {$moduleCode} migrations (dev): {$moduleDevPath}", []);
                    continue;
                }

                $this->logStep("   ⚠️  Module {$moduleCode} has no migrations at {$modulePath} or {$moduleDevPath}", [], 'warning');
            }
        } else {
            $this->logStep('   ⚠️  No plan assigned to tenant, using core only', [], 'warning');
        }

        // Include app-level tenant migrations if they exist
        $appTenantPath = database_path('migrations/tenant');
        if (File::exists($appTenantPath)) {
            $paths[] = $appTenantPath;
            $this->logStep("   → Including app tenant migrations: {$appTenantPath}", []);
        }

        // Validate that we have at least core migrations
        if (empty($paths)) {
            $searchedPathsStr = implode(', ', $searchedPaths);
            throw new \RuntimeException("No migration paths found. Searched: {$searchedPathsStr}. Cannot provision tenant without migrations.");
        }

        return $paths;
    }

    /**
     * Generate a username from email address.
     *
     * @deprecated Admin user creation is now done on tenant domain after provisioning
     */
    protected function generateUsername(string $email): string
    {
        // Extract local part before @
        $username = explode('@', $email)[0];

        // Replace non-alphanumeric characters with underscore
        $username = preg_replace('/[^a-zA-Z0-9]/', '_', $username);

        // Ensure it starts with a letter
        if (! preg_match('/^[a-zA-Z]/', $username)) {
            $username = 'user_'.$username;
        }

        return strtolower($username);
    }

    // NOTE: seedAdminUser() and assignSuperAdminRole() methods removed.
    // Admin user creation is now handled on the tenant domain after provisioning
    // completes, during the admin setup step of the registration flow.
    // See: app/Http/Controllers/Tenant/AdminSetupController.php

    /**
     * Sync module hierarchy from config to tenant database.
     * Populates modules, sub_modules, module_components, and module_component_actions tables.
     *
     * This method directly syncs modules from package config files to avoid
     * artisan command resolution issues in HTTP request context.
     */
    protected function syncModuleHierarchy(): void
    {
        $this->logStep('   → Syncing module hierarchy to tenant database', []);
        $this->tenant->updateProvisioningStep('syncing_modules');

        try {
            tenancy()->initialize($this->tenant);

            // Directly sync modules from config files
            $this->runModuleSyncDirectly();

            $this->logStep('   → Module hierarchy synced successfully', []);
        } catch (Throwable $e) {
            $this->logStep("   → Failed to sync modules: {$e->getMessage()}", [
                'error' => $e->getMessage(),
            ], 'error');
            throw $e;
        } finally {
            tenancy()->end();
        }
    }

    /**
     * Run module sync directly without artisan command.
     * Discovers module configs and syncs them to database.
     */
    protected function runModuleSyncDirectly(): void
    {
        $modules = $this->discoverModuleConfigs();

        if (empty($modules)) {
            $this->logStep('   → No module configs found to sync', []);

            return;
        }

        $this->logStep('   → Found '.count($modules).' module(s) to sync', []);

        DB::beginTransaction();

        try {
            foreach ($modules as $moduleConfig) {
                // Only sync tenant-scoped modules for tenant databases
                $scope = $moduleConfig['scope'] ?? 'tenant';
                if ($scope !== 'tenant') {
                    continue;
                }

                $this->syncModuleToDatabase($moduleConfig);
            }

            DB::commit();
        } catch (Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Discover module configs from installed packages.
     *
     * @return array
     */
    protected function discoverModuleConfigs(): array
    {
        $modules = [];

        // Look for module configs in vendor/aero/* packages
        $vendorPath = base_path('vendor/aero');
        if (File::exists($vendorPath)) {
            foreach (File::directories($vendorPath) as $packagePath) {
                $configPath = $packagePath.'/config/module.php';
                if (File::exists($configPath)) {
                    try {
                        $moduleConfig = require $configPath;
                        if (is_array($moduleConfig) && isset($moduleConfig['code'], $moduleConfig['name'])) {
                            $modules[] = $moduleConfig;
                        }
                    } catch (Throwable $e) {
                        Log::warning("Failed to load module config from {$packagePath}: ".$e->getMessage());
                    }
                }
            }
        }

        return $modules;
    }

    /**
     * Sync a single module and its hierarchy to the database.
     *
     * @param  array  $moduleDef
     */
    protected function syncModuleToDatabase(array $moduleDef): void
    {
        // Import models
        $moduleClass = \Aero\Core\Models\Module::class;
        $subModuleClass = \Aero\Core\Models\SubModule::class;
        $componentClass = \Aero\Core\Models\ModuleComponent::class;
        $actionClass = \Aero\Core\Models\ModuleComponentAction::class;

        // Sync module (top level)
        $module = $moduleClass::updateOrCreate(
            ['code' => $moduleDef['code']],
            [
                'name' => $moduleDef['name'],
                'scope' => $moduleDef['scope'] ?? 'tenant',
                'description' => $moduleDef['description'] ?? null,
                'icon' => $moduleDef['icon'] ?? null,
                'route_prefix' => $moduleDef['route_prefix'] ?? null,
                'category' => $moduleDef['category'] ?? 'core_system',
                'priority' => $moduleDef['priority'] ?? 100,
                'is_active' => $moduleDef['is_active'] ?? true,
                'is_core' => $moduleDef['is_core'] ?? false,
                'settings' => $moduleDef['settings'] ?? null,
                'version' => $moduleDef['version'] ?? '1.0.0',
                'min_plan' => $moduleDef['min_plan'] ?? null,
                'license_type' => $moduleDef['license_type'] ?? null,
                'dependencies' => $moduleDef['dependencies'] ?? null,
                'release_date' => $moduleDef['release_date'] ?? null,
            ]
        );

        $this->logStep("      → Synced module: {$moduleDef['name']}", []);

        // Sync submodules
        if (isset($moduleDef['submodules']) && is_array($moduleDef['submodules'])) {
            foreach ($moduleDef['submodules'] as $subModuleDef) {
                $subModule = $subModuleClass::updateOrCreate(
                    [
                        'module_id' => $module->id,
                        'code' => $subModuleDef['code'],
                    ],
                    [
                        'name' => $subModuleDef['name'],
                        'description' => $subModuleDef['description'] ?? null,
                        'icon' => $subModuleDef['icon'] ?? null,
                        'route' => $subModuleDef['route'] ?? null,
                        'priority' => $subModuleDef['priority'] ?? 100,
                        'is_active' => $subModuleDef['is_active'] ?? true,
                    ]
                );

                // Sync components
                if (isset($subModuleDef['components']) && is_array($subModuleDef['components'])) {
                    foreach ($subModuleDef['components'] as $componentDef) {
                        $component = $componentClass::updateOrCreate(
                            [
                                'module_id' => $module->id,
                                'sub_module_id' => $subModule->id,
                                'code' => $componentDef['code'],
                            ],
                            [
                                'name' => $componentDef['name'],
                                'description' => $componentDef['description'] ?? null,
                                'type' => $componentDef['type'] ?? 'page',
                                'route' => $componentDef['route'] ?? null,
                                'priority' => $componentDef['priority'] ?? 100,
                                'is_active' => $componentDef['is_active'] ?? true,
                            ]
                        );

                        // Sync actions
                        if (isset($componentDef['actions']) && is_array($componentDef['actions'])) {
                            foreach ($componentDef['actions'] as $actionDef) {
                                $actionClass::updateOrCreate(
                                    [
                                        'module_component_id' => $component->id,
                                        'code' => $actionDef['code'],
                                    ],
                                    [
                                        'name' => $actionDef['name'],
                                        'description' => $actionDef['description'] ?? null,
                                        'is_active' => $actionDef['is_active'] ?? true,
                                    ]
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Seed default roles for the tenant.
     *
     * Creates the essential roles that every tenant needs.
     * Permissions are NOT seeded - the system uses role-based access control only.
     */
    protected function seedDefaultRoles(): void
    {
        $this->logStep('   → Seeding default tenant roles', []);
        $this->tenant->updateProvisioningStep('seeding_roles');

        try {
            tenancy()->initialize($this->tenant);

            // Default roles that every tenant should have
            $defaultRoles = [
                [
                    'name' => 'Super Administrator',
                    'guard_name' => 'web',
                    'description' => 'Full access to all tenant features',
                    'is_protected' => true,
                ],
                [
                    'name' => 'Administrator',
                    'guard_name' => 'web',
                    'description' => 'Administrative access with most features',
                    'is_protected' => false,
                ],
                [
                    'name' => 'HR Manager',
                    'guard_name' => 'web',
                    'description' => 'Human Resources management access',
                    'is_protected' => false,
                ],
                [
                    'name' => 'Employee',
                    'guard_name' => 'web',
                    'description' => 'Basic employee access - self-service features',
                    'is_protected' => false,
                ],
            ];

            foreach ($defaultRoles as $roleData) {
                \Spatie\Permission\Models\Role::firstOrCreate(
                    ['name' => $roleData['name'], 'guard_name' => $roleData['guard_name']],
                    [
                        'description' => $roleData['description'],
                        'is_protected' => $roleData['is_protected'] ?? false,
                    ]
                );
            }

            // Grant full module access to Super Administrator role
            $superAdminRole = \Spatie\Permission\Models\Role::where('name', 'Super Administrator')->first();
            if ($superAdminRole) {
                $subModuleIds = DB::table('sub_modules')->pluck('id');
                foreach ($subModuleIds as $subModuleId) {
                    DB::table('role_module_access')->insertOrIgnore([
                        'role_id' => $superAdminRole->id,
                        'sub_module_id' => $subModuleId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
                $this->logStep('   → Granted full module access to Super Administrator', [
                    'submodules_count' => $subModuleIds->count(),
                ]);
            }

            $this->logStep('   → Default roles seeded successfully', []);
        } catch (Throwable $e) {
            $this->logStep("   → Failed to seed default roles: {$e->getMessage()}", [
                'error' => $e->getMessage(),
            ], 'error');
            throw $e;
        } finally {
            tenancy()->end();
        }
    }

    /**
     * Verify that provisioning completed successfully.
     * Checks that all required tables and roles exist.
     */
    protected function verifyProvisioning(): void
    {
        $this->logStep('   → Verifying provisioning completion', []);
        $this->tenant->updateProvisioningStep('verifying');

        try {
            tenancy()->initialize($this->tenant);

            // 1. Check required core tables exist
            $requiredTables = [
                'users',
                'roles',
                'model_has_roles',
                'modules',
                'sub_modules',
                'module_components',
                'module_component_actions',
            ];

            $missingTables = [];
            foreach ($requiredTables as $table) {
                if (! Schema::hasTable($table)) {
                    $missingTables[] = $table;
                }
            }

            if (! empty($missingTables)) {
                throw new \RuntimeException('Required tables missing: ' . implode(', ', $missingTables));
            }

            $this->logStep('   → All required tables verified', []);

            // 2. Verify roles were seeded
            $roleCount = DB::table('roles')->count();
            if ($roleCount === 0) {
                throw new \RuntimeException('No roles found after seeding');
            }

            // Check Super Administrator role exists
            $superAdminExists = DB::table('roles')
                ->where('name', 'Super Administrator')
                ->exists();

            if (! $superAdminExists) {
                throw new \RuntimeException('Super Administrator role not found after seeding');
            }

            $this->logStep("   → Roles verified ({$roleCount} roles found)", ['role_count' => $roleCount]);

            // 3. Verify modules were synced
            $moduleCount = DB::table('modules')->count();
            if ($moduleCount === 0) {
                $this->logStep('   ⚠️  No modules found after sync', [], 'warning');
            } else {
                $this->logStep("   → Modules verified ({$moduleCount} modules found)", ['module_count' => $moduleCount]);
            }

            $this->logStep('   → Provisioning verification passed', []);
        } catch (Throwable $e) {
            $this->logStep("   → Provisioning verification failed: {$e->getMessage()}", [
                'error' => $e->getMessage(),
            ], 'error');
            throw $e;
        } finally {
            tenancy()->end();
        }
    }

    /**
     * Assign Super Administrator role to the admin user.
     */
    // NOTE: assignSuperAdminRole() method removed.
    // Admin user and role assignment is now handled on the tenant domain
    // after provisioning completes, during the admin setup step.
    // See: app/Http/Controllers/Tenant/AdminSetupController.php

    /**
     * Activate the tenant and clear sensitive data.
     */
    protected function activateTenant(): void
    {
        $this->logStep('   → Activating tenant and clearing provisioning data', []);

        // Activate clears admin_data and provisioning_step automatically
        $this->tenant->activate();

        $this->logStep("   → Tenant status: {$this->tenant->status}", [
            'status' => $this->tenant->status,
            'activated_at' => now()->toDateTimeString(),
        ]);
    }

    /**
     * Send notification email that tenant is ready for admin setup.
     */
    protected function sendWelcomeEmail(): void
    {
        try {
            // Get the company email from tenant details
            $email = $this->tenant->email;

            if (empty($email)) {
                $this->logStep('   → No email found for notification, skipping', [], 'warning');

                return;
            }

            $this->logStep('   → Sending provisioning complete notification', [
                'tenant_email' => $email,
            ]);

            // Check if notification class exists (may not be present in all installations)
            $notificationClass = '\\App\\Notifications\\WelcomeToTenant';
            if (! class_exists($notificationClass)) {
                $this->logStep('   → WelcomeToTenant notification not found, skipping email', [], 'warning');
                return;
            }

            // Use the notification's sendEmail method with MailService
            $notification = new $notificationClass($this->tenant);
            $sent = $notification->sendEmail($email);

            if ($sent) {
                $this->logStep('   → Notification email sent successfully', [
                    'tenant_email' => $email,
                ]);
            } else {
                $this->logStep('   → Notification email sending failed', [
                    'tenant_email' => $email,
                ], 'warning');
            }
        } catch (Throwable $e) {
            // Don't fail provisioning if email fails
            Log::error('Failed to send notification email', [
                'tenant_id' => $this->tenant->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Rollback: Drop the tenant database if provisioning fails.
     *
     * This ensures we don't leave orphaned databases in an incomplete state.
     */
    protected function rollbackDatabase(): void
    {
        try {
            $databaseName = $this->tenant->database()->getName();

            if (empty($databaseName)) {
                $this->logStep('   → No database name found for rollback', [], 'warning');

                return;
            }

            $this->logStep("   → Dropping database: {$databaseName}", ['database' => $databaseName], 'warning');

            // Drop the database
            \DB::statement("DROP DATABASE IF EXISTS `{$databaseName}`");

            $this->logStep("   → Database '{$databaseName}' dropped successfully", ['database' => $databaseName], 'warning');
        } catch (Throwable $e) {
            // Log rollback failure but don't throw - we're already in error state
            $this->logStep("   → Failed to drop database: {$e->getMessage()}", [
                'error' => $e->getMessage(),
            ], 'error');
        }
    }

    /**
     * Handle a job failure.
     *
     * Performs rollback based on configuration:
     * - If PRESERVE_FAILED_TENANTS=true: Keep tenant record for debugging (default in dev)
     * - If PRESERVE_FAILED_TENANTS=false: Delete completely to allow re-registration (production)
     *
     * Steps:
     * 1. Mark tenant as failed with error details
     * 2. Drop tenant database (if created)
     * 3. Send failure notification to user
     * 4. Optionally delete tenant record (based on config)
     */
    public function failed(?Throwable $exception): void
    {
        $this->logStep('❌ TENANT PROVISIONING FAILED - PERFORMING ROLLBACK', [
            'step' => $this->tenant->provisioning_step,
            'error' => $exception?->getMessage(),
            'trace' => $exception?->getTraceAsString(),
        ], 'error');

        // Send failure notification to user before rollback
        $this->notifyProvisioningFailure($exception);

        try {
            // Step 1: Mark tenant as failed with error details
            $this->logStep('🔙 Step 1/3: Marking tenant as failed', [], 'warning');
            $this->tenant->markProvisioningFailed($exception?->getMessage());

            // Step 2: Drop tenant database if it exists
            $this->logStep('🔙 Step 2/3: Rolling back database', [], 'warning');
            $this->rollbackDatabase();

            // Step 3: Decide whether to delete tenant completely
            $preserveFailedTenants = config('platform.preserve_failed_tenants', config('app.debug', false));

            if ($preserveFailedTenants) {
                // Keep tenant record for debugging (useful in development)
                $this->logStep('✅ ROLLBACK COMPLETE - Tenant preserved for debugging', [
                    'tenant_id' => $this->tenant->id,
                    'subdomain' => $this->tenant->subdomain,
                    'note' => 'Admin can retry provisioning or manually delete',
                ], 'warning');
            } else {
                // Archive tenant (soft delete) to allow re-registration
                // Don't use forceDelete - maintain audit trail
                $this->logStep('🔙 Step 3/3: Archiving failed tenant', [], 'warning');
                $this->tenant->delete(); // Soft delete instead of force delete

                $this->logStep('✅ COMPLETE ROLLBACK SUCCESSFUL - Tenant archived, user can re-register', [], 'warning');
            }
        } catch (Throwable $e) {
            $this->logStep('❌ ROLLBACK FAILED: '.$e->getMessage(), [
                'error' => $e->getMessage(),
            ], 'error');

            // As a last resort, try to mark as failed so admin can manually clean up
            try {
                $this->tenant->refresh();
                $this->tenant->markProvisioningFailed($exception?->getMessage());

                $this->logStep('⚠️  Tenant marked as failed - manual cleanup required', [
                    'tenant_id' => $this->tenant->id,
                ], 'error');
            } catch (Throwable $markError) {
                $this->logStep('❌ CRITICAL: Could not even mark tenant as failed', [
                    'tenant_id' => $this->tenant->id ?? 'unknown',
                    'error' => $markError->getMessage(),
                ], 'critical');
            }
        }
    }

    /**
     * Notify user that provisioning failed.
     */
    protected function notifyProvisioningFailure(?Throwable $exception): void
    {
        try {
            // Use tenant contact email
            if ($this->tenant->email) {
                // Use the notification's sendEmail method with MailService
                $notification = new \App\Notifications\TenantProvisioningFailed(
                    $this->tenant,
                    $exception?->getMessage() ?? 'Unknown error'
                );
                $notification->sendEmail($this->tenant->email);

                $this->logStep('📧 Provisioning failure notification sent', [
                    'email' => $this->tenant->email,
                ], 'warning');
            }
        } catch (Throwable $e) {
            Log::error('Failed to send provisioning failure notification', [
                'tenant_id' => $this->tenant->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Log a provisioning step to both console and Laravel log.
     * Also broadcasts the step completion for real-time updates.
     */
    protected function logStep(string $message, array $context = [], string $level = 'info'): void
    {
        // Add tenant context to all logs
        $fullContext = array_merge([
            'tenant_id' => $this->tenant->id,
            'tenant_name' => $this->tenant->name,
        ], $context);

        // Log to Laravel log
        Log::log($level, $message, $fullContext);

        // Log to console ONLY when running from CLI (not HTTP context)
        // This prevents output from corrupting Inertia responses when using sync queue
        if (app()->runningInConsole()) {
            echo '['.now()->format('Y-m-d H:i:s')."] {$message}".PHP_EOL;

            // Flush output immediately
            if (function_exists('flush')) {
                flush();
            }
        }

        // Broadcast step completion for real-time updates (if WebSocket configured)
        // This will only broadcast if BROADCAST_DRIVER is set to pusher/redis/etc
        // Skip if provisioning_step is null (happens after activation clears it)
        $step = $this->tenant->provisioning_step ?? 'completed';
        if (str_contains($message, '✅') && config('broadcasting.default') !== 'null') {
            try {
                broadcast(new TenantProvisioningStepCompleted(
                    $this->tenant,
                    $step,
                    $message
                ));
            } catch (Throwable $e) {
                // Don't fail provisioning if broadcasting fails
                Log::debug('Broadcasting failed', ['error' => $e->getMessage()]);
            }
        }
    }
}
