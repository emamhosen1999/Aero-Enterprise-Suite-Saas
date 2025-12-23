<?php

declare(strict_types=1);

namespace Aero\Core\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Aero\Core\Contracts\CoreWidgetCategory;
use Aero\Core\Services\ModuleRegistry;
use Illuminate\Support\Facades\App;

/**
 * Active Modules Widget for Core Dashboard
 *
 * Shows the modules available to the current user/tenant.
 * This is a DISPLAY widget - informational navigation.
 *
 * Appears on: Core Dashboard (/dashboard)
 */
class ActiveModulesWidget extends AbstractDashboardWidget
{
    protected string $position = 'sidebar';
    protected int $order = 10;
    protected int|string $span = 1;
    protected CoreWidgetCategory $category = CoreWidgetCategory::DISPLAY;
    protected array $requiredPermissions = [];

    public function getKey(): string
    {
        return 'core.active_modules';
    }

    public function getComponent(): string
    {
        return 'Widgets/Core/ActiveModules';
    }

    public function getTitle(): string
    {
        return 'Active Modules';
    }

    public function getDescription(): string
    {
        return 'Your available modules';
    }

    public function getModuleCode(): string
    {
        return 'core';
    }

    /**
     * Active modules widget is always enabled.
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
        $user = auth()->user();
        $modules = [];

        // Get registered modules from ModuleRegistry
        if (App::bound(ModuleRegistry::class)) {
            $registry = App::make(ModuleRegistry::class);
            $registeredModules = $registry->all();

            foreach ($registeredModules as $code => $moduleInfo) {
                // Check if user has access to this module
                if ($user && $this->userCanAccessModule($user, $code)) {
                    $modules[] = [
                        'code' => $code,
                        'name' => $moduleInfo['name'] ?? ucfirst($code),
                        'icon' => $moduleInfo['icon'] ?? 'CubeIcon',
                        'route' => $moduleInfo['route'] ?? "{$code}.index",
                        'description' => $moduleInfo['description'] ?? '',
                    ];
                }
            }
        }

        // Fallback: hardcoded core modules if registry is empty
        if (empty($modules)) {
            $modules = [
                [
                    'code' => 'dashboard',
                    'name' => 'Dashboard',
                    'icon' => 'HomeIcon',
                    'route' => 'dashboard',
                    'description' => 'Main dashboard',
                ],
                [
                    'code' => 'users',
                    'name' => 'Users',
                    'icon' => 'UsersIcon',
                    'route' => 'users.index',
                    'description' => 'User management',
                ],
            ];
        }

        return [
            'modules' => $modules,
            'totalModules' => count($modules),
        ];
    }

    /**
     * Check if user can access a module.
     */
    protected function userCanAccessModule(mixed $user, string $moduleCode): bool
    {
        // Core modules are always accessible
        $coreModules = ['dashboard', 'core', 'settings', 'profile'];
        if (in_array($moduleCode, $coreModules)) {
            return true;
        }

        // Check module permission
        return $user->can("module.{$moduleCode}") ||
               $user->can("{$moduleCode}.view") ||
               $user->hasRole('super-admin');
    }
}
