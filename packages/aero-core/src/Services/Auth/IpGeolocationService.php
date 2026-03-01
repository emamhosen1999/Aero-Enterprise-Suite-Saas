<?php

declare(strict_types=1);

namespace Aero\Core\Services\Auth;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * IP Geolocation Service
 *
 * Provides IP-based geolocation services for security and analytics.
 * Supports multiple providers: MaxMind GeoIP2, IPApi, and others.
 *
 * Usage:
 * ```php
 * $geolocation = app(IpGeolocationService::class);
 *
 * $location = $geolocation->getLocation('192.168.1.1');
 * // Returns: ['country' => 'US', 'country_code' => 'US', 'city' => 'New York', ...]
 *
 * $distance = $geolocation->calculateDistance($location1, $location2);
 * // Returns: distance in kilometers
 * ```
 */
class IpGeolocationService
{
    protected string $provider;

    protected bool $cacheEnabled;

    protected int $cacheTtl;

    public function __construct()
    {
        $this->provider = config('security.ip_geolocation.provider', 'maxmind');
        $this->cacheEnabled = config('security.ip_geolocation.cache_results', true);
        $this->cacheTtl = config('security.ip_geolocation.cache_ttl_hours', 24) * 3600;
    }

    /**
     * Get location information for an IP address.
     *
     * @param  string  $ip  IP address to lookup
     * @return array Location information
     */
    public function getLocation(string $ip): array
    {
        // Handle localhost/private IPs
        if ($this->isPrivateOrLocalhost($ip)) {
            return $this->getDefaultLocation();
        }

        // Check cache first
        if ($this->cacheEnabled) {
            $cacheKey = "geolocation:{$this->provider}:".md5($ip);
            $cached = Cache::get($cacheKey);

            if ($cached) {
                return $cached;
            }
        }

        try {
            $location = match ($this->provider) {
                'maxmind' => $this->getLocationFromMaxMind($ip),
                'ipapi' => $this->getLocationFromIpApi($ip),
                'geoip2' => $this->getLocationFromGeoIP2($ip),
                default => $this->getLocationFromIpApi($ip), // fallback
            };

            // Cache the result
            if ($this->cacheEnabled && ! empty($location['country'])) {
                Cache::put($cacheKey, $location, $this->cacheTtl);
            }

            return $location;
        } catch (\Exception $e) {
            Log::warning('IP geolocation failed', [
                'ip' => $ip,
                'provider' => $this->provider,
                'error' => $e->getMessage(),
            ]);

            return $this->getDefaultLocation();
        }
    }

