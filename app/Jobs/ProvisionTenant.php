<?php

namespace App\Jobs;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Hash;
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
 * - Admin user seeding
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
     * Admin user data (name, email, password).
     * Passed directly to job - never stored in database.
     */
    private array $adminData;

    /**
     * Create a new job instance.
     *
     * @param  Tenant  $tenant  The tenant to provision
     * @param  array  $adminData  Admin credentials (name, email, password in plain text)
     */
    public function __construct(Tenant $tenant, array $adminData = [])
    {
        $this->tenant = $tenant;
        $this->adminData = $adminData;
    }

    /**
     * Execute the job.
     *
     * Provision the tenant through the following steps:
     * 1. Create the tenant database
     * 2. Run migrations on the tenant database
     * 3. Create the admin user in the tenant database
     * 4. Activate the tenant and clear sensitive data
     */
    public function handle(): void
    {
        Log::info('Starting tenant provisioning', [
            'tenant_id' => $this->tenant->id,
            'tenant_name' => $this->tenant->name,
        ]);

        // Step 1: Mark as provisioning
        $this->tenant->startProvisioning(Tenant::STEP_CREATING_DB);

        // Step 2: Create the database
        $this->createDatabase();

        // Step 3: Run migrations
        $this->migrateDatabase();

        // Step 4: Seed the admin user
        $this->seedAdminUser();

        // Step 5: Activate the tenant
        $this->activateTenant();

        Log::info('Tenant provisioning completed successfully', [
            'tenant_id' => $this->tenant->id,
            'tenant_name' => $this->tenant->name,
        ]);
    }

    /**
     * Create the tenant database.
     */
    protected function createDatabase(): void
    {
        Log::debug('Creating tenant database', ['tenant_id' => $this->tenant->id]);

        $this->tenant->updateProvisioningStep(Tenant::STEP_CREATING_DB);

        CreateDatabase::dispatchSync($this->tenant);

        Log::debug('Tenant database created', ['tenant_id' => $this->tenant->id]);
    }

    /**
     * Run migrations on the tenant database.
     */
    protected function migrateDatabase(): void
    {
        Log::debug('Migrating tenant database', ['tenant_id' => $this->tenant->id]);

        $this->tenant->updateProvisioningStep(Tenant::STEP_MIGRATING);

        MigrateDatabase::dispatchSync($this->tenant);

        Log::debug('Tenant database migrated', ['tenant_id' => $this->tenant->id]);
    }

    /**
     * Create the admin user in the tenant database.
     */
    protected function seedAdminUser(): void
    {
        Log::debug('Seeding admin user', ['tenant_id' => $this->tenant->id]);

        $this->tenant->updateProvisioningStep(Tenant::STEP_CREATING_ADMIN);

        // Use admin data passed to job constructor (never stored in database)
        if (empty($this->adminData) || empty($this->adminData['email'])) {
            Log::warning('No admin data provided for tenant, skipping admin creation', [
                'tenant_id' => $this->tenant->id,
            ]);

            return;
        }

        // Switch to tenant context
        tenancy()->initialize($this->tenant);

        try {
            // Create the admin user in the tenant database
            // Password is received in plain text and hashed here
            $user = User::create([
                'name' => $this->adminData['name'] ?? 'Administrator',
                'email' => $this->adminData['email'],
                'password' => Hash::make($this->adminData['password'] ?? 'password'),
                'active' => true,
            ]);

            // Assign admin role using Spatie Permission (if available)
            if (method_exists($user, 'assignRole')) {
                try {
                    $user->assignRole('admin');
                    Log::debug('Admin role assigned to user', [
                        'tenant_id' => $this->tenant->id,
                        'user_id' => $user->id,
                    ]);
                } catch (Throwable $e) {
                    // Role may not exist yet, log but don't fail
                    Log::warning('Could not assign admin role', [
                        'tenant_id' => $this->tenant->id,
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info('Admin user created', [
                'tenant_id' => $this->tenant->id,
                'user_id' => $user->id,
                'email' => $user->email,
            ]);
        } finally {
            // Always end tenancy context
            tenancy()->end();
        }
    }

    /**
     * Activate the tenant and clear sensitive data.
     */
    protected function activateTenant(): void
    {
        Log::debug('Activating tenant', ['tenant_id' => $this->tenant->id]);

        // Activate clears admin_data and provisioning_step automatically
        $this->tenant->activate();

        Log::debug('Tenant activated', ['tenant_id' => $this->tenant->id]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(?Throwable $exception): void
    {
        Log::error('Tenant provisioning failed', [
            'tenant_id' => $this->tenant->id,
            'tenant_name' => $this->tenant->name,
            'step' => $this->tenant->provisioning_step,
            'error' => $exception?->getMessage(),
            'trace' => $exception?->getTraceAsString(),
        ]);

        // Mark tenant as failed with the error reason
        $this->tenant->markProvisioningFailed($exception?->getMessage());
    }
}
