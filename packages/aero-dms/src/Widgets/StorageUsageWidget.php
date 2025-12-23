<?php

declare(strict_types=1);

namespace Aero\DMS\Widgets;

use Aero\Core\Contracts\DashboardWidgetInterface;

/**
 * Storage Usage Widget
 *
 * Displays storage usage statistics and quota information.
 */
class StorageUsageWidget implements DashboardWidgetInterface
{
    public function getKey(): string
    {
        return 'dms.storage_usage';
    }

    public function getTitle(): string
    {
        return 'Storage Usage';
    }

    public function getDescription(): string
    {
        return 'Document storage usage and quota';
    }

    public function getModule(): string
    {
        return 'dms';
    }

    public function getCategory(): string
    {
        return 'stats';
    }

    public function getPosition(): string
    {
        return 'stats_row';
    }

    public function getComponent(): string
    {
        return 'Widgets/DMS/StorageUsageWidget';
    }

    public function getPermissions(): array
    {
        return ['dms.view'];
    }

    public function getData(): array
    {
        // In production, calculate from actual storage
        return [
            'used_bytes' => 0,
            'quota_bytes' => 10 * 1024 * 1024 * 1024, // 10GB default
            'used_formatted' => '0 MB',
            'quota_formatted' => '10 GB',
            'percentage' => 0,
            'document_count' => 0,
            'folder_count' => 0,
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
        return 90;
    }
}
