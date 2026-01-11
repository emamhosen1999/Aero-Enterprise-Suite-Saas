<?php

namespace Aero\HRM\Listeners;

use Aero\HRM\Events\Leave\LeaveRequested;
use Aero\HRM\Models\Employee;
use Aero\HRM\Notifications\LeaveRequestNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class NotifyManagerOfLeaveRequest implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(LeaveRequested $event): void
    {
        $leave = $event->leave;
        $user = $leave->user;

        // Skip if no user found
        if (! $user) {
            return;
        }

        // Get the employee record to find manager (direct query)
        $employee = Employee::where('user_id', $user->id)->first();

        // Find the employee's manager (manager_id references users table)
        $manager = $employee?->manager_id ? \Aero\Core\Models\User::find($employee->manager_id) : null;

        if ($manager) {
            // Notify manager about leave request
            $manager->notify(new LeaveRequestNotification($leave));
        }

        // Notify users with access to leave management via HRMAC (replaces hardcoded HR roles)
        $this->notifyUsersWithLeaveAccess($leave, $user, $manager);
    }

    /**
     * Notify users who have access to leave management via HRMAC.
     * Falls back to HR roles if HRMAC service is not available.
     */
    protected function notifyUsersWithLeaveAccess($leave, $employee, $manager): void
    {
        // Try HRMAC first for proper module-based access control
        if (app()->bound('Aero\HRMAC\Contracts\RoleModuleAccessInterface')) {
            try {
                $hrmacService = app('Aero\HRMAC\Contracts\RoleModuleAccessInterface');
                
                // Get users with access to the 'leaves' submodule in 'hrm' module
                // Using 'approve' action to target users who can approve leave requests
                $usersWithAccess = $hrmacService->getUsersWithSubModuleAccess('hrm', 'leaves', 'approve');

                foreach ($usersWithAccess as $user) {
                    // Don't notify the employee requesting leave or the manager (already notified)
                    if ($user->id !== $employee->id && $user->id !== $manager?->id) {
                        $user->notify(new LeaveRequestNotification($leave));
                    }
                }
                
                // If we successfully used HRMAC and found users, return
                if ($usersWithAccess->isNotEmpty()) {
                    return;
                }
            } catch (\Throwable $e) {
                Log::warning('Failed to get users with leave access via HRMAC', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Fallback: If no manager assigned, try to notify HR users
        // This handles cases where HRMAC is not set up or returns no users
        if (! $manager) {
            $this->notifyHrFallback($leave, $employee);
        }
    }

    /**
     * Fallback notification to HR users when no manager is assigned and HRMAC not available.
     */
    protected function notifyHrFallback($leave, $employee): void
    {
        try {
            $userClass = \Aero\Core\Models\User::class;
            
            // Check if user class has scopeRole method (Laravel scope pattern)
            if (method_exists($userClass, 'scopeRole')) {
                $hrUsers = $userClass::role(['HR Admin', 'HR Manager', 'hr_admin', 'hr_manager'])->get();
                
                foreach ($hrUsers as $hrUser) {
                    if ($hrUser->id !== $employee->id) {
                        $hrUser->notify(new LeaveRequestNotification($leave));
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to notify HR users (fallback)', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(LeaveRequested $event, \Throwable $exception): void
    {
        Log::error('Failed to notify manager of leave request', [
            'leave_id' => $event->leave->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