    /**
     * Calculate distance between two locations in kilometers.
     *
     * @param  array  $location1  First location with lat/lng
     * @param  array  $location2  Second location with lat/lng
     * @return float Distance in kilometers
     */
    public function calculateDistance(array $location1, array $location2): float
    {
        if (empty($location1['latitude']) || empty($location1['longitude']) ||
            empty($location2['latitude']) || empty($location2['longitude'])) {
            return 0.0;
        }

        $lat1 = deg2rad((float) $location1['latitude']);
        $lon1 = deg2rad((float) $location1['longitude']);
        $lat2 = deg2rad((float) $location2['latitude']);
        $lon2 = deg2rad((float) $location2['longitude']);

        $deltaLat = $lat2 - $lat1;
        $deltaLon = $lon2 - $lon1;

        // Haversine formula
        $a = sin($deltaLat / 2) * sin($deltaLat / 2) +
             cos($lat1) * cos($lat2) *
             sin($deltaLon / 2) * sin($deltaLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        // Earth's radius in kilometers
        $earthRadius = 6371;

        return $earthRadius * $c;
    }

    /**
     * Get maximum possible travel speed in km/h for impossible travel detection.
     *
     * @return float Maximum speed (commercial flight speed)
     */
    public function getMaxTravelSpeed(): float
    {
        return config('security.threat_detection.max_travel_speed_kmh', 900);
    }

    /**
     * Check if travel between two locations within given time is impossible.
     *
     * @param  array  $location1  Starting location
     * @param  array  $location2  Ending location
     * @param  int  $timeSeconds  Time between locations in seconds
     * @return bool True if travel is impossible
     */
    public function isImpossibleTravel(array $location1, array $location2, int $timeSeconds): bool
    {
        if ($timeSeconds <= 0) {
            return false;
        }

        $distance = $this->calculateDistance($location1, $location2);
        $timeHours = $timeSeconds / 3600;
        $requiredSpeed = $distance / $timeHours;

        return $requiredSpeed > $this->getMaxTravelSpeed();
    }

    /**
     * Get location from MaxMind GeoIP2 database.
     */
    protected function getLocationFromMaxMind(string $ip): array
    {
        $dbPath = config('security.ip_geolocation.database_path', storage_path('app/geoip'));

        if (! class_exists(\GeoIp2\Database\Reader::class)) {
            throw new \Exception('MaxMind GeoIP2 library not installed. Run: composer require geoip2/geoip2');
        }

        $reader = new \GeoIp2\Database\Reader($dbPath.'/GeoLite2-City.mmdb');
        $record = $reader->city($ip);

        return [
            'ip' => $ip,
            'country' => $record->country->name ?? 'Unknown',
            'country_code' => $record->country->isoCode ?? 'Unknown',
            'region' => $record->mostSpecificSubdivision->name ?? 'Unknown',
            'region_code' => $record->mostSpecificSubdivision->isoCode ?? 'Unknown',
            'city' => $record->city->name ?? 'Unknown',
            'postal_code' => $record->postal->code ?? 'Unknown',
            'latitude' => $record->location->latitude ?? 0,
            'longitude' => $record->location->longitude ?? 0,
            'timezone' => $record->location->timeZone ?? 'UTC',
            'provider' => 'maxmind',
        ];
    }

    /**
     * Get location from IP-API service (free tier: 1000 requests/month).
     */
    protected function getLocationFromIpApi(string $ip): array
    {
        $response = Http::timeout(5)->get("http://ip-api.com/json/{$ip}");

        if (! $response->successful()) {
            throw new \Exception('IP-API request failed');
        }

        $data = $response->json();

        if ($data['status'] !== 'success') {
            throw new \Exception('IP-API returned error: '.($data['message'] ?? 'Unknown error'));
        }

        return [
            'ip' => $ip,
            'country' => $data['country'] ?? 'Unknown',
            'country_code' => $data['countryCode'] ?? 'Unknown',
            'region' => $data['regionName'] ?? 'Unknown',
            'region_code' => $data['region'] ?? 'Unknown',
            'city' => $data['city'] ?? 'Unknown',
            'postal_code' => $data['zip'] ?? 'Unknown',
            'latitude' => $data['lat'] ?? 0,
            'longitude' => $data['lon'] ?? 0,
            'timezone' => $data['timezone'] ?? 'UTC',
            'isp' => $data['isp'] ?? 'Unknown',
            'provider' => 'ipapi',
        ];
    }

    /**
     * Get location from local GeoIP2 database (if available).
     */
    protected function getLocationFromGeoIP2(string $ip): array
    {
        // This would use a different GeoIP2 implementation
        // For now, fallback to IP-API
        return $this->getLocationFromIpApi($ip);
    }

    /**
     * Check if IP is private or localhost.
     */
    protected function isPrivateOrLocalhost(string $ip): bool
    {
        return in_array($ip, ['127.0.0.1', '::1', 'localhost']) ||
               ! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
    }

    /**
     * Get default location for localhost/private IPs.
     */
    protected function getDefaultLocation(): array
    {
        return [
            'ip' => 'localhost',
            'country' => 'Local',
            'country_code' => 'LCL',
            'region' => 'Local',
            'region_code' => 'LCL',
            'city' => 'Local',
            'postal_code' => '00000',
            'latitude' => 0,
            'longitude' => 0,
            'timezone' => 'UTC',
            'provider' => 'local',
        ];
    }
}
