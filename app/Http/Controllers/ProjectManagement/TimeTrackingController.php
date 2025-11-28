<?php

namespace App\Http\Controllers\ProjectManagement;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectTimeEntry;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TimeTrackingController extends Controller
{
    public function index(Request $request)
    {
        $query = ProjectTimeEntry::with(['project', 'task', 'user', 'approvedBy'])
            ->orderBy('date', 'desc');

        // Filter by project if specified
        if ($request->has('project_id') && $request->project_id) {
            $query->where('project_id', $request->project_id);
        }

        // Filter by user if specified
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->start_date) {
            $query->where('date', '>=', $request->start_date);
        }

        if ($request->has('end_date') && $request->end_date) {
            $query->where('date', '<=', $request->end_date);
        }

        // Filter by approval status
        if ($request->has('approved') && $request->approved !== '') {
            $query->where('approved', $request->approved === 'true');
        }

        $timeEntries = $query->paginate(15);

        return Inertia::render('ProjectManagement/TimeTracking/Index', [
            'timeEntries' => $timeEntries,
            'projects' => Project::select('id', 'project_name')->get(),
            'users' => User::select('id', 'name')->get(),
            'filters' => $request->only(['project_id', 'user_id', 'start_date', 'end_date', 'approved']),
        ]);
    }

    public function create()
    {
        return Inertia::render('ProjectManagement/TimeTracking/Create', [
            'projects' => Project::with(['tasks' => function ($query) {
                $query->select('id', 'project_id', 'name');
            }])->select('id', 'project_name')->get(),
            'users' => User::select('id', 'name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'task_id' => 'nullable|exists:project_tasks,id',
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'description' => 'required|string|max:1000',
            'billable' => 'boolean',
            'hourly_rate' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Calculate duration
        $startTime = Carbon::createFromFormat('H:i', $validated['start_time']);
        $endTime = Carbon::createFromFormat('H:i', $validated['end_time']);
        $durationMinutes = $startTime->diffInMinutes($endTime);

        $validated['duration_minutes'] = $durationMinutes;
        $validated['billable'] = $validated['billable'] ?? false;

        ProjectTimeEntry::create($validated);

        return redirect()->route('time-tracking.index')
            ->with('success', 'Time entry created successfully.');
    }

    public function show(ProjectTimeEntry $timeEntry)
    {
        $timeEntry->load(['project', 'task', 'user', 'approvedBy']);

        return Inertia::render('ProjectManagement/TimeTracking/Show', [
            'timeEntry' => $timeEntry,
        ]);
    }

    public function edit(ProjectTimeEntry $timeEntry)
    {
        return Inertia::render('ProjectManagement/TimeTracking/Edit', [
            'timeEntry' => $timeEntry,
            'projects' => Project::with(['tasks' => function ($query) {
                $query->select('id', 'project_id', 'name');
            }])->select('id', 'project_name')->get(),
            'users' => User::select('id', 'name')->get(),
        ]);
    }

    public function update(Request $request, ProjectTimeEntry $timeEntry)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'task_id' => 'nullable|exists:project_tasks,id',
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'description' => 'required|string|max:1000',
            'billable' => 'boolean',
            'hourly_rate' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Calculate duration
        $startTime = Carbon::createFromFormat('H:i', $validated['start_time']);
        $endTime = Carbon::createFromFormat('H:i', $validated['end_time']);
        $durationMinutes = $startTime->diffInMinutes($endTime);

        $validated['duration_minutes'] = $durationMinutes;
        $validated['billable'] = $validated['billable'] ?? false;

        $timeEntry->update($validated);

        return redirect()->route('time-tracking.index')
            ->with('success', 'Time entry updated successfully.');
    }

    public function destroy(ProjectTimeEntry $timeEntry)
    {
        $timeEntry->delete();

        return redirect()->route('time-tracking.index')
            ->with('success', 'Time entry deleted successfully.');
    }

    public function approve(ProjectTimeEntry $timeEntry)
    {
        $timeEntry->update([
            'approved' => true,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()
            ->with('success', 'Time entry approved successfully.');
    }

    public function unapprove(ProjectTimeEntry $timeEntry)
    {
        $timeEntry->update([
            'approved' => false,
            'approved_by' => null,
            'approved_at' => null,
        ]);

        return redirect()->back()
            ->with('success', 'Time entry approval removed successfully.');
    }

    public function bulkApprove(Request $request)
    {
        $validated = $request->validate([
            'time_entry_ids' => 'required|array',
            'time_entry_ids.*' => 'exists:project_time_entries,id',
        ]);

        ProjectTimeEntry::whereIn('id', $validated['time_entry_ids'])
            ->update([
                'approved' => true,
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

        return redirect()->back()
            ->with('success', 'Time entries approved successfully.');
    }

    public function reports(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', now()->endOfMonth()->format('Y-m-d'));

        // Time tracking summary
        $summary = ProjectTimeEntry::selectRaw('
            COUNT(*) as total_entries,
            SUM(duration_minutes) as total_minutes,
            SUM(CASE WHEN billable = 1 THEN duration_minutes ELSE 0 END) as billable_minutes,
            SUM(CASE WHEN billable = 1 THEN (duration_minutes/60) * hourly_rate ELSE 0 END) as billable_amount,
            SUM(CASE WHEN approved = 1 THEN duration_minutes ELSE 0 END) as approved_minutes
        ')
            ->whereBetween('date', [$startDate, $endDate])
            ->first();

        // Project breakdown
        $projectBreakdown = ProjectTimeEntry::selectRaw('
            projects.project_name,
            COUNT(*) as entries_count,
            SUM(duration_minutes) as total_minutes,
            SUM(CASE WHEN billable = 1 THEN (duration_minutes/60) * hourly_rate ELSE 0 END) as billable_amount
        ')
            ->join('projects', 'project_time_entries.project_id', '=', 'projects.id')
            ->whereBetween('date', [$startDate, $endDate])
            ->groupBy('projects.id', 'projects.project_name')
            ->get();

        // User breakdown
        $userBreakdown = ProjectTimeEntry::selectRaw('
            users.name,
            COUNT(*) as entries_count,
            SUM(duration_minutes) as total_minutes,
            SUM(CASE WHEN billable = 1 THEN (duration_minutes/60) * hourly_rate ELSE 0 END) as billable_amount
        ')
            ->join('users', 'project_time_entries.user_id', '=', 'users.id')
            ->whereBetween('date', [$startDate, $endDate])
            ->groupBy('users.id', 'users.name')
            ->get();

        return Inertia::render('ProjectManagement/TimeTracking/Reports', [
            'summary' => $summary,
            'projectBreakdown' => $projectBreakdown,
            'userBreakdown' => $userBreakdown,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);
    }
}
