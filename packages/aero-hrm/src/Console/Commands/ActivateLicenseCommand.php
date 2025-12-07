<?php

namespace AeroModules\Hrm\Console\Commands;

use Illuminate\Console\Command;
use AeroModules\Hrm\Services\LicenseValidator;

class ActivateLicenseCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'license:activate {key : The license key to activate}';

    /**
     * The console command description.
     */
    protected $description = 'Activate HRM license on this domain';

    /**
     * License validator instance
     */
    protected LicenseValidator $validator;

    /**
     * Create a new command instance.
     */
    public function __construct(LicenseValidator $validator)
    {
        parent::__construct();
        $this->validator = $validator;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $licenseKey = $this->argument('key');

        $this->info('Activating license...');
        $this->line('License Key: ' . substr($licenseKey, 0, 8) . '...');
        $this->line('Domain: ' . request()->getHost() ?? config('app.url'));

        $result = $this->validator->activate($licenseKey);

        if ($result['success']) {
            $this->info('✓ ' . $result['message']);
            
            $this->newLine();
            $this->info('License activated successfully!');
            $this->line('You can now use the HRM module on this domain.');
            
            return Command::SUCCESS;
        }

        $this->error('✗ ' . $result['message']);
        $this->newLine();
        $this->error('License activation failed!');
        $this->line('Please check your license key and try again.');
        $this->line('Contact support if the problem persists.');

        return Command::FAILURE;
    }
}
