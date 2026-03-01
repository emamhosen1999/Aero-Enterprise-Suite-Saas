<?php

declare(strict_types=1);

namespace Aero\Rfi\Services;

use Aero\Core\Support\TenantCache;
use Aero\Rfi\Models\Rfi;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

/**
 * RFI Escalation Service
 *
 * Manages automatic escalation of RFIs based on configurable rules.
 * Handles overdue RFIs, pending approvals, and priority escalation.
 *
 * Features:
 * - Configurable escalation rules per status
 * - Multi-level escalation paths
 * - Time-based triggers (overdue, SLA breach)
 * - Notification dispatch to escalation contacts
 * - Escalation history tracking
 * - Pause/resume escalation capability
 *
 * Usage:
 * ```php
 * $escalationService = app(RfiEscalationService::class);
 *
 * // Process all pending escalations (run via scheduler)
 * $escalationService->processEscalations();
 *
 * // Check if specific RFI needs escalation
 * if ($escalationService->needsEscalation($rfi)) {
 *     $escalationService->escalate($rfi);
 * }
 *
 * // Configure escalation rules
 * $escalationService->updateRules([...]);
 * ```
 */
class RfiEscalationService
{
    /**
     * Escalation levels.
     */
    public const LEVEL_NONE = 0;

    public const LEVEL_FIRST = 1;

    public const LEVEL_SECOND = 2;

    public const LEVEL_CRITICAL = 3;

    /**
     * Default escalation rules per status.
     */
    protected array $defaultRules = [
        'pending' => [
            'enabled' => true,
            'levels' => [
                1 => ['after_hours' => 24, 'notify' => ['assignee', 'supervisor']],
                2 => ['after_hours' => 48, 'notify' => ['manager', 'project_manager']],
                3 => ['after_hours' => 72, 'notify' => ['director', 'admin']],
            ],
        ],
        'in_review' => [
            'enabled' => true,
            'levels' => [
                1 => ['after_hours' => 48, 'notify' => ['reviewer', 'supervisor']],
                2 => ['after_hours' => 96, 'notify' => ['manager']],
            ],
        ],
        'awaiting_response' => [
            'enabled' => true,
            'levels' => [
                1 => ['after_hours' => 72, 'notify' => ['requester', 'assignee']],
                2 => ['after_hours' => 120, 'notify' => ['manager']],
            ],
        ],
    ];

    /**
     * Cache TTL for rules (seconds).
     */
    protected int $cacheTtl = 3600;

