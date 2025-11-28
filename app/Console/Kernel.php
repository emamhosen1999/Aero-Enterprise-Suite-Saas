<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Support\Facades\Log;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        \App\Console\Commands\SendAttendanceReminders::class,
    ];

    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule)
    {
        // Test scheduler command runs every minute (for testing only)
        if (config('app.env') === 'local') {
            $schedule->command('test:scheduler')
                ->everyMinute()
                ->onFailure(function () {
                    Log::error('Test scheduler failed');
                });
        }

        // Send attendance reminders daily at 8:00 AM
        $schedule->command('attendance:reminders')
            ->dailyAt('22:17')
            ->timezone(config('app.timezone', 'UTC'))
            ->before(function () {
                Log::info('Starting attendance reminder job');
            })
            ->onSuccess(function () {
                Log::info('Attendance reminders sent successfully');
            })
            ->onFailure(function () {
                Log::error('Failed to send attendance reminders');
                // Optionally send an alert to admins here
            })
            ->withoutOverlapping()
            ->runInBackground()
            ->appendOutputTo(storage_path('logs/attendance-reminders.log'));

        // Clean up old notification logs (keep 30 days)
        $schedule->command('model:prune', [
            '--model' => [
                \App\Models\NotificationLog::class,
            ],
        ])->daily();

        // Leave management scheduled tasks
        // Reset annual leaves and process carry forwards - runs on January 1st at midnight
        $schedule->command('leave:reset-annual')
            ->yearly()
            ->timezone(config('app.timezone', 'UTC'))
            ->at('00:00')
            ->before(function () {
                Log::info('Starting annual leave reset process');
            })
            ->onSuccess(function () {
                Log::info('Annual leave reset completed successfully');
            })
            ->onFailure(function () {
                Log::error('Annual leave reset failed');
            })
            ->withoutOverlapping()
            ->appendOutputTo(storage_path('logs/leave-reset.log'));

        // Accrue monthly earned leaves - runs on 1st of each month at midnight
        $schedule->command('leave:accrue-monthly')
            ->monthlyOn(1, '00:00')
            ->timezone(config('app.timezone', 'UTC'))
            ->before(function () {
                Log::info('Starting monthly leave accrual process');
            })
            ->onSuccess(function () {
                Log::info('Monthly leave accrual completed successfully');
            })
            ->onFailure(function () {
                Log::error('Monthly leave accrual failed');
            })
            ->withoutOverlapping()
            ->appendOutputTo(storage_path('logs/leave-accrual.log'));
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
