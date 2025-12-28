<?php

declare(strict_types=1);

namespace Aero\Platform\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Aero\Core\Contracts\CoreWidgetCategory;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

/**
 * Platform Welcome Widget for Admin Dashboard
 *
 * Shows personalized greeting and platform overview message.
 * This is a DISPLAY widget - informational only.
 */
class PlatformWelcomeWidget extends AbstractDashboardWidget
{
    protected string $position = 'welcome';

    protected int $order = 1;

    protected int|string $span = 'full';

    protected CoreWidgetCategory $category = CoreWidgetCategory::DISPLAY;

    protected array $requiredPermissions = [];

    public function getKey(): string
    {
        return 'platform.welcome';
    }

    public function getComponent(): string
    {
        return 'Widgets/Platform/PlatformWelcomeWidget';
    }

    public function getTitle(): string
    {
        return 'Welcome';
    }

    public function getDescription(): string
    {
        return 'Platform admin greeting';
    }

    public function getModuleCode(): string
    {
        return 'platform';
    }

    /**
     * Welcome widget is always enabled for authenticated users.
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
        $user = Auth::guard('landlord')->user();
        $now = Carbon::now();
        $hour = $now->hour;

        // Determine greeting based on time of day
        if ($hour >= 5 && $hour < 12) {
            $greeting = 'Good Morning';
        } elseif ($hour >= 12 && $hour < 17) {
            $greeting = 'Good Afternoon';
        } elseif ($hour >= 17 && $hour < 21) {
            $greeting = 'Good Evening';
        } else {
            $greeting = 'Hello';
        }

        return [
            'greeting' => $greeting,
            'userName' => $user?->name ?? 'Admin',
            'date' => $now->format('l, F j, Y'),
            'time' => $now->format('g:i A'),
            'message' => 'Platform Command Center',
            'subtitle' => 'Multi-tenant operations suite',
        ];
    }
}
