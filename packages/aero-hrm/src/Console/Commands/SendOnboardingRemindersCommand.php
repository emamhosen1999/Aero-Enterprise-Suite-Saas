<?php

namespace Aero\Hrm\Console\Commands;

use Aero\Hrm\Jobs\OnboardingReminderJob;
use Illuminate\Console\Command;

class SendOnboardingRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hrm:send-onboarding-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send reminder notifications for incomplete employee onboardings';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Sending onboarding reminders...');

        try {
            // Dispatch the job
            OnboardingReminderJob::dispatch();

            $this->info('Onboarding reminder job dispatched successfully.');
            
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Failed to dispatch onboarding reminder job: ' . $e->getMessage());
            
            return Command::FAILURE;
        }
    }
}
