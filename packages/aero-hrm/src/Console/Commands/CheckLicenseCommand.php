<?php

namespace AeroModules\Hrm\Console\Commands;

use Illuminate\Console\Command;
use AeroModules\Hrm\Services\LicenseValidator;

class CheckLicenseCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'license:check';

    /**
     * The console command description.
     */
    protected $description = 'Check HRM license status';

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
        $this->info('Checking license status...');
        $this->newLine();

        $status = $this->validator->status();

        if (isset($status['status']) && $status['status'] === 'error') {
            $this->error('Failed to check license status');
            $this->line($status['message'] ?? 'Unknown error');
            return Command::FAILURE;
        }

        // Display status information
        $this->line('License Status: ' . $this->getStatusLabel($status['status']));
        
        if (isset($status['license_type'])) {
            $this->line('License Type: ' . ucfirst($status['license_type']));
        }
        
        if (isset($status['expires_at'])) {
            $this->line('Expires: ' . $status['expires_at']);
        }
        
        if (isset($status['activations']) && isset($status['max_activations'])) {
            $this->line('Activations: ' . $status['activations'] . '/' . $status['max_activations']);
        }

        // Check if in grace period
        if ($this->validator->isGracePeriodActive()) {
            $days = $this->validator->gracePeriodDaysRemaining();
            $this->newLine();
            $this->warn('⚠ Grace period active: ' . $days . ' days remaining');
            $this->line('License server is unreachable. Please check your connection.');
        }

        $this->newLine();

        return Command::SUCCESS;
    }

    /**
     * Get colored status label
     */
    protected function getStatusLabel(string $status): string
    {
        return match($status) {
            'active' => '<fg=green>Active</>',
            'expired' => '<fg=red>Expired</>',
            'suspended' => '<fg=yellow>Suspended</>',
            'inactive' => '<fg=gray>Inactive</>',
            default => '<fg=gray>Unknown</>',
        };
    }
}
