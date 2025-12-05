<?php

namespace App\Jobs;

use App\Events\TenantProvisioningStepCompleted;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Stancl\Tenancy\Jobs\CreateDatabase;
use Stancl\Tenancy\Jobs\MigrateDatabase;
use Throwable;

/**
 * ProvisionTenant Job
 *
 * Handles the asynchronous provisioning of a new tenant, including:
 * - Database creation
 * - Schema migrations
 * - Roles and permissions seeding
 * - Module permissions seeding
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
     * 1. Create the tenant database
     * 2. Run migrations on the tenant database
     * 3. Seed roles and permissions
     * 4. Seed module permissions
     * 5. Activate the tenant
     * 6. Send notification email
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
            // Step 1: Mark as provisioning
            $this->logStep('📋 Step 1: Marking tenant as provisioning', $context);
            $this->tenant->startProvisioning(Tenant::STEP_CREATING_DB);
            $this->logStep('✅ Step 1 Complete: Tenant marked as provisioning', $context);

            // Step 2: Create the database
            $this->logStep('🗄️  Step 2: Creating tenant database', $context);
            $this->createDatabase();
            $databaseCreated = true;
            $this->logStep('✅ Step 2 Complete: Database created - '.$this->tenant->tenancy_db_name, $context);

            // Step 3: Run migrations
            $this->logStep('🔄 Step 3: Running database migrations', $context);
            $this->migrateDatabase();
            $this->logStep('✅ Step 3 Complete: Migrations applied successfully', $context);

            // Step 4: Seed roles and permissions
            $this->logStep('🔐 Step 4: Seeding roles and permissions', $context);
            $this->seedRolesAndPermissions();
            $this->logStep('✅ Step 4 Complete: Roles and permissions seeded', $context);

            // Step 5: Seed module permissions
            $this->logStep('📦 Step 5: Seeding module permissions', $context);
            $this->seedModulePermissions();
            $this->logStep('✅ Step 5 Complete: Module permissions seeded', $context);

            // Step 6: Activate the tenant (ready for admin setup on tenant domain)
            $this->logStep('🎉 Step 6: Activating tenant', $context);
            $this->activateTenant();
            $this->logStep('✅ Step 6 Complete: Tenant activated and ready for admin setup', $context);

            // Step 7: Send notification email
            $this->logStep('📧 Step 7: Sending notification email', $context);
            $this->sendWelcomeEmail();
            $this->logStep('✅ Step 7 Complete: Notification email sent', $context);

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
     * Create the tenant database.
     */
    protected function createDatabase(): void
    {
        $dbName = $this->tenant->tenancy_db_name;

        $this->logStep("   → Creating database: {$dbName}", ['database' => $dbName]);

        $this->tenant->updateProvisioningStep(Tenant::STEP_CREATING_DB);

        CreateDatabase::dispatchSync($this->tenant);

        $this->logStep("   → Database '{$dbName}' created successfully", ['database' => $dbName]);
    }

    /**
     * Run migrations on the tenant database.
     */
    protected function migrateDatabase(): void
    {
        $this->logStep('   → Running tenant migrations', []);

        $this->tenant->updateProvisioningStep(Tenant::STEP_MIGRATING);

        MigrateDatabase::dispatchSync($this->tenant);

        $this->logStep('   → All migrations completed', []);
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
     * Seed roles and permissions for the tenant.
     */
    protected function seedRolesAndPermissions(): void
    {
        $this->logStep('   → Running ComprehensiveRolePermissionSeeder', []);
        $this->tenant->updateProvisioningStep('seeding_permissions');

        try {
            tenancy()->initialize($this->tenant);

            $seeder = new \Database\Seeders\Tenant\ComprehensiveRolePermissionSeeder;
            $seeder->run();

            $this->logStep('   → Roles and permissions seeded successfully', []);
        } catch (Throwable $e) {
            $this->logStep("   → Failed to seed roles and permissions: {$e->getMessage()}", [
                'error' => $e->getMessage(),
            ], 'error');
            throw $e;
        } finally {
            tenancy()->end();
        }
    }

    /**
     * Seed module permissions for the tenant.
     */
    protected function seedModulePermissions(): void
    {
        $this->logStep('   → Running ModulePermissionSeeder', []);
        $this->tenant->updateProvisioningStep('seeding_modules');

        try {
            tenancy()->initialize($this->tenant);

            $seeder = new \Database\Seeders\Tenant\ModulePermissionSeeder;
            $seeder->run();

            $this->logStep('   → Module permissions seeded successfully', []);
        } catch (Throwable $e) {
            $this->logStep("   → Failed to seed module permissions: {$e->getMessage()}", [
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

            // Use the notification's sendEmail method with MailService
            $notification = new \App\Notifications\WelcomeToTenant($this->tenant);
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
            $databaseName = $this->tenant->tenancy_db_name;

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
     * Performs complete rollback:
     * 1. Deletes tenant database (if created)
     * 2. Deletes domain records
     * 3. Deletes tenant record from platform database
     * 4. Sends failure notification to user
     *
     * This ensures users can re-register with the same subdomain/email.
     */
    public function failed(?Throwable $exception): void
    {
        $this->logStep('❌ TENANT PROVISIONING FAILED - PERFORMING COMPLETE ROLLBACK', [
            'step' => $this->tenant->provisioning_step,
            'error' => $exception?->getMessage(),
            'trace' => $exception?->getTraceAsString(),
        ], 'error');

        // Send failure notification to user before rollback
        $this->notifyProvisioningFailure($exception);

        try {
            // Step 1: Drop tenant database if it exists
            $this->logStep('🔙 Step 1/3: Rolling back database', [], 'warning');
            $this->rollbackDatabase();

            // Step 2: Delete domain records (allows re-registration with same subdomain)
            $this->logStep('🔙 Step 2/3: Deleting domain records', [], 'warning');
            $this->tenant->domains()->delete();

            // Step 3: Delete tenant record (allows re-registration with same email/name)
            $this->logStep('🔙 Step 3/3: Deleting tenant record', [], 'warning');
            $this->tenant->forceDelete(); // Use forceDelete to bypass soft deletes if enabled

            $this->logStep('✅ COMPLETE ROLLBACK SUCCESSFUL - User can re-register', [], 'warning');
        } catch (Throwable $e) {
            $this->logStep('❌ ROLLBACK FAILED: '.$e->getMessage(), [
                'error' => $e->getMessage(),
            ], 'error');

            // As a last resort, mark as failed so admin can manually clean up
            try {
                $this->tenant->markProvisioningFailed($exception?->getMessage());
            } catch (Throwable $markError) {
                $this->logStep('❌ CRITICAL: Could not even mark tenant as failed', [
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

        // Log to console (visible in terminal output)
        echo '['.now()->format('Y-m-d H:i:s')."] {$message}".PHP_EOL;

        // Flush output immediately
        if (function_exists('flush')) {
            flush();
        }

        // Broadcast step completion for real-time updates (if WebSocket configured)
        // This will only broadcast if BROADCAST_DRIVER is set to pusher/redis/etc
        if (str_contains($message, '✅') && config('broadcasting.default') !== 'null') {
            try {
                broadcast(new TenantProvisioningStepCompleted(
                    $this->tenant,
                    $this->tenant->provisioning_step,
                    $message
                ));
            } catch (Throwable $e) {
                // Don't fail provisioning if broadcasting fails
                Log::debug('Broadcasting failed', ['error' => $e->getMessage()]);
            }
        }
    }
}
