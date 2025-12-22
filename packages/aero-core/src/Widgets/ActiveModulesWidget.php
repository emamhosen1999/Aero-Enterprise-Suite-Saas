<?php

namespace Aero\Core\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Active Modules Widget
 *
 * Displays status of available modules.
 */
class ActiveModulesWidget extends AbstractDashboardWidget
{
    protected string $position = 'main_left';

    protected int $order = 50;

    protected bool $lazy = false;

    public function getKey(): string
    {
        return 'core_active_modules';
    }

    public function getComponent(): string
    {
        return 'Core/ActiveModules';
    }

    public function getTitle(): string
    {
        return 'Available Modules';
    }

    public function getDescription(): string
    {
        return 'Module status';
    }

    public function getData(): array
    {
        return $this->safeResolve(function () {
            $allModules = [
                ['code' => 'core', 'name' => 'Core', 'icon' => 'HomeIcon', 'enabled' => true],
                ['code' => 'hrm', 'name' => 'Human Resources', 'icon' => 'UserGroupIcon', 'enabled' => false],
                ['code' => 'finance', 'name' => 'Finance', 'icon' => 'CurrencyDollarIcon', 'enabled' => false],
                ['code' => 'crm', 'name' => 'CRM', 'icon' => 'UserCircleIcon', 'enabled' => false],
                ['code' => 'project', 'name' => 'Projects', 'icon' => 'FolderIcon', 'enabled' => false],
                ['code' => 'inventory', 'name' => 'Inventory', 'icon' => 'CubeIcon', 'enabled' => false],
                ['code' => 'pos', 'name' => 'POS', 'icon' => 'ShoppingCartIcon', 'enabled' => false],
                ['code' => 'scm', 'name' => 'Supply Chain', 'icon' => 'TruckIcon', 'enabled' => false],
            ];

            // Check which modules are actually enabled from database
            if (Schema::hasTable('modules')) {
                $enabledModuleCodes = DB::table('modules')
                    ->where('is_active', true)
                    ->pluck('code')
                    ->toArray();

                foreach ($allModules as &$module) {
                    $module['enabled'] = in_array($module['code'], $enabledModuleCodes) || $module['code'] === 'core';
                }
            }

            return ['modules' => $allModules];
        }, ['modules' => []]);
    }
}
