<?php

namespace Aero\HRM\Http\Controllers;

use Aero\HRM\Services\DEIAnalyticsService;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class DEIAnalyticsController extends Controller
{
    public function __construct(protected DEIAnalyticsService $deiService) {}

    /**
     * Render the DEI Analytics dashboard.
     */
    public function index(): Response
    {
        $genderDistribution = [];
        $ageDistribution = [];
        $departmentMatrix = [];
        $hiringTrends = [];
        $payEquityData = [];
        $summaryStats = [];
        $error = null;

        try {
            $genderDistribution = $this->deiService->getGenderDistribution();
            $ageDistribution = $this->deiService->getAgeDistribution();
            $departmentMatrix = $this->deiService->getDepartmentDiversityMatrix();
            $hiringTrends = $this->deiService->getHiringTrendsByGender(12);
            $payEquityData = $this->deiService->getPayEquityGap();
            $summaryStats = $this->deiService->getSummaryStats();
        } catch (Throwable $e) {
            report($e);
            $error = 'Failed to load DEI analytics data. Please try again later.';
        }

        return Inertia::render('HRM/DEIAnalytics/Dashboard', [
            'title' => 'DEI Analytics',
            'genderDistribution' => $genderDistribution,
            'ageDistribution' => $ageDistribution,
            'departmentMatrix' => $departmentMatrix,
            'hiringTrends' => $hiringTrends,
            'payEquityData' => $payEquityData,
            'summaryStats' => $summaryStats,
            'error' => $error,
        ]);
    }
}
