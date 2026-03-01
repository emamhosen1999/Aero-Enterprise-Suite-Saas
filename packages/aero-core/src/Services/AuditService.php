<?php

namespace Aero\Core\Services;

use Aero\Core\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

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
            ucfirst($action)." user: {$user->name} ({$user->email})",
            ['active' => ! $active],
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
     * Log role creation.
     */
    public function logRoleCreated(Model $role): AuditLog
    {
        return $this->log(
            'role_created',
            null,
            "Created role: {$role->name}",
            null,
            [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'description' => $role->description ?? null,
                'guard_name' => $role->guard_name,
            ]
        );
    }

    /**
     * Log role update.
     */
    public function logRoleUpdated(Model $role, array $oldData, array $newData): AuditLog
    {
        return $this->log(
            'role_updated',
            null,
            "Updated role: {$role->name}",
            null,
            [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'old_data' => $oldData,
                'new_data' => $newData,
            ]
        );
    }

    /**
     * Log role deletion.
     */
    public function logRoleDeleted(Model $role): AuditLog
    {
        return $this->log(
            'role_deleted',
            null,
            "Deleted role: {$role->name}",
            null,
            [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'description' => $role->description ?? null,
            ]
        );
    }

    /**
     * Log role module access changed.
     */
    public function logRoleAccessChanged(Model $role, ?array $oldAccess, array $newAccess): AuditLog
    {
        $summary = $this->summarizeAccessChanges($oldAccess, $newAccess);

        return $this->log(
            'role_access_changed',
            null,
            "Modified module access for role: {$role->name} - {$summary}",
            null,
            [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'old_access' => $oldAccess,
                'new_access' => $newAccess,
                'summary' => $summary,
            ]
        );
    }

    /**
     * Summarize access changes for audit log.
     */
    private function summarizeAccessChanges(?array $oldAccess, array $newAccess): string
    {
        if (! $oldAccess) {
            return 'Initial access configuration';
        }

        $changes = [];

        // Count modules
        $oldModules = count($oldAccess['modules'] ?? []);
        $newModules = count($newAccess['modules'] ?? []);
        if ($oldModules !== $newModules) {
            $changes[] = "Modules: {$oldModules} → {$newModules}";
        }

        // Count submodules
        $oldSubs = count($oldAccess['sub_modules'] ?? []);
        $newSubs = count($newAccess['sub_modules'] ?? []);
        if ($oldSubs !== $newSubs) {
            $changes[] = "SubModules: {$oldSubs} → {$newSubs}";
        }

        // Count components
        $oldComps = count($oldAccess['components'] ?? []);
        $newComps = count($newAccess['components'] ?? []);
        if ($oldComps !== $newComps) {
            $changes[] = "Components: {$oldComps} → {$newComps}";
        }

        // Count actions
        $oldActions = count($oldAccess['actions'] ?? []);
        $newActions = count($newAccess['actions'] ?? []);
        if ($oldActions !== $newActions) {
            $changes[] = "Actions: {$oldActions} → {$newActions}";
        }

        return empty($changes) ? 'Access reconfigured' : implode(', ', $changes);
    }

    /**
     * Get audit logs with filters.
     */
    public function getLogs(array $filters = [], int $perPage = 15)
    {
        $query = AuditLog::with('user')
            ->orderBy('created_at', 'desc');

        // Filter by action
        if (! empty($filters['action'])) {
            $query->action($filters['action']);
        }

        // Filter by auditable type
        if (! empty($filters['auditable_type'])) {
            $query->auditableType($filters['auditable_type']);
        }

        // Filter by user
        if (! empty($filters['user_id'])) {
            $query->byUser($filters['user_id']);
        }

        // Filter by date range
        if (! empty($filters['from']) || ! empty($filters['to'])) {
            $query->dateRange($filters['from'] ?? null, $filters['to'] ?? null);
        }

        // Search in description
        if (! empty($filters['search'])) {
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

    // ========================================
    // Security & Authentication Audit Methods
    // ========================================

    /**
     * Log device registration.
     */
    public function logDeviceRegistered(Model $user, array $deviceData): AuditLog
    {
        return $this->log(
            'device_registered',
            $user,
            "Registered new device: {$deviceData['device_name']} ({$deviceData['device_type']})",
            null,
            null,
            [
                'device_name' => $deviceData['device_name'] ?? 'Unknown Device',
                'device_type' => $deviceData['device_type'] ?? 'unknown',
                'trusted' => $deviceData['trusted'] ?? false,
                'platform' => $deviceData['platform'] ?? null,
                'browser' => $deviceData['browser'] ?? null,
            ]
        );
    }

    /**
     * Log device trust revoked.
     */
    public function logDeviceTrustRevoked(Model $user, string $deviceName, ?string $deviceId = null): AuditLog
    {
        return $this->log(
            'device_trust_revoked',
            $user,
            "Revoked trust for device: {$deviceName}",
            null,
            null,
            [
                'device_name' => $deviceName,
                'device_id' => $deviceId,
            ]
        );
    }

    /**
     * Log device removed.
     */
    public function logDeviceRemoved(Model $user, string $deviceName, ?string $deviceId = null): AuditLog
    {
        return $this->log(
            'device_removed',
            $user,
            "Removed device: {$deviceName}",
            null,
            null,
            [
                'device_name' => $deviceName,
                'device_id' => $deviceId,
            ]
        );
    }

    /**
     * Log 2FA enabled.
     */
    public function log2FAEnabled(Model $user): AuditLog
    {
        return $this->log(
            '2fa_enabled',
            $user,
            "Enabled two-factor authentication for user: {$user->name} ({$user->email})"
        );
    }

    /**
     * Log 2FA disabled.
     */
    public function log2FADisabled(Model $user): AuditLog
    {
        return $this->log(
            '2fa_disabled',
            $user,
            "Disabled two-factor authentication for user: {$user->name} ({$user->email})"
        );
    }

    /**
     * Log 2FA recovery codes regenerated.
     */
    public function log2FACodesRegenerated(Model $user): AuditLog
    {
        return $this->log(
            '2fa_codes_regenerated',
            $user,
            "Regenerated 2FA recovery codes for user: {$user->name} ({$user->email})"
        );
    }

    /**
     * Log 2FA verification failed.
     */
    public function log2FAVerificationFailed(Model $user, int $remainingAttempts): AuditLog
    {
        return $this->log(
            '2fa_verification_failed',
            $user,
            "Failed 2FA verification for user: {$user->name} ({$user->email})",
            null,
            null,
            [
                'remaining_attempts' => $remainingAttempts,
            ]
        );
    }

    /**
     * Log session created.
     */
    public function logSessionCreated(Model $user, ?string $deviceName = null): AuditLog
    {
        return $this->log(
            'session_created',
            $user,
            "Created session for user: {$user->name} ({$user->email})",
            null,
            null,
            [
                'device_name' => $deviceName,
            ]
        );
    }

    /**
     * Log session terminated.
     */
    public function logSessionTerminated(Model $user, ?string $sessionId = null, bool $terminatedByUser = true): AuditLog
    {
        $reason = $terminatedByUser ? 'User action' : 'Automatic expiration';

        return $this->log(
            'session_terminated',
            $user,
            "Terminated session for user: {$user->name} ({$user->email})",
            null,
            null,
            [
                'session_id' => $sessionId,
                'reason' => $reason,
                'terminated_by_user' => $terminatedByUser,
            ]
        );
    }

    /**
     * Log all sessions terminated (logout all devices).
     */
    public function logAllSessionsTerminated(Model $user, int $sessionsCount): AuditLog
    {
        return $this->log(
            'all_sessions_terminated',
            $user,
            "Terminated all sessions ({$sessionsCount}) for user: {$user->name} ({$user->email})",
            null,
            null,
            [
                'sessions_count' => $sessionsCount,
            ]
        );
    }

    /**
     * Log suspicious login attempt.
     */
    public function logSuspiciousLoginAttempt(Model $user, string $reason): AuditLog
    {
        return $this->log(
            'suspicious_login_attempt',
            $user,
            "Suspicious login attempt detected for user: {$user->name} ({$user->email}) - Reason: {$reason}",
            null,
            null,
            [
                'reason' => $reason,
                'security_level' => 'high',
            ]
        );
    }

    /**
     * Log password changed.
     */
    public function logPasswordChanged(Model $user, bool $forcedReset = false): AuditLog
    {
        $description = $forcedReset
            ? "Password reset (forced) for user: {$user->name} ({$user->email})"
            : "Password changed for user: {$user->name} ({$user->email})";

        return $this->log(
            'password_changed',
            $user,
            $description,
            null,
            null,
            [
                'forced_reset' => $forcedReset,
            ]
        );
    }

    /**
     * Generate description from action and model.
     */
    protected function generateDescription(string $action, ?Model $model): string
    {
        if (! $model) {
            return ucfirst(str_replace('_', ' ', $action));
        }

        $type = class_basename($model);
        $identifier = $model->name ?? $model->email ?? $model->id;

        return ucfirst(str_replace('_', ' ', $action))." {$type}: {$identifier}";
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
