<?php

namespace Aero\Platform\Http\Controllers;

use Aero\Platform\Models\PlatformSetting;
use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Aero\Core\Support\TenantCache;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceController extends Controller
{
    public function __construct()
    {
        // Middleware handled by route group (auth:landlord)
    }

    /**
     * Display the maintenance settings page.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $setting = PlatformSetting::current();

        $maintenanceSettings = [
            'maintenance_mode' => $setting->maintenance_mode ?? false,
            'maintenance_message' => $setting->maintenance_message ?? 'We are currently performing scheduled maintenance. We\'ll be back shortly.',
            'maintenance_bypass_secret' => $setting->maintenance_bypass_secret ?? '',
            'maintenance_bypass_ips' => $setting->maintenance_bypass_ips ?? [],
            'maintenance_allowed_paths' => $setting->maintenance_allowed_paths ?? ['/api/health', '/status'],
            'maintenance_ends_at' => $setting->maintenance_ends_at?->format('Y-m-d\TH:i') ?? '',
            'scheduled_maintenance_at' => $setting->scheduled_maintenance_at?->format('Y-m-d\TH:i') ?? '',
            'maintenance_skip_verification' => $setting->maintenance_skip_verification ?? false,
        ];

        if ($request->wantsJson()) {
            return response()->json($maintenanceSettings);
        }

        return Inertia::render('Platform/Admin/Developer/Maintenance', [
            'title' => 'System Maintenance',
            'settings' => $maintenanceSettings,
        ]);
    }

    /**
     * Update maintenance settings.
     */
    public function update(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'maintenance_mode' => 'required|boolean',
            'maintenance_message' => 'nullable|string|max:1000',
            'maintenance_bypass_secret' => 'nullable|string|max:64',
            'maintenance_bypass_ips' => 'nullable|array',
            'maintenance_bypass_ips.*' => 'ip',
            'maintenance_allowed_paths' => 'nullable|array',
            'maintenance_allowed_paths.*' => 'string|max:255',
            'maintenance_ends_at' => 'nullable|date',
            'scheduled_maintenance_at' => 'nullable|date',
            'maintenance_skip_verification' => 'nullable|boolean',
        ]);

        $setting = PlatformSetting::current();

        // Convert empty datetime strings to null
        if (empty($validated['maintenance_ends_at'])) {
            $validated['maintenance_ends_at'] = null;
        }
        if (empty($validated['scheduled_maintenance_at'])) {
            $validated['scheduled_maintenance_at'] = null;
        }

        $setting->update($validated);

        // Clear the maintenance cache so changes take effect immediately
        TenantCache::forget(PlatformSetting::CACHE_KEY_MAINTENANCE);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Maintenance settings updated successfully.',
                'settings' => [
                    'maintenance_mode' => $setting->maintenance_mode,
                    'maintenance_message' => $setting->maintenance_message,
                    'maintenance_bypass_secret' => $setting->maintenance_bypass_secret,
                    'maintenance_bypass_ips' => $setting->maintenance_bypass_ips,
                    'maintenance_allowed_paths' => $setting->maintenance_allowed_paths,
                    'maintenance_ends_at' => $setting->maintenance_ends_at?->format('Y-m-d\TH:i'),
                ],
            ]);
        }

        return redirect()->back()->with('success', 'Maintenance settings updated successfully.');
    }

    /**
     * Quick toggle for maintenance mode (API endpoint).
     */
    public function toggle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => 'required|boolean',
            'message' => 'nullable|string|max:1000',
        ]);

        $setting = PlatformSetting::current();

        if ($validated['enabled']) {
            $setting->enableMaintenanceMode(
                $validated['message'] ?? null,
                null
            );
        } else {
            $setting->disableMaintenanceMode();
        }

        return response()->json([
            'message' => $validated['enabled']
                ? 'Maintenance mode enabled.'
                : 'Maintenance mode disabled.',
            'maintenance_mode' => $setting->maintenance_mode,
        ]);
    }
}
