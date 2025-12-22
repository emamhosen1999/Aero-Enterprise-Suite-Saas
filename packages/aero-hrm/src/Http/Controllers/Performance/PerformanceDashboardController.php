<?php

namespace Aero\HRM\Http\Controllers\Performance;

use Aero\HRM\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * Performance Dashboard Controller - Glass ERP Phase 5
 *
 * Handles performance monitoring dashboard routes and API endpoints
 * for real-time performance data display and report generation.
 */
class PerformanceDashboardController extends Controller
{
    /**
     * Display the performance dashboard.
     */
    public function index()
    {
        return Inertia::render('Pages/HRM/Performance/Dashboard', [
            'title' => 'Performance Dashboard - Glass ERP',
        ]);
    }

    /**
     * Get current performance metrics.
     */
    public function getMetrics()
    {
        $data = [];

        // Load baseline data
        if (Storage::exists('performance/baseline.json')) {
            $data['baseline'] = json_decode(Storage::get('performance/baseline.json'), true);
        }

        // Load comparison data
        if (Storage::exists('performance/comparison.json')) {
            $data['comparison'] = json_decode(Storage::get('performance/comparison.json'), true);
        }

        // Load reports data
        if (Storage::exists('reports/performance-export.json')) {
            $data['report'] = json_decode(Storage::get('reports/performance-export.json'), true);
        }

        return response()->json($data);
    }

    /**
     * Generate performance report.
     */
    public function generateReport(Request $request)
    {
        try {
            // Execute the performance report generation script
            $command = 'cd '.base_path().' && npm run performance:report';
            $output = shell_exec($command.' 2>&1');

            return response()->json([
                'success' => true,
                'message' => 'Performance report generated successfully',
                'output' => $output,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate performance report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get performance baseline.
     */
    public function getBaseline()
    {
        if (! Storage::exists('performance/baseline.json')) {
            return response()->json([
                'error' => 'No baseline data available',
            ], 404);
        }

        $baseline = json_decode(Storage::get('performance/baseline.json'), true);

        return response()->json($baseline);
    }

    /**
     * Establish new performance baseline.
     */
    public function establishBaseline(Request $request)
    {
        try {
            // Execute the baseline establishment script
            $command = 'cd '.base_path().' && npm run performance:baseline';
            $output = shell_exec($command.' 2>&1');

            return response()->json([
                'success' => true,
                'message' => 'Performance baseline established successfully',
                'output' => $output,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to establish performance baseline',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Compare current performance with baseline.
     */
    public function comparePerformance(Request $request)
    {
        try {
            // Execute the performance comparison script
            $command = 'cd '.base_path().' && npm run performance:compare';
            $output = shell_exec($command.' 2>&1');

            return response()->json([
                'success' => true,
                'message' => 'Performance comparison completed successfully',
                'output' => $output,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to compare performance',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get performance alerts and recommendations.
     */
    public function getAlerts()
    {
        $alerts = [];

        // Check baseline for issues
        if (Storage::exists('performance/baseline.json')) {
            $baseline = json_decode(Storage::get('performance/baseline.json'), true);

            if ($baseline['overall']['performanceScore'] < 70) {
                $alerts[] = [
                    'type' => 'error',
                    'title' => 'Low Performance Score',
                    'message' => "Overall performance score is {$baseline['overall']['performanceScore']}/100, below recommended threshold of 70.",
                    'timestamp' => now(),
                ];
            }

            if ($baseline['overall']['totalIssues'] > 0) {
                $alerts[] = [
                    'type' => 'warning',
                    'title' => 'Performance Issues Detected',
                    'message' => "{$baseline['overall']['totalIssues']} performance issues require attention.",
                    'timestamp' => now(),
                ];
            }
        }

        // Check comparison for regressions
        if (Storage::exists('performance/comparison.json')) {
            $comparison = json_decode(Storage::get('performance/comparison.json'), true);

            if (! empty($comparison['summary']['regressions'])) {
                $regressionCount = count($comparison['summary']['regressions']);
                $alerts[] = [
                    'type' => 'error',
                    'title' => 'Performance Regression',
                    'message' => "{$regressionCount} performance regressions detected since last baseline.",
                    'timestamp' => now(),
                ];
            }
        }

        return response()->json($alerts);
    }

    /**
     * Download performance report.
     */
    public function downloadReport(Request $request)
    {
        $format = $request->get('format', 'json');

        switch ($format) {
            case 'json':
                if (! Storage::exists('reports/performance-export.json')) {
                    abort(404, 'Performance report not found');
                }

                return Storage::download(
                    'reports/performance-export.json',
                    'glass-erp-performance-'.date('Y-m-d').'.json'
                );

            case 'dashboard':
                if (! Storage::exists('reports/performance-dashboard.html')) {
                    abort(404, 'Performance dashboard not found');
                }

                return Storage::download(
                    'reports/performance-dashboard.html',
                    'glass-erp-dashboard-'.date('Y-m-d').'.html'
                );

            default:
                abort(400, 'Invalid format requested');
        }
    }
}
