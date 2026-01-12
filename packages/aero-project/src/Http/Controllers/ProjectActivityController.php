<?php

declare(strict_types=1);

namespace Aero\Project\Http\Controllers;

use Aero\Project\Contracts\UserResolverContract;
use Aero\Project\Models\Project;
use Aero\Project\Models\ProjectActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ProjectActivityController
 *
 * Read-only controller for project activity feed/audit log.
 */
class ProjectActivityController extends Controller
{
    public function __construct(
        protected UserResolverContract $userResolver
    ) {}

    /**
     * Display activity feed for a project.
     */
    public function index(Request $request, Project $project): Response|JsonResponse
    {
        $query = $project->activityLogs()
            ->orderBy('created_at', 'desc');

        // Filter by event type
        if ($request->filled('event')) {
            $query->ofEvent($request->event);
        }

        // Filter by subject type
        if ($request->filled('subject_type')) {
            $query->where('subject_type', $request->subject_type);
        }

        // Filter by user
        if ($request->filled('causer_id')) {
            $query->byCauser($request->causer_id);
        }

        // Filter by date range
        if ($request->filled('days')) {
            $query->recent((int) $request->days);
        }

        $activities = $query->paginate($request->input('per_page', 25));

        // Get unique causer IDs for user info
        $causerIds = $activities->pluck('causer_id')->filter()->unique()->values()->toArray();
        $users = $this->userResolver->getUsersByIds($causerIds);
        $usersById = collect($users)->keyBy('id');

        // Append user info to each activity
        $activities->getCollection()->transform(function ($activity) use ($usersById) {
            $activity->causer = $usersById->get($activity->causer_id);

            return $activity;
        });

        if ($request->wantsJson()) {
            return response()->json([
                'activities' => $activities,
            ]);
        }

        return Inertia::render('Project/Activity/Index', [
            'project' => $project->only(['id', 'project_name', 'code']),
            'activities' => $activities,
            'filters' => $request->only(['event', 'subject_type', 'causer_id', 'days']),
            'eventTypes' => $this->getEventTypes(),
            'users' => $this->userResolver->getAllActiveUsers(),
        ]);
    }

    /**
     * Get activity for a specific entity.
     */
    public function forEntity(Request $request, Project $project): JsonResponse
    {
        $validated = $request->validate([
            'subject_type' => 'required|string',
            'subject_id' => 'required|integer',
        ]);

        $activities = ProjectActivityLog::forProject($project->id)
            ->where('subject_type', $validated['subject_type'])
            ->where('subject_id', $validated['subject_id'])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        // Get user info
        $causerIds = $activities->pluck('causer_id')->filter()->unique()->values()->toArray();
        $users = $this->userResolver->getUsersByIds($causerIds);
        $usersById = collect($users)->keyBy('id');

        $activities->transform(function ($activity) use ($usersById) {
            $activity->causer = $usersById->get($activity->causer_id);

            return $activity;
        });

        return response()->json([
            'activities' => $activities,
        ]);
    }

    /**
     * Get recent activity summary for dashboard.
     */
    public function summary(Project $project): JsonResponse
    {
        $last7Days = $project->activityLogs()->recent(7)->count();
        $last24Hours = $project->activityLogs()->recent(1)->count();

        // Activity by event type
        $byEvent = $project->activityLogs()
            ->recent(7)
            ->selectRaw('event, count(*) as count')
            ->groupBy('event')
            ->pluck('count', 'event')
            ->toArray();

        // Most active users
        $topUsers = $project->activityLogs()
            ->recent(7)
            ->selectRaw('causer_id, count(*) as count')
            ->groupBy('causer_id')
            ->orderByDesc('count')
            ->limit(5)
            ->pluck('count', 'causer_id')
            ->toArray();

        // Get user names
        $userIds = array_keys($topUsers);
        $users = $this->userResolver->getUsersByIds($userIds);
        $usersById = collect($users)->keyBy('id');

        $topUsersWithNames = [];
        foreach ($topUsers as $userId => $count) {
            $user = $usersById->get($userId);
            $topUsersWithNames[] = [
                'user_id' => $userId,
                'name' => $user->name ?? 'Unknown',
                'count' => $count,
            ];
        }

        return response()->json([
            'last_24_hours' => $last24Hours,
            'last_7_days' => $last7Days,
            'by_event' => $byEvent,
            'top_users' => $topUsersWithNames,
        ]);
    }

    /**
     * Get available event types.
     */
    protected function getEventTypes(): array
    {
        return [
            ProjectActivityLog::EVENT_CREATED => 'Created',
            ProjectActivityLog::EVENT_UPDATED => 'Updated',
            ProjectActivityLog::EVENT_DELETED => 'Deleted',
            ProjectActivityLog::EVENT_STATUS_CHANGED => 'Status Changed',
            ProjectActivityLog::EVENT_ASSIGNED => 'Assigned',
            ProjectActivityLog::EVENT_COMMENT_ADDED => 'Comment Added',
            ProjectActivityLog::EVENT_ATTACHMENT_ADDED => 'Attachment Added',
            ProjectActivityLog::EVENT_MEMBER_ADDED => 'Member Added',
            ProjectActivityLog::EVENT_MILESTONE_REACHED => 'Milestone Reached',
            ProjectActivityLog::EVENT_SPRINT_STARTED => 'Sprint Started',
            ProjectActivityLog::EVENT_SPRINT_COMPLETED => 'Sprint Completed',
        ];
    }
}
