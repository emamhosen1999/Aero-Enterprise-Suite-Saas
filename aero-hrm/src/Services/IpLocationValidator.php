<?php

namespace Aero\HRM\Services;

/**
 * IP address-based validation service
 * Supports multiple office locations with different IPs
 */
class IpLocationValidator extends BaseAttendanceValidator
{
    public function validate(): array
    {
        $config = $this->attendanceType->config ?? [];
        $ip = $this->request->ip();

        // Try to get real IP behind proxy
        if ($this->request->hasHeader('X-Forwarded-For')) {
            $forwardedIp = $this->request->header('X-Forwarded-For');
            if (strpos($forwardedIp, ',') !== false) {
                $ip = trim(explode(',', $forwardedIp)[0]);
            } else {
                $ip = $forwardedIp;
            }
        } elseif ($this->request->hasHeader('X-Real-IP')) {
            $ip = $this->request->header('X-Real-IP');
        }

        // Check for new multi-location format first, fallback to legacy
        $ipLocations = $config['ip_locations'] ?? [];
        $validationMode = $config['validation_mode'] ?? 'any';
        $allowWithoutNetwork = $config['allow_without_network'] ?? false;

        // Legacy support: single list format
        if (empty($ipLocations)) {
            $allowedIps = $config['allowed_ips'] ?? [];
            $allowedRanges = $config['allowed_ranges'] ?? [];

            if (! empty($allowedIps) || ! empty($allowedRanges)) {
                $ipLocations = [
                    [
                        'id' => 'legacy_office',
                        'name' => 'Office Network',
                        'allowed_ips' => $allowedIps,
                        'allowed_ranges' => $allowedRanges,
                        'is_active' => true,
                    ],
                ];
            }
        }

        // Filter active locations
        $activeLocations = array_filter($ipLocations, fn ($l) => ($l['is_active'] ?? true));

        if (empty($activeLocations)) {
            if ($allowWithoutNetwork) {
                return $this->successResponse('Attendance recorded without network validation (no locations configured).');
            }

            return $this->errorResponse('No IP addresses configured for this attendance type.');
        }

        // Validate against all active locations
        $validLocations = [];
        $checkedLocations = [];

        foreach ($activeLocations as $location) {
            $allowedIps = $location['allowed_ips'] ?? [];
            $allowedRanges = $location['allowed_ranges'] ?? [];

            $isValid = $this->isIpAllowed($ip, $allowedIps, $allowedRanges);

            $checkedLocations[] = [
                'id' => $location['id'] ?? 'unknown',
                'name' => $location['name'] ?? 'Unnamed',
                'is_valid' => $isValid,
            ];

            if ($isValid) {
                $validLocations[] = $location;
            }
        }

        // Apply validation mode
        $isAuthorized = $validationMode === 'all'
            ? count($validLocations) === count($activeLocations)
            : count($validLocations) > 0;

        if (! $isAuthorized) {
            if ($allowWithoutNetwork) {
                return $this->successResponse(
                    "Network IP ({$ip}) not in authorized list, but attendance allowed.",
                    ['ip' => $ip, 'fallback' => true]
                );
            }

            return $this->errorResponse(
                "Your network IP ({$ip}) is not authorized for attendance.",
                403
            );
        }

        return $this->successResponse(
            "Network IP ({$ip}) authorized for attendance at: ".($validLocations[0]['name'] ?? 'Valid location'),
            [
                'ip' => $ip,
                'matched_location' => $validLocations[0] ?? null,
                'validation_mode' => $validationMode,
                'checked_locations' => $checkedLocations,
            ]
        );
    }

    /**
     * Check if IP is in allowed list or ranges
     */
    private function isIpAllowed(string $ip, array $allowedIps, array $allowedRanges): bool
    {
        // Check exact IP match
        if (in_array($ip, $allowedIps)) {
            return true;
        }

        // Check IP ranges (CIDR notation)
        foreach ($allowedRanges as $range) {
            if ($this->ipInRange($ip, $range)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if IP is within a CIDR range
     */
    private function ipInRange(string $ip, string $range): bool
    {
        if (strpos($range, '/') === false) {
            // Not a CIDR range, treat as exact IP
            return $ip === $range;
        }

        [$subnet, $bits] = explode('/', $range);
        $bits = (int) $bits;

        $ipLong = ip2long($ip);
        $subnetLong = ip2long($subnet);

        if ($ipLong === false || $subnetLong === false) {
            return false;
        }

        $mask = -1 << (32 - $bits);
        $subnetLong &= $mask;

        return ($ipLong & $mask) === $subnetLong;
    }
}
