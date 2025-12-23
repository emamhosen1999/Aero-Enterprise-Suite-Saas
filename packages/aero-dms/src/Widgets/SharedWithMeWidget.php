<?php

declare(strict_types=1);

namespace Aero\DMS\Widgets;

use Aero\Core\Contracts\DashboardWidgetInterface;

/**
 * Shared With Me Widget
 *
 * Displays documents that have been shared with the current user.
 */
class SharedWithMeWidget implements DashboardWidgetInterface
{
    public function getKey(): string
    {
        return 'dms.shared_with_me';
    }

    public function getTitle(): string
    {
        return 'Shared With Me';
    }

    public function getDescription(): string
    {
        return 'Documents shared with you by others';
    }

    public function getModule(): string
    {
        return 'dms';
    }

    public function getCategory(): string
    {
        return 'activity';
    }

    public function getPosition(): string
    {
        return 'sidebar';
    }

    public function getComponent(): string
    {
        return 'Widgets/DMS/SharedWithMeWidget';
    }

    public function getPermissions(): array
    {
        return ['dms.view'];
    }

    public function getData(): array
    {
        $user = auth()->user();
        
        if (!$user) {
            return [
                'documents' => [],
                'count' => 0,
            ];
        }

        // In production, query from DocumentShare model
        return [
            'documents' => [],
            'count' => 0,
            'view_all_url' => route('dms.shared', [], false),
        ];
    }

    public function getProps(): array
    {
        return array_merge($this->getData(), [
            'title' => $this->getTitle(),
            'limit' => 5,
        ]);
    }

    public function isEnabled(): bool
    {
        return true;
    }

    public function getPriority(): int
    {
        return 70;
    }
}
