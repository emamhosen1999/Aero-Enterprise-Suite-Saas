<?php

namespace Aero\Core\Services;

use Aero\Core\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;

/**
 * Audit Service
 * 
 * Centralized service for logging user actions and system events.
 * Provides consistent audit trail for compliance and security.
 */
class AuditService
{
    /**
     * Log an action.
     */
    public function log(
        string $action,
        ?Model $auditable = null,
        ?string $description = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $metadata = null
    ): AuditLog {
        $user = Auth::user();
        
        return AuditLog::create([
            'user_id' => $user?->id,
            'user_name' => $user?->name,
            'user_email' => $user?->email,
            'action' => $action,
            'auditable_type' => $auditable ? get_class($auditable) : null,
            'auditable_id' => $auditable?->id,
            'description' => $description ?? $this->generateDescription($action, $auditable),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'metadata' => array_merge([
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'url' => request()->fullUrl(),
            ], $metadata ?? []),
        ]);
    }

    /**
     * Log user created.
     */
    public function logUserCreated(Model $user, array $data): AuditLog
    {
        return $this->log(
            'created',
            $user,
            "Created user: {$user->name} ({$user->email})",
            null,
            $this->filterSensitiveData($data)
        );
    }

    /**
     * Log user updated.
     */
    public function logUserUpdated(Model $user, array $oldData, array $newData): AuditLog
    {
        return $this->log(
            'updated',
            $user,
            "Updated user: {$user->name} ({$user->email})",
            $this->filterSensitiveData($oldData),
            $this->filterSensitiveData($newData)
        );
    }

    /**
     * Log user deleted.
     */
    public function logUserDeleted(Model $user): AuditLog
    {
        return $this->log(
            'deleted',
            $user,
            "Deleted user: {$user->name} ({$user->email})"
        );
    }

    /**
     * Log user status changed.
     */
    public function logUserStatusChanged(Model $user, bool $active): AuditLog
    {
        $action = $active ? 'activated' : 'deactivated';
        $status = $active ? 'active' : 'inactive';
        
        return $this->log(
            $action,
            $user,
            ucfirst($action) . " user: {$user->name} ({$user->email})",
            ['active' => !$active],
            ['active' => $active]
        );
    }

    /**
     * Log user invitation sent.
     */
    public function logUserInvited(Model $invitation): AuditLog
    {
        return $this->log(
            'invited',
            $invitation,
            "Invited user: {$invitation->name} ({$invitation->email})",
            null,
            [
                'email' => $invitation->email,
                'name' => $invitation->name,
                'roles' => $invitation->roles,
            ]
        );
    }

    /**
     * Log invitation resent.
     */
    public function logInvitationResent(Model $invitation): AuditLog
    {
        return $this->log(
            'invitation_resent',
            $invitation,
            "Resent invitation to: {$invitation->email}"
        );
    }

    /**
     * Log invitation cancelled.
     */
    public function logInvitationCancelled(Model $invitation): AuditLog
    {
        return $this->log(
            'invitation_cancelled',
            $invitation,
            "Cancelled invitation for: {$invitation->email}"
        );
    }

    /**
     * Log role assigned to user.
     */
    public function logRoleAssigned(Model $user, array $roles): AuditLog
    {
        return $this->log(
            'role_assigned',
            $user,
            "Assigned roles to user: {$user->name}",
            null,
            ['roles' => $roles]
        );
    }

    /**
     * Log bulk status change.
     */
    public function logBulkStatusChange(int $count, bool $active): AuditLog
    {
        $action = $active ? 'bulk_activated' : 'bulk_deactivated';
        $status = $active ? 'activated' : 'deactivated';
        
        return $this->log(
            $action,
            null,
            "Bulk {$status} {$count} users",
            null,
            ['count' => $count, 'active' => $active]
        );
    }

    /**
     * Log bulk role assignment.
     */
    public function logBulkRoleAssignment(int $count, array $roles): AuditLog
    {
        return $this->log(
            'bulk_roles_assigned',
            null,
            "Assigned roles to {$count} users",
            null,
            ['count' => $count, 'roles' => $roles]
        );
    }

    /**
     * Log bulk deletion.
     */
    public function logBulkDeletion(int $count): AuditLog
    {
        return $this->log(
            'bulk_deleted',
            null,
            "Bulk deleted {$count} users",
            null,
            ['count' => $count]
        );
    }

