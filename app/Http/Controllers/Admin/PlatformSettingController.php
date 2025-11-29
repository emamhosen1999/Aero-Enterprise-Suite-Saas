<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdatePlatformSettingRequest;
use App\Http\Resources\PlatformSettingResource;
use App\Models\PlatformSetting;
use App\Services\Settings\PlatformSettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformSettingController extends Controller
{
    public function __construct(private readonly PlatformSettingService $service)
    {
        $this->middleware('auth');
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

    public function update(UpdatePlatformSettingRequest $request): JsonResponse
    {
        $setting = PlatformSetting::current();

        $updated = $this->service->update(
            $setting,
            $request->validated(),
            [
                'logo' => $request->file('logo'),
                'favicon' => $request->file('favicon'),
                'social' => $request->file('social'),
            ]
        );

        return (new PlatformSettingResource($updated))
            ->response()
            ->setStatusCode(200);
    }
}
