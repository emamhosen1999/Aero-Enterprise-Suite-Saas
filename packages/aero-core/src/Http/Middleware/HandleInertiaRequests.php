<?php

namespace Aero\Core\Http\Middleware;

use Aero\Core\Http\Resources\SystemSettingResource;
use Aero\Core\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\View;
use Inertia\Middleware;
use Throwable;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     * Uses the 'aero-core' namespace to load from package, not host app.
     *
     * @var string
     */
    protected $rootView = 'aero-core::app';

    protected bool $resolvedSystemSetting = false;

    protected ?SystemSetting $cachedSystemSetting = null;

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        
        $systemSetting = $this->systemSetting();
        $systemSettingsPayload = $systemSetting
            ? SystemSettingResource::make($systemSetting)->resolve($request)
            : null;
            
        $organization = $systemSettingsPayload['organization'] ?? [];
        $branding = $systemSettingsPayload['branding'] ?? [];
        $companyName = $organization['company_name'] ?? config('app.name', 'Aero ERP');

        // Share branding with blade template
        View::share([
            'logoUrl' => $branding['logo_light'] ?? $branding['logo'] ?? asset('assets/images/logo.png'),
            'logoLightUrl' => $branding['logo_light'] ?? $branding['logo'] ?? asset('assets/images/logo.png'),
            'logoDarkUrl' => $branding['logo_dark'] ?? $branding['logo'] ?? asset('assets/images/logo.png'),
            'faviconUrl' => $branding['favicon'] ?? asset('assets/images/favicon.ico'),
            'siteName' => $companyName,
        ]);

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar_url' => $user->avatar_url ?? null,
                    'roles' => $user->roles?->pluck('name')->toArray() ?? [],
                ] : null,
                'isAuthenticated' => (bool) $user,
                'sessionValid' => (bool) $user,
            ],
            'app' => [
                'name' => $companyName,
                'version' => config('app.version', '1.0.0'),
                'environment' => config('app.env', 'production'),
            ],
            'systemSettings' => $systemSettingsPayload,
            'branding' => $branding,
            'theme' => [
                'defaultTheme' => 'OCEAN',
                'defaultBackground' => data_get($branding, 'login_background', 'pattern-1'),
                'darkMode' => data_get($branding, 'dark_mode', false),
                'animations' => data_get($branding, 'animations', true),
            ],
            'url' => $request->getPathInfo(),
            'csrfToken' => csrf_token(),
            'locale' => App::getLocale(),
            'translations' => fn () => $this->getTranslations(),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
            ],
        ];
    }

    /**
     * Get translations for the current locale.
     *
     * @return array<string, mixed>
     */
    protected function getTranslations(): array
    {
        $locale = App::getLocale();
        $translations = [];

        // Load JSON translations
        $jsonPath = lang_path("{$locale}.json");
        if (file_exists($jsonPath)) {
            $jsonTranslations = json_decode(file_get_contents($jsonPath), true);
            if ($jsonTranslations) {
                $translations = $jsonTranslations;
            }
        }

        return $translations;
    }

    /**
     * Get system setting (cached).
     */
    protected function systemSetting(): ?SystemSetting
    {
        if ($this->resolvedSystemSetting) {
            return $this->cachedSystemSetting;
        }

        $this->resolvedSystemSetting = true;

        try {
            $this->cachedSystemSetting = SystemSetting::current();
        } catch (Throwable $exception) {
            $this->cachedSystemSetting = null;
        }

        return $this->cachedSystemSetting;
    }
}
