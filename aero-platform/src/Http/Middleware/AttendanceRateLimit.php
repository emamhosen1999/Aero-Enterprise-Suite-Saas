<?php

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

class AttendanceRateLimit
{
    public function handle(Request $request, Closure $next)
    {
        $key = 'attendance_punch:'.$request->user()->id;

        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Too many attendance attempts. Please try again later.',
            ], 429);
        }

        RateLimiter::hit($key, 300); // 5 attempts per 5 minutes

        // Check for suspicious location jumps
        $lastLocation = Cache::get("last_location:{$request->user()->id}");
        if ($lastLocation && $request->has(['lat', 'lng'])) {
            $distance = $this->calculateDistance(
                $lastLocation['lat'], $lastLocation['lng'],
                $request->lat, $request->lng
            );

            // Suspicious if user "traveled" more than 10km in less than 5 minutes
            if ($distance > 10000 && now()->diffInMinutes($lastLocation['timestamp']) < 5) {
                \Log::warning('Suspicious attendance location jump', [
                    'user_id' => $request->user()->id,
                    'distance' => $distance,
                    'time_diff' => now()->diffInMinutes($lastLocation['timestamp']),
                ]);
            }
        }

        Cache::put("last_location:{$request->user()->id}", [
            'lat' => $request->lat,
            'lng' => $request->lng,
            'timestamp' => now(),
        ], 300);

        return $next($request);
    }

    private function calculateDistance($lat1, $lng1, $lat2, $lng2): float
    {
        $earthRadius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
