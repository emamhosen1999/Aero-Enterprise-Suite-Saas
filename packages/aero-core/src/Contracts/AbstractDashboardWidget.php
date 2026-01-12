<?php

declare(strict_types=1);

namespace Aero\Core\Contracts;

/**
 * Abstract Dashboard Widget
 *
 * Base class for Dashboard widgets with sensible defaults.
 * Modules extend this to create widgets for any dashboard.
 *
 * Dashboard Keys:
 * - 'core' - Core Dashboard (/dashboard)
 * - 'hrm' - HRM Manager Dashboard (/hrm/dashboard)
 * - 'hrm.employee' - Employee Self-Service Dashboard (/hrm/employee/dashboard)
 * - 'project' - Project Dashboard (/project/dashboard)
 * - 'quality' - Quality Dashboard (/quality/dashboard)
 * - 'dms' - Document Management Dashboard (/dms/dashboard)
 * - 'finance' - Finance Dashboard (/finance/dashboard)
 * - 'rfi' - RFI Dashboard (/rfi/dashboard)
 * - 'compliance' - Compliance Dashboard (/compliance/dashboard)
 */
abstract class AbstractDashboardWidget implements DashboardWidgetInterface
{
    protected string $position = 'main_left';
    protected int $order = 50;
    protected int|string $span = 1;
    protected bool $lazy = false;
    protected array $requiredPermissions = [];
    protected CoreWidgetCategory $category = CoreWidgetCategory::SUMMARY;

    /**
     * Dashboards this widget should appear on.
     * Override in subclass to target specific dashboards.
     *
     * @var array<string>
     */
    protected array $dashboards = ['core'];

    /**
     * Get widget category (override in subclass).
     */
    public function getCategory(): CoreWidgetCategory
    {
        return $this->category;
    }

    /**
     * Get widget description (override in subclass).
     */
    public function getDescription(): string
    {
        return '';
    }

    /**
     * Get dashboard position.
     */
    public function getPosition(): string
    {
        return $this->position;
    }

    /**
     * Get sort order.
     */
    public function getOrder(): int
    {
        return $this->order;
    }

    /**
     * Get grid span.
     */
    public function getSpan(): int|string
    {
        return $this->span;
    }

    /**
     * Whether to lazy load.
     */
    public function isLazy(): bool
    {
        return $this->lazy;
    }

    /**
     * Get required permissions.
     */
    public function getRequiredPermissions(): array
    {
        return $this->requiredPermissions;
    }

    /**
     * Get the dashboards this widget should appear on.
     *
     * @return array<string> Dashboard keys
     */
    public function getDashboards(): array
    {
        return $this->dashboards;
    }

    /**
     * Check if widget is enabled.
     * Override for custom logic, or use permissions.
     */
    public function isEnabled(): bool
    {
        // Check if module is active
        if (!$this->isModuleActive()) {
            return false;
        }

        // Check permissions if any required
        if (!empty($this->requiredPermissions)) {
            return $this->userHasAnyPermission($this->requiredPermissions);
        }

        return true;
    }

    /**
     * Check if the module is active.
     */
    protected function isModuleActive(): bool
    {
        $moduleCode = $this->getModuleCode();

        // Core is always active
        if ($moduleCode === 'core') {
            return true;
        }

        // Check module status from database or config
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('modules')) {
                return \Illuminate\Support\Facades\DB::table('modules')
                    ->where('code', $moduleCode)
                    ->where('is_active', true)
                    ->exists();
            }
        } catch (\Exception $e) {
            // If we can't check, assume active
        }

        return true;
    }

    /**
     * Check if user has any of the specified permissions.
     */
    protected function userHasAnyPermission(array $permissions): bool
    {
        $user = auth()->user();

        if (!$user) {
            return false;
        }

        foreach ($permissions as $permission) {
            if ($user->can($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user has all specified permissions.
     */
    protected function userHasAllPermissions(array $permissions): bool
    {
        $user = auth()->user();

        if (!$user) {
            return false;
        }

        foreach ($permissions as $permission) {
            if (!$user->can($permission)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Safely resolve data with fallback.
     */
    protected function safeResolve(callable $callback, array $fallback = []): array
    {
        try {
            return $callback();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Widget data error: ' . $e->getMessage(), [
                'widget' => $this->getKey(),
            ]);
            return $fallback;
        }
    }
}
