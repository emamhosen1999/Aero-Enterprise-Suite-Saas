<?php

namespace Aero\Platform\Console\Commands;

use Aero\Platform\Jobs\ProvisionTenant;
use Aero\Platform\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class TenantCreate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenant:create
                            {name : The name of the tenant}
                            {--domain= : Custom domain for the tenant}
                            {--email= : Admin email address}
                            {--plan= : Subscription plan ID}
                            {--sync : Run provisioning synchronously}
                            {--no-provision : Create tenant without running provisioning job}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new tenant with optional configuration';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $name = $this->argument('name');

        $this->info("Creating tenant: {$name}");

        // Generate subdomain from name
        $subdomain = Str::slug($name);

        // Check if subdomain already exists
        if (Tenant::where('id', $subdomain)->exists()) {
            $this->error("A tenant with subdomain '{$subdomain}' already exists.");

            return self::FAILURE;
        }

        // Gather configuration
        $domain = $this->option('domain');
        $email = $this->option('email') ?? $this->ask('Admin email address');
        $planId = $this->option('plan');

        // Create the tenant
        $tenant = Tenant::create([
            'id' => $subdomain,
            'name' => $name,
            'status' => 'provisioning',
            'provisioning_status' => 'pending',
            'data' => [
                'admin_email' => $email,
                'plan_id' => $planId,
                'created_via' => 'artisan',
            ],
        ]);

        $this->info("Tenant created with ID: {$tenant->id}");

        // Create domain if specified
        if ($domain) {
            $tenant->domains()->create([
                'domain' => $domain,
            ]);
            $this->info("Domain '{$domain}' attached to tenant.");
        }

        // Run provisioning
        if (! $this->option('no-provision')) {
            if ($this->option('sync')) {
                $this->info('Running provisioning synchronously...');
                ProvisionTenant::dispatchSync($tenant);
                $this->info('Provisioning complete.');
            } else {
                $this->info('Dispatching provisioning job to queue...');
                ProvisionTenant::dispatch($tenant);
                $this->info('Provisioning job dispatched. Check queue for progress.');
            }
        }

        $this->newLine();
        $this->table(
            ['Property', 'Value'],
            [
                ['ID', $tenant->id],
                ['Name', $tenant->name],
                ['Status', $tenant->status],
                ['Admin Email', $email],
                ['Domain', $domain ?? 'Using default subdomain'],
            ]
        );

        return self::SUCCESS;
    }
}
