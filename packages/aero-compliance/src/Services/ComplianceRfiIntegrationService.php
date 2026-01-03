<?php

namespace Aero\Compliance\Services;

use Aero\Compliance\Models\ComplianceCheckLog;
use Aero\Compliance\Models\RegulatoryRequirement;
use Aero\Compliance\Models\RiskAssessment;
use Aero\Rfi\Models\DailyWork;

/**
 * ComplianceRfiIntegrationService
 * 
 * PATENTABLE: "Automated regulatory compliance verification for construction RFIs"
 * 
 * This service:
 * 1. Auto-scans RFI descriptions for compliance keywords
 * 2. Checks if regulatory requirements block RFI submission at specific chainages
 * 3. Predicts RFI failure probability based on historical data
 */
class ComplianceRfiIntegrationService
{
    /**
     * Run compliance checks on an RFI before submission.
     * PATENTABLE: "Pre-submission regulatory validation for construction requests"
     * 
     * @return array{can_submit: bool, checks: array, blockers: array, warnings: array}
     */
    public function runPreSubmissionChecks(DailyWork $rfi): array
    {
        $checks = [];
        $blockers = [];
        $warnings = [];

        $workLocation = $rfi->workLocation;
        $projectId = $rfi->project_id ?? $workLocation?->project_id;
        $startM = $workLocation?->start_chainage_m;
        $endM = $workLocation?->end_chainage_m;

        // 1. Keyword-based compliance check
        $keywordResults = $this->checkKeywordCompliance($rfi, $projectId);
        $checks = array_merge($checks, $keywordResults['checks']);
        $blockers = array_merge($blockers, $keywordResults['blockers']);
        $warnings = array_merge($warnings, $keywordResults['warnings']);

        // 2. Chainage-based regulatory requirements
        if ($startM && $endM) {
            $chainageResults = $this->checkChainageCompliance($projectId, $startM, $endM);
            $checks = array_merge($checks, $chainageResults['checks']);
            $blockers = array_merge($blockers, $chainageResults['blockers']);
        }

        // 3. Risk prediction
        $riskPrediction = $this->predictRfiRisk($rfi, $projectId, $startM, $endM);
        if ($riskPrediction['probability'] > 70) {
            $warnings[] = [
                'type' => 'risk_prediction',
                'message' => sprintf(
                    'High failure probability (%.1f%%) based on historical data: %s',
                    $riskPrediction['probability'],
                    implode(', ', $riskPrediction['factors'])
                ),
            ];
        }

        return [
            'can_submit' => empty($blockers),
            'checks' => $checks,
            'blockers' => $blockers,
            'warnings' => $warnings,
            'risk_prediction' => $riskPrediction,
        ];
    }

    /**
     * Check RFI description against compliance keyword triggers.
     * PATENTABLE: "NLP-based regulatory trigger detection in construction documents"
     */
    protected function checkKeywordCompliance(DailyWork $rfi, ?int $projectId): array
    {
        $checks = [];
        $blockers = [];
        $warnings = [];

        $description = strtolower($rfi->description ?? '');
        $location = strtolower($rfi->location ?? '');
        $searchText = $description . ' ' . $location;

        // Get all requirements with trigger keywords
        $requirements = RegulatoryRequirement::query()
            ->where(function ($q) use ($projectId) {
                $q->where('project_id', $projectId)
                    ->orWhereNull('project_id');
            })
            ->whereNotNull('trigger_keywords')
            ->whereNotIn('status', [RegulatoryRequirement::STATUS_COMPLIANT, RegulatoryRequirement::STATUS_NOT_APPLICABLE])
            ->get();

        foreach ($requirements as $req) {
            $keywords = $req->trigger_keywords ?? [];
            
            foreach ($keywords as $keyword) {
                if (str_contains($searchText, strtolower($keyword))) {
                    $check = [
                        'requirement_id' => $req->id,
                        'requirement_number' => $req->requirement_number,
                        'title' => $req->title,
                        'matched_keyword' => $keyword,
                        'status' => $req->status,
                        'type' => $req->requirement_type,
                    ];

                    $checks[] = $check;

                    if ($req->blocks_rfi_if_non_compliant && $req->status === RegulatoryRequirement::STATUS_NON_COMPLIANT) {
                        $blockers[] = [
                            'type' => 'regulatory',
                            'id' => $req->id,
                            'number' => $req->requirement_number,
                            'reason' => "Non-compliant requirement '{$req->title}' triggered by keyword '{$keyword}'",
                        ];
                    } elseif ($req->status === RegulatoryRequirement::STATUS_PENDING) {
                        $warnings[] = [
                            'type' => 'regulatory',
                            'id' => $req->id,
                            'message' => "Pending compliance for '{$req->title}'",
                        ];
                    }

                    break; // Only match once per requirement
                }
            }
        }

        return [
            'checks' => $checks,
            'blockers' => $blockers,
            'warnings' => $warnings,
        ];
    }

