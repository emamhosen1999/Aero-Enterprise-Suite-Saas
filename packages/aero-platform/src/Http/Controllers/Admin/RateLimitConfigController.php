<?php

namespace Aero\Platform\Http\Controllers\Admin;

use Aero\Platform\Http\Controllers\Controller;
use Aero\Platform\Models\RateLimitConfig;
use Aero\Platform\Services\RateLimitConfigService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Rate Limit Configuration Controller
 * 
 * Manages rate limiting configurations for tenants and global settings
 */
class RateLimitConfigController extends Controller
{
    protected RateLimitConfigService $configService;

    public function __construct(RateLimitConfigService $configService)
    {
        $this->configService = $configService;
    }

    /**
     * Get rate limit configurations
     */
    public function index(Request $request)
    {
        $tenantId = $request->input('tenant_id');
        
        $configs = RateLimitConfig::query()
            ->when($tenantId, function ($query, $tenantId) {
                $query->where('tenant_id', $tenantId);
            })
            ->when(!$tenantId, function ($query) {
                $query->whereNull('tenant_id'); // Global configs only
            })
            ->orderBy('limit_type')
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'data' => $configs->items(),
            'meta' => [
                'current_page' => $configs->currentPage(),
                'last_page' => $configs->lastPage(),
                'per_page' => $configs->perPage(),
                'total' => $configs->total(),
            ],
        ]);
    }

    /**
     * Get a specific configuration
     */
    public function show(Request $request, string $id)
    {
        $config = RateLimitConfig::findOrFail($id);

        return response()->json(['data' => $config]);
    }

    /**
     * Create or update rate limit configuration
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tenant_id' => 'nullable|string|exists:tenants,id',
            'limit_type' => 'required|string|in:api,web,webhook,custom',
            'max_requests' => 'required|integer|min:1|max:1000000',
            'time_window_seconds' => 'required|integer|min:1|max:86400',
            'burst_limit' => 'nullable|integer|min:1',
            'throttle_percentage' => 'nullable|integer|min:1|max:100',
            'block_duration_seconds' => 'nullable|integer|min:60|max:86400',
            'whitelist_ips' => 'nullable|array',
            'whitelist_ips.*' => 'ip',
            'blacklist_ips' => 'nullable|array',
            'blacklist_ips.*' => 'ip',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $config = $this->configService->createOrUpdate($validator->validated());

        return response()->json([
            'message' => 'Rate limit configuration saved successfully',
            'data' => $config,
        ], 201);
    }

    /**
     * Update rate limit configuration
     */
    public function update(Request $request, string $id)
    {
        $config = RateLimitConfig::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'max_requests' => 'sometimes|required|integer|min:1|max:1000000',
            'time_window_seconds' => 'sometimes|required|integer|min:1|max:86400',
            'burst_limit' => 'nullable|integer|min:1',
            'throttle_percentage' => 'nullable|integer|min:1|max:100',
            'block_duration_seconds' => 'nullable|integer|min:60|max:86400',
            'whitelist_ips' => 'nullable|array',
            'whitelist_ips.*' => 'ip',
            'blacklist_ips' => 'nullable|array',
            'blacklist_ips.*' => 'ip',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $config->update($validator->validated());

        return response()->json([
            'message' => 'Rate limit configuration updated successfully',
            'data' => $config,
        ]);
    }

    /**
     * Delete rate limit configuration
     */
    public function destroy(string $id)
    {
        $this->configService->delete($id);

        return response()->json([
            'message' => 'Rate limit configuration deleted successfully',
        ]);
    }

    /**
     * Toggle configuration active status
     */
    public function toggle(Request $request, string $id)
    {
        $config = RateLimitConfig::findOrFail($id);
        
        $config->update([
            'is_active' => $request->boolean('is_active'),
        ]);

        return response()->json([
            'message' => 'Rate limit configuration status updated',
            'data' => $config,
        ]);
    }

    /**
     * Get rate limit statistics
     */
    public function stats(Request $request)
    {
        $tenantId = $request->input('tenant_id');
        $stats = $this->configService->getStats($tenantId);

        return response()->json(['data' => $stats]);
    }

    /**
     * Test rate limit configuration
     */
    public function test(Request $request, string $id)
    {
        $config = RateLimitConfig::findOrFail($id);

        // Simulate rate limit check
        $testResult = [
            'config_id' => $config->id,
            'limit_type' => $config->limit_type,
            'max_requests' => $config->max_requests,
            'time_window' => $config->time_window_seconds . ' seconds',
            'estimated_rpm' => round($config->max_requests / ($config->time_window_seconds / 60), 2),
            'burst_limit' => $config->burst_limit,
            'status' => 'Configuration valid',
        ];

        return response()->json([
            'message' => 'Rate limit configuration test completed',
            'data' => $testResult,
        ]);
    }

    /**
     * Get default configurations
     */
    public function defaults()
    {
        $defaults = [
            'api' => [
                'max_requests' => 1000,
                'time_window_seconds' => 3600,
                'burst_limit' => 100,
                'throttle_percentage' => 100,
                'block_duration_seconds' => 3600,
            ],
            'web' => [
                'max_requests' => 300,
                'time_window_seconds' => 60,
                'burst_limit' => 50,
                'throttle_percentage' => 100,
                'block_duration_seconds' => 300,
            ],
            'webhook' => [
                'max_requests' => 100,
                'time_window_seconds' => 60,
                'burst_limit' => 10,
                'throttle_percentage' => 100,
                'block_duration_seconds' => 600,
            ],
        ];

        return response()->json(['data' => $defaults]);
    }

    /**
     * Bulk update configurations
     */
    public function bulkUpdate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'configs' => 'required|array|min:1',
            'configs.*.id' => 'required|string|exists:rate_limit_configs,id',
            'configs.*.is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $updated = 0;
        foreach ($request->input('configs') as $configData) {
            $config = RateLimitConfig::find($configData['id']);
            if ($config) {
                $config->update(['is_active' => $configData['is_active'] ?? $config->is_active]);
                $updated++;
            }
        }

        return response()->json([
            'message' => "Updated {$updated} rate limit configuration(s)",
            'updated' => $updated,
        ]);
    }
}
