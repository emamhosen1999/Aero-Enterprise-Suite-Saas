<?php

declare(strict_types=1);

namespace Aero\DMS\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Aero\Core\Contracts\CoreWidgetCategory;

/**
 * Recent Documents Widget
 *
 * Displays recently uploaded or modified documents for the current user.
 */
class RecentDocumentsWidget extends AbstractDashboardWidget
{
    protected string $position = 'main_left';
    protected int $order = 20;
    protected int|string $span = 1;
    protected array $requiredPermissions = ['dms.view'];

    public function getCategory(): CoreWidgetCategory
    {
        return CoreWidgetCategory::ACTIVITY;
    }

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

    public function getModuleCode(): string
    {
        return 'dms';
    }

    public function getComponent(): string
    {
        return 'Widgets/DMS/RecentDocumentsWidget';
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
}
