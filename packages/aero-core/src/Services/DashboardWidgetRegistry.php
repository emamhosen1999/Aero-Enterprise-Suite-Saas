<?php

declare(strict_types=1);

namespace Aero\Core\Services;

use Aero\Core\Contracts\DashboardWidgetInterface;
use Illuminate\Support\Collection;
use Inertia\Inertia;

/**
 * Dashboard Widget Registry
 *
 * Central registry where all modules register their dashboard widgets.
 * The Dashboard Controller uses this to collect and render widgets.
 *
 * ARCHITECTURE:
 * -------------
 * 1. Core binds this as a Singleton in ServiceProvider
 * 2. Modules inject this and register widgets in their boot() method
 * 3. Dashboard Controller calls getWidgetsForFrontend() to get all widgets
 * 4. Frontend renders widgets dynamically with lazy loading support
 *
 * EXAMPLE REGISTRATION (in HRM ServiceProvider):
 * ```php
 * public function boot(): void
 * {
 *     $registry = $this->app->make(DashboardWidgetRegistry::class);
 *     $registry->register(new PunchStatusWidget());
 *     $registry->register(new LeaveBalanceWidget());
 *     $registry->register(new TeamAttendanceWidget());
 * }
 * ```
 */
class DashboardWidgetRegistry
{
    /**
     * Registered widgets from all modules.
     *
     * @var DashboardWidgetInterface[]
     */
    protected array $widgets = [];

    /**
     * Layout position definitions with grid classes.
     */
    protected array $positions = [
        'welcome' => [
            'label' => 'Welcome Header',
            'gridClass' => 'col-span-full',
            'order' => 1,
        ],
        'stats_row' => [
            'label' => 'Statistics Row',
            'gridClass' => 'grid-cols-2 md:grid-cols-4',
            'order' => 2,
        ],
        'main_left' => [
            'label' => 'Main Content (Left)',
            'gridClass' => 'lg:col-span-2',
            'order' => 3,
        ],
        'main_right' => [
            'label' => 'Main Content (Right)',
            'gridClass' => 'lg:col-span-1',
            'order' => 4,
        ],
        'sidebar' => [
            'label' => 'Sidebar',
            'gridClass' => 'space-y-4',
            'order' => 5,
        ],
        'full_width' => [
            'label' => 'Full Width',
            'gridClass' => 'col-span-full',
            'order' => 6,
        ],
    ];

    /**
     * Register a widget.
     *
     * @param DashboardWidgetInterface $widget
     * @return self
     */
    public function register(DashboardWidgetInterface $widget): self
    {
        $this->widgets[$widget->getKey()] = $widget;
        return $this;
    }

    /**
     * Register multiple widgets at once.
     *
     * @param DashboardWidgetInterface[] $widgets
     * @return self
     */
    public function registerMany(array $widgets): self
    {
        foreach ($widgets as $widget) {
            $this->register($widget);
        }
        return $this;
    }

    /**
     * Unregister a widget by key.
     *
     * @param string $key
     * @return self
     */
    public function unregister(string $key): self
    {
        unset($this->widgets[$key]);
        return $this;
    }

    /**
     * Check if a widget is registered.
     *
     * @param string $key
     * @return bool
     */
    public function has(string $key): bool
    {
        return isset($this->widgets[$key]);
    }

    /**
     * Get all enabled widgets, sorted by position and order.
     *
     * @return Collection<DashboardWidgetInterface>
     */
    public function getWidgets(): Collection
    {
        return collect($this->widgets)
            ->filter(fn(DashboardWidgetInterface $widget) => $widget->isEnabled())
            ->sortBy([
                fn($a, $b) => ($this->positions[$a->getPosition()]['order'] ?? 99) <=> ($this->positions[$b->getPosition()]['order'] ?? 99),
                fn($a, $b) => $a->getOrder() <=> $b->getOrder(),
            ]);
    }

    /**
     * Get widgets grouped by position.
     *
     * @return Collection<string, Collection<DashboardWidgetInterface>>
     */
    public function getWidgetsByPosition(): Collection
    {
        return $this->getWidgets()->groupBy(fn(DashboardWidgetInterface $widget) => $widget->getPosition());
    }

    /**
     * Get widgets for a specific module.
     *
     * @param string $moduleCode
     * @return Collection<DashboardWidgetInterface>
     */
    public function getWidgetsForModule(string $moduleCode): Collection
    {
        return $this->getWidgets()->filter(fn(DashboardWidgetInterface $widget) => $widget->getModuleCode() === $moduleCode);
    }

    /**
     * Get widgets formatted for frontend rendering.
     *
     * This is the main method called by DashboardController.
     * Returns structure that React can use to dynamically render widgets.
     *
     * @return array
     */
    public function getWidgetsForFrontend(): array
    {
        $widgets = [];

        foreach ($this->getWidgets() as $widget) {
            $widgetData = [
                'key' => $widget->getKey(),
                'component' => $widget->getComponent(),
                'title' => $widget->getTitle(),
                'description' => $widget->getDescription(),
                'position' => $widget->getPosition(),
                'order' => $widget->getOrder(),
                'span' => $widget->getSpan(),
                'module' => $widget->getModuleCode(),
                'lazy' => $widget->isLazy(),
            ];

            // If lazy, wrap data in Inertia::lazy() for deferred loading
            if ($widget->isLazy()) {
                $widgetData['data'] = Inertia::lazy(fn() => $widget->getData());
            } else {
                $widgetData['data'] = $widget->getData();
            }

            $widgets[] = $widgetData;
        }

        return $widgets;
    }

    /**
     * Get the layout configuration for frontend.
     *
     * @return array
     */
    public function getLayoutConfig(): array
    {
        return $this->positions;
    }

    /**
     * Get count of all registered widgets.
     *
     * @return int
     */
    public function count(): int
    {
        return count($this->widgets);
    }

    /**
     * Get count of enabled widgets.
     *
     * @return int
     */
    public function countEnabled(): int
    {
        return $this->getWidgets()->count();
    }
}
