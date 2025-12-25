<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers\Admin;

use Aero\Platform\Http\Controllers\Controller;
use Aero\Platform\Models\ScheduledReport;
use Aero\Platform\Services\ReportScheduler;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Exception;

/**
 * Admin Report Management Controller
 *
 * Provides endpoints for:
 * - Managing scheduled reports (CRUD)
 * - Generating ad-hoc reports
 * - Accessing report templates
 * - Viewing execution history
 */
class ReportController extends Controller
{
    public function __construct(
        protected ReportScheduler $reportScheduler
    ) {}

    /**
     * List all scheduled reports for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user('landlord');
        
        $filters = [];
        if ($request->has('is_active')) {
            $filters['is_active'] = $request->boolean('is_active');
        }
        if ($request->has('report_type')) {
            $filters['report_type'] = $request->input('report_type');
        }

        $reports = $this->reportScheduler->getUserReports($user->id, $filters);

        return response()->json([
            'success' => true,
            'data' => $reports,
        ]);
    }

    /**
     * Create a new scheduled report.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'report_type' => ['required', Rule::in(['revenue', 'subscription', 'cohort_analysis', 'plan_performance', 'customer_analytics', 'usage'])],
            'config' => 'required|array',
            'frequency' => ['required', Rule::in(['daily', 'weekly', 'monthly', 'custom'])],
            'schedule_config' => 'required|array',
            'recipients' => 'required|array',
            'recipients.*' => 'email',
            'export_formats' => 'required|array',
            'export_formats.*' => Rule::in(['pdf', 'csv', 'excel', 'json']),
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = $request->user('landlord');
            $config = array_merge($request->all(), ['user_id' => $user->id]);
            
            $report = $this->reportScheduler->saveReportConfig($config, $user->id);

            return response()->json([
                'success' => true,
                'data' => $report,
                'message' => 'Report scheduled successfully',
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create scheduled report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a specific scheduled report.
     */
    public function show(Request $request, int $id)
    {
        $user = $request->user('landlord');
        
        $report = ScheduledReport::where('id', $id)
            ->where('user_id', $user->id)
            ->with('latestExecution')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    /**
     * Update a scheduled report.
     */
    public function update(Request $request, int $id)
    {
        $user = $request->user('landlord');
        
        $report = ScheduledReport::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'config' => 'sometimes|required|array',
            'frequency' => ['sometimes', 'required', Rule::in(['daily', 'weekly', 'monthly', 'custom'])],
            'schedule_config' => 'sometimes|required|array',
            'recipients' => 'sometimes|required|array',
            'export_formats' => 'sometimes|required|array',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $report->update($request->all());

            // Recalculate next run if schedule changed
            if ($request->has('frequency') || $request->has('schedule_config')) {
                $report->update(['next_run_at' => $report->calculateNextRunAt()]);
            }

            return response()->json([
                'success' => true,
                'data' => $report->fresh(),
                'message' => 'Report updated successfully',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a scheduled report.
     */
    public function destroy(Request $request, int $id)
    {
        $user = $request->user('landlord');
        
        $report = ScheduledReport::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        try {
            $report->delete();

            return response()->json([
                'success' => true,
                'message' => 'Report deleted successfully',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Execute a report immediately.
     */
    public function run(Request $request, int $id)
    {
        $user = $request->user('landlord');
        
        $report = ScheduledReport::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        try {
            $execution = $this->reportScheduler->executeScheduledReport($report);

            return response()->json([
                'success' => true,
                'data' => $execution,
                'message' => 'Report executed successfully',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to execute report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Duplicate an existing report.
     */
    public function duplicate(Request $request, int $id)
    {
        $user = $request->user('landlord');
        
        $report = ScheduledReport::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        try {
            $newReport = $report->replicate();
            $newReport->name = $report->name . ' (Copy)';
            $newReport->is_active = false; // Start as inactive
            $newReport->save();

            return response()->json([
                'success' => true,
                'data' => $newReport,
                'message' => 'Report duplicated successfully',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to duplicate report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get execution history for a report.
     */
    public function executions(Request $request, int $id)
    {
        $user = $request->user('landlord');
        
        $report = ScheduledReport::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $limit = $request->input('limit', 50);
        $executions = $this->reportScheduler->getExecutionHistory($report->id, $limit);

        return response()->json([
            'success' => true,
            'data' => $executions,
        ]);
    }

    /**
     * Generate an ad-hoc report (no scheduling).
     */
    public function generate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'report_type' => ['required', Rule::in(['revenue', 'subscription', 'cohort_analysis', 'plan_performance', 'customer_analytics', 'usage'])],
            'config' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $config = $request->input('config');
            $config['report_type'] = $request->input('report_type');
            
            $result = $this->reportScheduler->generateReport($config);

            return response()->json($result);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get pre-built report templates.
     */
    public function templates(Request $request)
    {
        $templates = [
            [
                'id' => 'executive_dashboard',
                'name' => 'Executive Dashboard',
                'description' => 'High-level overview of key business metrics',
                'report_type' => 'revenue',
                'config' => [
                    'metrics' => ['mrr', 'arr', 'churn_rate', 'ltv'],
                    'groupBy' => 'month',
                ],
            ],
            [
                'id' => 'monthly_business_review',
                'name' => 'Monthly Business Review',
                'description' => 'Comprehensive monthly performance report',
                'report_type' => 'subscription',
                'config' => [
                    'metrics' => ['new_subs', 'cancelled', 'net_growth', 'trial_conversion'],
                    'groupBy' => 'month',
                ],
            ],
            [
                'id' => 'churn_analysis',
                'name' => 'Churn Analysis',
                'description' => 'Detailed analysis of customer churn patterns',
                'report_type' => 'cohort_analysis',
                'config' => [
                    'metrics' => ['retention_rate', 'churn_rate', 'mrr_retention'],
                    'groupBy' => 'cohort',
                ],
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $templates,
        ]);
    }
}
