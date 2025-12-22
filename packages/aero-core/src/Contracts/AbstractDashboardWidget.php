<?php

namespace Aero\Core\Contracts;

/**
 * Abstract Base Widget
 *
 * Provides sensible defaults for common widget properties.
 * Modules can extend this instead of implementing the full interface.
 */
abstract class AbstractDashboardWidget implements DashboardWidget
{
    protected string $position = 'main_left';

    protected int $order = 50;

    protected bool $lazy = false;

    protected array $span = ['cols' => 1, 'rows' => 1];

    public function getPosition(): string
    {
        return $this->position;
    }

    public function getOrder(): int
    {
        return $this->order;
    }

    public function getSpan(): array
    {
        return $this->span;
    }

    public function isLazy(): bool
    {
        return $this->lazy;
    }

    public function isEnabled(): bool
    {
        return true;
    }

    public function getDescription(): string
    {
        return '';
    }

    /**
     * Safely resolve data with error handling.
     *
     * Wraps the actual data retrieval in a try/catch
     * so one failing widget doesn't crash the whole dashboard.
     */
    protected function safeResolve(callable $resolver, array $fallback = []): array
    {
        try {
            return $resolver();
        } catch (\Throwable $e) {
            report($e);

            return array_merge($fallback, [
                '_error' => true,
                '_errorMessage' => config('app.debug') ? $e->getMessage() : 'Failed to load widget data',
            ]);
        }
    }
}
