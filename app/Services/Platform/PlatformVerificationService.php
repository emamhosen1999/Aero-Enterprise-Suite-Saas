<?php

namespace App\Services\Platform;

use App\Models\Tenant;
use App\Services\Mail\MailService;
use App\Services\Notifications\SmsGatewayService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class PlatformVerificationService
{
    public function __construct(
        protected SmsGatewayService $smsGateway,
        protected MailService $mailService
    ) {}

    /**
     * Send email verification code to tenant admin during registration.
     *
     * @return array{success: bool, message: string}
     */
    public function sendEmailVerificationCode(Tenant $tenant, string $email): array
    {
        // Generate 6-digit OTP
        $code = $this->generateCode();

        // Store hashed code in tenant record
        $tenant->update([
            'admin_email_verification_code' => Hash::make($code),
            'admin_email_verification_sent_at' => now(),
        ]);

        // Build email HTML content
        $appName = config('app.name');
        $htmlBody = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2 style='color: #1a1a1a;'>Email Verification</h2>
                <p>Thank you for registering with {$appName}!</p>
                <p>Your verification code is:</p>
                <h1 style='font-size: 32px; letter-spacing: 8px; color: #4F46E5; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px;'>{$code}</h1>
                <p>This code will expire in <strong>10 minutes</strong>.</p>
                <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'>
                <p style='color: #666;'>Organization: {$tenant->name}</p>
                <p style='color: #999; font-size: 12px;'>If you didn't request this, please ignore this email.</p>
            </div>
        ";

        // Send email using MailService (uses platform settings)
        $result = $this->mailService
            ->usePlatformSettings()
            ->sendMail($email, "Verify Your Email - {$appName}", $htmlBody);

        if ($result['success']) {
            Log::info('Email verification code sent during registration', [
                'tenant_id' => $tenant->id,
                'email' => $email,
            ]);

            return ['success' => true, 'message' => 'Verification code sent'];
        }

        Log::error('Failed to send email verification code', [
            'tenant_id' => $tenant->id,
            'email' => $email,
            'error' => $result['message'],
        ]);

        return ['success' => false, 'message' => $result['message']];
    }

    /**
     * Send phone verification code to tenant admin during registration.
     */
    public function sendPhoneVerificationCode(Tenant $tenant, string $phone): bool
    {
        // Generate 6-digit OTP
        $code = $this->generateCode();

        // Store hashed code in tenant record
        $tenant->update([
            'admin_phone_verification_code' => Hash::make($code),
            'admin_phone_verification_sent_at' => now(),
        ]);

        // Send SMS with OTP
        $message = 'Your '.config('app.name')." verification code is: {$code}. Valid for 10 minutes.";

        try {
            $this->smsGateway->send($phone, $message);

            Log::info('Phone verification code sent during registration', [
                'tenant_id' => $tenant->id,
                'phone' => $phone,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send phone verification code', [
                'tenant_id' => $tenant->id,
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Verify email verification code.
     */
    public function verifyEmailCode(Tenant $tenant, string $code): bool
    {
        // Check if code exists
        if (empty($tenant->admin_email_verification_code)) {
            return false;
        }

        // Check if code is expired (10 minutes)
        if ($tenant->admin_email_verification_sent_at?->addMinutes(10)->isPast()) {
            return false;
        }

        // Verify code
        if (! Hash::check($code, $tenant->admin_email_verification_code)) {
            return false;
        }

        // Mark email as verified
        $tenant->update([
            'admin_email_verified_at' => now(),
            'admin_email_verification_code' => null,
            'admin_email_verification_sent_at' => null,
        ]);

        Log::info('Email verified successfully during registration', [
            'tenant_id' => $tenant->id,
        ]);

        return true;
    }

    /**
     * Verify phone verification code.
     */
    public function verifyPhoneCode(Tenant $tenant, string $code): bool
    {
        // Check if code exists
        if (empty($tenant->admin_phone_verification_code)) {
            return false;
        }

        // Check if code is expired (10 minutes)
        if ($tenant->admin_phone_verification_sent_at?->addMinutes(10)->isPast()) {
            return false;
        }

        // Verify code
        if (! Hash::check($code, $tenant->admin_phone_verification_code)) {
            return false;
        }

        // Mark phone as verified
        $tenant->update([
            'admin_phone_verified_at' => now(),
            'admin_phone_verification_code' => null,
            'admin_phone_verification_sent_at' => null,
        ]);

        Log::info('Phone verified successfully during registration', [
            'tenant_id' => $tenant->id,
        ]);

        return true;
    }

    /**
     * Check if email verification can be resent (rate limiting).
     */
    public function canResendEmailCode(Tenant $tenant): bool
    {
        if (empty($tenant->admin_email_verification_sent_at)) {
            return true;
        }

        // Allow resend after 1 minute
        return $tenant->admin_email_verification_sent_at->addMinute()->isPast();
    }

    /**
     * Check if phone verification can be resent (rate limiting).
     */
    public function canResendPhoneCode(Tenant $tenant): bool
    {
        if (empty($tenant->admin_phone_verification_sent_at)) {
            return true;
        }

        // Allow resend after 1 minute
        return $tenant->admin_phone_verification_sent_at->addMinute()->isPast();
    }

    /**
     * Generate 6-digit verification code.
     */
    protected function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Check if email is verified.
     */
    public function isEmailVerified(Tenant $tenant): bool
    {
        return ! empty($tenant->admin_email_verified_at);
    }

    /**
     * Check if phone is verified.
     */
    public function isPhoneVerified(Tenant $tenant): bool
    {
        return ! empty($tenant->admin_phone_verified_at);
    }
}
