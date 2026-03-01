<?php

namespace Aero\Rfi\Services;

use Aero\Rfi\Models\Rfi;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * LinearContinuityValidator - Layer Progression Rules Engine (PATENTABLE CORE)
 *
 * Enforces construction sequence integrity across linear projects.
 * Prevents upper layers from being approved before lower layers are complete.
 *
 * Example: Cannot approve "Asphalt Base Course" at Ch 100-200
 * if "Sub-base Compaction" has gaps at Ch 120-140.
 *
 * This is the MOST VALUABLE algorithm in the system for Tier-1 infrastructure.
 */
class LinearContinuityValidator
{
    /**
     * Layer hierarchy - defines which layers must be complete before others
     * Lower index = must be done first
     */
    private const LAYER_HIERARCHY = [
        1 => 'earthwork_excavation',
        2 => 'earthwork_compaction',
        3 => 'sub_base',
        4 => 'base_course',
        5 => 'binder_course',
        6 => 'wearing_course',
        7 => 'surface_treatment',
    ];

    /**
     * Layer dependency rules (some layers can be parallel)
     */
    private const DEPENDENCY_RULES = [
        'wearing_course' => ['binder_course', 'base_course', 'sub_base'],
        'binder_course' => ['base_course', 'sub_base'],
        'base_course' => ['sub_base', 'earthwork_compaction'],
        'sub_base' => ['earthwork_compaction'],
        'earthwork_compaction' => ['earthwork_excavation'],
    ];

    /**
     * Minimum coverage percentage required before next layer can begin
     */
    private const REQUIRED_COVERAGE = 95; // 95% of length must be complete

    /**
     * Validate if a new RFI can be approved based on underlying layer continuity
     *
     * @param  string  $proposedLayer  Layer being inspected (e.g., 'base_course')
     * @param  float  $startChainage  Start of the work segment
     * @param  float  $endChainage  End of the work segment
     * @param  int  $projectId  Project context
     * @return array ['can_approve' => bool, 'gaps' => array, 'coverage' => float, 'violations' => array]
     */
    public function validateLayerContinuity(
        string $proposedLayer,
        float $startChainage,
        float $endChainage,
        int $projectId
    ): array {
        // Get required predecessor layers
        $requiredLayers = self::DEPENDENCY_RULES[$proposedLayer] ?? [];

        if (empty($requiredLayers)) {
            return [
                'can_approve' => true,
                'gaps' => [],
                'coverage' => 100,
                'violations' => [],
                'message' => 'No underlying layers required for '.$proposedLayer,
            ];
        }

        $violations = [];
        $allGaps = [];

        foreach ($requiredLayers as $requiredLayer) {
            $analysis = $this->analyzeLayerCoverage(
                $requiredLayer,
                $startChainage,
                $endChainage,
                $projectId
            );

            if ($analysis['coverage'] < self::REQUIRED_COVERAGE) {
                $violations[] = [
                    'layer' => $requiredLayer,
                    'coverage' => $analysis['coverage'],
                    'required' => self::REQUIRED_COVERAGE,
                    'gap_count' => count($analysis['gaps']),
                    'gaps' => $analysis['gaps'],
                    'message' => sprintf(
                        'Layer "%s" only %.1f%% complete (requires %.0f%%)',
                        $requiredLayer,
                        $analysis['coverage'],
                        self::REQUIRED_COVERAGE
                    ),
                ];

                $allGaps = array_merge($allGaps, $analysis['gaps']);
            }
        }

        $canApprove = empty($violations);

        // Log validation for audit
        Log::channel('quality')->info('Layer continuity validation', [
            'proposed_layer' => $proposedLayer,
            'chainage_range' => "{$startChainage} - {$endChainage}",
            'project_id' => $projectId,
            'can_approve' => $canApprove,
            'violations' => count($violations),
            'required_layers' => $requiredLayers,
        ]);

        return [
            'can_approve' => $canApprove,
            'gaps' => $allGaps,
            'coverage' => $this->calculateOverallCoverage($violations),
            'violations' => $violations,
            'message' => $canApprove
                ? 'All underlying layers complete - safe to proceed'
                : 'Cannot approve: Underlying layers incomplete',
            'required_layers' => $requiredLayers,
            'blocking' => true, // This is a hard block, not a warning
        ];
    }

