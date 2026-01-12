<?php

declare(strict_types=1);

namespace Aero\Project\Http\Middleware;

use Aero\Project\Contracts\ProjectAuthorizationContract;
use Aero\Project\Models\ProjectMember;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * ProjectMemberMiddleware
 *
 * Ensures the user is a member of the project they're trying to access.
 * Optionally checks for specific project roles.
 *
 * Usage in routes:
 *   ->middleware('project.member')                    // Any member
 *   ->middleware('project.member:project_leader')     // Specific role
 *   ->middleware('project.member:project_leader,team_lead')  // Multiple roles
 *
 * ARCHITECTURAL PRINCIPLE: Project membership is contextual access control,
 * working alongside HRMAC module-level permissions.
 */
class ProjectMemberMiddleware
{
    public function __construct(
        protected ProjectAuthorizationContract $authorization
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  string|null  $roles  Comma-separated list of allowed project roles
     */
    public function handle(Request $request, Closure $next, ?string $roles = null): Response
    {
        $user = $request->user();

        if (! $user) {
            return $this->unauthorized('Authentication required');
        }

        // Extract project ID from route parameter
        $projectId = $this->extractProjectId($request);

        if (! $projectId) {
            // No project in context, proceed (let controller handle)
            return $next($request);
        }

        // Check if user is project member
        $membership = ProjectMember::where('project_id', $projectId)
            ->where('user_id', $user->id)
            ->first();

        if (! $membership) {
            // Check if user has global project access via HRMAC
            if ($this->authorization->canAccessProjectModule($user)) {
                return $next($request);
            }

            return $this->unauthorized('You are not a member of this project');
        }

        // If specific roles are required, check them
        if ($roles !== null) {
            $allowedRoles = array_map('trim', explode(',', $roles));

            if (! in_array($membership->role, $allowedRoles)) {
                // Check if user has elevated HRMAC access that bypasses role requirement
                if ($this->authorization->canAccessProjectModule($user)) {
                    return $next($request);
                }

                return $this->unauthorized('Your project role does not have access to this resource');
            }
        }

        // Store membership info for controllers to use
        $request->merge(['project_membership' => $membership]);

        return $next($request);
    }

    /**
     * Extract project ID from request route parameters.
     */
    protected function extractProjectId(Request $request): ?int
    {
        // Try various common parameter names
        $paramNames = ['project', 'project_id', 'projectId'];

        foreach ($paramNames as $param) {
            $value = $request->route($param);

            if ($value) {
                // Handle both model binding and raw IDs
                if (is_object($value) && property_exists($value, 'id')) {
                    return (int) $value->id;
                }

                return (int) $value;
            }
        }

        // Check query parameters
        if ($request->has('project_id')) {
            return (int) $request->get('project_id');
        }

        return null;
    }

    /**
     * Return unauthorized response.
     */
    protected function unauthorized(string $message): Response
    {
        if (request()->expectsJson()) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => $message,
            ], 403);
        }

        abort(403, $message);
    }
}
