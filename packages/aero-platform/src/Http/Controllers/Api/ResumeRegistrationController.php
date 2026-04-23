<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers\Api;

use Aero\Platform\Http\Controllers\Controller;
use Aero\Platform\Http\Requests\SaveRegistrationProgressRequest;
use Aero\Platform\Models\PartialRegistration;
use Aero\Platform\Notifications\ResumeRegistrationNotification;
use Aero\Platform\Services\Monitoring\Tenant\TenantRegistrationSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
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
    public function saveProgress(SaveRegistrationProgressRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Strip any non-whitelisted keys that might have slipped through
        $allowedDataKeys = ['account', 'details', 'verification', 'plan', 'trial', 'payment', 'provisioning'];
        $validated['data'] = array_intersect_key($validated['data'], array_flip($allowedDataKeys));
        $validated['step'] = $this->normalizeStep($validated['step']);

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
    public function resume(Request $request, string $token): RedirectResponse
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
        $registrationSession = app(TenantRegistrationSession::class);

        $data = $registration->data;

        // Restore each step that was saved
        if (isset($data['account'])) {
            $registrationSession->putStep('account', $data['account']);
        }
        if (isset($data['details'])) {
            $registrationSession->putStep('details', $data['details']);
        }
        if (isset($data['verification'])) {
            $registrationSession->putStep('verification', $data['verification']);
        }
        if (isset($data['plan'])) {
            $registrationSession->putStep('plan', $data['plan']);
        }
        if (isset($data['trial'])) {
            $registrationSession->putStep('trial', $data['trial']);
        }
        if (isset($data['payment'])) {
            $registrationSession->putStep('payment', $data['payment']);
        }
        if (isset($data['provisioning'])) {
            $registrationSession->putStep('provisioning', $data['provisioning']);
        }

        Log::info('Registration resumed from magic link', [
            'email' => $registration->email,
            'step' => $registration->step,
        ]);

        // Delete the used token
        $registration->delete();

        return $this->redirectToStep($registration->step, $registrationSession, $registration->email);
    }

    private function normalizeStep(string $step): string
    {
        return match ($step) {
            'account-type' => 'account',
            'verify-email', 'verify-phone' => 'verification',
            default => $step,
        };
    }

    private function redirectToStep(
        string $storedStep,
        TenantRegistrationSession $registrationSession,
        string $email,
    ): RedirectResponse {
        $step = $this->normalizeStep($storedStep);

        $stepRoutes = [
            'account' => 'platform.register.index',
            'details' => 'platform.register.details',
            'verification' => 'platform.register.verify-email',
            'plan' => 'platform.register.plan',
            'trial' => 'platform.register.payment',
            'payment' => 'platform.register.payment',
            'provisioning' => 'platform.register.provisioning',
        ];

        if ($step === 'provisioning') {
            $verification = $registrationSession->getStep('verification') ?? [];
            $tenantId = $verification['tenant_id'] ?? null;

            if ($tenantId) {
                return redirect()
                    ->route('platform.register.provisioning', ['tenant' => $tenantId])
                    ->with('success', 'Welcome back! Your registration progress has been restored.');
            }

            Log::warning('Resume requested for provisioning step without tenant_id; falling back to payment', [
                'email' => $email,
            ]);

            return redirect()
                ->route('platform.register.payment')
                ->with('success', 'Welcome back! Your registration progress has been restored.');
        }

        $route = $stepRoutes[$step] ?? 'platform.register.index';

        return redirect()
            ->route($route)
            ->with('success', 'Welcome back! Your registration progress has been restored.');
    }
}