    /**
     * Analyze coverage of a specific layer within a chainage range
     *
     * @param  string  $layer  Layer to analyze
     * @return array ['coverage' => float, 'gaps' => array, 'completed_segments' => array]
     */
    private function analyzeLayerCoverage(
        string $layer,
        float $startChainage,
        float $endChainage,
        int $projectId
    ): array {
        // Get all approved RFIs for this layer within the chainage range
        // Uses daily_works joined with work_locations to get chainage boundaries
        $completedSegments = DB::table('daily_works')
            ->join('work_locations', 'daily_works.work_location_id', '=', 'work_locations.id')
            ->where('work_locations.project_id', $projectId)
            ->where('daily_works.layer', $layer)
            ->where('daily_works.inspection_result', Rfi::INSPECTION_APPROVED) // Only approved work counts
            ->where(function ($query) use ($startChainage, $endChainage) {
                $query->whereBetween('work_locations.start_chainage_m', [$startChainage, $endChainage])
                    ->orWhereBetween('work_locations.end_chainage_m', [$startChainage, $endChainage])
                    ->orWhere(function ($q) use ($startChainage, $endChainage) {
                        $q->where('work_locations.start_chainage_m', '<=', $startChainage)
                            ->where('work_locations.end_chainage_m', '>=', $endChainage);
                    });
            })
            ->orderBy('work_locations.start_chainage_m')
            ->select([
                'work_locations.start_chainage_m as start_chainage',
                'work_locations.end_chainage_m as end_chainage',
                'daily_works.id',
            ])
            ->get();

        if ($completedSegments->isEmpty()) {
            return [
                'coverage' => 0,
                'gaps' => [[
                    'start' => $startChainage,
                    'end' => $endChainage,
                    'length' => $endChainage - $startChainage,
                ]],
                'completed_segments' => [],
            ];
        }

        // Merge overlapping segments
        $mergedSegments = $this->mergeOverlappingSegments($completedSegments->toArray());

        // Find gaps
        $gaps = $this->findGaps($mergedSegments, $startChainage, $endChainage);

        // Calculate coverage percentage
        $totalLength = $endChainage - $startChainage;
        $coveredLength = array_reduce($mergedSegments, function ($sum, $seg) use ($startChainage, $endChainage) {
            $segStart = max($seg->start_chainage, $startChainage);
            $segEnd = min($seg->end_chainage, $endChainage);

            return $sum + ($segEnd - $segStart);
        }, 0);

        $coverage = $totalLength > 0 ? ($coveredLength / $totalLength) * 100 : 0;

        return [
            'coverage' => round($coverage, 2),
            'gaps' => $gaps,
            'completed_segments' => $mergedSegments,
            'covered_length' => round($coveredLength, 2),
            'total_length' => round($totalLength, 2),
        ];
    }

    /**
     * Merge overlapping or adjacent segments
     */
    private function mergeOverlappingSegments(array $segments): array
    {
        if (empty($segments)) {
            return [];
        }

        usort($segments, fn ($a, $b) => $a->start_chainage <=> $b->start_chainage);

        $merged = [];
        $current = (object) [
            'start_chainage' => $segments[0]->start_chainage,
            'end_chainage' => $segments[0]->end_chainage,
        ];

        foreach (array_slice($segments, 1) as $segment) {
            if ($segment->start_chainage <= $current->end_chainage + 0.01) {
                // Overlapping or adjacent - merge
                $current->end_chainage = max($current->end_chainage, $segment->end_chainage);
            } else {
                // Gap found - save current and start new
                $merged[] = $current;
                $current = (object) [
                    'start_chainage' => $segment->start_chainage,
                    'end_chainage' => $segment->end_chainage,
                ];
            }
        }

        $merged[] = $current;

        return $merged;
    }

