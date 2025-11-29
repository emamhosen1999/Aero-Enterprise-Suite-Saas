<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateSystemSettingRequest;
use App\Http\Resources\SystemSettingResource;
use App\Models\SystemSetting;
use App\Services\Settings\SystemSettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SystemSettingController extends Controller
{
    public function __construct(private readonly SystemSettingService $service) {}

    public function index(Request $request): Response|SystemSettingResource
    {
        $setting = SystemSetting::current();

        if ($request->wantsJson()) {
            return new SystemSettingResource($setting);
        }

        return Inertia::render('Settings/SystemSettings', [
            'title' => 'System Settings',
            'systemSettings' => SystemSettingResource::make($setting)->resolve(),
        ]);
    }

    public function update(UpdateSystemSettingRequest $request): JsonResponse
    {
        $setting = SystemSetting::current();

        $updated = $this->service->update(
            $setting,
            $request->validated(),
            [
                'logo_light' => $request->file('logo_light'),
                'logo_dark' => $request->file('logo_dark'),
                'favicon' => $request->file('favicon'),
                'login_background' => $request->file('login_background'),
            ]
        );

        return (new SystemSettingResource($updated))
            ->response()
            ->setStatusCode(200);
    }
}
