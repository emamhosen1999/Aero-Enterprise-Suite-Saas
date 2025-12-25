<?php

namespace Aero\Platform\Http\Controllers\Admin;

use Aero\Platform\Http\Controllers\Controller;
use Aero\Platform\Jobs\BulkTenantOperationsJob;
use Aero\Platform\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Bulk Tenant Operations Controller
 * 
 * Handles bulk operations on multiple tenants
 */
class BulkTenantOperationsController extends Controller
{
    /**
     * Perform bulk operation on tenants
     */
    public function execute(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tenant_ids' => 'required|array|min:1',
            'tenant_ids.*' => 'required|string|exists:tenants,id',
            'operation' => 'required|string|in:suspend,activate,delete,update_plan,reset_quota',
            'options' => 'nullable|array',
            'async' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $tenantIds = $request->input('tenant_ids');
        $operation = $request->input('operation');
        $options = $request->input('options', []);
        $async = $request->boolean('async', true);

        // Additional validation based on operation
        $this->validateOperationOptions($operation, $options);

        // Verify user has permission
        if (!$request->user()->can('manage-tenants')) {
            return response()->json([
                'message' => 'Unauthorized to perform bulk tenant operations',
            ], 403);
        }

        // Dispatch job
        if ($async) {
            BulkTenantOperationsJob::dispatch($tenantIds, $operation, $options);
            
            return response()->json([
                'message' => "Bulk operation '{$operation}' queued for " . count($tenantIds) . ' tenant(s)',
                'async' => true,
                'tenant_count' => count($tenantIds),
            ]);
        }

        // Execute synchronously
        try {
            BulkTenantOperationsJob::dispatchSync($tenantIds, $operation, $options);
            
            return response()->json([
                'message' => "Bulk operation '{$operation}' completed for " . count($tenantIds) . ' tenant(s)',
                'async' => false,
                'tenant_count' => count($tenantIds),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Bulk operation failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Suspend multiple tenants
     */
    public function suspend(Request $request)
    {
        $request->merge(['operation' => 'suspend']);
        return $this->execute($request);
    }

    /**
     * Activate multiple tenants
     */
    public function activate(Request $request)
    {
        $request->merge(['operation' => 'activate']);
        return $this->execute($request);
    }

    /**
     * Delete multiple tenants
     */
    public function delete(Request $request)
    {
        $request->merge(['operation' => 'delete']);
        return $this->execute($request);
    }

    /**
     * Update plan for multiple tenants
     */
    public function updatePlan(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|string|exists:plans,id',
        ]);

        $request->merge([
            'operation' => 'update_plan',
            'options' => ['plan_id' => $request->input('plan_id')],
        ]);

        return $this->execute($request);
    }

    /**
     * Reset quota for multiple tenants
     */
    public function resetQuota(Request $request)
    {
        $request->merge(['operation' => 'reset_quota']);
        return $this->execute($request);
    }

    /**
     * Get bulk operation status/history
     */
    public function history(Request $request)
    {
        // TODO: Implement job history tracking
        return response()->json([
            'data' => [],
            'message' => 'Bulk operation history not yet implemented',
        ]);
    }

    /**
     * Validate operation-specific options
     */
    protected function validateOperationOptions(string $operation, array $options): void
    {
        switch ($operation) {
            case 'update_plan':
                if (!isset($options['plan_id'])) {
                    throw new \InvalidArgumentException('plan_id is required for update_plan operation');
                }
                break;

            case 'delete':
                // Hard delete requires explicit confirmation
                if (isset($options['confirm_hard_delete']) && $options['confirm_hard_delete'] === true) {
                    if (!isset($options['confirmation_token']) || $options['confirmation_token'] !== 'CONFIRM_HARD_DELETE') {
                        throw new \InvalidArgumentException('Hard delete requires confirmation_token = "CONFIRM_HARD_DELETE"');
                    }
                }
                break;
        }
    }

    /**
     * Preview bulk operation impact
     */
    public function preview(Request $request)
    {
        $request->validate([
            'tenant_ids' => 'required|array|min:1',
            'tenant_ids.*' => 'required|string|exists:tenants,id',
            'operation' => 'required|string|in:suspend,activate,delete,update_plan,reset_quota',
        ]);

        $tenants = Tenant::whereIn('id', $request->input('tenant_ids'))->get();
        $operation = $request->input('operation');

        $preview = [
            'operation' => $operation,
            'tenant_count' => $tenants->count(),
            'tenants' => $tenants->map(function ($tenant) use ($operation) {
                return [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'current_status' => $tenant->status,
                    'impact' => $this->getOperationImpact($operation, $tenant),
                ];
            }),
            'warnings' => $this->getOperationWarnings($operation, $tenants),
        ];

        return response()->json(['data' => $preview]);
    }

    /**
     * Get operation impact description
     */
    protected function getOperationImpact(string $operation, Tenant $tenant): string
    {
        return match ($operation) {
            'suspend' => $tenant->status === 'suspended' ? 'Already suspended' : 'Will be suspended',
            'activate' => $tenant->status === 'active' ? 'Already active' : 'Will be activated',
            'delete' => 'Will be soft deleted (recoverable)',
            'update_plan' => 'Plan will be updated',
            'reset_quota' => 'Quota usage will be reset to zero',
            default => 'Unknown impact',
        };
    }

    /**
     * Get operation warnings
     */
    protected function getOperationWarnings(string $operation, $tenants): array
    {
        $warnings = [];

        if ($operation === 'suspend') {
            $activeTenants = $tenants->where('status', 'active')->count();
            if ($activeTenants > 0) {
                $warnings[] = "{$activeTenants} active tenant(s) will lose access to the system";
            }
        }

        if ($operation === 'delete') {
            $warnings[] = "Tenants will be soft deleted and can be recovered within 30 days";
        }

        return $warnings;
    }
}
