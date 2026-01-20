<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers\Public;

use Aero\Platform\Models\Affiliate;
use Aero\Platform\Services\Marketing\AffiliateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

/**
 * Public Affiliate Controller
 *
 * Handles public affiliate referral tracking and application.
 */
class AffiliateController extends Controller
{
    public function __construct(
        protected AffiliateService $affiliateService
    ) {}

    /**
     * Track affiliate referral click.
     */
    public function track(Request $request, string $code): RedirectResponse
    {
        if (! $this->affiliateService->isEnabled()) {
            return redirect('/');
        }

        $affiliate = Affiliate::findByCode($code);

        if (! $affiliate || ! $affiliate->isApproved()) {
            return redirect('/');
        }

        // Record the referral click
        $this->affiliateService->trackReferralClick($code);

        // Get redirect URL (landing page or default)
        $redirectUrl = $request->query('redirect', '/');

        return redirect($redirectUrl);
    }

    /**
     * Show affiliate program landing page.
     */
    public function landing(): \Inertia\Response
    {
        if (! $this->affiliateService->isEnabled()) {
            abort(404);
        }

        $settings = \Aero\Platform\Models\PlatformSetting::current()->getAffiliateSettings();

        return Inertia::render('Platform/Public/Affiliate/Landing', [
            'title' => 'Affiliate Program',
            'commissionRate' => $settings['default_commission_rate'] ?? 10,
            'cookieDays' => $settings['cookie_days'] ?? 30,
            'termsUrl' => $settings['terms_url'] ?? null,
        ]);
    }

    /**
     * Show affiliate application form.
     */
    public function showApplication(): \Inertia\Response
    {
        if (! $this->affiliateService->isEnabled()) {
            abort(404);
        }

        return Inertia::render('Platform/Public/Affiliate/Apply', [
            'title' => 'Apply to Become an Affiliate',
        ]);
    }

    /**
     * Process affiliate application.
     */
    public function apply(Request $request): JsonResponse
    {
        if (! $this->affiliateService->isEnabled()) {
            return response()->json([
                'success' => false,
                'message' => 'Affiliate program is not currently available.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:affiliates,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            'how_promote' => ['nullable', 'string', 'max:1000'],
            'agree_terms' => ['required', 'accepted'],
        ]);

        $affiliate = $this->affiliateService->createAffiliate($validated);

        $message = $affiliate->isApproved()
            ? 'Welcome! Your affiliate account has been created. Check your email for login details.'
            : 'Thank you for applying! We will review your application and get back to you soon.';

        return response()->json([
            'success' => true,
            'message' => $message,
            'status' => $affiliate->status,
        ]);
    }

    /**
     * Affiliate login page.
     */
    public function showLogin(): \Inertia\Response
    {
        if (! $this->affiliateService->isEnabled()) {
            abort(404);
        }

        return Inertia::render('Platform/Public/Affiliate/Login', [
            'title' => 'Affiliate Login',
        ]);
    }

    /**
     * Affiliate dashboard (for approved affiliates).
     */
    public function dashboard(Request $request): \Inertia\Response
    {
        // In real implementation, this would require affiliate authentication
        // For now, just return a placeholder

        return Inertia::render('Platform/Public/Affiliate/Dashboard', [
            'title' => 'Affiliate Dashboard',
        ]);
    }
}
