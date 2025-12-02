<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdatePlatformSettingRequest;
use App\Http\Resources\PlatformSettingResource;
use App\Models\PlatformSetting;
use App\Services\Settings\PlatformSettingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformSettingController extends Controller
{
    public function __construct(private readonly PlatformSettingService $service)
    {
        // Middleware handled by route group (auth:landlord)
    }

    public function index(Request $request): Response|PlatformSettingResource
    {
      

        $setting = PlatformSetting::current();

        if ($request->wantsJson()) {
            return new PlatformSettingResource($setting);
        }

        return Inertia::render('Admin/Settings/Platform', [
            'title' => 'Platform Settings',
            'platformSettings' => PlatformSettingResource::make($setting)->resolve(),
        ]);
    }

    public function update(UpdatePlatformSettingRequest $request): RedirectResponse
    {
        $user = $request->user('landlord');

        // Check permission for landlord guard
        if (! $user || ! $user->hasPermissionTo('platform.settings.update', 'landlord')) {
            \Log::warning('Platform Settings Update - Authorization Failed', [
                'user_id' => $user?->id,
                'required_permission' => 'platform.settings.update',
                'has_permission' => $user?->hasPermissionTo('platform.settings.update', 'landlord'),
            ]);
            abort(403, 'This action is unauthorized.');
        }

        $setting = PlatformSetting::current();

        $updated = $this->service->update(
            $setting,
            $request->validated(),
            [
                'logo' => $request->file('logo'),
                'logo_light' => $request->file('logo_light'),
                'logo_dark' => $request->file('logo_dark'),
                'square_logo' => $request->file('square_logo'),
                'favicon' => $request->file('favicon'),
                'social' => $request->file('social'),
            ]
        );

        return redirect()->back()->with('success', 'Platform settings updated successfully.');
    }
}
