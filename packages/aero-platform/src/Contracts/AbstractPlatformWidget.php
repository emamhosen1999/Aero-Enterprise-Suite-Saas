<?php

declare(strict_types=1);

namespace Aero\Platform\Contracts;

/**
 * Abstract Platform Widget
 *
 * Base class for Platform Admin Dashboard widgets.
 * Independent from Core's widget system.
 */
abstract class AbstractPlatformWidget
{
    protected string $position = 'main_left';

    protected int $order = 50;

    protected int|string $span = 1;

    protected bool $lazy = false;

    protected array $requiredPermissions = [];

    protected PlatformWidgetCategory $category = PlatformWidgetCategory::SUMMARY;

    /**
     * Get unique widget key.
     */
    abstract public function getKey(): string;

    /**
     * Get React component path.
     */
    abstract public function getComponent(): string;

    /**
     * Get widget title.
     */
    abstract public function getTitle(): string;

    /**
     * Get widget description.
     */
    public function getDescription(): string
    {
        return '';
    }

    /**
     * Get module code this widget belongs to.
     */
    public function getModuleCode(): string
    {
        return 'platform';
    }

    /**
     * Get widget category.
     */
    public function getCategory(): PlatformWidgetCategory
    {
        return $this->category;
    }

    /**
     * Get widget data for frontend.
     *
     * @return array<string, mixed>
     */
    abstract public function getData(): array;

    /**
     * Get dashboard position.
     */
    public function getPosition(): string
    {
        return $this->position;
    }

    /**
     * Get render order.
     */
    public function getOrder(): int
    {
        return $this->order;
    }

    /**
     * Get column span.
     */
    public function getSpan(): int|string
    {
        return $this->span;
    }

    /**
     * Whether widget should lazy load.
     */
    public function isLazy(): bool
    {
        return $this->lazy;
    }

    /**
     * Get required permissions.
     *
     * @return array<string>
     */
    public function getRequiredPermissions(): array
    {
        return $this->requiredPermissions;
    }

    /**
     * Check if user can view this widget.
     */
    public function canView(?object $user = null): bool
    {
        if (empty($this->requiredPermissions)) {
            return true;
        }

        if (! $user) {
            return false;
        }

        foreach ($this->requiredPermissions as $permission) {
            if (method_exists($user, 'can') && $user->can($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Convert widget to array for frontend.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'key' => $this->getKey(),
            'component' => $this->getComponent(),
            'title' => $this->getTitle(),
            'description' => $this->getDescription(),
            'module' => $this->getModuleCode(),
            'category' => $this->getCategory()->value,
            'position' => $this->getPosition(),
            'order' => $this->getOrder(),
            'span' => $this->getSpan(),
            'lazy' => $this->isLazy(),
            'data' => $this->getData(),
        ];
    }
}
