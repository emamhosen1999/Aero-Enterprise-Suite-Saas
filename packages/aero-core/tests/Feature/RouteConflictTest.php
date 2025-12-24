<?php

namespace Aero\Core\Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Route Conflict Detection Test
 *
 * This test ensures no route URI conflicts exist across packages.
 * Route conflicts can cause 404s, unexpected behavior, or route shadowing.
 *
 * Run with: php artisan test --filter=RouteConflictTest
 */
class RouteConflictTest extends TestCase
{
    /**
     * Test that no routes have duplicate URIs with the same HTTP methods.
     *
     * A conflict occurs when two routes have:
     * - Same HTTP method(s)
     * - Same URI pattern
     *
     * Note: Routes on different domains (via middleware) are NOT conflicts
     * since they're separated at runtime by domain middleware.
     */
    public function test_no_route_uri_conflicts_exist(): void
    {
        $routes = Route::getRoutes();
        $routesByUri = [];
        $conflicts = [];

        foreach ($routes as $route) {
            $methods = $route->methods();
            $uri = $route->uri();
            $name = $route->getName() ?? 'unnamed';
            $action = $route->getActionName();

            // Create a unique key for method+uri combination
            foreach ($methods as $method) {
                // Skip HEAD method (auto-generated for GET routes)
                if ($method === 'HEAD') {
                    continue;
                }

                $key = "{$method}:{$uri}";

                if (isset($routesByUri[$key])) {
                    // Check if this is a real conflict or just domain-separated routes
                    $existingMiddleware = $routesByUri[$key]['middleware'];
                    $currentMiddleware = $route->gatherMiddleware();

                    // If both routes have domain middleware, they're not conflicts
                    $existingDomain = $this->extractDomainMiddleware($existingMiddleware);
                    $currentDomain = $this->extractDomainMiddleware($currentMiddleware);

                    if ($existingDomain && $currentDomain && $existingDomain !== $currentDomain) {
                        // Domain-separated routes are OK
                        continue;
                    }

                    // Real conflict found
                    $conflicts[] = [
                        'key' => $key,
                        'existing' => [
                            'name' => $routesByUri[$key]['name'],
                            'action' => $routesByUri[$key]['action'],
                            'middleware' => implode(', ', $existingMiddleware),
                        ],
                        'conflicting' => [
                            'name' => $name,
                            'action' => $action,
                            'middleware' => implode(', ', $currentMiddleware),
                        ],
                    ];
                } else {
                    $routesByUri[$key] = [
                        'name' => $name,
                        'action' => $action,
                        'middleware' => $route->gatherMiddleware(),
                    ];
                }
            }
        }

        if (count($conflicts) > 0) {
            $message = "Route conflicts detected:\n";
            foreach ($conflicts as $conflict) {
                $message .= "\n[{$conflict['key']}]\n";
                $message .= "  Existing: {$conflict['existing']['name']} ({$conflict['existing']['action']})\n";
                $message .= "    Middleware: {$conflict['existing']['middleware']}\n";
                $message .= "  Conflicting: {$conflict['conflicting']['name']} ({$conflict['conflicting']['action']})\n";
                $message .= "    Middleware: {$conflict['conflicting']['middleware']}\n";
            }
            $this->fail($message);
        }

        $this->assertTrue(true, 'No route conflicts detected');
    }

    /**
     * Test that all named routes are unique.
     */
    public function test_no_duplicate_route_names(): void
    {
        $routes = Route::getRoutes();
        $namedRoutes = [];
        $duplicates = [];

        foreach ($routes as $route) {
            $name = $route->getName();

            if ($name === null) {
                continue;
            }

            if (isset($namedRoutes[$name])) {
                $duplicates[$name] = [
                    'first' => $namedRoutes[$name],
                    'second' => $route->uri(),
                ];
            } else {
                $namedRoutes[$name] = $route->uri();
            }
        }

        if (count($duplicates) > 0) {
            $message = "Duplicate route names detected:\n";
            foreach ($duplicates as $name => $info) {
                $message .= "  [{$name}]\n";
                $message .= "    First: {$info['first']}\n";
                $message .= "    Second: {$info['second']}\n";
            }
            $this->fail($message);
        }

        $this->assertTrue(true, 'No duplicate route names detected');
    }

    /**
     * Test that reserved API prefixes are not used by non-platform packages.
     */
    public function test_reserved_api_prefixes_not_conflicted(): void
    {
        $reservedPrefixes = [
            'api/platform/',  // Reserved for Platform package
            'api/admin/',     // Reserved for Platform admin
        ];

        $routes = Route::getRoutes();
        $violations = [];

        foreach ($routes as $route) {
            $uri = $route->uri();
            $action = $route->getActionName();

            foreach ($reservedPrefixes as $prefix) {
                if (str_starts_with($uri, $prefix)) {
                    // Check if this route is from Platform package
                    if (! str_contains($action, 'Aero\\Platform\\')) {
                        $violations[] = [
                            'uri' => $uri,
                            'action' => $action,
                            'reserved_prefix' => $prefix,
                        ];
                    }
                }
            }
        }

        if (count($violations) > 0) {
            $message = "Reserved API prefix violations:\n";
            foreach ($violations as $violation) {
                $message .= "  [{$violation['uri']}]\n";
                $message .= "    Action: {$violation['action']}\n";
                $message .= "    Reserved: {$violation['reserved_prefix']} is reserved for Platform package\n";
            }
            $this->fail($message);
        }

        $this->assertTrue(true, 'No reserved API prefix violations');
    }

    /**
     * Extract domain middleware from a middleware array.
     *
     * @return string|null The domain middleware name or null
     */
    protected function extractDomainMiddleware(array $middleware): ?string
    {
        $domainMiddleware = ['platform.domain', 'admin.domain', 'tenant'];

        foreach ($middleware as $m) {
            if (in_array($m, $domainMiddleware, true)) {
                return $m;
            }
        }

        return null;
    }
}



