<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers\Api;

use Aero\Platform\Http\Controllers\Controller;
use Aero\Platform\Models\PartialRegistration;
use Aero\Platform\Notifications\ResumeRegistrationNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Handles saving and resuming incomplete tenant registrations via magic link.
 */
class ResumeRegistrationController extends Controller
{
    /**
     * Save registration progress and send magic link email.
     */
    public function saveProgress(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'step' => ['required', 'string', 'max:50'],
            'data' => ['required', 'array'],
        ]);

        // Generate secure token
        $token = Str::random(64);
        $expiresAt = now()->addDays(7);

        // Create or update partial registration
        $registration = PartialRegistration::updateOrCreate(
            ['email' => $validated['email']],
            [
                'token' => hash('sha256', $token),
                'step' => $validated['step'],
                'data' => $validated['data'],
                'expires_at' => $expiresAt,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]
        );

        // Send magic link email
        try {
            $registration->notify(new ResumeRegistrationNotification($token));

            Log::info('Resume registration link sent', [
                'email' => $validated['email'],
                'step' => $validated['step'],
                'expires_at' => $expiresAt->toDateTimeString(),
            ]);

            return response()->json([
                'message' => 'Magic link sent to your email',
                'expires_at' => $expiresAt->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send resume registration email', [
                'email' => $validated['email'],
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to send email. Please try again.',
            ], 500);
        }
    }

    /**
     * Resume registration from magic link token.
     */
    public function resume(Request $request, string $token): \Illuminate\Http\RedirectResponse
    {
        $hashedToken = hash('sha256', $token);

        $registration = PartialRegistration::where('token', $hashedToken)
            ->where('expires_at', '>', now())
            ->first();

        if (! $registration) {
            return redirect()
                ->route('platform.register.index')
                ->with('error', 'This link has expired or is invalid. Please start a new registration.');
        }

        // Restore registration data to session
        $registrationSession = app(\Aero\Platform\Services\Monitoring\Tenant\TenantRegistrationSession::class);

        $data = $registration->data;

        // Restore each step that was saved
        if (isset($data['account'])) {
            $registrationSession->putStep('account', $data['account']);
        }
        if (isset($data['details'])) {
            $registrationSession->putStep('details', $data['details']);
        }
        if (isset($data['admin'])) {
            $registrationSession->putStep('admin', $data['admin']);
        }
        if (isset($data['plan'])) {
            $registrationSession->putStep('plan', $data['plan']);
        }

        Log::info('Registration resumed from magic link', [
            'email' => $registration->email,
            'step' => $registration->step,
        ]);

        // Delete the used token
        $registration->delete();

        // Redirect to the appropriate step
        $stepRoutes = [
            'account-type' => 'platform.register.index',
            'details' => 'platform.register.details',
            'admin' => 'platform.register.admin',
            'plan' => 'platform.register.plan',
            'payment' => 'platform.register.payment',
        ];

        $route = $stepRoutes[$registration->step] ?? 'platform.register.index';

        return redirect()
            ->route($route)
            ->with('success', 'Welcome back! Your registration progress has been restored.');
    }
}
