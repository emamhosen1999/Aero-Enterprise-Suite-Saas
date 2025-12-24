<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers;

use Aero\Platform\Models\Tenant;
use Aero\Platform\Services\Monitoring\Tenant\TenantProvisioner;
use Aero\Platform\Services\Tenant\TenantPurgeService;
use Aero\Platform\Services\Tenant\TenantRetentionService;
use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Tenant Management Controller
 *
 * Handles CRUD operations for tenants in the platform admin panel.
 * All operations are performed on the central database with landlord guard.
 */
class TenantController extends Controller
{
    public function __construct(
        protected TenantProvisioner $provisioner,
        protected TenantRetentionService $retentionService,
        protected TenantPurgeService $purgeService
    ) {}

    /**
     * Get paginated list of tenants.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Tenant::query()
            ->with(['plan', 'domains'])
            ->when($request->boolean('include_archived'), function ($q) {
                $q->withTrashed();
            })
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->input('search');
                $q->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('subdomain', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), function ($q) use ($request) {
                $q->where('status', $request->input('status'));
            })
            ->when($request->filled('plan_id'), function ($q) use ($request) {
                $q->where('plan_id', $request->input('plan_id'));
            })
            ->when($request->filled('type'), function ($q) use ($request) {
                $q->where('type', $request->input('type'));
            });

        // Sorting
        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $tenants = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => $tenants->items(),
            'meta' => [
                'current_page' => $tenants->currentPage(),
                'per_page' => $tenants->perPage(),
                'total' => $tenants->total(),
                'last_page' => $tenants->lastPage(),
            ],
        ]);
    }

    /**
     * Get tenant statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        $stats = [
            'total' => Tenant::count(),
            'active' => Tenant::where('status', Tenant::STATUS_ACTIVE)->count(),
            'pending' => Tenant::where('status', Tenant::STATUS_PENDING)->count(),
            'suspended' => Tenant::where('status', Tenant::STATUS_SUSPENDED)->count(),
            'archived' => Tenant::where('status', Tenant::STATUS_ARCHIVED)->count(),
            'on_trial' => Tenant::whereNotNull('trial_ends_at')
                ->where('trial_ends_at', '>', now())
                ->count(),
            'new_this_month' => Tenant::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
        ];

        return response()->json(['data' => $stats]);
    }

    /**
     * Get a specific tenant.
     */
    public function show(Request $request, Tenant $tenant): JsonResponse
    {
        $tenant->load(['plan', 'domains', 'subscriptions']);

        return response()->json(['data' => $tenant]);
    }

