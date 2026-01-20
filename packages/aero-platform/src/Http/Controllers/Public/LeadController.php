<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers\Public;

use Aero\Platform\Models\ProspectLead;
use Aero\Platform\Services\Marketing\LeadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Public Lead Controller
 *
 * Handles public lead capture endpoints (contact forms, demo requests, etc.).
 */
class LeadController extends Controller
{
    public function __construct(
        protected LeadService $leadService
    ) {}

    /**
     * Capture lead from contact form.
     */
    public function contactForm(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'message' => ['nullable', 'string', 'max:5000'],
        ]);

        $utmData = $this->extractUtmData($request);

        $lead = $this->leadService->createFromFormSubmission(
            array_merge($validated, [
                'source' => ProspectLead::SOURCE_CONTACT_FORM,
                'form_name' => 'contact',
            ]),
            $utmData
        );

        return response()->json([
            'success' => true,
            'message' => 'Thank you for contacting us! We will get back to you soon.',
        ]);
    }

    /**
     * Capture lead from demo request.
     */
    public function demoRequest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'company' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'company_size' => ['nullable', 'string', 'in:1-10,11-50,51-200,201-500,500+'],
            'industry' => ['nullable', 'string', 'max:100'],
            'use_case' => ['nullable', 'string', 'max:1000'],
        ]);

        $utmData = $this->extractUtmData($request);

        $lead = $this->leadService->createFromFormSubmission(
            array_merge($validated, [
                'source' => ProspectLead::SOURCE_DEMO_REQUEST,
                'form_name' => 'demo',
                'interest_level' => 'high',
                'interests' => ['demo'],
            ]),
            $utmData
        );

        return response()->json([
            'success' => true,
            'message' => 'Thank you for your interest! Our team will contact you to schedule a demo.',
        ]);
    }

    /**
     * Capture lead from free trial signup interest.
     */
    public function trialInterest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
        ]);

        $utmData = $this->extractUtmData($request);

        $lead = $this->leadService->createFromFormSubmission(
            array_merge($validated, [
                'source' => ProspectLead::SOURCE_FREE_TRIAL,
                'form_name' => 'trial_interest',
                'interest_level' => 'high',
                'interests' => ['trial'],
            ]),
            $utmData
        );

        return response()->json([
            'success' => true,
            'message' => 'Great! You can start your free trial by creating an account.',
        ]);
    }

    /**
     * Capture lead from pricing inquiry.
     */
    public function pricingInquiry(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'employees' => ['nullable', 'string', 'in:1-10,11-50,51-200,201-500,500+'],
            'plan_interest' => ['nullable', 'string', 'max:100'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $utmData = $this->extractUtmData($request);

        $lead = $this->leadService->createFromFormSubmission(
            array_merge($validated, [
                'source' => ProspectLead::SOURCE_PRICING_PAGE,
                'form_name' => 'pricing',
                'interest_level' => 'high',
                'interests' => ['pricing', $validated['plan_interest'] ?? null],
            ]),
            $utmData
        );

        return response()->json([
            'success' => true,
            'message' => 'Thank you for your interest! Our sales team will reach out with pricing details.',
        ]);
    }

    /**
     * Generic lead capture endpoint.
     */
    public function capture(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'country' => ['nullable', 'string', 'max:100'],
            'source' => ['nullable', 'string', 'max:50'],
            'source_detail' => ['nullable', 'string', 'max:255'],
            'message' => ['nullable', 'string', 'max:5000'],
            'interests' => ['nullable', 'array'],
        ]);

        $utmData = $this->extractUtmData($request);

        $lead = $this->leadService->createFromFormSubmission(
            array_merge($validated, [
                'source' => $validated['source'] ?? ProspectLead::SOURCE_WEBSITE,
            ]),
            $utmData
        );

        return response()->json([
            'success' => true,
            'message' => 'Thank you for your interest!',
        ]);
    }

    /**
     * Extract UTM parameters from request.
     */
    protected function extractUtmData(Request $request): array
    {
        return array_filter([
            'utm_source' => $request->input('utm_source') ?? $request->cookie('utm_source'),
            'utm_medium' => $request->input('utm_medium') ?? $request->cookie('utm_medium'),
            'utm_campaign' => $request->input('utm_campaign') ?? $request->cookie('utm_campaign'),
            'utm_term' => $request->input('utm_term') ?? $request->cookie('utm_term'),
            'utm_content' => $request->input('utm_content') ?? $request->cookie('utm_content'),
            'referrer' => $request->headers->get('referer'),
        ]);
    }
}
