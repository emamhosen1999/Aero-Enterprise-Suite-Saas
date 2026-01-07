<?php

namespace Aero\Quality\Contracts;

use Illuminate\Support\Collection;

/**
 * Abstraction for querying NCRs that block RFIs.
 */
interface NcrBlockingServiceInterface
{
    /**
     * Get open NCRs in a project that overlap a chainage range.
     */
    public function getOpenNcrsAtChainage(int $projectId, float $startM, float $endM): Collection;

    /**
     * Get blocking NCRs (all layers or specific layer) for a chainage range.
     */
    public function getBlockingNcrs(int $projectId, int $layerId, float $startM, float $endM): Collection;
}
