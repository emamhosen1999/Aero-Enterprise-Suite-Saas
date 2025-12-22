<?php

namespace Aero\Platform\Http\Controllers\Auth;

use Aero\Platform\Services\Auth\SamlService;
use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SamlController extends Controller
{
    public function __construct(
        protected SamlService $samlService
    ) {}

    /**
     * Display available SSO providers.
     */
    public function providers(): JsonResponse
    {
        if (! $this->samlService->isEnabled()) {
            return response()->json(['providers' => []]);
        }

        $tenant = tenant();
        $idps = $this->samlService->getAvailableIdps($tenant);

        return response()->json([
            'providers' => array_values($idps),
            'enabled' => true,
        ]);
    }

    /**
     * Initiate SAML login.
     */
    public function login(Request $request, string $idp = 'default'): RedirectResponse|Response
    {
        if (! $this->samlService->isEnabled()) {
            return redirect()->route('login')
                ->with('error', 'SAML SSO is not enabled');
        }

        try {
            $returnTo = $request->input('returnTo', route('dashboard'));
            $tenant = tenant();

            $redirectUrl = $this->samlService->login($idp, $returnTo, $tenant);

            return redirect($redirectUrl);
        } catch (\Exception $e) {
            Log::error('SAML login initiation failed', [
                'idp' => $idp,
                'error' => $e->getMessage(),
            ]);

            return redirect()->route('login')
                ->with('error', 'Failed to initiate SSO login: '.$e->getMessage());
        }
    }

    /**
     * Handle SAML Assertion Consumer Service (ACS) - POST callback from IdP.
     */
    public function acs(Request $request, string $idp = 'default'): RedirectResponse
    {
        if (! $this->samlService->isEnabled()) {
            return redirect()->route('login')
                ->with('error', 'SAML SSO is not enabled');
        }

        try {
            $tenant = tenant();
            $result = $this->samlService->processResponse($idp, $tenant);

            if (! $result) {
                $errors = $this->samlService->getLastErrors();
                $reason = $this->samlService->getLastErrorReason();

                Log::error('SAML ACS processing failed', [
                    'idp' => $idp,
                    'errors' => $errors,
                    'reason' => $reason,
                ]);

                return redirect()->route('login')
                    ->with('error', 'SSO authentication failed: '.($reason ?: 'Unknown error'));
            }

            $user = $result['user'];

            // Log in the user
            Auth::login($user, true);

            // Log the SSO event
            activity('auth')
                ->causedBy($user)
                ->withProperties([
                    'method' => 'saml',
                    'idp' => $idp,
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'created' => $result['created'],
                ])
                ->log('User logged in via SAML SSO');

            Log::info('SAML SSO login successful', [
                'user_id' => $user->id,
                'idp' => $idp,
                'created' => $result['created'],
            ]);

            // Redirect to intended URL or dashboard
            $relayState = $request->input('RelayState');
            $redirectTo = $relayState ?: route('dashboard');

            return redirect($redirectTo);
        } catch (\Exception $e) {
            Log::error('SAML ACS exception', [
                'idp' => $idp,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->route('login')
                ->with('error', 'SSO authentication failed: '.$e->getMessage());
        }
    }

    /**
     * Handle SAML Single Logout Service (SLS).
     */
    public function sls(Request $request, string $idp = 'default'): RedirectResponse
    {
        if (! $this->samlService->isEnabled()) {
            return redirect()->route('login');
        }

        try {
            $tenant = tenant();
            $this->samlService->processSlo($idp, $tenant);

            // Log out locally
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')
                ->with('status', 'You have been logged out');
        } catch (\Exception $e) {
            Log::error('SAML SLS exception', [
                'idp' => $idp,
                'error' => $e->getMessage(),
            ]);

            // Still log out locally even if SLS fails
            Auth::logout();
            $request->session()->invalidate();

            return redirect()->route('login');
        }
    }

    /**
     * Initiate SAML logout.
     */
    public function logout(Request $request, string $idp = 'default'): RedirectResponse
    {
        if (! $this->samlService->isEnabled()) {
            return redirect()->route('logout');
        }

        try {
            $user = Auth::user();
            $tenant = tenant();

            // Get SAML session data
            $nameId = $user->saml_id ?? null;
            $sessionIndex = session('saml_session_index');

            $redirectUrl = $this->samlService->logout(
                $idp,
                route('login'),
                $nameId,
                $sessionIndex,
                $tenant
            );

            if ($redirectUrl) {
                return redirect($redirectUrl);
            }

            // Fall back to local logout if no SLO URL
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login');
        } catch (\Exception $e) {
            Log::error('SAML logout exception', [
                'idp' => $idp,
                'error' => $e->getMessage(),
            ]);

            // Fall back to local logout
            Auth::logout();
            $request->session()->invalidate();

            return redirect()->route('login');
        }
    }

    /**
     * Get SP metadata for IdP configuration.
     */
    public function metadata(string $idp = 'default'): Response
    {
        try {
            $tenant = tenant();
            $metadata = $this->samlService->getMetadata($idp, $tenant);

            return response($metadata, 200, [
                'Content-Type' => 'application/xml',
            ]);
        } catch (\Exception $e) {
            Log::error('SAML metadata generation failed', [
                'idp' => $idp,
                'error' => $e->getMessage(),
            ]);

            return response('Failed to generate metadata', 500);
        }
    }

    /**
     * Admin page for SAML configuration.
     */
    public function settings()
    {
        $tenant = tenant();

        return Inertia::render('Settings/SamlSettings', [
            'enabled' => $this->samlService->isEnabled(),
            'providers' => $this->samlService->getAvailableIdps($tenant),
            'currentConfig' => $tenant?->data['saml_idp'] ?? null,
            'spMetadataUrl' => route('saml.metadata'),
            'acsUrl' => route('saml.acs'),
            'sloUrl' => route('saml.sls'),
        ]);
    }

    /**
     * Save tenant SAML IdP configuration.
     */
    public function saveSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'label' => 'required|string|max:100',
            'entityId' => 'required|url',
            'ssoUrl' => 'required|url',
            'sloUrl' => 'nullable|url',
            'x509cert' => 'required|string',
        ]);

        try {
            $tenant = tenant();

            if (! $tenant) {
                return back()->with('error', 'Tenant not found');
            }

            $config = [
                'name' => $validated['name'],
                'label' => $validated['label'],
                'entityId' => $validated['entityId'],
                'singleSignOnService' => [
                    'url' => $validated['ssoUrl'],
                    'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
                ],
                'singleLogoutService' => $validated['sloUrl'] ? [
                    'url' => $validated['sloUrl'],
                    'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
                ] : null,
                'x509cert' => $validated['x509cert'],
            ];

            $this->samlService->saveTenantIdpConfig($tenant, $config);

            return back()->with('success', 'SAML SSO configuration saved successfully');
        } catch (\Exception $e) {
            Log::error('SAML settings save failed', ['error' => $e->getMessage()]);

            return back()->with('error', 'Failed to save configuration: '.$e->getMessage());
        }
    }

    /**
     * Test SAML configuration.
     */
    public function testConnection(Request $request): JsonResponse
    {
        try {
            $tenant = tenant();
            $idpConfig = $tenant?->data['saml_idp'] ?? null;

            if (! $idpConfig) {
                return response()->json([
                    'success' => false,
                    'message' => 'No SAML configuration found',
                ]);
            }

            $errors = $this->samlService->validateIdpConfig($idpConfig);

            if (! empty($errors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Configuration validation failed',
                    'errors' => $errors,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Configuration is valid',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
