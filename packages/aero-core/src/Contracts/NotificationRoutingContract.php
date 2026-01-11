<?php

declare(strict_types=1);

namespace Aero\Core\Contracts;

use Illuminate\Support\Collection;

/**
 * Notification Routing Contract
 *
 * Defines HRMAC-aware notification recipient resolution.
 * Recipients are determined by module/submodule/component/action access,
 * NOT by hardcoded role names.
 */
interface NotificationRoutingContract
{
    /**
     * Get users who should receive notifications for a specific event.
     *
     * @param string $moduleCode Module code (e.g., 'hrm')
     * @param string $subModuleCode Sub-module code (e.g., 'leaves')
     * @param string|null $componentCode Component code (e.g., 'leave-requests')
     * @param string|null $actionCode Action code (e.g., 'approve')
     * @param array $context Additional context for scoping (e.g., department_id, manager_id)
     * @return Collection<UserContract>
     */
    public function getRecipients(
        string $moduleCode,
        string $subModuleCode,
        ?string $componentCode = null,
        ?string $actionCode = null,
        array $context = []
    ): Collection;

    /**
     * Get recipients filtered by access scope.
     *
     * @param string $moduleCode
     * @param string $subModuleCode
     * @param string $scope 'all', 'own', 'team', 'department'
     * @param array $context Must include relevant IDs for scope filtering
     * @return Collection<UserContract>
     */
    public function getRecipientsByScope(
        string $moduleCode,
        string $subModuleCode,
        string $scope,
        array $context
    ): Collection;

    /**
     * Check if a specific user should receive notification for an event.
     */
    public function shouldNotify(
        int $userId,
        string $moduleCode,
        string $subModuleCode,
        ?string $componentCode = null,
        ?string $actionCode = null
    ): bool;
}
