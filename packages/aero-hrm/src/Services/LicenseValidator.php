<?php

namespace AeroModules\Hrm\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class LicenseValidator
{
    /**
     * License server URL
     */
    protected string $serverUrl;

    /**
     * License key
     */
    protected ?string $licenseKey;

    /**
     * Domain for validation
     */
    protected string $domain;

    /**
     * Cache key for validation result
     */
    protected string $cacheKey = 'aero_hrm_license_validation';

    /**
     * Cache key for last check timestamp
     */
    protected string $lastCheckKey = 'aero_hrm_license_last_check';

    /**
     * Grace period in days
     */
    protected int $gracePeriodDays;

    /**
     * Check interval in seconds
     */
    protected int $checkInterval;

    public function __construct()
    {
        $this->serverUrl = config('aero-hrm.license.server_url');
        $this->licenseKey = config('aero-hrm.license.key');
        $this->domain = $this->getCurrentDomain();
        $this->gracePeriodDays = config('aero-hrm.license.grace_period_days', 7);
        $this->checkInterval = config('aero-hrm.license.check_interval', 3600);
    }

    /**
     * Validate the license
     */
    public function validate(): bool
    {
        // If no license key configured, return false
        if (empty($this->licenseKey)) {
            return false;
        }

        // Check cache first for performance
        $cached = $this->getCachedValidation();
        if ($cached !== null) {
            return $cached;
        }

        // Call license server
        try {
            $response = $this->callLicenseServer();
            
            if ($response && isset($response['valid'])) {
                $isValid = $response['valid'];
                $this->cacheValidation($isValid);
                $this->updateLastCheckTime();
                return $isValid;
            }
        } catch (\Exception $e) {
            Log::warning('License validation failed: ' . $e->getMessage());
        }

        // If server call failed, check grace period
        if ($this->isWithinGracePeriod()) {
            Log::info('License validation using grace period');
            return true;
        }

        return false;
    }

