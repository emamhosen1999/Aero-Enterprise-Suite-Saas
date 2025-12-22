<?php

namespace Aero\Core\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Aero\Core\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Pending Actions Widget
 *
 * Displays items that require attention.
 */
class PendingActionsWidget extends AbstractDashboardWidget
{
    protected string $position = 'sidebar';

    protected int $order = 10;

    protected bool $lazy = false;

    public function getKey(): string
    {
        return 'core_pending_actions';
    }

    public function getComponent(): string
    {
        return 'Core/PendingActions';
    }

    public function getTitle(): string
    {
        return 'Pending Actions';
    }

    public function getDescription(): string
    {
        return 'Items needing attention';
    }

    public function getData(): array
    {
        return $this->safeResolve(function () {
            $pendingActions = [];

            // Pending user invitations
            if (Schema::hasTable('user_invitations')) {
                $pendingInvitations = DB::table('user_invitations')
                    ->whereNull('accepted_at')
                    ->where('expires_at', '>', now())
                    ->count();
                if ($pendingInvitations > 0) {
                    $pendingActions[] = [
                        'type' => 'invitation',
                        'icon' => 'EnvelopeIcon',
                        'count' => $pendingInvitations,
                        'label' => $pendingInvitations === 1 ? 'pending invitation' : 'pending invitations',
                        'route' => 'core.users.invitations',
                        'priority' => 'info',
                    ];
                }
            }

            // Users pending approval
            $pendingApproval = User::where('is_active', false)
                ->whereNull('email_verified_at')
                ->count();
            if ($pendingApproval > 0) {
                $pendingActions[] = [
                    'type' => 'approval',
                    'icon' => 'UserPlusIcon',
                    'count' => $pendingApproval,
                    'label' => $pendingApproval === 1 ? 'user pending approval' : 'users pending approval',
                    'route' => 'core.users.index',
                    'priority' => 'warning',
                ];
            }

            // Failed login attempts (last 24 hours)
            if (Schema::hasTable('failed_login_attempts')) {
                $failedLogins = DB::table('failed_login_attempts')
                    ->where('created_at', '>', now()->subHours(24))
                    ->count();
                if ($failedLogins > 5) {
                    $pendingActions[] = [
                        'type' => 'security',
                        'icon' => 'ShieldExclamationIcon',
                        'count' => $failedLogins,
                        'label' => 'failed login attempts (24h)',
                        'route' => 'core.audit-logs.index',
                        'priority' => 'danger',
                    ];
                }
            }

            return ['actions' => $pendingActions];
        }, ['actions' => []]);
    }
}
