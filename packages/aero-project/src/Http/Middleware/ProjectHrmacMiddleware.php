<?php

declare(strict_types=1);

namespace Aero\Project\Http\Middleware;

use Aero\Project\Contracts\ProjectAuthorizationContract;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * ProjectHrmacMiddleware
 *
 * HRMAC-based authorization middleware for Project module.
 * Validates access at module, submodule, component, and action levels.
 *
 * Usage in routes:
 *   ->middleware('project.hrmac:projects.project_list.view')
 *   ->middleware('project.hrmac:tasks.task_list.create')
 *
 * ARCHITECTURAL RULE: NO hardcoded role checks. All authorization
 * flows through HRMAC permission paths.
 */
class ProjectHrmacMiddleware
{
    public function __construct(
        protected ProjectAuthorizationContract $authorization
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  string|null  $permissionPath  Format: submodule.component.action
     */
    public function handle(Request $request, Closure $next, ?string $permissionPath = null): Response
    {
        $user = $request->user();

        if (! $user) {
            return $this->unauthorized('Authentication required');
        }

        // If no specific permission path, just check module access
        if (! $permissionPath) {
            if (! $this->authorization->canAccessProjectModule($user)) {
                return $this->unauthorized('Access to Project module denied');
            }

            return $next($request);
        }

        // Parse permission path: submodule.component.action
        $parts = explode('.', $permissionPath);

        if (count($parts) === 1) {
            // Only submodule specified
            if (! $this->authorization->canAccessSubModule($user, $parts[0])) {
                return $this->unauthorized("Access to {$parts[0]} denied");
            }
        } elseif (count($parts) >= 3) {
            // Full path: submodule.component.action
            if (! $this->authorization->canPerformAction($user, $parts[0], $parts[1], $parts[2])) {
                return $this->unauthorized("Permission denied for action: {$permissionPath}");
            }
        } elseif (count($parts) === 2) {
            // submodule.component - default to 'view' action
            if (! $this->authorization->canPerformAction($user, $parts[0], $parts[1], 'view')) {
                return $this->unauthorized("Access to {$parts[0]}.{$parts[1]} denied");
            }
        }

        return $next($request);
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
