<?php

namespace Aero\Platform\Jobs;

use Aero\Platform\Services\MailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of times the job may be attempted.
     */
    public int $tries;

    /**
     * The email data
     */
    protected array $emailData;

    /**
     * Create a new job instance.
     *
     * @param array $emailData
     * @param int $tries
     */
    public function __construct(array $emailData, int $tries = 3)
    {
        $this->emailData = $emailData;
        $this->tries = $tries;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle(): void
    {
        try {
            $result = MailService::sendDirectly($this->emailData);

            if (!$result['success']) {
                throw new \Exception($result['message'] ?? 'Email sending failed');
            }

            Log::info('SendEmailJob: Email sent successfully', [
                'to' => $this->emailData['to'] ?? 'unknown',
                'subject' => $this->emailData['subject'] ?? 'No subject',
            ]);
        } catch (\Exception $e) {
            Log::error('SendEmailJob: Failed to send email', [
                'error' => $e->getMessage(),
                'to' => $this->emailData['to'] ?? 'unknown',
                'attempt' => $this->attempts(),
            ]);

            // Re-throw to trigger retry
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     *
     * @param \Throwable $exception
     * @return void
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('SendEmailJob: Job permanently failed after all retries', [
            'error' => $exception->getMessage(),
            'to' => $this->emailData['to'] ?? 'unknown',
            'subject' => $this->emailData['subject'] ?? 'No subject',
        ]);
    }
}
