<?php

namespace Aero\Core\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Illuminate\Support\Facades\Auth;

/**
 * Welcome Widget
 *
 * Displays personalized greeting with user info.
 */
class WelcomeWidget extends AbstractDashboardWidget
{
    protected string $position = 'welcome';

    protected int $order = 1;

    protected bool $lazy = false;

    public function getKey(): string
    {
        return 'core_welcome';
    }

    public function getComponent(): string
    {
        return 'Core/WelcomeCard';
    }

    public function getTitle(): string
    {
        return 'Welcome';
    }

    public function getDescription(): string
    {
        return 'Personalized welcome message';
    }

    public function getData(): array
    {
        return $this->safeResolve(function () {
            $user = Auth::user();

            return [
                'userName' => $user?->name ?? 'User',
                'greeting' => $this->getGreeting(),
                'currentDate' => now()->format('F j, Y'),
                'lastLogin' => $user?->last_login_at
                    ? \Carbon\Carbon::parse($user->last_login_at)->diffForHumans()
                    : null,
            ];
        }, ['userName' => 'User', 'greeting' => 'Welcome']);
    }

    protected function getGreeting(): string
    {
        $hour = now()->hour;
        if ($hour < 12) {
            return 'Good morning';
        } elseif ($hour < 17) {
            return 'Good afternoon';
        }

        return 'Good evening';
    }
}
