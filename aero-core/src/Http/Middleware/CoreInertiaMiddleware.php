<?php

namespace Aero\Core\Http\Middleware;

use Aero\Core\Services\NavigationRegistry;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

/**
 * Handle Inertia Requests - Core Standalone Version
 *
 * This is a simplified, standalone middleware for aero-core that works
 * without any external module dependencies. For multi-tenant or platform
 * setups, the host application can extend this class.
 */
class CoreInertiaMiddleware extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     * Uses host app's view if available, otherwise falls back to package view.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Get the root view.
     */
    public function rootView(Request $request): string
    {
        // Use host app's app.blade.php if it exists
        if (view()->exists('app')) {
            return 'app';
        }

        // Fall back to package's view
        return 'aero-core::app';
    }

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
        $user = Auth::user();

        return [
            ...parent::share($request),
            'auth' => $this->getAuthProps($user, $request),
            'app' => $this->getAppProps(),
            'url' => $request->getPathInfo(),
            'navigation' => fn () => $this->getNavigationProps($user),
            'flash' => $this->getFlashProps($request),
            'settings' => $this->getSettingsProps(),
        ];
    }

    /**
     * Get authentication props.
     *
     * @return array<string, mixed>
     */
    protected function getAuthProps(?Authenticatable $user, Request $request): array
    {
        if (! $user) {
            return [
                'user' => null,
                'isAuthenticated' => false,
            ];
        }

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_name' => $user->user_name ?? null,
                'profile_image' => $user->profile_image ?? null,
                'avatar_url' => $user->avatar_url ?? null,
                'active' => $user->active ?? true,
                'roles' => method_exists($user, 'roles') && $user->roles ? $user->roles->pluck('name')->toArray() : [],
                'permissions' => method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name')->toArray() : [],
            ],
            'isAuthenticated' => true,
            'sessionValid' => $request->session()->isStarted(),
        ];
    }

    /**
     * Get application props.
     *
     * @return array<string, mixed>
     */
    protected function getAppProps(): array
    {
        return [
            'name' => config('app.name', 'Aero Core'),
            'version' => config('aero.core.version', '1.0.0'),
            'environment' => config('app.env', 'production'),
            'debug' => config('app.debug', false),
            'locale' => config('app.locale', 'en'),
            'timezone' => config('app.timezone', 'UTC'),
        ];
    }

    /**
     * Get navigation props from NavigationRegistry.
     *
     * @return array<string, mixed>
     */
    protected function getNavigationProps(?Authenticatable $user): array
    {
        if (! $user) {
            return [
                'modules' => [],
                'items' => [],
            ];
        }

        try {
            $registry = app(NavigationRegistry::class);

            return $registry->toFrontend();
        } catch (\Throwable $e) {
            return [
                'modules' => [],
                'items' => [],
            ];
        }
    }

    /**
     * Get flash message props.
     *
     * @return array<string, mixed>
     */
    protected function getFlashProps(Request $request): array
    {
        return [
            'success' => fn () => $request->session()->get('success'),
            'error' => fn () => $request->session()->get('error'),
            'warning' => fn () => $request->session()->get('warning'),
            'info' => fn () => $request->session()->get('info'),
            'message' => fn () => $request->session()->get('message'),
        ];
    }

    /**
     * Get settings props.
     *
     * @return array<string, mixed>
     */
    protected function getSettingsProps(): array
    {
        return [
            'branding' => [
                'logo' => asset('images/logo.png'),
                'logo_light' => asset('images/logo.png'),
                'logo_dark' => asset('images/logo-dark.png'),
                'favicon' => asset('favicon.ico'),
                'primary_color' => '#006FEE',
                'border_radius' => '12px',
                'border_width' => '2px',
                'font_family' => 'Inter',
            ],
            'site' => [
                'name' => config('app.name', 'Aero Core'),
            ],
        ];
    }
}