    /**
     * Find gaps in coverage
     */
    private function findGaps(array $mergedSegments, float $rangeStart, float $rangeEnd): array
    {
        $gaps = [];
        $currentPosition = $rangeStart;

        foreach ($mergedSegments as $segment) {
            if ($segment->start_chainage > $currentPosition) {
                // Gap found
                $gaps[] = [
                    'start' => round($currentPosition, 2),
                    'end' => round($segment->start_chainage, 2),
                    'length' => round($segment->start_chainage - $currentPosition, 2),
                ];
            }
            $currentPosition = max($currentPosition, $segment->end_chainage);
        }

        // Check for gap at the end
        if ($currentPosition < $rangeEnd) {
            $gaps[] = [
                'start' => round($currentPosition, 2),
                'end' => round($rangeEnd, 2),
                'length' => round($rangeEnd - $currentPosition, 2),
            ];
        }

        return $gaps;
    }

    /**
     * Calculate overall coverage from violations array
     */
    private function calculateOverallCoverage(array $violations): float
    {
        if (empty($violations)) {
            return 100;
        }

        $totalCoverage = array_reduce($violations, fn ($sum, $v) => $sum + $v['coverage'], 0);

        return round($totalCoverage / count($violations), 2);
    }

    /**
     * Get visual representation of layer completion (for frontend map)
     *
     * @param  int  $segmentSize  Divide range into segments of this size (e.g., 10m)
     * @return array Grid of completion status
     */
    public function getLayerCompletionGrid(
        string $layer,
        float $startChainage,
        float $endChainage,
        int $projectId,
        int $segmentSize = 10
    ): array {
        $segments = [];
        $currentCh = $startChainage;

        while ($currentCh < $endChainage) {
            $segmentEnd = min($currentCh + $segmentSize, $endChainage);

            $analysis = $this->analyzeLayerCoverage(
                $layer,
                $currentCh,
                $segmentEnd,
                $projectId
            );

            $segments[] = [
                'start' => round($currentCh, 2),
                'end' => round($segmentEnd, 2),
                'coverage' => $analysis['coverage'],
                'status' => $analysis['coverage'] >= 95 ? 'complete' :
                           ($analysis['coverage'] >= 50 ? 'partial' : 'incomplete'),
            ];

            $currentCh = $segmentEnd;
        }

        return [
            'layer' => $layer,
            'range' => compact('startChainage', 'endChainage'),
            'segment_size' => $segmentSize,
            'segments' => $segments,
            'overall_coverage' => round(
                array_sum(array_column($segments, 'coverage')) / count($segments),
                2
            ),
        ];
    }

    /**
     * Find optimal start location for next work based on continuity
     * (AI-assisted work planning)
     *
     * @param  string  $layer  Layer to find next location for
     * @return array Recommended work location
     */
    public function suggestNextWorkLocation(
        string $layer,
        int $projectId,
        float $projectStartCh,
        float $projectEndCh
    ): array {
        $analysis = $this->analyzeLayerCoverage(
            $layer,
            $projectStartCh,
            $projectEndCh,
            $projectId
        );

        if (empty($analysis['gaps'])) {
            return [
                'status' => 'layer_complete',
                'message' => "Layer $layer is complete across entire project",
                'recommendation' => null,
            ];
        }

        // Sort gaps by length (prioritize largest gaps)
        usort($analysis['gaps'], fn ($a, $b) => $b['length'] <=> $a['length']);

        $priorityGap = $analysis['gaps'][0];

        return [
            'status' => 'gap_found',
            'recommended_location' => $priorityGap,
            'priority' => 'high',
            'message' => sprintf(
                'Largest gap at Ch %.2f - %.2f (%.2fm)',
                $priorityGap['start'],
                $priorityGap['end'],
                $priorityGap['length']
            ),
            'all_gaps' => $analysis['gaps'],
        ];
    }
}