    /**
     * Check if chainage has blocking regulatory requirements.
     */
    protected function checkChainageCompliance(int $projectId, float $startM, float $endM): array
    {
        $checks = [];
        $blockers = [];

        $requirements = RegulatoryRequirement::query()
            ->where('project_id', $projectId)
            ->where('blocks_rfi_if_non_compliant', true)
            ->where('status', RegulatoryRequirement::STATUS_NON_COMPLIANT)
            ->where(function ($q) use ($startM, $endM) {
                $q->whereBetween('start_chainage_m', [$startM, $endM])
                    ->orWhereBetween('end_chainage_m', [$startM, $endM])
                    ->orWhere(function ($q2) use ($startM, $endM) {
                        $q2->where('start_chainage_m', '<=', $startM)
                            ->where('end_chainage_m', '>=', $endM);
                    });
            })
            ->get();

        foreach ($requirements as $req) {
            $checks[] = [
                'requirement_id' => $req->id,
                'requirement_number' => $req->requirement_number,
                'title' => $req->title,
                'check_type' => 'chainage',
            ];

            $blockers[] = [
                'type' => 'regulatory_chainage',
                'id' => $req->id,
                'number' => $req->requirement_number,
                'reason' => "Regulatory requirement '{$req->title}' blocks this chainage until resolved",
            ];
        }

        return [
            'checks' => $checks,
            'blockers' => $blockers,
        ];
    }

    /**
     * Predict RFI failure probability based on historical data.
     * PATENTABLE: "AI-based construction inspection outcome prediction"
     * 
     * @return array{probability: float, factors: array}
     */
    protected function predictRfiRisk(
        DailyWork $rfi,
        ?int $projectId,
        ?float $startM,
        ?float $endM
    ): array {
        $factors = [];
        $probability = 0;

        if (! $projectId) {
            return ['probability' => 0, 'factors' => []];
        }

        // Factor 1: Historical failure rate at this chainage
        if ($startM && $endM) {
            $historicalFailures = DailyWork::query()
                ->whereHas('workLocation', function ($q) use ($startM, $endM) {
                    $q->where('start_chainage_m', '<=', $endM)
                        ->where('end_chainage_m', '>=', $startM);
                })
                ->where('inspection_result', DailyWork::INSPECTION_REJECTED)
                ->count();

            $historicalTotal = DailyWork::query()
                ->whereHas('workLocation', function ($q) use ($startM, $endM) {
                    $q->where('start_chainage_m', '<=', $endM)
                        ->where('end_chainage_m', '>=', $startM);
                })
                ->whereNotNull('inspection_result')
                ->count();

            if ($historicalTotal > 0) {
                $failRate = ($historicalFailures / $historicalTotal) * 100;
                $probability += $failRate * 0.4; // 40% weight
                if ($failRate > 20) {
                    $factors[] = sprintf('Historical failure rate: %.1f%%', $failRate);
                }
            }
        }

        // Factor 2: Existing risk assessments
        $risks = RiskAssessment::query()
            ->where('project_id', $projectId)
            ->where('risk_level', 'high')
            ->when($startM && $endM, function ($q) use ($startM, $endM) {
                $q->where('start_chainage_m', '<=', $endM)
                    ->where('end_chainage_m', '>=', $startM);
            })
            ->count();

        if ($risks > 0) {
            $probability += min($risks * 10, 30); // Max 30% from risks
            $factors[] = "{$risks} high-risk assessment(s) at this location";
        }

        // Factor 3: Work type historical performance
        $typeFailRate = DailyWork::query()
            ->where('type', $rfi->type)
            ->where('inspection_result', DailyWork::INSPECTION_REJECTED)
            ->count();

        $typeTotal = DailyWork::query()
            ->where('type', $rfi->type)
            ->whereNotNull('inspection_result')
            ->count();

        if ($typeTotal > 10) {
            $typeRate = ($typeFailRate / $typeTotal) * 100;
            $probability += $typeRate * 0.3; // 30% weight
            if ($typeRate > 15) {
                $factors[] = sprintf('%s work type has %.1f%% failure rate', $rfi->type, $typeRate);
            }
        }

        return [
            'probability' => min(round($probability, 1), 100),
            'factors' => $factors,
        ];
    }

    /**
     * Log a compliance check result.
     */
    public function logCheck(
        DailyWork $rfi,
        string $checkType,
        string $result,
        ?int $requirementId = null,
        ?string $details = null,
        bool $blocksSubmission = false,
        ?int $userId = null
    ): ComplianceCheckLog {
        return ComplianceCheckLog::create([
            'project_id' => $rfi->project_id ?? $rfi->workLocation?->project_id,
            'daily_work_id' => $rfi->id,
            'regulatory_requirement_id' => $requirementId,
            'check_type' => $checkType,
            'result' => $result,
            'details' => $details,
            'blocks_submission' => $blocksSubmission,
            'checked_by_user_id' => $userId,
            'checked_at' => now(),
        ]);
    }
}
