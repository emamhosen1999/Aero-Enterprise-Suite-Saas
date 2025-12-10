<?php

namespace Aero\Core\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class VersionService
{
    /**
     * Get the current application version
     */
    public static function getCurrentVersion(): string
    {
        return config('app.version');
    }

    /**
     * Check if the client version matches the server version
     */
    public static function isVersionMatch(string $clientVersion): bool
    {
        return $clientVersion === self::getCurrentVersion();
    }

    /**
     * Get version information for API responses
     */
    public static function getVersionInfo(): array
    {
        return [
            'version' => self::getCurrentVersion(),
            'timestamp' => now()->timestamp,
            'environment' => config('app.env'),
        ];
    }

    /**
     * Log version mismatch for monitoring
     */
    public static function logVersionMismatch(string $clientVersion, ?string $userAgent = null): void
    {
        Log::info('Version mismatch detected', [
            'client_version' => $clientVersion,
            'server_version' => self::getCurrentVersion(),
            'user_agent' => $userAgent,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Invalidate cache when version changes
     */
    public static function clearVersionCache(): void
    {
        Cache::forget('app_version_info');
        Cache::forget('app_version_timestamp');
    }

    /**
     * Get cached version info to reduce config calls
     */
    public static function getCachedVersionInfo(): array
    {
        return Cache::remember('app_version_info', 3600, function () {
            return self::getVersionInfo();
        });
    }
}
