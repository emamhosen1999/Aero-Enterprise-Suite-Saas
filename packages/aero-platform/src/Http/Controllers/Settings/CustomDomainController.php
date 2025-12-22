<?php

namespace Aero\Platform\Http\Controllers\Settings;

use Aero\Platform\Models\Domain;
use Aero\Platform\Services\Monitoring\Tenant\CustomDomainService;
use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CustomDomainController extends Controller
{
    public function __construct(
        protected CustomDomainService $domainService
    ) {}

    /**
     * Display the domain settings page.
     */
    public function index(): Response
    {
        $tenant = tenant();

        // Get all domains for the tenant
        $domains = Domain::where('tenant_id', $tenant->id)
            ->orderBy('is_primary', 'desc')
            ->orderBy('is_custom', 'asc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function (Domain $domain) {
                return [
                    'id' => $domain->id,
                    'domain' => $domain->domain,
                    'is_primary' => $domain->is_primary,
                    'is_custom' => $domain->is_custom,
                    'status' => $domain->status,
                    'ssl_status' => $domain->ssl_status,
                    'dns_verification_code' => $domain->dns_verification_code,
                    'verified_at' => $domain->verified_at?->toISOString(),
                    'verification_errors' => $domain->verification_errors,
                    'created_at' => $domain->created_at->toISOString(),
                ];
            });

        // Get platform domain from config
        $platformDomain = config('tenancy.central_domains.0', 'eos365.com');

        return Inertia::render('Platform/Admin/Settings/DomainManager', [
            'title' => 'Domain Settings',
            'domains' => $domains,
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name ?? $tenant->id,
            ],
            'platformDomain' => $platformDomain,
        ]);
    }

    /**
     * Store a new custom domain.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'domain' => ['required', 'string', 'max:255'],
        ]);

        try {
            $domain = $this->domainService->addDomain(
                tenant(),
                $request->input('domain')
            );

            return response()->json([
                'success' => true,
                'message' => 'Domain added successfully. Please configure your DNS settings.',
                'domain' => [
                    'id' => $domain->id,
                    'domain' => $domain->domain,
                    'is_custom' => $domain->is_custom,
                    'status' => $domain->status,
                    'dns_verification_code' => $domain->dns_verification_code,
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        }
    }

    /**
     * Verify DNS records for a domain.
     */
    public function verify(Domain $domain): JsonResponse
    {
        // Ensure domain belongs to current tenant
        if ($domain->tenant_id !== tenant()->id) {
            abort(403, 'Unauthorized access to domain.');
        }

        $result = $this->domainService->verifyDns($domain);

        return response()->json($result);
    }

    /**
     * Set a domain as primary.
     */
    public function setPrimary(Domain $domain): JsonResponse
    {
        // Ensure domain belongs to current tenant
        if ($domain->tenant_id !== tenant()->id) {
            abort(403, 'Unauthorized access to domain.');
        }

        try {
            $this->domainService->setPrimary($domain);

            return response()->json([
                'success' => true,
                'message' => 'Primary domain updated successfully.',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        }
    }

    /**
     * Remove a custom domain.
     */
    public function destroy(Domain $domain): JsonResponse
    {
        // Ensure domain belongs to current tenant
        if ($domain->tenant_id !== tenant()->id) {
            abort(403, 'Unauthorized access to domain.');
        }

        try {
            $this->domainService->removeDomain($domain);

            return response()->json([
                'success' => true,
                'message' => 'Domain removed successfully.',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        }
    }
}
