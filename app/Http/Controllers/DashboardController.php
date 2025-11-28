<?php

namespace App\Http\Controllers;

use App\Models\DailyWork;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        if (! Auth::check()) {
            return redirect()->route('login');
        }
        $user = Auth::user();

        return Inertia::render('Dashboard', [
            'title' => 'Dashboard',
            'user' => $user,
            'status' => session('status'),
            'csrfToken' => session('csrfToken'),
        ]);
    }

    public function stats()
    {
        $user = Auth::user();

        // Use permission-based access control instead of roles
        $taskQuery = DailyWork::query();

        // Apply filters based on user permissions and context
        if ($user->can('daily-works.view')) {
            // Users with full daily works access can see all tasks
            $taskQuery = DailyWork::query();
        } elseif ($user->can('daily-works.own.view')) {
            // Users with limited access see only their own tasks
            $taskQuery = DailyWork::where(function ($query) use ($user) {
                $query->where('incharge', $user->id)
                    ->orWhere('assigned', $user->id);
            });
        } else {
            // No access to daily works - return empty stats
            $taskQuery = DailyWork::whereRaw('1 = 0'); // Always empty
        }

        $total = (clone $taskQuery)->count();
        $completed = (clone $taskQuery)->where('status', 'completed')->count();
        $pending = $total - $completed;
        $rfi_submissions = (clone $taskQuery)->whereNotNull('rfi_submission_date')->count();

        $statistics = [
            'total' => $total,
            'completed' => $completed,
            'pending' => $pending,
            'rfi_submissions' => $rfi_submissions,
        ];

        return response()->json([
            'statistics' => $statistics,
        ]);
    }

    public function updates()
    {
        $user = Auth::user();

        // Check if user has permission to view updates
        if (! $user->can('core.updates.view')) {
            return response()->json([
                'message' => 'Unauthorized access to updates',
            ], 403);
        }

        $users = User::with('roles:name')
            ->whereHas('roles', function ($query) {
                $query->where('name', 'Employee');
            })
            ->get()
            ->map(function ($user) {
                $userData = $user->toArray();
                $userData['roles'] = $user->roles->pluck('name')->toArray();

                return $userData;
            });

        $today = now()->toDateString();

        // Only show leave information if user has appropriate permissions
        $todayLeaves = [];
        $upcomingLeaves = [];

        if ($user->can('leaves.view') || $user->can('leaves.own.view')) {
            $leaveQuery = DB::table('leaves')
                ->join('leave_settings', 'leaves.leave_type', '=', 'leave_settings.id')
                ->select('leaves.*', 'leave_settings.type as leave_type');

            // If user can only view own leaves, filter accordingly
            if (! $user->can('leaves.view') && $user->can('leaves.own.view')) {
                $leaveQuery->where('leaves.user_id', $user->id);
            }

            $todayLeaves = (clone $leaveQuery)
                ->whereDate('leaves.from_date', '<=', $today)
                ->whereDate('leaves.to_date', '>=', $today)
                ->get();

            $upcomingLeaves = (clone $leaveQuery)
                ->where(function ($query) {
                    $query->whereDate('leaves.from_date', '>=', now())
                        ->orWhereDate('leaves.to_date', '>=', now());
                })
                ->where(function ($query) {
                    $query->whereDate('leaves.from_date', '<=', now()->addDays(7))
                        ->orWhereDate('leaves.to_date', '<=', now()->addDays(7));
                })
                ->orderBy('leaves.from_date', 'desc')
                ->get();
        }

        $upcomingHoliday = null;
        if ($user->can('holidays.view')) {
            $upcomingHoliday = DB::table('holidays')
                ->whereDate('holidays.from_date', '>=', now())
                ->orderBy('holidays.from_date', 'asc')
                ->first();
        }

        return response()->json([
            'users' => $users,
            'todayLeaves' => $todayLeaves,
            'upcomingLeaves' => $upcomingLeaves,
            'upcomingHoliday' => $upcomingHoliday,
        ]);
    }
}
