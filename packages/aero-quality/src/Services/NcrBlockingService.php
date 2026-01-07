<?php

namespace Aero\Quality\Services;

use Aero\Quality\Contracts\NcrBlockingServiceInterface;
use Aero\Quality\Models\NonConformanceReport;
use Illuminate\Support\Collection;

class NcrBlockingService implements NcrBlockingServiceInterface
{
    public function getOpenNcrsAtChainage(int $projectId, float $startM, float $endM): Collection
    {
        return NonConformanceReport::query()
            ->where('project_id', $projectId)
            ->whereIn('status', [
                NonConformanceReport::STATUS_OPEN,
                NonConformanceReport::STATUS_IN_PROGRESS,
            ])
            ->where(function ($q) use ($startM, $endM) {
                $q->whereBetween('start_chainage_m', [$startM, $endM])
                    ->orWhereBetween('end_chainage_m', [$startM, $endM])
                    ->orWhere(function ($q2) use ($startM, $endM) {
                        $q2->where('start_chainage_m', '<=', $startM)
                            ->where('end_chainage_m', '>=', $endM);
                    });
            })
            ->get();
    }

    public function getBlockingNcrs(int $projectId, int $layerId, float $startM, float $endM): Collection
    {
        return NonConformanceReport::query()
            ->where('project_id', $projectId)
            ->whereIn('status', [
                NonConformanceReport::STATUS_OPEN,
                NonConformanceReport::STATUS_IN_PROGRESS,
            ])
            ->where(function ($q) use ($layerId) {
                $q->where('blocks_all_layers', true)
                    ->orWhere(function ($q2) use ($layerId) {
                        $q2->where('blocks_same_layer', true)
                            ->where('work_layer_id', $layerId);
                    });
            })
            ->where(function ($q) use ($startM, $endM) {
                $q->whereBetween('start_chainage_m', [$startM, $endM])
                    ->orWhereBetween('end_chainage_m', [$startM, $endM])
                    ->orWhere(function ($q2) use ($startM, $endM) {
                        $q2->where('start_chainage_m', '<=', $startM)
                            ->where('end_chainage_m', '>=', $endM);
                    });
            })
            ->get();
    }
}
