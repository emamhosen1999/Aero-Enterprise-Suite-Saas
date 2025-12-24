<?php

namespace Aero\HRM\Commands\Attendance;

use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Leave;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class AutoMarkAbsences extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:auto-mark-absences 
                            {--date= : The date to process (defaults to previous working day)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically mark employees as absent if they did not punch in';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $date = $this->option('date')
            ? Carbon::parse($this->option('date'))
            : Carbon::yesterday();

        // Skip weekends
        if ($date->isWeekend()) {
            $this->info("Skipping {$date->toDateString()} (weekend)");

            return Command::SUCCESS;
        }

        $this->info("Processing absences for {$date->toDateString()}...");

        // Get all active users
        $users = Employee::where('is_active', true)->get();
        $markedCount = 0;
        $skippedCount = 0;

        foreach ($users as $user) {
            // Check if user already has attendance record
            $existingAttendance = Attendance::where('user_id', $user->id)
                ->whereDate('date', $date)
                ->first();

            if ($existingAttendance) {
                $skippedCount++;

                continue;
            }

            // Check if user has approved leave for this date
            $hasLeave = Leave::where('user_id', $user->id)
                ->where('status', 'Approved')
                ->where('from_date', '<=', $date)
                ->where('to_date', '>=', $date)
                ->exists();

            if ($hasLeave) {
                $this->line("  Skipping {$user->name} (on leave)");
                $skippedCount++;

                continue;
            }

            // Mark as absent
            Attendance::create([
                'user_id' => $user->id,
                'date' => $date,
                'status' => 'Absent',
                'punchin' => null,
                'punchout' => null,
                'work_hours' => 0,
                'overtime_hours' => 0,
                'is_late' => false,
                'is_early_leave' => false,
                'notes' => 'Auto-marked absent by system',
            ]);

            $this->line("  Marked {$user->name} as absent");
            $markedCount++;
        }

        $this->info("Completed! Marked {$markedCount} absences, skipped {$skippedCount}");

        Log::info("Auto-marked absences for {$date->toDateString()}", [
            'marked' => $markedCount,
            'skipped' => $skippedCount,
        ]);

        return Command::SUCCESS;
    }
}