    /**
     * Activate license on current domain
     */
    public function activate(string $licenseKey): array
    {
        try {
            $response = Http::timeout(10)
                ->post($this->serverUrl . '/api/licenses/activate', [
                    'license_key' => $licenseKey,
                    'domain' => $this->domain,
                    'ip_address' => $this->getServerIp(),
                ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if ($data['success'] ?? false) {
                    // Update config with license key
                    $this->updateLicenseConfig($licenseKey);
                    
                    // Cache the validation result
                    $this->cacheValidation(true);
                    $this->updateLastCheckTime();
                    
                    return [
                        'success' => true,
                        'message' => 'License activated successfully for ' . $this->domain,
                    ];
                }
                
                return [
                    'success' => false,
                    'message' => $data['message'] ?? 'License activation failed',
                ];
            }

            return [
                'success' => false,
                'message' => 'License server returned error: ' . $response->status(),
            ];
        } catch (\Exception $e) {
            Log::error('License activation error: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'License activation failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Check license status
     */
    public function status(): array
    {
        if (empty($this->licenseKey)) {
            return [
                'status' => 'inactive',
                'message' => 'No license key configured',
            ];
        }

        try {
            $response = Http::timeout(10)
                ->get($this->serverUrl . '/api/licenses/check/' . $this->licenseKey, [
                    'domain' => $this->domain,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'status' => $data['status'] ?? 'unknown',
                    'license_type' => $data['license_type'] ?? 'unknown',
                    'expires_at' => $data['expires_at'] ?? null,
                    'activations' => $data['activations'] ?? 0,
                    'max_activations' => $data['max_activations'] ?? 1,
                ];
            }
        } catch (\Exception $e) {
            Log::error('License status check error: ' . $e->getMessage());
        }

        return [
            'status' => 'error',
            'message' => 'Unable to check license status',
        ];
    }

    /**
     * Deactivate license on current domain
     */
    public function deactivate(): array
    {
        if (empty($this->licenseKey)) {
            return [
                'success' => false,
                'message' => 'No license key configured',
            ];
        }

        try {
            $response = Http::timeout(10)
                ->post($this->serverUrl . '/api/licenses/deactivate', [
                    'license_key' => $this->licenseKey,
                    'domain' => $this->domain,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if ($data['success'] ?? false) {
                    // Clear cached validation
                    Cache::forget($this->cacheKey);
                    Cache::forget($this->lastCheckKey);
                    
                    return [
                        'success' => true,
                        'message' => 'License deactivated successfully',
                    ];
                }
                
                return [
                    'success' => false,
                    'message' => $data['message'] ?? 'License deactivation failed',
                ];
            }

            return [
                'success' => false,
                'message' => 'License server returned error',
            ];
        } catch (\Exception $e) {
            Log::error('License deactivation error: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'License deactivation failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Call license server for validation
     */
    protected function callLicenseServer(): ?array
    {
        try {
            $response = Http::timeout(10)
                ->post($this->serverUrl . '/api/licenses/validate', [
                    'license_key' => $this->licenseKey,
                    'domain' => $this->domain,
                    'ip_address' => $this->getServerIp(),
                ]);

            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Exception $e) {
            Log::warning('License server call failed: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Get cached validation result
     */
    protected function getCachedValidation(): ?bool
    {
        $cached = Cache::get($this->cacheKey);
        
        if ($cached !== null) {
            // Check if we need to revalidate based on interval
            $lastCheck = Cache::get($this->lastCheckKey);
            
            if ($lastCheck && Carbon::parse($lastCheck)->addSeconds($this->checkInterval)->isFuture()) {
                return $cached;
            }
        }

        return null;
    }

    /**
     * Cache validation result
     */
    protected function cacheValidation(bool $isValid): void
    {
        Cache::put($this->cacheKey, $isValid, now()->addSeconds($this->checkInterval));
    }

    /**
     * Update last check timestamp
     */
    protected function updateLastCheckTime(): void
    {
        Cache::put($this->lastCheckKey, now(), now()->addDays($this->gracePeriodDays + 1));
    }

    /**
     * Check if within grace period
     */
    protected function isWithinGracePeriod(): bool
    {
        $lastCheck = Cache::get($this->lastCheckKey);
        
        if (!$lastCheck) {
            return false;
        }

        $gracePeriodEnd = Carbon::parse($lastCheck)->addDays($this->gracePeriodDays);
        
        return now()->isBefore($gracePeriodEnd);
    }

    /**
     * Get current domain
     */
    protected function getCurrentDomain(): string
    {
        return request()->getHost() ?? config('app.url');
    }

    /**
     * Get server IP address
     */
    protected function getServerIp(): string
    {
        return request()->ip() ?? '0.0.0.0';
    }

    /**
     * Update license configuration
     */
    protected function updateLicenseConfig(string $licenseKey): void
    {
        // Update .env file
        $envPath = base_path('.env');
        
        if (file_exists($envPath)) {
            $envContent = file_get_contents($envPath);
            
            if (strpos($envContent, 'HRM_LICENSE_KEY=') !== false) {
                $envContent = preg_replace(
                    '/HRM_LICENSE_KEY=.*/',
                    'HRM_LICENSE_KEY=' . $licenseKey,
                    $envContent
                );
            } else {
                $envContent .= "\nHRM_LICENSE_KEY=" . $licenseKey . "\n";
            }
            
            file_put_contents($envPath, $envContent);
        }
    }

    /**
     * Check if grace period is active
     */
    public function isGracePeriodActive(): bool
    {
        $lastCheck = Cache::get($this->lastCheckKey);
        
        if (!$lastCheck) {
            return false;
        }

        $lastCheckTime = Carbon::parse($lastCheck);
        $gracePeriodEnd = $lastCheckTime->copy()->addDays($this->gracePeriodDays);
        
        return now()->isBetween($lastCheckTime->copy()->addSeconds($this->checkInterval), $gracePeriodEnd);
    }

    /**
     * Get days remaining in grace period
     */
    public function gracePeriodDaysRemaining(): int
    {
        if (!$this->isGracePeriodActive()) {
            return 0;
        }

        $lastCheck = Cache::get($this->lastCheckKey);
        $gracePeriodEnd = Carbon::parse($lastCheck)->addDays($this->gracePeriodDays);
        
        return (int) now()->diffInDays($gracePeriodEnd, false);
    }
}
