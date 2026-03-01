<?php

declare(strict_types=1);

namespace Aero\Core\Http\Middleware;

use Aero\Core\Services\Auth\ThreatDetectionService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Advanced Threat Detection Middleware
 *
 * Analyzes incoming requests for security threats and applies
 * appropriate countermeasures based on risk assessment.
 */
class ThreatDetectionMiddleware
{
    protected ThreatDetectionService $threatDetection;

    public function __construct(ThreatDetectionService $threatDetection)
    {
        $this->threatDetection = $threatDetection;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip threat detection for non-authenticated routes
        if (! Auth::check()) {
            return $next($request);
        }

        $user = Auth::user();

        // Analyze the request for threats
        $threatAnalysis = $this->threatDetection->analyzeLoginAttempt($user, $request);

        // Log threat analysis
        Log::channel('security')->info('Threat analysis completed', [
            'user_id' => $user->id,
            'risk_level' => $threatAnalysis['risk_level'],
            'risk_score' => $threatAnalysis['risk_score'],
            'threats' => $threatAnalysis['threats'],
            'ip' => $request->ip(),
        ]);

        // Apply automatic security measures based on risk level
        $this->applySecurityMeasures($request, $threatAnalysis, $user);

        // Add threat analysis to request for controllers to use
        $request->merge(['threat_analysis' => $threatAnalysis]);

        return $next($request);
    }

    /**
     * Apply security measures based on threat analysis.
     */
    protected function applySecurityMeasures(Request $request, array $analysis, $user): void
    {
        $actions = $analysis['actions'] ?? [];

        foreach ($actions as $action) {
            match ($action) {
                'require_2fa' => $this->requireTwoFactor($request),
                'email_notification' => $this->sendSecurityNotification($user, $analysis),
                'email_security_alert' => $this->sendSecurityAlert($user, $analysis),
                'notify_security_team' => $this->notifySecurityTeam($user, $analysis),
                'account_lock' => $this->lockAccount($user, $analysis),
                'temporary_account_lock' => $this->temporaryLockAccount($user),
                'device_verification_required' => $this->requireDeviceVerification($request),
                'captcha_required' => $this->requireCaptcha($request),
                'extended_session_monitoring' => $this->enableExtendedMonitoring($user),
                default => null, // Ignore unknown actions
            };
        }
    }

    /**
     * Require two-factor authentication for this session.
     */
    protected function requireTwoFactor(Request $request): void
    {
        session()->forget('2fa_verified');
        session()->put('2fa_required_due_to_risk', true);
    }

    /**
     * Send security notification to user.
     */
    protected function sendSecurityNotification($user, array $analysis): void
    {
        // Queue a job to send notification
        dispatch(function () use ($user, $analysis) {
            // Implementation would send email/SMS notification
            Log::info('Security notification queued', [
                'user_id' => $user->id,
                'risk_level' => $analysis['risk_level'],
            ]);
        });
    }

    /**
     * Send security alert to user.
     */
    protected function sendSecurityAlert($user, array $analysis): void
    {
        // Queue urgent security alert
        dispatch(function () use ($user, $analysis) {
            Log::warning('Security alert queued', [
                'user_id' => $user->id,
                'risk_level' => $analysis['risk_level'],
                'threats' => $analysis['threats'],
            ]);
        });
    }

    /**
     * Notify security team of critical threat.
     */
    protected function notifySecurityTeam($user, array $analysis): void
    {
        Log::critical('Critical security threat detected', [
            'user_id' => $user->id,
            'email' => $user->email,
            'risk_level' => $analysis['risk_level'],
            'risk_score' => $analysis['risk_score'],
            'threats' => $analysis['threats'],
            'metadata' => $analysis['metadata'],
        ]);

        // Queue notification to security team
        dispatch(function () {
            // Implementation would notify security team via Slack, email, etc.
        });
    }

    /**
     * Lock user account due to high risk.
     */
    protected function lockAccount($user, array $analysis): void
    {
        $user->update([
            'account_locked_at' => now(),
            'locked_reason' => 'Automatic lock due to high security risk: '.implode(', ', $analysis['threats']),
        ]);

        Log::critical('User account locked due to security threat', [
            'user_id' => $user->id,
            'threats' => $analysis['threats'],
        ]);
    }

    /**
     * Temporarily lock account (shorter duration).
     */
    protected function temporaryLockAccount($user): void
    {
        cache()->put(
            "temp_lock_user:{$user->id}",
            true,
            now()->addMinutes(15) // 15 minute temporary lock
        );

        Log::warning('User account temporarily locked', [
            'user_id' => $user->id,
            'duration' => '15 minutes',
        ]);
    }

    /**
     * Require device verification.
     */
    protected function requireDeviceVerification(Request $request): void
    {
        session()->put('device_verification_required', true);
        session()->put('device_verification_reason', 'suspicious_device');
    }

    /**
     * Require CAPTCHA verification.
     */
    protected function requireCaptcha(Request $request): void
    {
        session()->put('captcha_required', true);
        session()->put('captcha_reason', 'bot_behavior_detected');
    }

    /**
     * Enable extended session monitoring.
     */
    protected function enableExtendedMonitoring($user): void
    {
        cache()->put(
            "extended_monitoring_user:{$user->id}",
            true,
            now()->addHours(24) // Monitor for 24 hours
        );

        Log::info('Extended monitoring enabled for user', [
            'user_id' => $user->id,
            'duration' => '24 hours',
        ]);
    }
}
