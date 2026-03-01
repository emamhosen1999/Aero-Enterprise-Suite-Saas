<?php

namespace Aero\Rfi\Traits;

use Aero\Rfi\Services\GeoFencingService;
use Illuminate\Support\Facades\Log;

/**
 * HasGeoLock Trait - GPS-Based Anti-Fraud Protection (PATENTABLE)
 *
 * Automatically validates GPS coordinates before saving model.
 * Prevents fraudulent submissions from remote locations.
 *
 * Usage: Add this trait to RFI, Inspection, or any location-critical model
 */
trait HasGeoLock
{
    /**
     * Boot the trait
     */
    public static function bootHasGeoLock(): void
    {
        // Before creating/updating, validate GPS coordinates
        static::saving(function ($model) {
            return $model->validateGeoLock();
        });
    }

    /**
     * Validate GPS coordinates against claimed chainage
     *
     * @return bool True if validation passes or is disabled
     *
     * @throws \Exception If validation fails and strict mode is enabled
     */
    protected function validateGeoLock(): bool
    {
        // Skip validation if explicitly disabled (e.g., for admin bulk imports)
        if ($this->skipGeoValidation ?? false) {
            return true;
        }

        // Skip if no GPS data provided
        if (! $this->latitude || ! $this->longitude) {
            // If geo-lock is mandatory, throw exception
            if ($this->geoLockMandatory ?? true) {
                Log::channel('geofence')->warning('Missing GPS data', [
                    'model' => get_class($this),
                    'id' => $this->id ?? 'new',
                    'user_id' => auth()->id(),
                ]);

                throw new \Exception('GPS coordinates required for this submission. Please enable location services.');
            }

            return true; // Allow save if geo-lock is optional
        }

        // Skip if no chainage specified
        if (! $this->start_chainage && ! $this->chainage) {
            return true;
        }

        $chainage = $this->start_chainage ?? $this->chainage;
        $projectId = $this->project_id;

        if (! $projectId) {
            Log::channel('geofence')->error('Project ID missing for geo-validation', [
                'model' => get_class($this),
                'id' => $this->id ?? 'new',
            ]);

            return true; // Allow save if project context missing
        }

        // Perform geo-fencing validation
        $geoService = app(GeoFencingService::class);
        $tolerance = $this->geoTolerance ?? null;

        $validation = $geoService->validateLocation(
            (float) $this->latitude,
            (float) $this->longitude,
            (float) $chainage,
            (int) $projectId,
            $tolerance
        );

        // Store validation result in model for reference
        $this->geo_validation_result = json_encode([
            'valid' => $validation['valid'],
            'distance' => $validation['distance'],
            'expected_location' => $validation['expected_location'],
            'validated_at' => now()->toIso8601String(),
        ]);

        if (! $validation['valid']) {
            // Log the violation
            Log::channel('geofence')->warning('Geo-fence validation failed', [
                'model' => get_class($this),
                'id' => $this->id ?? 'new',
                'user_id' => auth()->id(),
                'claimed_chainage' => $chainage,
                'actual_location' => [
                    'lat' => $this->latitude,
                    'lng' => $this->longitude,
                ],
                'distance' => $validation['distance'],
                'message' => $validation['message'],
            ]);

            // If strict mode enabled, block the save
            if ($this->geoLockStrict ?? true) {
                throw new \Exception($validation['message'].' (Distance: '.$validation['distance'].'m)');
            }

            // Otherwise, just flag it for review
            $this->geo_validation_status = 'failed';
            $this->requires_review = true;
            $this->review_reason = 'Location mismatch detected';
        } else {
            $this->geo_validation_status = 'passed';
        }

        return true;
    }

    /**
     * Check if model passed geo-validation
     */
    public function isGeoValidated(): bool
    {
        return $this->geo_validation_status === 'passed';
    }

    /**
     * Get distance from expected location
     */
    public function getGeoDistanceAttribute(): ?float
    {
        if (! $this->geo_validation_result) {
            return null;
        }

        $result = json_decode($this->geo_validation_result, true);

        return $result['distance'] ?? null;
    }

    /**
     * Scope to query only geo-validated records
     */
    public function scopeGeoValidated($query)
    {
        return $query->where('geo_validation_status', 'passed');
    }

    /**
     * Scope to query records with geo-fence violations
     */
    public function scopeGeoViolations($query)
    {
        return $query->where('geo_validation_status', 'failed');
    }

    /**
     * Disable geo-validation for this model instance (admin override)
     */
    public function skipGeoValidation(): self
    {
        $this->skipGeoValidation = true;

        return $this;
    }
}
