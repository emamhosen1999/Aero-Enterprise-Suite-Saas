<?php

declare(strict_types=1);

namespace Aero\Platform\Services;

use Aero\Platform\Contracts\AbstractPlatformWidget;
use Aero\Platform\Contracts\PlatformWidgetCategory;
use Illuminate\Support\Collection;

/**
 * Platform Widget Registry
 *
 * Manages platform admin dashboard widgets independently from Core.
 * Platform widgets are for the landlord/admin panel only.
 *
 * This registry is SEPARATE from Core's DashboardWidgetRegistry which
 * handles tenant-facing dashboard widgets.
 */
class PlatformWidgetRegistry
{
    /**
     * Registered platform widgets.
     *
     * @var array<string, AbstractPlatformWidget>
     */
    protected array $widgets = [];

    /**
     * Register a platform widget.
     */
    public function register(AbstractPlatformWidget $widget): self
    {
        $this->widgets[$widget->getKey()] = $widget;

        return $this;
    }

    /**
     * Register multiple widgets at once.
     *
     * @param  AbstractPlatformWidget[]  $widgets
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
     */
    public function unregister(string $key): self
    {
        unset($this->widgets[$key]);

        return $this;
    }

    /**
     * Check if a widget is registered.
     */
    public function has(string $key): bool
    {
        return isset($this->widgets[$key]);
    }

    /**
     * Get a specific widget by key.
     */
    public function get(string $key): ?AbstractPlatformWidget
    {
        return $this->widgets[$key] ?? null;
    }

    /**
     * Get all registered and enabled widgets.
     *
     * @return Collection<AbstractPlatformWidget>
     */
    public function getWidgets(): Collection
    {
        return collect($this->widgets)
            ->filter(fn (AbstractPlatformWidget $widget) => $widget->isEnabled())
            ->sortBy(fn (AbstractPlatformWidget $widget) => $widget->getOrder());
    }

    /**
     * Get widgets grouped by position.
     *
     * @return Collection<string, Collection<AbstractPlatformWidget>>
     */
    public function getWidgetsByPosition(): Collection
    {
        return $this->getWidgets()->groupBy(fn (AbstractPlatformWidget $widget) => $widget->getPosition());
    }

    /**
     * Get widgets by category.
     *
     * @return Collection<AbstractPlatformWidget>
     */
    public function getWidgetsByCategory(PlatformWidgetCategory $category): Collection
    {
        return $this->getWidgets()->filter(fn (AbstractPlatformWidget $widget) => $widget->getCategory() === $category);
    }

    /**
     * Get all widgets for a specific position.
     *
     * @return Collection<AbstractPlatformWidget>
     */
    public function getWidgetsForPosition(string $position): Collection
    {
        return $this->getWidgets()->filter(fn (AbstractPlatformWidget $widget) => $widget->getPosition() === $position);
    }

    /**
     * Get all registered widget keys.
     *
     * @return array<string>
     */
    public function keys(): array
    {
        return array_keys($this->widgets);
    }

    /**
     * Get count of registered widgets.
     */
    public function count(): int
    {
        return count($this->widgets);
    }

    /**
     * Get widgets formatted for frontend consumption.
     *
     * @return array<array<string, mixed>>
     */
    public function getWidgetsForFrontend(): array
    {
        return $this->getWidgets()
            ->map(fn (AbstractPlatformWidget $widget) => $widget->toArray())
            ->values()
            ->toArray();
    }
}
