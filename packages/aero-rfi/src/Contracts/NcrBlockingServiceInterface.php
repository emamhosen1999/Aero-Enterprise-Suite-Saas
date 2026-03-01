<?php

declare(strict_types=1);

namespace Aero\Rfi\Contracts;

/**
 * NCR Blocking Service Interface
 *
 * Local interface for NCR blocking functionality.
 * This allows RFI to work independently when Quality package is not installed.
 * When Quality package IS installed, its implementation takes precedence.
 */
interface NcrBlockingServiceInterface
{
    /**
     * Get NCRs that block work in a given chainage range.
     *
     * @param  float  $startChainage  Start chainage in meters
     * @param  float  $endChainage  End chainage in meters
     * @return array Array of NCR data that blocks the range
     */
    public function getBlockingNcrsInRange(int $projectId, float $startChainage, float $endChainage): array;

    /**
     * Check if there are any blocking NCRs in a chainage range.
     */
    public function hasBlockingNcrs(int $projectId, float $startChainage, float $endChainage): bool;
}