    /**
     * Process all RFIs that need escalation.
     * This should be run periodically via the scheduler.
     *
     * @return array Summary of escalations performed
     */
    public function processEscalations(): array
    {
        $results = [
            'processed' => 0,
            'escalated' => 0,
            'errors' => 0,
            'details' => [],
        ];

        $rfisToCheck = $this->getRfisForEscalationCheck();

        foreach ($rfisToCheck as $rfi) {
            $results['processed']++;

            try {
                if ($this->needsEscalation($rfi)) {
                    $escalationResult = $this->escalate($rfi);

                    if ($escalationResult['success']) {
                        $results['escalated']++;
                        $results['details'][] = [
                            'rfi_id' => $rfi->id,
                            'rfi_number' => $rfi->rfi_number ?? $rfi->id,
                            'new_level' => $escalationResult['level'],
                            'notified' => $escalationResult['notified'],
                        ];
                    }
                }
            } catch (\Exception $e) {
                $results['errors']++;
                Log::error("RFI escalation failed for RFI {$rfi->id}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $results;
    }

    /**
     * Check if an RFI needs escalation.
     */
    public function needsEscalation(Rfi $rfi): bool
    {
        // Check if escalation is paused for this RFI
        if ($this->isEscalationPaused($rfi)) {
            return false;
        }

        $rules = $this->getRulesForStatus($rfi->status);

        if (! $rules['enabled']) {
            return false;
        }

        $currentLevel = $this->getCurrentEscalationLevel($rfi);
        $nextLevel = $currentLevel + 1;

        // Check if there's a next level defined
        if (! isset($rules['levels'][$nextLevel])) {
            return false; // Already at max escalation
        }

        // Check if time threshold for next level is met
        $hoursOverdue = $this->getHoursInCurrentStatus($rfi);
        $requiredHours = $rules['levels'][$nextLevel]['after_hours'];

        return $hoursOverdue >= $requiredHours;
    }

    /**
     * Escalate an RFI to the next level.
     *
     * @param  string|null  $reason  Custom reason for escalation
     * @return array Result of escalation
     */
    public function escalate(Rfi $rfi, ?string $reason = null): array
    {
        $currentLevel = $this->getCurrentEscalationLevel($rfi);
        $newLevel = $currentLevel + 1;

        $rules = $this->getRulesForStatus($rfi->status);

        if (! isset($rules['levels'][$newLevel])) {
            return ['success' => false, 'reason' => 'Max escalation level reached'];
        }

        $levelConfig = $rules['levels'][$newLevel];

        // Record escalation
        $this->recordEscalation($rfi, $newLevel, $reason);

        // Send notifications
        $notified = $this->sendEscalationNotifications($rfi, $newLevel, $levelConfig['notify']);

        // Update RFI metadata
        $this->updateRfiEscalationData($rfi, $newLevel);

        Log::info("RFI {$rfi->id} escalated to level {$newLevel}", [
            'rfi_id' => $rfi->id,
            'new_level' => $newLevel,
            'notified' => $notified,
        ]);

        return [
            'success' => true,
            'level' => $newLevel,
            'notified' => $notified,
        ];
    }

    /**
     * Manually escalate an RFI (by user action).
     *
     * @param  int  $escalatedBy  User ID
     */
    public function manualEscalate(Rfi $rfi, int $toLevel, string $reason, int $escalatedBy): array
    {
        $rules = $this->getRulesForStatus($rfi->status);

        if (! isset($rules['levels'][$toLevel])) {
            return ['success' => false, 'reason' => 'Invalid escalation level'];
        }

        $levelConfig = $rules['levels'][$toLevel];

        // Record manual escalation
        $this->recordEscalation($rfi, $toLevel, $reason, $escalatedBy);

        // Send notifications
        $notified = $this->sendEscalationNotifications($rfi, $toLevel, $levelConfig['notify']);

        // Update RFI metadata
        $this->updateRfiEscalationData($rfi, $toLevel);

        return [
            'success' => true,
            'level' => $toLevel,
            'notified' => $notified,
        ];
    }

    /**
     * De-escalate an RFI (usually after resolution or response).
     */
    public function deescalate(Rfi $rfi, string $reason = 'Issue addressed'): void
    {
        $rfi->update([
            'escalation_level' => 0,
            'escalation_paused' => false,
            'last_escalation_at' => null,
        ]);

        $this->recordEscalation($rfi, 0, $reason);

        Log::info("RFI {$rfi->id} de-escalated", [
            'rfi_id' => $rfi->id,
            'reason' => $reason,
        ]);
    }

    /**
     * Pause escalation for an RFI.
     */
    public function pauseEscalation(Rfi $rfi, string $reason, ?\DateTimeInterface $until = null): void
    {
        $rfi->update([
            'escalation_paused' => true,
            'escalation_paused_until' => $until,
            'escalation_pause_reason' => $reason,
        ]);
    }

    /**
     * Resume escalation for an RFI.
     */
    public function resumeEscalation(Rfi $rfi): void
    {
        $rfi->update([
            'escalation_paused' => false,
            'escalation_paused_until' => null,
            'escalation_pause_reason' => null,
        ]);
    }

    /**
     * Get RFIs that need to be checked for escalation.
     */
    protected function getRfisForEscalationCheck(): Collection
    {
        $statuses = array_keys($this->getEscalationRules());

        return Rfi::whereIn('status', $statuses)
            ->where(function ($query) {
                $query->where('escalation_paused', false)
                    ->orWhereNull('escalation_paused')
                    ->orWhere('escalation_paused_until', '<', now());
            })
            ->get();
    }

    /**
     * Get current escalation level for an RFI.
     */
    public function getCurrentEscalationLevel(Rfi $rfi): int
    {
        return (int) ($rfi->escalation_level ?? self::LEVEL_NONE);
    }

    /**
     * Get hours since RFI entered current status.
     */
    protected function getHoursInCurrentStatus(Rfi $rfi): float
    {
        $statusChangedAt = $rfi->status_changed_at ?? $rfi->created_at;

        return now()->diffInHours($statusChangedAt, true);
    }

    /**
     * Check if escalation is paused for an RFI.
     */
    protected function isEscalationPaused(Rfi $rfi): bool
    {
        if (! ($rfi->escalation_paused ?? false)) {
            return false;
        }

        // Check if pause has expired
        if ($rfi->escalation_paused_until && now()->isAfter($rfi->escalation_paused_until)) {
            $this->resumeEscalation($rfi);

            return false;
        }

        return true;
    }

    /**
     * Get escalation rules for a status.
     */
    protected function getRulesForStatus(string $status): array
    {
        $allRules = $this->getEscalationRules();

        return $allRules[$status] ?? ['enabled' => false, 'levels' => []];
    }

    /**
     * Get all escalation rules.
     */
    public function getEscalationRules(): array
    {
        $tenant = tenant();

        if (! $tenant) {
            return $this->defaultRules;
        }

        $cacheKey = "rfi_escalation_rules:tenant:{$tenant->id}";

        return TenantCache::remember($cacheKey, $this->cacheTtl, function () use ($tenant) {
            $tenantRules = $tenant->settings['rfi_escalation_rules'] ?? [];

            return array_merge($this->defaultRules, $tenantRules);
        });
    }

    /**
     * Update escalation rules.
     */
    public function updateRules(array $rules): void
    {
        $tenant = tenant();

        if (! $tenant) {
            throw new \RuntimeException('Cannot update rules without tenant context.');
        }

        $current = $tenant->settings ?? [];
        $current['rfi_escalation_rules'] = array_merge($this->defaultRules, $rules);

        $tenant->update(['settings' => $current]);

        TenantCache::forget("rfi_escalation_rules:tenant:{$tenant->id}");
    }

    /**
     * Record escalation in history.
     */
    protected function recordEscalation(
        Rfi $rfi,
        int $level,
        ?string $reason = null,
        ?int $byUserId = null
    ): void {
        $history = $rfi->escalation_history ?? [];

        $history[] = [
            'level' => $level,
            'reason' => $reason ?? ($level === 0 ? 'De-escalated' : 'Auto-escalation'),
            'by_user_id' => $byUserId,
            'at' => now()->toDateTimeString(),
        ];

        $rfi->update(['escalation_history' => $history]);
    }

    /**
     * Update RFI escalation metadata.
     */
    protected function updateRfiEscalationData(Rfi $rfi, int $level): void
    {
        $rfi->update([
            'escalation_level' => $level,
            'last_escalation_at' => now(),
        ]);
    }

    /**
     * Send escalation notifications.
     *
     * @return array List of notified users/roles
     */
    protected function sendEscalationNotifications(Rfi $rfi, int $level, array $notifyRoles): array
    {
        $notified = [];

        foreach ($notifyRoles as $role) {
            $recipients = $this->getRecipientsForRole($rfi, $role);

            foreach ($recipients as $recipient) {
                // TODO: Send notification via NotificationService
                // Notification::send($recipient, new RfiEscalationNotification($rfi, $level));
                $notified[] = $recipient->email ?? $recipient->id;
            }
        }

        return $notified;
    }

    /**
     * Get notification recipients for a role.
     */
    protected function getRecipientsForRole(Rfi $rfi, string $role): array
    {
        switch ($role) {
            case 'assignee':
                return $rfi->assignee ? [$rfi->assignee] : [];

            case 'requester':
                return $rfi->requester ? [$rfi->requester] : [];

            case 'reviewer':
                return $rfi->reviewer ? [$rfi->reviewer] : [];

            case 'supervisor':
                $assignee = $rfi->assignee;

                return $assignee && $assignee->supervisor ? [$assignee->supervisor] : [];

            case 'manager':
            case 'project_manager':
            case 'director':
            case 'admin':
                // Get users with this role in the project/tenant
                // This would integrate with role/permission system
                return [];

            default:
                return [];
        }
    }

    /**
     * Get escalation summary for an RFI.
     */
    public function getEscalationSummary(Rfi $rfi): array
    {
        $currentLevel = $this->getCurrentEscalationLevel($rfi);
        $rules = $this->getRulesForStatus($rfi->status);

        return [
            'current_level' => $currentLevel,
            'max_level' => count($rules['levels'] ?? []),
            'is_paused' => $this->isEscalationPaused($rfi),
            'paused_until' => $rfi->escalation_paused_until,
            'pause_reason' => $rfi->escalation_pause_reason,
            'last_escalation_at' => $rfi->last_escalation_at,
            'history' => $rfi->escalation_history ?? [],
            'hours_in_status' => $this->getHoursInCurrentStatus($rfi),
            'needs_escalation' => $this->needsEscalation($rfi),
        ];
    }

    /**
     * Get all overdue RFIs grouped by escalation level.
     */
    public function getOverdueRfisByLevel(): array
    {
        $rfis = Rfi::whereNotNull('escalation_level')
            ->where('escalation_level', '>', 0)
            ->get();

        $grouped = [
            self::LEVEL_FIRST => [],
            self::LEVEL_SECOND => [],
            self::LEVEL_CRITICAL => [],
        ];

        foreach ($rfis as $rfi) {
            $level = $rfi->escalation_level;
            if (isset($grouped[$level])) {
                $grouped[$level][] = $rfi;
            }
        }

        return $grouped;
    }
}
