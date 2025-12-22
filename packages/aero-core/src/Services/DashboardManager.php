<?php

namespace Aero\Core\Services;

use Aero\Core\Contracts\DashboardWidget;
use Illuminate\Support\Collection;
use Inertia\Inertia;

/**
 * Dashboard Manager Service
 *
 * The "Power Strip" for dashboard widgets.
 *
 * - Core module creates and binds this as a Singleton
 * - Other modules inject this and register their widgets in boot()
 * - Dashboard Controller asks this for the compiled widget list
 *
 * This ensures loose coupling: the Dashboard knows nothing about
 * HRM, Finance, or any other module's internal structure.
 */
class DashboardManager
{
    /**
     * Registered widgets from all modules.
     *
     * @var DashboardWidget[]
     */
    protected array $widgets = [];

    /**
     * Layout position definitions.
     */
    protected array $positions = [
        'stats_row' => [
            'label' => 'Stats Row',
            'gridClass' => 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        ],
        'main_left' => [
            'label' => 'Main Content (Left)',
            'gridClass' => 'lg:col-span-2',
        ],
        'main_right' => [
            'label' => 'Main Content (Right)',
            'gridClass' => 'lg:col-span-1',
        ],
        'sidebar' => [
            'label' => 'Sidebar',
            'gridClass' => 'space-y-6',
        ],
        'full_width' => [
            'label' => 'Full Width',
            'gridClass' => 'col-span-full',
        ],
    ];

    /**
     * Register a widget.
     *
     * Modules call this in their ServiceProvider boot() method.
     */
    public function register(DashboardWidget $widget): self
    {
        $this->widgets[] = $widget;

        return $this;
    }

    /**
     * Register multiple widgets at once.
     *
     * @param  DashboardWidget[]  $widgets
     */
    public function registerMany(array $widgets): self
    {
        foreach ($widgets as $widget) {
            $this->register($widget);
        }

        return $this;
    }

    /**
     * Get all registered widgets.
     *
     * @return Collection<DashboardWidget>
     */
    public function getWidgets(): Collection
    {
        return collect($this->widgets)
            ->filter(fn (DashboardWidget $w) => $w->isEnabled())
            ->sortBy(fn (DashboardWidget $w) => $w->getOrder());
    }

    /**
     * Get widgets grouped by position for the frontend.
     *
     * This is the main method called by the DashboardController.
     * It returns a structure that Inertia can render dynamically.
     */
    public function getWidgetsForFrontend(): array
    {
        $grouped = [];

        foreach ($this->getWidgets() as $widget) {
            $position = $widget->getPosition();

            $widgetData = [
                'key' => $widget->getKey(),
                'component' => $widget->getComponent(),
                'title' => $widget->getTitle(),
                'description' => $widget->getDescription(),
                'span' => $widget->getSpan(),
                'lazy' => $widget->isLazy(),
            ];

            // If lazy, wrap data in Inertia::lazy() for deferred loading
            if ($widget->isLazy()) {
                $widgetData['data'] = Inertia::lazy(fn () => $widget->getData());
            } else {
                $widgetData['data'] = $widget->getData();
            }

            $grouped[$position][] = $widgetData;
        }

        return $grouped;
    }

    /**
     * Get the layout configuration for the frontend.
     */
    public function getLayoutConfig(): array
    {
        return $this->positions;
    }

    /**
     * Check if any widgets are registered for a position.
     */
    public function hasWidgetsAt(string $position): bool
    {
        return collect($this->widgets)
            ->filter(fn (DashboardWidget $w) => $w->isEnabled() && $w->getPosition() === $position)
            ->isNotEmpty();
    }

    /**
     * Get count of registered widgets.
     */
    public function count(): int
    {
        return count($this->widgets);
    }
}
