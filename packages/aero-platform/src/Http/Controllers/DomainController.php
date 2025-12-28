<?php

namespace Aero\Platform\Http\Controllers;

use Aero\Platform\Models\Domain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * Controller for domain management API endpoints.
 */
class DomainController extends Controller
{
    /**
     * Get paginated list of domains.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Domain::query()
            ->with(['tenant:id,name,status'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->input('search');
                $q->where(function ($query) use ($search) {
                    $query->where('domain', 'like', "%{$search}%")
                        ->orWhereHas('tenant', function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->filled('type'), function ($q) use ($request) {
                $type = $request->input('type');
                if ($type === 'custom') {
                    $q->where('is_custom', true);
                } elseif ($type === 'subdomain') {
                    $q->where('is_custom', false);
                }
            })
            ->when($request->filled('status'), function ($q) use ($request) {
                $q->where('status', $request->input('status'));
            })
            ->when($request->filled('ssl_status'), function ($q) use ($request) {
                $q->where('ssl_status', $request->input('ssl_status'));
            })
            ->when($request->filled('tenant_id'), function ($q) use ($request) {
                $q->where('tenant_id', $request->input('tenant_id'));
            });

        // Sorting
        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $domains = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => $domains->items(),
            'meta' => [
                'current_page' => $domains->currentPage(),
                'last_page' => $domains->lastPage(),
                'per_page' => $domains->perPage(),
                'total' => $domains->total(),
            ],
        ]);
    }

    /**
     * Get domain statistics.
     *
     * Stats are cached for 2 minutes.
     */
    public function stats(): JsonResponse
    {
        $cacheKey = 'domain_stats_' . now()->format('Y-m-d_H-i');
        $cacheTtl = 120; // 2 minutes

        $stats = Cache::remember($cacheKey, $cacheTtl, function () {
            return [
                'total' => Domain::count(),
                'custom' => Domain::where('is_custom', true)->count(),
                'subdomains' => Domain::where('is_custom', false)->count(),
                'verified' => Domain::where('status', Domain::STATUS_VERIFIED)->orWhere('status', Domain::STATUS_ACTIVE)->count(),
                'pending' => Domain::where('status', Domain::STATUS_PENDING)->count(),
                'ssl_active' => Domain::where('ssl_status', Domain::SSL_ACTIVE)->count(),
                'ssl_pending' => Domain::where('ssl_status', Domain::SSL_PENDING)->orWhere('ssl_status', Domain::SSL_PROVISIONING)->count(),
            ];
        });

        return response()->json(['data' => $stats]);
    }

    /**
     * Get a single domain.
     */
    public function show(Domain $domain): JsonResponse
    {
        $domain->load('tenant:id,name,status,subdomain');

        return response()->json(['data' => $domain]);
    }

    /**
     * Verify a domain's DNS records.
     */
    public function verify(Domain $domain): JsonResponse
    {
        // Trigger DNS verification
        try {
            $domain->verifyDns();

            return response()->json([
                'message' => 'Domain verification initiated',
                'data' => $domain->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Domain verification failed',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Provision SSL for a domain.
     */
    public function provisionSsl(Domain $domain): JsonResponse
    {
        if ($domain->status !== Domain::STATUS_ACTIVE && $domain->status !== Domain::STATUS_VERIFIED) {
            return response()->json([
                'message' => 'Domain must be verified before provisioning SSL',
            ], 422);
        }

        try {
            $domain->update(['ssl_status' => Domain::SSL_PROVISIONING]);

            // Queue SSL provisioning job
            // dispatch(new ProvisionSslCertificate($domain));

            return response()->json([
                'message' => 'SSL provisioning initiated',
                'data' => $domain->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'SSL provisioning failed',
                'error' => $e->getMessage(),
            ], 422);
        }
    }
}
