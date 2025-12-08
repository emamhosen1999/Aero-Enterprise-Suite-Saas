<?php

namespace Aero\HRM\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * QR Code validation service
 * Supports multiple QR codes, time-based codes, and location verification
 */
class QrCodeValidator extends BaseAttendanceValidator
{
    /**
     * Validate the QR code for attendance
     */
    public function validate(): array
    {
        $config = $this->attendanceType->config ?? [];
        $qrCode = $this->request->input('qr_code');
        $userLat = $this->request->input('lat');
        $userLng = $this->request->input('lng');

        // Get QR configuration
        $validQrCodes = $config['qr_codes'] ?? [];
        $codeExpiryHours = $config['code_expiry_hours'] ?? 24;
        $oneTimeUse = $config['one_time_use'] ?? false;
        $requireLocation = $config['require_location'] ?? false;
        $maxDistance = $config['max_distance'] ?? 100;

        // Validate QR code is provided
        if (! $qrCode) {
            return $this->errorResponse('QR code is required for validation. Please scan a valid attendance QR code.');
        }

        // Check if any QR codes are configured
        if (empty($validQrCodes)) {
            return $this->errorResponse('No QR codes configured for this attendance type. Please contact your administrator.');
        }

        // Find and validate the QR code
        $validCode = $this->findValidQrCode($qrCode, $validQrCodes, $codeExpiryHours, $oneTimeUse);

        if (! $validCode) {
            Log::warning('Invalid QR code attempt', [
                'user_id' => $this->request->user()?->id,
                'qr_code' => substr($qrCode, 0, 10).'...',
                'ip' => $this->request->ip(),
            ]);

            return $this->errorResponse('Invalid, expired, or already used QR code.', 403);
        }

        // Location verification if required
        if ($requireLocation || $validCode['require_location'] ?? false) {
            if (! $userLat || ! $userLng) {
                return $this->errorResponse('Location is required for this QR code. Please enable location access and try again.');
            }

            $codeLocation = $validCode['location'] ?? null;
            if ($codeLocation && isset($codeLocation['lat']) && isset($codeLocation['lng'])) {
                $distance = $this->calculateDistance(
                    $userLat,
                    $userLng,
                    $codeLocation['lat'],
                    $codeLocation['lng']
                );

                $codeMaxDistance = $validCode['max_distance'] ?? $maxDistance;

                if ($distance > $codeMaxDistance) {
                    return $this->errorResponse(
                        "You are {$distance}m away from the QR code location. Maximum allowed distance: {$codeMaxDistance}m.",
                        403
                    );
                }
            }
        }

        // Mark as used if one-time use
        if ($oneTimeUse || ($validCode['one_time_use'] ?? false)) {
            $this->markQrCodeAsUsed($validCode['id'] ?? $qrCode, $this->request->user()?->id);
        }

        return $this->successResponse('QR code validated successfully.', [
            'qr_code_id' => $validCode['id'] ?? null,
            'location' => $validCode['location'] ?? null,
            'location_name' => $validCode['name'] ?? 'Unknown location',
            'validated_at' => now()->toISOString(),
        ]);
    }

    /**
     * Find and validate QR code from the list
     */
    private function findValidQrCode(string $qrCode, array $validQrCodes, int $expiryHours, bool $globalOneTimeUse): ?array
    {
        foreach ($validQrCodes as $code) {
            // Check code match
            if (($code['code'] ?? '') !== $qrCode) {
                continue;
            }

            // Check if code is active
            if (isset($code['is_active']) && ! $code['is_active']) {
                continue;
            }

            // Check expiration (if set on individual code)
            if (isset($code['expires_at'])) {
                $expiresAt = Carbon::parse($code['expires_at']);
                if ($expiresAt->isPast()) {
                    continue;
                }
            }

            // Check dynamic/time-based expiration
            if (isset($code['created_at']) && $expiryHours > 0) {
                $createdAt = Carbon::parse($code['created_at']);
                if ($createdAt->addHours($expiryHours)->isPast()) {
                    continue;
                }
            }

            // Check if already used (one-time codes)
            $isOneTime = $globalOneTimeUse || ($code['one_time_use'] ?? false);
            if ($isOneTime && $this->isQrCodeUsed($code['id'] ?? $qrCode)) {
                continue;
            }

            return $code;
        }

        return null;
    }

    /**
     * Check if QR code has been used
     */
    private function isQrCodeUsed(string $codeId): bool
    {
        $cacheKey = "qr_code_used:{$codeId}";

        return Cache::has($cacheKey);
    }

    /**
     * Mark QR code as used
     */
    private function markQrCodeAsUsed(string $codeId, ?int $userId): void
    {
        $cacheKey = "qr_code_used:{$codeId}";

        // Store usage for 30 days
        Cache::put($cacheKey, [
            'user_id' => $userId,
            'used_at' => now()->toISOString(),
        ], now()->addDays(30));

        Log::info('QR code marked as used', [
            'code_id' => $codeId,
            'user_id' => $userId,
        ]);
    }

    /**
     * Generate a new QR code for attendance (static method for admin use)
     */
    public static function generateQrCode(array $options = []): array
    {
        $code = $options['code'] ?? self::generateUniqueCode();

        return [
            'id' => $options['id'] ?? 'qr_'.uniqid(),
            'code' => $code,
            'name' => $options['name'] ?? 'Attendance Point',
            'location' => $options['location'] ?? null,
            'max_distance' => $options['max_distance'] ?? 100,
            'require_location' => $options['require_location'] ?? false,
            'one_time_use' => $options['one_time_use'] ?? false,
            'is_active' => true,
            'created_at' => now()->toISOString(),
            'expires_at' => $options['expires_at'] ?? null,
            'qr_image_url' => self::generateQrImageUrl($code),
        ];
    }

    /**
     * Generate unique code for QR
     */
    private static function generateUniqueCode(): string
    {
        return strtoupper(bin2hex(random_bytes(8)));
    }

    /**
     * Generate QR code image URL (using external service or generate locally)
     */
    private static function generateQrImageUrl(string $code): string
    {
        // Using Google Charts API for QR generation
        $encoded = urlencode($code);

        return "https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl={$encoded}&choe=UTF-8";
    }
}
