<?php

namespace Aero\HRM\Services;

use Illuminate\Http\Request;

/**
 * Factory for creating attendance validators
 */
class AttendanceValidatorFactory
{
    /**
     * Extract base slug by removing numeric suffixes (e.g., wifi_ip_2 -> wifi_ip)
     */
    private static function getBaseSlug(string $slug): string
    {
        return preg_replace('/_\d+$/', '', $slug);
    }

    /**
     * Create appropriate validator based on attendance type
     */
    public static function create($attendanceType, Request $request): BaseAttendanceValidator
    {
        $baseSlug = self::getBaseSlug($attendanceType->slug);

        switch ($baseSlug) {
            case 'geo_polygon':
                return new PolygonLocationValidator($attendanceType, $request);

            case 'wifi_ip':
                return new IpLocationValidator($attendanceType, $request);

            case 'route-waypoint':
            case 'route_waypoint':
                return new RouteWaypointValidator($attendanceType, $request);

            case 'qr_code':
                return new QrCodeValidator($attendanceType, $request);

            default:
                throw new \InvalidArgumentException("Unsupported attendance type: {$attendanceType->slug}");
        }
    }
}