    /**
     * Log user restored.
     */
    public function logUserRestored(Model $user): AuditLog
    {
        return $this->log(
            'user_restored',
            $user,
            "Restored user: {$user->name}"
        );
    }

    /**
     * Log account locked.
     */
    public function logAccountLocked(Model $user, ?string $reason = null): AuditLog
    {
        return $this->log(
            'account_locked',
            $user,
            "Locked account: {$user->name}",
            null,
            ['reason' => $reason]
        );
    }

    /**
     * Log account unlocked.
     */
    public function logAccountUnlocked(Model $user): AuditLog
    {
        return $this->log(
            'account_unlocked',
            $user,
            "Unlocked account: {$user->name}"
        );
    }

    /**
     * Log password reset forced.
     */
    public function logPasswordResetForced(Model $user): AuditLog
    {
        return $this->log(
            'password_reset_forced',
            $user,
            "Forced password reset for user: {$user->name}"
        );
    }

    /**
     * Log email verification resent.
     */
    public function logVerificationResent(Model $user): AuditLog
    {
        return $this->log(
            'verification_resent',
            $user,
            "Resent email verification to: {$user->email}"
        );
    }

    /**
     * Log user export.
     */
    public function logUserExport(int $count, array $filters = []): AuditLog
    {
        return $this->log(
            'users_exported',
            null,
            "Exported {$count} users",
            null,
            ['count' => $count, 'filters' => $filters]
        );
    }

    /**
     * Get audit logs with filters.
     */
    public function getLogs(array $filters = [], int $perPage = 15)
    {
        $query = AuditLog::with('user')
            ->orderBy('created_at', 'desc');

        // Filter by action
        if (!empty($filters['action'])) {
            $query->action($filters['action']);
        }

        // Filter by auditable type
        if (!empty($filters['auditable_type'])) {
            $query->auditableType($filters['auditable_type']);
        }

        // Filter by user
        if (!empty($filters['user_id'])) {
            $query->byUser($filters['user_id']);
        }

        // Filter by date range
        if (!empty($filters['from']) || !empty($filters['to'])) {
            $query->dateRange($filters['from'] ?? null, $filters['to'] ?? null);
        }

        // Search in description
        if (!empty($filters['search'])) {
            $query->where('description', 'like', "%{$filters['search']}%");
        }

        return $query->paginate($perPage);
    }

    /**
     * Get audit statistics.
     */
    public function getStatistics(int $days = 30): array
    {
        $from = now()->subDays($days);

        return [
            'total' => AuditLog::where('created_at', '>=', $from)->count(),
            'by_action' => AuditLog::where('created_at', '>=', $from)
                ->selectRaw('action, count(*) as count')
                ->groupBy('action')
                ->pluck('count', 'action')
                ->toArray(),
            'by_user' => AuditLog::where('created_at', '>=', $from)
                ->whereNotNull('user_id')
                ->selectRaw('user_name, count(*) as count')
                ->groupBy('user_name')
                ->orderByDesc('count')
                ->limit(10)
                ->pluck('count', 'user_name')
                ->toArray(),
            'recent' => AuditLog::with('user')
                ->where('created_at', '>=', $from)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
        ];
    }

    /**
     * Cleanup old audit logs.
     */
    public function cleanup(int $daysToKeep = 365): int
    {
        $date = now()->subDays($daysToKeep);
        
        return AuditLog::where('created_at', '<', $date)->delete();
    }

    /**
     * Generate description from action and model.
     */
    protected function generateDescription(string $action, ?Model $model): string
    {
        if (!$model) {
            return ucfirst(str_replace('_', ' ', $action));
        }

        $type = class_basename($model);
        $identifier = $model->name ?? $model->email ?? $model->id;

        return ucfirst(str_replace('_', ' ', $action)) . " {$type}: {$identifier}";
    }

    /**
     * Filter sensitive data from arrays.
     */
    protected function filterSensitiveData(array $data): array
    {
        $sensitiveKeys = ['password', 'password_confirmation', 'token', 'secret', 'api_key'];
        
        return collect($data)
            ->except($sensitiveKeys)
            ->toArray();
    }
}
