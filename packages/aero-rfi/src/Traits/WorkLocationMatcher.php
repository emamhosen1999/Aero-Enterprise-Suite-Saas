<?php

namespace Aero\Rfi\Traits;

use Aero\Rfi\Models\WorkLocation;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Trait for matching locations/chainages to work locations.
 */
trait WorkLocationMatcher
{
    /**
     * Cached work locations collection
     */
    private ?Collection $cachedWorkLocations = null;

    /**
     * Get work locations with caching
     */
    protected function getWorkLocations(): Collection
    {
        if ($this->cachedWorkLocations === null) {
            // Cache work locations for 5 minutes to reduce DB queries during bulk imports
            $this->cachedWorkLocations = Cache::remember('work_locations_all', 300, function () {
                return WorkLocation::active()->get();
            });
        }

        return $this->cachedWorkLocations;
    }

    /**
     * Clear the cached work locations
     */
    protected function clearWorkLocationCache(): void
    {
        $this->cachedWorkLocations = null;
        Cache::forget('work_locations_all');
    }

    /**
     * Find work location for a given location string
     */
    protected function findWorkLocationForLocation(string $location): ?WorkLocation
    {
        // Regex for extracting start and end chainages
        // Matches patterns like: K30+560-K30+570, K24+800, K13 TOLL STATION
        $chainageRegex = '/([A-Z]*K[0-9]+(?:\+[0-9]+(?:\.[0-9]+)?)?)\s*-\s*([A-Z]*K[0-9]+(?:\+[0-9]+(?:\.[0-9]+)?)?)|([A-Z]*K[0-9]+(?:\+[0-9]+(?:\.[0-9]+)?)?)/';

        if (! preg_match($chainageRegex, $location, $matches)) {
            Log::debug('WorkLocationMatcher: No chainage pattern found in location', ['location' => $location]);

            return null;
        }

        // Extract start and end chainages based on match groups
        $startChainage = ! empty($matches[1]) ? $matches[1] : ($matches[3] ?? null);
        $endChainage = ! empty($matches[2]) ? $matches[2] : null;

        if (! $startChainage) {
            return null;
        }

        $startChainageFormatted = $this->formatChainageToFloat($startChainage);
        $endChainageFormatted = $endChainage ? $this->formatChainageToFloat($endChainage) : null;

        $workLocations = $this->getWorkLocations();

        foreach ($workLocations as $workLocation) {
            $formattedStartLocation = $this->formatChainageToFloat($workLocation->chainage_from);
            $formattedEndLocation = $this->formatChainageToFloat($workLocation->chainage_to);

            // Check if the start chainage is within the work location's range
            if ($startChainageFormatted >= $formattedStartLocation &&
                $startChainageFormatted <= $formattedEndLocation) {
                Log::debug('WorkLocationMatcher: Match found for start chainage', [
                    'location' => $location,
                    'work_location' => $formattedStartLocation.'-'.$formattedEndLocation,
                ]);

                return $workLocation;
            }

            // If an end chainage exists, check if it's within the work location's range
            if ($endChainageFormatted &&
                $endChainageFormatted >= $formattedStartLocation &&
                $endChainageFormatted <= $formattedEndLocation) {
                Log::debug('WorkLocationMatcher: Match found for end chainage', [
                    'location' => $location,
                    'work_location' => $formattedStartLocation.'-'.$formattedEndLocation,
                ]);

                return $workLocation;
            }
        }

        Log::debug('WorkLocationMatcher: No work location found', ['location' => $location]);

        return null;
    }

    /**
     * Format chainage string to float for comparison
     *
     * @example K05+900 becomes 5.900
     * @example K30+560 becomes 30.560
     */
    protected function formatChainageToFloat(string $chainage): float
    {
        // Remove spaces and convert to uppercase
        $chainage = strtoupper(trim($chainage));

        // Extract K number and additional values
        if (preg_match('/K(\d+)(?:\+(\d+(?:\.\d+)?))?/', $chainage, $matches)) {
            $kNumber = (int) $matches[1];
            $additional = isset($matches[2]) ? (float) $matches[2] : 0;

            // Convert to a comparable format (e.g., K05+900 becomes 5.900)
            return $kNumber + ($additional / 1000);
        }

        return 0;
    }

    /**
     * Format chainage for display/storage
     */
    protected function formatChainageForDisplay(string $chainage): string
    {
        $chainage = strtoupper(trim($chainage));

        if (preg_match('/K(\d+)(?:\+(\d+(?:\.\d+)?))?/', $chainage, $matches)) {
            $kNumber = (int) $matches[1];
            $additional = isset($matches[2]) ? (int) $matches[2] : 0;

            return sprintf('K%02d+%03d', $kNumber, $additional);
        }

        return $chainage;
    }
}
