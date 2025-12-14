<?php

namespace Aero\Platform\Http\Controllers\Settings;

use Aero\HRM\Models\AttendanceSetting;
use Aero\HRM\Models\AttendanceType;
use Aero\Platform\Services\Attendance\QrCodeValidator;
use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AttendanceSettingController extends Controller
{
    public function index()
    {
        $attendanceSettings = AttendanceSetting::first();
        $attendanceTypes = AttendanceType::all();

        // Handle AJAX requests for settings data
        if (request()->expectsJson()) {
            return response()->json([
                'attendanceSettings' => $attendanceSettings,
                'attendanceTypes' => $attendanceTypes,
            ]);
        }

        return Inertia::render('Pages/HRM/Settings/AttendanceSettings', [
            'title' => 'Attendance Settings',
            'attendanceSettings' => $attendanceSettings,
            'attendanceTypes' => $attendanceTypes,
        ]);
    }

    public function updateSettings(Request $request)
    {
        // Validate the request data
        $data = $request->validate([
            'office_start_time' => 'required',
            'office_end_time' => 'required',
            'break_time_duration' => 'required|integer|min:0',
            'late_mark_after' => 'required|integer|min:0',
            'early_leave_before' => 'required|integer|min:0',
            'overtime_after' => 'required|integer|min:0',
            'weekend_days' => 'array',
            'weekend_days.*' => 'string|in:saturday,sunday,monday,tuesday,wednesday,thursday,friday',
        ]);

        $settings = AttendanceSetting::first();
        if (! $settings) {
            $settings = AttendanceSetting::create($data);
        } else {
            $settings->update($data);
        }

        return response()->json([
            'message' => 'Attendance settings updated successfully.',
            'attendanceSettings' => $settings,
        ]);
    }

    public function updateType(Request $request, $id)
    {
        $type = AttendanceType::findOrFail($id);

        // Check if only config is being updated (for waypoint/polygon/ip updates)
        $requestData = $request->except(['_token', '_method']);
        if ($request->has('config') && count($requestData) === 1) {
            // Only update config field - comprehensive validation
            $data = $request->validate([
                'config' => 'required|array',

                // Polygon multi-config validation
                'config.polygons' => 'sometimes|array',
                'config.polygons.*.id' => 'sometimes|string',
                'config.polygons.*.name' => 'sometimes|string',
                'config.polygons.*.points' => 'sometimes|array',
                'config.polygons.*.points.*.lat' => 'sometimes|numeric|between:-90,90',
                'config.polygons.*.points.*.lng' => 'sometimes|numeric|between:-180,180',
                'config.polygons.*.is_active' => 'sometimes|boolean',

                // IP location multi-config validation
                'config.ip_locations' => 'sometimes|array',
                'config.ip_locations.*.id' => 'sometimes|string',
                'config.ip_locations.*.name' => 'sometimes|string',
                'config.ip_locations.*.allowed_ips' => 'sometimes|array',
                'config.ip_locations.*.allowed_ranges' => 'sometimes|array',
                'config.ip_locations.*.is_active' => 'sometimes|boolean',

                // Route multi-config validation
                'config.routes' => 'sometimes|array',
                'config.routes.*.id' => 'sometimes|string',
                'config.routes.*.name' => 'sometimes|string',
                'config.routes.*.waypoints' => 'sometimes|array',
                'config.routes.*.waypoints.*.lat' => 'sometimes|numeric|between:-90,90',
                'config.routes.*.waypoints.*.lng' => 'sometimes|numeric|between:-180,180',
                'config.routes.*.tolerance' => 'sometimes|integer|min:1|max:10000',
                'config.routes.*.is_active' => 'sometimes|boolean',

                // QR code multi-config validation
                'config.qr_codes' => 'sometimes|array',
                'config.qr_codes.*.id' => 'sometimes|string',
                'config.qr_codes.*.code' => 'sometimes|string',
                'config.qr_codes.*.name' => 'sometimes|string',
                'config.qr_codes.*.location' => 'sometimes|array',
                'config.qr_codes.*.max_distance' => 'sometimes|integer|min:1',
                'config.qr_codes.*.require_location' => 'sometimes|boolean',
                'config.qr_codes.*.one_time_use' => 'sometimes|boolean',
                'config.qr_codes.*.is_active' => 'sometimes|boolean',
                'config.qr_codes.*.expires_at' => 'sometimes|nullable|date',

                // Legacy support
                'config.tolerance' => 'sometimes|integer|min:1|max:10000',
                'config.waypoints' => 'sometimes|array',
                'config.waypoints.*.lat' => 'sometimes|numeric|between:-90,90',
                'config.waypoints.*.lng' => 'sometimes|numeric|between:-180,180',
                'config.polygon' => 'sometimes|array',
                'config.polygon.*.lat' => 'sometimes|numeric|between:-90,90',
                'config.polygon.*.lng' => 'sometimes|numeric|between:-180,180',

                // Global config options
                'config.validation_mode' => 'sometimes|string|in:any,all',
                'config.allow_without_location' => 'sometimes|boolean',
                'config.allow_without_network' => 'sometimes|boolean',
                'config.code_expiry_hours' => 'sometimes|integer|min:1|max:720',
                'config.one_time_use' => 'sometimes|boolean',
                'config.require_location' => 'sometimes|boolean',
                'config.max_distance' => 'sometimes|integer|min:1|max:10000',
            ]);

            $type->update([
                'config' => $data['config'],
            ]);

            return response()->json([
                'message' => 'Attendance type config updated successfully.',
                'attendanceType' => $type->fresh(),
            ]);
        }

        // Full update for all fields
        $data = $request->validate([
            'name' => 'sometimes|required|string',
            'slug' => 'sometimes|required|string|unique:attendance_types,slug,'.$id,
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'config' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
            'priority' => 'sometimes|integer',
            'required_permissions' => 'nullable|array',
        ]);

        // Ensure config and required_permissions are arrays
        if (isset($data['config'])) {
            $data['config'] = $data['config'] ?? [];
        }
        if (isset($data['required_permissions'])) {
            $data['required_permissions'] = $data['required_permissions'] ?? [];
        }

        $type->update($data);

        return response()->json([
            'message' => 'Attendance type updated successfully.',
            'attendanceType' => $type->fresh(),
        ]);
    }

    /**
     * Add a new location/route/polygon/QR code to an attendance type
     */
    public function addConfigItem(Request $request, $id)
    {
        $type = AttendanceType::findOrFail($id);
        $config = $type->config ?? [];

        $itemType = $request->input('item_type'); // 'polygon', 'ip_location', 'route', 'qr_code'
        $itemData = $request->input('item_data');

        switch ($itemType) {
            case 'polygon':
                $config['polygons'] = $config['polygons'] ?? [];
                $config['polygons'][] = [
                    'id' => 'polygon_'.Str::random(8),
                    'name' => $itemData['name'] ?? 'New Location',
                    'points' => $itemData['points'] ?? [],
                    'is_active' => true,
                ];
                break;

            case 'ip_location':
                $config['ip_locations'] = $config['ip_locations'] ?? [];
                $config['ip_locations'][] = [
                    'id' => 'office_'.Str::random(8),
                    'name' => $itemData['name'] ?? 'New Office',
                    'allowed_ips' => $itemData['allowed_ips'] ?? [],
                    'allowed_ranges' => $itemData['allowed_ranges'] ?? [],
                    'is_active' => true,
                ];
                break;

            case 'route':
                $config['routes'] = $config['routes'] ?? [];
                $config['routes'][] = [
                    'id' => 'route_'.Str::random(8),
                    'name' => $itemData['name'] ?? 'New Route',
                    'waypoints' => $itemData['waypoints'] ?? [],
                    'tolerance' => $itemData['tolerance'] ?? 300,
                    'is_active' => true,
                ];
                break;

            case 'qr_code':
                $config['qr_codes'] = $config['qr_codes'] ?? [];
                $newQrCode = QrCodeValidator::generateQrCode([
                    'name' => $itemData['name'] ?? 'New QR Code',
                    'location' => $itemData['location'] ?? null,
                    'max_distance' => $itemData['max_distance'] ?? 100,
                    'require_location' => $itemData['require_location'] ?? false,
                    'one_time_use' => $itemData['one_time_use'] ?? false,
                    'expires_at' => $itemData['expires_at'] ?? null,
                ]);
                $config['qr_codes'][] = $newQrCode;
                break;

            default:
                return response()->json([
                    'message' => 'Invalid item type.',
                ], 422);
        }

        $type->update(['config' => $config]);

        return response()->json([
            'message' => ucfirst(str_replace('_', ' ', $itemType)).' added successfully.',
            'attendanceType' => $type->fresh(),
        ]);
    }

    /**
     * Remove a location/route/polygon/QR code from an attendance type
     */
    public function removeConfigItem(Request $request, $id)
    {
        $type = AttendanceType::findOrFail($id);
        $config = $type->config ?? [];

        $itemType = $request->input('item_type');
        $itemId = $request->input('item_id');

        $configKey = match ($itemType) {
            'polygon' => 'polygons',
            'ip_location' => 'ip_locations',
            'route' => 'routes',
            'qr_code' => 'qr_codes',
            default => null,
        };

        if (! $configKey || ! isset($config[$configKey])) {
            return response()->json([
                'message' => 'Invalid item type or no items found.',
            ], 422);
        }

        $config[$configKey] = array_values(array_filter(
            $config[$configKey],
            fn ($item) => ($item['id'] ?? '') !== $itemId
        ));

        $type->update(['config' => $config]);

        return response()->json([
            'message' => ucfirst(str_replace('_', ' ', $itemType)).' removed successfully.',
            'attendanceType' => $type->fresh(),
        ]);
    }

    /**
     * Generate a new QR code for attendance
     */
    public function generateQrCode(Request $request, $id)
    {
        $type = AttendanceType::findOrFail($id);

        if ($type->slug !== 'qr_code') {
            return response()->json([
                'message' => 'This attendance type does not support QR codes.',
            ], 422);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|array',
            'location.lat' => 'required_with:location|numeric|between:-90,90',
            'location.lng' => 'required_with:location|numeric|between:-180,180',
            'location.address' => 'nullable|string',
            'max_distance' => 'nullable|integer|min:1|max:10000',
            'require_location' => 'nullable|boolean',
            'one_time_use' => 'nullable|boolean',
            'expires_at' => 'nullable|date|after:now',
        ]);

        $qrCode = QrCodeValidator::generateQrCode($data);

        $config = $type->config ?? [];
        $config['qr_codes'] = $config['qr_codes'] ?? [];
        $config['qr_codes'][] = $qrCode;

        $type->update(['config' => $config]);

        return response()->json([
            'message' => 'QR code generated successfully.',
            'qr_code' => $qrCode,
            'attendanceType' => $type->fresh(),
        ]);
    }

    /**
     * Store a new attendance type
     */
    public function storeType(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'slug' => 'required|string|in:geo_polygon,wifi_ip,route_waypoint,qr_code',
            'icon' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'config' => 'nullable|array',
        ]);

        // Generate a unique slug by appending a number if needed
        $baseSlug = $data['slug'];
        $slug = $baseSlug;
        $counter = 1;

        while (AttendanceType::where('slug', $slug)->exists()) {
            $counter++;
            $slug = $baseSlug.'_'.$counter;
        }

        // Set default icon based on base slug if not provided
        $defaultIcons = [
            'geo_polygon' => '🗺️',
            'wifi_ip' => '📡',
            'route_waypoint' => '🛣️',
            'qr_code' => '📱',
        ];

        $type = AttendanceType::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'slug' => $slug,
            'icon' => $data['icon'] ?? $defaultIcons[$baseSlug] ?? '📍',
            'is_active' => $data['is_active'] ?? true,
            'config' => $data['config'] ?? [],
            'required_permissions' => [],
        ]);

        return response()->json([
            'message' => 'Attendance type created successfully.',
            'attendanceType' => $type,
        ]);
    }

    /**
     * Delete an attendance type
     */
    public function destroyType($id)
    {
        $type = AttendanceType::findOrFail($id);

        // Optionally check if this type is in use before deletion
        // For now, we'll allow deletion

        $type->delete();

        return response()->json([
            'message' => 'Attendance type deleted successfully.',
        ]);
    }
}