    /**
     * Store a new tenant (admin-initiated).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'subdomain' => [
                'required',
                'string',
                'max:63',
                'regex:/^[a-z0-9][a-z0-9-]*[a-z0-9]$/i',
                Rule::unique('tenants', 'subdomain'),
            ],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'type' => ['required', 'string', Rule::in(['business', 'enterprise', 'startup'])],
            'plan_id' => ['required', 'exists:plans,id'],
            'trial_days' => ['nullable', 'integer', 'min:0', 'max:90'],
            'admin_name' => ['required', 'string', 'max:255'],
            'admin_email' => ['required', 'email', 'max:255'],
            'admin_password' => ['nullable', 'string', 'min:8'],
        ]);

        DB::beginTransaction();

        try {
            $tenant = Tenant::create([
                'name' => $validated['name'],
                'subdomain' => strtolower($validated['subdomain']),
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'type' => $validated['type'],
                'plan_id' => $validated['plan_id'],
                'status' => Tenant::STATUS_PENDING,
                'trial_ends_at' => isset($validated['trial_days'])
                    ? now()->addDays($validated['trial_days'])
                    : null,
                'admin_data' => [
                    'name' => $validated['admin_name'],
                    'email' => $validated['admin_email'],
                    'password' => $validated['admin_password'] ?? null,
                ],
            ]);

            // Create domain
            $tenant->createDomain([
                'domain' => $tenant->subdomain.'.'.config('tenancy.central_domains.0'),
            ]);

            DB::commit();

            // Dispatch provisioning job
            $this->provisioner->dispatch($tenant);

            return response()->json([
                'data' => $tenant,
                'message' => 'Tenant created successfully. Provisioning started.',
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update a tenant.
     */
    public function update(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'plan_id' => ['sometimes', 'exists:plans,id'],
            'trial_ends_at' => ['nullable', 'date'],
            'subscription_ends_at' => ['nullable', 'date'],
        ]);

        $tenant->update($validated);

        return response()->json([
            'data' => $tenant->fresh(['plan', 'domains']),
            'message' => 'Tenant updated successfully.',
        ]);
    }

    /**
     * Archive a tenant (soft delete with retention period).
     */
    public function destroy(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
            'confirm' => ['required', 'accepted'],
        ]);

        // Soft delete the tenant
        $tenant->delete();

        // Update metadata
        $tenant->update([
            'status' => Tenant::STATUS_ARCHIVED,
            'data' => array_merge($tenant->data?->getArrayCopy() ?? [], [
                'archived_reason' => $validated['reason'],
                'archived_by' => auth('landlord')->id(),
            ]),
        ]);

        $retentionExpiresAt = $this->retentionService->getRetentionExpiresAt($tenant);

        return response()->json([
            'message' => 'Tenant archived successfully. Can be restored within retention period.',
            'retention_expires_at' => $retentionExpiresAt?->toIso8601String(),
            'retention_days' => config('tenancy.retention.days', 30),
        ]);
    }

    /**
     * Restore an archived tenant.
     */
    public function restore(Request $request, string $tenantId): JsonResponse
    {
        $tenant = Tenant::onlyTrashed()->findOrFail($tenantId);

        // Check if restoration is allowed
        if (!$this->retentionService->canRestore($tenant)) {
            return response()->json([
                'message' => 'Retention period expired. Tenant cannot be restored.',
            ], 422);
        }

        // Restore tenant
        $tenant->restore();

        // Reactivate
        $tenant->update([
            'status' => Tenant::STATUS_ACTIVE,
            'data' => array_merge($tenant->data?->getArrayCopy() ?? [], [
                'restored_at' => now()->toIso8601String(),
                'restored_by' => auth('landlord')->id(),
            ]),
        ]);

        return response()->json([
            'data' => $tenant->fresh(),
            'message' => 'Tenant restored successfully.',
        ]);
    }

    /**
     * Permanently purge a tenant (irreversible).
     */
    public function purge(Request $request, string $tenantId): JsonResponse
    {
        $tenant = Tenant::onlyTrashed()->findOrFail($tenantId);

        // Verify retention period expired
        if (!$this->retentionService->canPurge($tenant)) {
            $expiresAt = $this->retentionService->getRetentionExpiresAt($tenant);
            
            return response()->json([
                'message' => "Retention period not expired. Can purge after {$expiresAt->toDateString()}",
                'retention_expires_at' => $expiresAt->toIso8601String(),
                'days_remaining' => $this->retentionService->getDaysUntilPurge($tenant),
            ], 422);
        }

        // Require confirmation
        $validated = $request->validate([
            'confirm' => ['required', 'accepted'],
            'confirm_name' => ['required', 'string', function ($attribute, $value, $fail) use ($tenant) {
                if ($value !== $tenant->name) {
                    $fail('Tenant name confirmation does not match.');
                }
            }],
        ]);

        try {
            $this->purgeService->purge($tenant);

            return response()->json([
                'message' => 'Tenant permanently purged.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to purge tenant: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Suspend a tenant.
     */
    public function suspend(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $tenant->update([
            'status' => Tenant::STATUS_SUSPENDED,
            'data' => array_merge($tenant->data?->getArrayCopy() ?? [], [
                'suspended_at' => now()->toIso8601String(),
                'suspended_reason' => $validated['reason'] ?? null,
                'suspended_by' => auth('landlord')->id(),
            ]),
        ]);

        return response()->json([
            'data' => $tenant->fresh(),
            'message' => 'Tenant suspended successfully.',
        ]);
    }

    /**
     * Activate/reactivate a tenant.
     */
    public function activate(Request $request, Tenant $tenant): JsonResponse
    {
        $tenant->update([
            'status' => Tenant::STATUS_ACTIVE,
            'data' => array_merge($tenant->data?->getArrayCopy() ?? [], [
                'activated_at' => now()->toIso8601String(),
                'activated_by' => auth('landlord')->id(),
            ]),
        ]);

        return response()->json([
            'data' => $tenant->fresh(),
            'message' => 'Tenant activated successfully.',
        ]);
    }

    /**
     * Archive a tenant.
     */
    public function archive(Request $request, Tenant $tenant): JsonResponse
    {
        $tenant->update([
            'status' => Tenant::STATUS_ARCHIVED,
        ]);

        // Soft delete
        $tenant->delete();

        return response()->json([
            'message' => 'Tenant archived successfully.',
        ]);
    }

    /**
     * Check subdomain availability.
     * 
     * Public API endpoint - no session required.
     * Only checks if subdomain is taken by an active tenant.
     */
    public function checkSubdomain(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subdomain' => ['required', 'string', 'max:63'],
        ]);

        $subdomain = strtolower($validated['subdomain']);

        // Check format
        if (! preg_match('/^[a-z0-9][a-z0-9-]*[a-z0-9]$/', $subdomain) && strlen($subdomain) > 2) {
            return response()->json([
                'available' => false,
                'message' => 'Invalid subdomain format. Use only lowercase letters, numbers, and hyphens.',
            ]);
        }

        // Check reserved subdomains
        $reserved = ['admin', 'api', 'app', 'www', 'mail', 'smtp', 'ftp', 'cdn', 'static', 'assets', 'help', 'support', 'billing', 'status'];
        if (in_array($subdomain, $reserved)) {
            return response()->json([
                'available' => false,
                'message' => 'This subdomain is reserved.',
            ]);
        }

        // Check if subdomain is taken by any tenant (active, pending, or failed)
        // Note: We show as "taken" even for pending/failed to prevent conflicts
        // The actual registration submission will handle re-claiming abandoned registrations
        $exists = Tenant::where('subdomain', $subdomain)->exists();

        return response()->json([
            'available' => ! $exists,
            'message' => $exists ? 'This subdomain is already taken.' : 'Subdomain is available.',
        ]);
    }
}
