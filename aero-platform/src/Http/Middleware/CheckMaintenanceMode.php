<?php

namespace Aero\Platform\Http\Middleware;

use Aero\Platform\Models\PlatformSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gatekeeper Middleware for Maintenance Mode
 *
 * This middleware operates at two levels:
 * 1. Global Platform Level - Checks platform_settings for system-wide maintenance
 * 2. Tenant/Workspace Level - Checks tenant->maintenance_mode for workspace-specific maintenance
 *
 * Bypass mechanisms:
 * - Specific IP addresses can be whitelisted to bypass maintenance
 * - A secret header (X-Maintenance-Bypass) can be used for testing
 * - Specific paths can be whitelisted (e.g., /api/health, /status)
 */
class CheckMaintenanceMode
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if request should bypass maintenance mode
        if ($this->shouldBypass($request)) {
            return $next($request);
        }

        // Level 1: Check Global Platform Maintenance Mode (use central database)
        $platformMaintenanceEnabled = tenancy()->central(function () {
            return PlatformSetting::isMaintenanceModeEnabled();
        });

        if ($platformMaintenanceEnabled) {
            $maintenanceStatus = tenancy()->central(function () {
                return PlatformSetting::getMaintenanceStatus();
            });

            return $this->maintenanceResponse(
                $request,
                'platform',
                $maintenanceStatus
            );
        }

        // Level 2: Check Tenant/Workspace Maintenance Mode
        if ($this->isTenantInMaintenance()) {
            $tenant = tenant();

            return $this->maintenanceResponse($request, 'workspace', [
                'enabled' => true,
                'message' => $tenant->data['maintenance_message']
                    ?? 'This workspace is currently undergoing maintenance. Please try again later.',
                'ends_at' => $tenant->data['maintenance_ends_at'] ?? null,
            ]);
        }

        return $next($request);
    }

    /**
     * Determine if the request should bypass maintenance mode.
     */
    protected function shouldBypass(Request $request): bool
    {
        // Check IP bypass (use central database for platform settings)
        $ipBypassed = tenancy()->central(function () use ($request) {
            return PlatformSetting::isIpBypassed($request->ip());
        });

        if ($ipBypassed) {
            return true;
        }

        // Check secret header bypass
        $bypassSecret = $request->header(PlatformSetting::BYPASS_HEADER);
        $secretValid = tenancy()->central(function () use ($bypassSecret) {
            return PlatformSetting::isSecretValid($bypassSecret);
        });

        if ($secretValid) {
            return true;
        }

        // Check allowed paths (health checks, status endpoints, etc.)
        $pathAllowed = tenancy()->central(function () use ($request) {
            return PlatformSetting::isPathAllowed($request->path());
        });

        if ($pathAllowed) {
            return true;
        }

        // Check for Laravel's built-in maintenance bypass cookie
        if ($this->hasValidBypassCookie($request)) {
            return true;
        }

        return false;
    }

    /**
     * Check if the current tenant is in maintenance mode.
     */
    protected function isTenantInMaintenance(): bool
    {
        // Only check if we're in a tenant context
        if (! function_exists('tenant') || ! tenant()) {
            return false;
        }

        $tenant = tenant();

        // Check the maintenance_mode column on tenants table
        return $tenant->isInMaintenanceMode();
    }

    /**
     * Check for Laravel's built-in maintenance bypass cookie.
     */
    protected function hasValidBypassCookie(Request $request): bool
    {
        $cookie = $request->cookie('laravel_maintenance');

        if (empty($cookie)) {
            return false;
        }

        $payload = json_decode(base64_decode($cookie), true);

        if (! is_array($payload)) {
            return false;
        }

        // Check if the bypass hasn't expired
        return isset($payload['expires_at']) && $payload['expires_at'] > time();
    }

    /**
     * Generate the maintenance mode response.
     *
     * @param  string  $level  Either 'platform' or 'workspace'
     */
    protected function maintenanceResponse(Request $request, string $level, array $status): Response
    {
        $message = $status['message'];
        $endsAt = $status['ends_at'] ?? null;

        $title = $level === 'platform'
            ? 'Platform Upgrading'
            : 'Workspace Upgrading';

        // API/JSON requests get a JSON response
        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'level' => $level,
                'title' => $title,
                'retry_after' => $endsAt,
            ], Response::HTTP_SERVICE_UNAVAILABLE, [
                'Retry-After' => $endsAt ? strtotime($endsAt) - time() : 3600,
            ]);
        }

        // Web requests get the 503 maintenance page
        return $this->render503Page($level, $title, $message, $endsAt);
    }

    /**
     * Render the 503 Service Unavailable page.
     */
    protected function render503Page(string $level, string $title, string $message, ?string $endsAt): Response
    {
        $html = $this->getMaintenanceHtml($level, $title, $message, $endsAt);

        return response($html, Response::HTTP_SERVICE_UNAVAILABLE, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Retry-After' => $endsAt ? strtotime($endsAt) - time() : 3600,
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }

    /**
     * Generate HTML for the maintenance page.
     *
     * This creates a beautiful, branded maintenance page that matches
     * the platform's design language.
     */
    protected function getMaintenanceHtml(string $level, string $title, string $message, ?string $endsAt): string
    {
        $levelColor = $level === 'platform' ? '#f59e0b' : '#6366f1';
        $levelIcon = $level === 'platform' ? $this->getPlatformIcon() : $this->getWorkspaceIcon();
        $levelBadge = $level === 'platform' ? 'Platform-wide Maintenance' : 'Workspace Maintenance';

        $estimatedTime = '';
        if ($endsAt) {
            $estimatedTime = <<<HTML
            <div class="eta">
                <span class="eta-label">Estimated completion:</span>
                <span class="eta-time" id="countdown" data-ends-at="{$endsAt}"></span>
            </div>
HTML;
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="60">
    <title>{$title} - aeos365</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700" rel="stylesheet" />
    <style>
        :root {
            --level-color: {$levelColor};
            --bg-primary: #0f172a;
            --bg-secondary: #1e293b;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --border-color: #334155;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-primary);
            padding: 1rem;
        }
        
        .container {
            max-width: 540px;
            width: 100%;
            text-align: center;
        }
        
        .icon-wrapper {
            width: 100px;
            height: 100px;
            margin: 0 auto 2rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid var(--level-color);
            animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        .icon-wrapper svg {
            width: 48px;
            height: 48px;
            color: var(--level-color);
        }
        
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-color);
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--level-color);
            margin-bottom: 1.5rem;
        }
        
        .badge::before {
            content: '';
            width: 8px;
            height: 8px;
            background: var(--level-color);
            border-radius: 50%;
            animation: blink 1.5s ease-in-out infinite;
        }
        
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
        
        h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 1rem;
            line-height: 1.2;
        }
        
        .message {
            font-size: 1rem;
            color: var(--text-secondary);
            line-height: 1.6;
            margin-bottom: 2rem;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border-color);
            border-radius: 1rem;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .eta {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .eta-label {
            font-size: 0.875rem;
            color: var(--text-secondary);
        }
        
        .eta-time {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--level-color);
            font-variant-numeric: tabular-nums;
        }
        
        .status-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 0.875rem;
            transition: color 0.2s;
        }
        
        .status-link:hover {
            color: var(--text-primary);
        }
        
        .status-link svg {
            width: 16px;
            height: 16px;
        }
        
        .footer {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid var(--border-color);
            font-size: 0.75rem;
            color: var(--text-secondary);
        }
        
        @media (max-width: 640px) {
            h1 { font-size: 1.5rem; }
            .icon-wrapper { width: 80px; height: 80px; }
            .icon-wrapper svg { width: 36px; height: 36px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon-wrapper">
            {$levelIcon}
        </div>
        
        <span class="badge">{$levelBadge}</span>
        
        <h1>{$title}</h1>
        
        <p class="message">{$message}</p>
        
        <div class="card">
            {$estimatedTime}
        </div>
        
        <a href="javascript:location.reload()" class="status-link">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh to check status
        </a>
        
        <div class="footer">
            aeos365 &copy; 2024. We apologize for any inconvenience.
        </div>
    </div>
    
    <script>
        (function() {
            const countdown = document.getElementById('countdown');
            if (!countdown) return;
            
            const endsAt = countdown.dataset.endsAt;
            if (!endsAt) return;
            
            const endTime = new Date(endsAt).getTime();
            
            function updateCountdown() {
                const now = Date.now();
                const diff = endTime - now;
                
                if (diff <= 0) {
                    countdown.textContent = 'Any moment now...';
                    setTimeout(() => location.reload(), 5000);
                    return;
                }
                
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                
                if (hours > 0) {
                    countdown.textContent = `${hours}h ${minutes}m ${seconds}s`;
                } else if (minutes > 0) {
                    countdown.textContent = `${minutes}m ${seconds}s`;
                } else {
                    countdown.textContent = `${seconds}s`;
                }
            }
            
            updateCountdown();
            setInterval(updateCountdown, 1000);
        })();
    </script>
</body>
</html>
HTML;
    }

    /**
     * Get the SVG icon for platform-level maintenance.
     */
    protected function getPlatformIcon(): string
    {
        return <<<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" />
</svg>
SVG;
    }

    /**
     * Get the SVG icon for workspace-level maintenance.
     */
    protected function getWorkspaceIcon(): string
    {
        return <<<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
</svg>
SVG;
    }
}
