<?php

declare(strict_types=1);

namespace Aero\DMS\Widgets;

use Aero\Core\Contracts\DashboardWidgetInterface;

/**
 * Recent Documents Widget
 *
 * Displays recently uploaded or modified documents for the current user.
 */
class RecentDocumentsWidget implements DashboardWidgetInterface
{
    public function getKey(): string
    {
        return 'dms.recent_documents';
    }

    public function getTitle(): string
    {
        return 'Recent Documents';
    }

    public function getDescription(): string
    {
        return 'Recently uploaded or modified documents';
    }

    public function getModule(): string
    {
        return 'dms';
    }

    public function getCategory(): string
    {
        return 'activity'; // activity, stats, action, alert
    }

    public function getPosition(): string
    {
        return 'main_left'; // welcome, stats_row, main_left, main_right, sidebar, full_width
    }

    public function getComponent(): string
    {
        return 'Widgets/DMS/RecentDocumentsWidget';
    }

    public function getPermissions(): array
    {
        return ['dms.view'];
    }

    public function getData(): array
    {
        // Get recent documents for the current user
        $user = auth()->user();
        
        if (!$user) {
            return [
                'documents' => [],
                'total' => 0,
            ];
        }

        // In production, query from Document model
        // For now, return structure
        return [
            'documents' => [],
            'total' => 0,
            'show_more_url' => route('dms.documents', [], false),
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
        return 100;
    }
}
