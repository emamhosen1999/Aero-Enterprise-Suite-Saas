<?php

declare(strict_types=1);

namespace Aero\Core\Contracts;

/**
 * Interface for modules to provide dashboard summary data.
 *
 * Each package can implement this to supply cross-module
 * summary stats for the admin dashboard.
 */
interface ModuleSummaryProvider
{
    /**
     * Get a summary array for the admin dashboard.
     *
     * @return array{key: string, label: string, icon: string, stats: array<string, mixed>, alerts: array<int, string>, pendingCount: int}
     */
    public function getDashboardSummary(): array;
}
