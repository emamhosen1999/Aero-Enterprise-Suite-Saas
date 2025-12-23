<?php

declare(strict_types=1);

namespace Aero\DMS\Widgets;

use Aero\Core\Contracts\DashboardWidgetInterface;

/**
 * Pending Document Approvals Widget
 *
 * Displays documents awaiting approval from the current user.
 */
class PendingApprovalsWidget implements DashboardWidgetInterface
{
    public function getKey(): string
    {
        return 'dms.pending_approvals';
    }

    public function getTitle(): string
    {
        return 'Pending Document Approvals';
    }

    public function getDescription(): string
    {
        return 'Documents awaiting your approval';
    }

    public function getModule(): string
    {
        return 'dms';
    }

    public function getCategory(): string
    {
        return 'action';
    }

    public function getPosition(): string
    {
        return 'sidebar';
    }

    public function getComponent(): string
    {
        return 'Widgets/DMS/PendingApprovalsWidget';
    }

    public function getPermissions(): array
    {
        return ['dms.approve'];
    }

    public function getData(): array
    {
        $user = auth()->user();
        
        if (!$user) {
            return [
                'approvals' => [],
                'count' => 0,
            ];
        }

        // In production, query from DocumentApproval model
        return [
            'approvals' => [],
            'count' => 0,
            'action_url' => route('dms.approvals', [], false),
        ];
    }

    public function getProps(): array
    {
        return array_merge($this->getData(), [
            'title' => $this->getTitle(),
        ]);
    }

    public function isEnabled(): bool
    {
        return true;
    }

    public function getPriority(): int
    {
        return 80;
    }
}
