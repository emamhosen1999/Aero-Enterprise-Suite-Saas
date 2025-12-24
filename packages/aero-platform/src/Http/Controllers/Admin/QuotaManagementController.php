<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers\Admin;

use Aero\Platform\Http\Controllers\Controller;
use Aero\Platform\Models\QuotaEnforcementSetting;
use Aero\Platform\Models\QuotaWarning;
use Aero\Platform\Models\Tenant;
use Aero\Platform\Services\Quotas\EnhancedQuotaEnforcementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

/**
 * Admin Quota Management Controller
 *
 * Provides endpoints for:
 * - Viewing quota usage across all tenants
 * - Configuring enforcement settings
 * - Managing quota warnings
 * - Overriding tenant-specific quotas
 */
class QuotaManagementController extends Controller
{
    public function __construct(
        protected EnhancedQuotaEnforcementService $quotaService
    ) {}

    /**
     * Display quota dashboard with all tenant usage.
     */
    public function index(Request $request)
    {
        $query = Tenant::with(['subscription.plan']);

        // Filter by status
        if ($request->has('status')) {
            $status = $request->input('status');
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        // Search by name
        if ($request->has('search') && $request->input('search')) {
            $query->where('name', 'like', '%' . $request->input('search') . '%');
        }

        $tenants = $query->paginate(20);

        // Get quota summary for each tenant
        $tenantsWithQuotas = $tenants->map(function ($tenant) {
            $summary = $this->quotaService->getQuotaSummary($tenant);
            $warnings = $this->quotaService->getActiveWarnings($tenant);

            return [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'domain' => $tenant->domains->first()->domain ?? null,
                'plan' => $tenant->subscription?->plan?->name ?? 'No Plan',
                'status' => $tenant->status,
                'quotas' => $summary,
                'active_warnings' => $warnings->count(),
                'critical_quotas' => collect($summary)->filter(fn($q) => $q['status'] === 'critical')->count(),
            ];
        });

        return Inertia::render('Admin/QuotaManagement/Index', [
            'title' => 'Quota Management',
            'tenants' => $tenantsWithQuotas,
            'pagination' => [
                'current_page' => $tenants->currentPage(),
                'last_page' => $tenants->lastPage(),
                'per_page' => $tenants->perPage(),
                'total' => $tenants->total(),
            ],
            'filters' => [
                'status' => $request->input('status', 'all'),
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    /**
     * Get detailed quota information for a specific tenant.
     */
    public function show(Tenant $tenant)
    {
        $summary = $this->quotaService->getQuotaSummary($tenant);
        $warnings = $this->quotaService->getActiveWarnings($tenant);

        return response()->json([
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'domain' => $tenant->domains->first()->domain ?? null,
                'plan' => $tenant->subscription?->plan?->name ?? 'No Plan',
                'status' => $tenant->status,
            ],
            'quotas' => $summary,
            'warnings' => $warnings,
            'metadata' => $tenant->metadata ?? [],
        ]);
    }

    /**
     * Display enforcement settings configuration.
     */
    public function settings()
    {
        $settings = QuotaEnforcementSetting::all();

        return Inertia::render('Admin/QuotaManagement/Settings', [
            'title' => 'Quota Enforcement Settings',
            'settings' => $settings,
        ]);
    }

    /**
     * Update or create enforcement settings for a quota type.
     */
    public function updateSettings(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'quota_type' => 'required|string',
            'warning_threshold_percentage' => 'required|numeric|min:0|max:100',
            'critical_threshold_percentage' => 'required|numeric|min:0|max:100',
            'block_threshold_percentage' => 'required|numeric|min:0|max:100',
            'warning_period_days' => 'required|integer|min:1|max:90',
            'is_active' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $setting = QuotaEnforcementSetting::updateOrCreate(
            ['quota_type' => $request->input('quota_type')],
            $request->only([
                'warning_threshold_percentage',
                'critical_threshold_percentage',
                'block_threshold_percentage',
                'warning_period_days',
                'is_active',
            ])
        );

        return response()->json([
            'success' => true,
            'message' => 'Enforcement settings updated successfully',
            'setting' => $setting,
        ]);
    }

    /**
     * Override quota limit for a specific tenant.
     */
    public function overrideQuota(Request $request, Tenant $tenant)
    {
        $validator = Validator::make($request->all(), [
            'quota_type' => 'required|string',
            'value' => 'required|integer|min:-1', // -1 for unlimited
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $quotaType = $request->input('quota_type');
        $value = $request->input('value');

        // Store override in tenant metadata
        $metadata = $tenant->metadata ?? [];
        $metadata['quota_overrides'] = $metadata['quota_overrides'] ?? [];
        $metadata['quota_overrides'][$quotaType] = $value;
        
        $tenant->metadata = $metadata;
        $tenant->save();

        return response()->json([
            'success' => true,
            'message' => "Quota override applied for {$quotaType}",
            'tenant' => $tenant,
        ]);
    }

    /**
     * Remove quota override for a tenant.
     */
    public function removeOverride(Request $request, Tenant $tenant)
    {
        $quotaType = $request->input('quota_type');
        
        $metadata = $tenant->metadata ?? [];
        if (isset($metadata['quota_overrides'][$quotaType])) {
            unset($metadata['quota_overrides'][$quotaType]);
            $tenant->metadata = $metadata;
            $tenant->save();
        }

        return response()->json([
            'success' => true,
            'message' => "Quota override removed for {$quotaType}",
        ]);
    }

    /**
     * Dismiss a quota warning.
     */
    public function dismissWarning(Request $request, int $warningId)
    {
        $success = $this->quotaService->dismissWarning($warningId);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Warning dismissed successfully' : 'Warning not found',
        ]);
    }

    /**
     * Get quota statistics across all tenants.
     */
    public function statistics()
    {
        $stats = [
            'total_tenants' => Tenant::count(),
            'tenants_with_warnings' => QuotaWarning::where('is_dismissed', false)
                ->distinct('tenant_id')
                ->count('tenant_id'),
            'critical_warnings' => QuotaWarning::where('is_dismissed', false)
                ->where('warning_level', 'critical')
                ->count(),
            'quota_types' => [],
        ];

        // Get usage statistics by quota type
        $tenants = Tenant::with('subscription.plan')->get();
        $quotaTypes = ['users', 'storage', 'api_calls', 'employees', 'projects'];

        foreach ($quotaTypes as $type) {
            $usage = [];
            foreach ($tenants as $tenant) {
                $current = $this->quotaService->getCurrentUsage($tenant, $type);
                $limit = $this->quotaService->getQuotaLimit($tenant, $type);
                $percentage = $limit > 0 ? ($current / $limit) * 100 : 0;
                
                if ($percentage >= 80) {
                    $usage[] = [
                        'tenant_id' => $tenant->id,
                        'tenant_name' => $tenant->name,
                        'current' => $current,
                        'limit' => $limit,
                        'percentage' => round($percentage, 1),
                    ];
                }
            }
            
            $stats['quota_types'][$type] = [
                'high_usage_count' => count($usage),
                'tenants' => $usage,
            ];
        }

        return response()->json($stats);
    }
}
