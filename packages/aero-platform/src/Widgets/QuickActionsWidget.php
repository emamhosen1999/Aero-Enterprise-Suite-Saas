<?php

declare(strict_types=1);

namespace Aero\Platform\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Aero\Core\Contracts\CoreWidgetCategory;

/**
 * Quick Actions Widget for Admin Dashboard
 *
 * Displays common administrative actions for quick access.
 *
 * This is an ACTION widget - provides quick navigation.
 */
class QuickActionsWidget extends AbstractDashboardWidget
{
    protected string $position = 'main_left';

    protected int $order = 20;

    protected int|string $span = 2;

    protected CoreWidgetCategory $category = CoreWidgetCategory::ACTION;

    protected array $requiredPermissions = [];

    public function getKey(): string
    {
        return 'platform.quick_actions';
    }

    public function getComponent(): string
    {
        return 'Widgets/Platform/QuickActionsWidget';
    }

    public function getTitle(): string
    {
        return 'Quick Actions';
    }

    public function getDescription(): string
    {
        return 'Common administrative actions';
    }

    public function getModuleCode(): string
    {
        return 'platform';
    }

    /**
     * Widget is always enabled for platform admins.
     */
    public function isEnabled(): bool
    {
        return true;
    }

    /**
     * Get widget data for frontend.
     */
    public function getData(): array
    {
        return [
            'actions' => [
                [
                    'label' => 'Create Tenant',
                    'icon' => 'BuildingOffice2Icon',
                    'route' => 'admin.tenants.create',
                    'color' => 'primary',
                ],
                [
                    'label' => 'Manage Plans',
                    'icon' => 'CreditCardIcon',
                    'route' => 'admin.plans.index',
                    'color' => 'success',
                ],
                [
                    'label' => 'View Subscriptions',
                    'icon' => 'BanknotesIcon',
                    'route' => 'admin.subscriptions.index',
                    'color' => 'warning',
                ],
                [
                    'label' => 'System Logs',
                    'icon' => 'CommandLineIcon',
                    'route' => 'admin.logs.index',
                    'color' => 'secondary',
                ],
                [
                    'label' => 'Platform Settings',
                    'icon' => 'Cog6ToothIcon',
                    'route' => 'admin.settings.index',
                    'color' => 'default',
                ],
                [
                    'label' => 'Analytics',
                    'icon' => 'ChartBarIcon',
                    'route' => 'admin.analytics.index',
                    'color' => 'primary',
                ],
            ],
        ];
    }
}
