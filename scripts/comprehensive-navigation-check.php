<?php
/**
 * Comprehensive Navigation-to-Page Verification Script
 * 
 * This script performs a complete chain verification:
 * 1. Check registered navigation items
 * 2. Verify routes exist for navigation items
 * 3. Check route definitions (controller/action)
 * 4. Verify controller methods exist
 * 5. Check if rendered pages exist
 */

// Check if we're in a Laravel project structure
$possibleAutoloadPaths = [
    __DIR__ . '/../vendor/autoload.php',
    __DIR__ . '/../../../autoload.php', // For packages
    __DIR__ . '/../../vendor/autoload.php'
];

foreach ($possibleAutoloadPaths as $autoloadPath) {
    if (file_exists($autoloadPath)) {
        require_once $autoloadPath;
        break;
    }
}

class NavigationChecker 
{
    private $basePath;
    private $results = [];
    private $errors = [];
    private $warnings = [];

    public function __construct($basePath = null) 
    {
        $this->basePath = $basePath ?: dirname(__DIR__);
        echo "🔍 Comprehensive Navigation-to-Page Verification\n";
        echo "================================================\n\n";
    }

    public function runCompleteCheck()
    {
        $this->checkStep1_Navigation();
        $this->checkStep2_Routes();
        $this->checkStep3_Controllers();
        $this->checkStep4_Pages();
        $this->generateReport();
    }

    private function checkStep1_Navigation()
    {
        echo "STEP 1: Checking Navigation Registration\n";
        echo "---------------------------------------\n";

        // Check navigation configuration files (updated for monorepo)
        $navFiles = [
            'config/navigation.php',
            'config/modules.php', 
            'config/hrm.php',
            'packages/aero-ui/resources/js/Layouts/App.jsx',
            'packages/aero-ui/resources/js/Layouts/Sidebar.jsx',
            'packages/aero-ui/resources/js/Components/Navigation/ModuleAwareSidebar.jsx',
            'packages/aero-ui/resources/js/Layouts/Navigation/Sidebar.jsx',
            'packages/aero-ui/resources/js/Layouts/Navigation/NavigationProvider.jsx',
            'packages/aero-core/src/Providers/CoreModuleProvider.php',
            'packages/aero-ui/src/AeroUIServiceProvider.php',
            'packages/aero-hrmac/src/HRMACServiceProvider.php',
        ];

        foreach ($navFiles as $file) {
            $fullPath = $this->basePath . '/' . $file;
            if (file_exists($fullPath)) {
                echo "✅ Found: $file\n";
                $this->analyzeNavigationFile($fullPath, $file);
            } else {
                echo "❌ Missing: $file\n";
                $this->errors[] = "Navigation file missing: $file";
            }
        }

        // Also check for HRM-specific navigation
        $hrmNavFiles = [
            'packages/aero-hrm/config/navigation.php',
            'packages/aero-ui/resources/js/Components/Navigation/HRMNavigation.jsx'
        ];

        foreach ($hrmNavFiles as $file) {
            $fullPath = $this->basePath . '/' . $file;
            if (file_exists($fullPath)) {
                echo "✅ Found HRM: $file\n";
                $this->analyzeNavigationFile($fullPath, $file);
            }
        }

        echo "\n";
    }

    private function analyzeNavigationFile($filePath, $fileName)
    {
        $content = file_get_contents($filePath);
        
        if (strpos($fileName, '.php') !== false) {
            // PHP navigation config
            $this->extractPHPNavigation($content, $fileName);
        } elseif (strpos($fileName, '.jsx') !== false) {
            // JSX navigation component
            $this->extractJSXNavigation($content, $fileName);
        }
    }

    private function extractPHPNavigation($content, $fileName)
    {
        // Look for route patterns in PHP files
        preg_match_all("/['\"]route['\"][^=]*=>[^'\"]*['\"]([^'\"]+)['\"]/", $content, $routes);
        preg_match_all("/['\"]name['\"][^=]*=>[^'\"]*['\"]([^'\"]+)['\"]/", $content, $names);

        if (!empty($routes[1])) {
            foreach ($routes[1] as $i => $route) {
                $name = isset($names[1][$i]) ? $names[1][$i] : 'Unknown';
                $this->results['navigation'][$fileName][] = [
                    'name' => $name,
                    'route' => $route,
                    'source' => 'PHP Config'
                ];
                echo "  📍 $name → $route\n";
            }
        }
    }

    private function extractJSXNavigation($content, $fileName)
    {
        // Look for route() calls or href patterns in JSX
        preg_match_all("/route\(['\"]([^'\"]+)['\"]\)/", $content, $routeCalls);
        preg_match_all("/href=['\"]([^'\"]+)['\"]/", $content, $hrefPatterns);

        if (!empty($routeCalls[1])) {
            foreach ($routeCalls[1] as $route) {
                $this->results['navigation'][$fileName][] = [
                    'name' => 'JSX Route',
                    'route' => $route,
                    'source' => 'JSX Component'
                ];
                echo "  📍 JSX Route → $route\n";
            }
        }
    }

    private function checkStep2_Routes()
    {
        echo "STEP 2: Checking Route Definitions\n";
        echo "----------------------------------\n";

        $routeFiles = [
            'routes/web.php',
            'routes/tenant.php', 
            'routes/admin.php',
            'routes/api.php',
            'packages/aero-hrm/routes/web.php',
            'packages/aero-hrm/routes/tenant.php',
            'packages/aero-core/routes/web.php',
            'packages/aero-platform/routes/web.php',
            'packages/aero-crm/routes/web.php',
        ];

        $allRoutes = [];

        foreach ($routeFiles as $routeFile) {
            $fullPath = $this->basePath . '/' . $routeFile;
            if (file_exists($fullPath)) {
                echo "✅ Analyzing: $routeFile\n";
                $routes = $this->parseRouteFile($fullPath, $routeFile);
                $allRoutes = array_merge($allRoutes, $routes);
            } else {
                echo "⚠️  Missing: $routeFile\n";
                $this->warnings[] = "Route file missing: $routeFile";
            }
        }

        $this->results['routes'] = $allRoutes;

        // Cross-reference navigation routes with defined routes
        $this->crossReferenceNavigationRoutes($allRoutes);
        echo "\n";
    }

    private function parseRouteFile($filePath, $fileName)
    {
        $content = file_get_contents($filePath);
        $routes = [];

        // Match Route::get/post/put/delete patterns
        preg_match_all("/Route::(get|post|put|delete|patch|resource|group)\s*\(\s*['\"]([^'\"]*)['\"]([^)]*)\)/", $content, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            $method = $match[1];
            $uri = $match[2];
            $rest = isset($match[3]) ? $match[3] : '';
            
            // Parse the rest of the route definition for action and name
            $action = '';
            $name = '';
            
            // Look for controller@method or class::method patterns
            if (preg_match("/['\"]([^'\"]*@[^'\"]*|[^'\"]*::[^'\"]*)['\"]|([A-Z][a-zA-Z0-9_\\\\]*::class)/", $rest, $actionMatch)) {
                $action = isset($actionMatch[1]) ? $actionMatch[1] : $actionMatch[2] ?? '';
            }
            
            // Look for ->name() calls
            if (preg_match("/->name\(['\"]([^'\"]*)['\"]?\)/", $rest, $nameMatch)) {
                $name = $nameMatch[1];
            }

            // Handle different route definition patterns
            if (strpos($action, '@') !== false) {
                // Controller@method format
                $parts = explode('@', $action);
                $controller = $parts[0];
                $method_name = $parts[1] ?? 'index';
            } elseif (strpos($action, '::') !== false) {
                // Controller::class format or Controller::method 
                $parts = explode('::', $action);
                $controller = $parts[0];
                $method_name = $parts[1] ?? 'index';
                if ($method_name === 'class') {
                    $method_name = 'index';
                }
            } else {
                $controller = $action;
                $method_name = 'index';
            }

            $routes[] = [
                'file' => $fileName,
                'method' => $method,
                'uri' => $uri,
                'name' => $name,
                'controller' => $controller,
                'action' => $method_name ?? '',
                'full_action' => $action
            ];

            echo "  📍 [$method] $uri → $action" . ($name ? " (name: $name)" : "") . "\n";
        }

        return $routes;
    }

    private function crossReferenceNavigationRoutes($allRoutes)
    {
        echo "\nCross-referencing Navigation → Routes:\n";
        
        if (!isset($this->results['navigation'])) {
            echo "⚠️  No navigation items found to cross-reference\n";
            return;
        }

        $routeNames = array_column($allRoutes, 'name');
        $routeUris = array_column($allRoutes, 'uri');

        foreach ($this->results['navigation'] as $navFile => $navItems) {
            echo "\nFrom $navFile:\n";
            foreach ($navItems as $navItem) {
                $found = false;
                
                // Check by route name
                if (in_array($navItem['route'], $routeNames)) {
                    echo "  ✅ {$navItem['name']}: {$navItem['route']} (found by name)\n";
                    $found = true;
                }
                // Check by URI pattern
                elseif (in_array($navItem['route'], $routeUris)) {
                    echo "  ✅ {$navItem['name']}: {$navItem['route']} (found by URI)\n";
                    $found = true;
                }
                
                if (!$found) {
                    echo "  ❌ {$navItem['name']}: {$navItem['route']} (NOT FOUND)\n";
                    $this->errors[] = "Navigation route not found: {$navItem['route']} from $navFile";
                }
            }
        }
    }

    private function checkStep3_Controllers()
    {
        echo "\nSTEP 3: Checking Controllers & Methods\n";
        echo "--------------------------------------\n";

        if (!isset($this->results['routes'])) {
            echo "⚠️  No routes found to check controllers\n";
            return;
        }

        foreach ($this->results['routes'] as $route) {
            if (empty($route['controller'])) continue;

            $this->verifyController($route);
        }

        echo "\n";
    }

    private function verifyController($route)
    {
        $controller = $route['controller'];
        $action = $route['action'];
        
        // Handle different controller path formats (updated for monorepo)
        $controllerPaths = [
            "app/Http/Controllers/$controller.php",
            "app/Http/Controllers/Tenant/$controller.php", 
            "app/Http/Controllers/Admin/$controller.php",
            "packages/aero-hrm/src/Http/Controllers/$controller.php",
            "packages/aero-core/src/Http/Controllers/$controller.php",
            "packages/aero-platform/src/Http/Controllers/$controller.php",
            "packages/aero-crm/src/Http/Controllers/$controller.php",
            "packages/aero-finance/src/Http/Controllers/$controller.php",
        ];

        $controllerFound = false;
        $methodFound = false;

        foreach ($controllerPaths as $path) {
            $fullPath = $this->basePath . '/' . $path;
            if (file_exists($fullPath)) {
                $controllerFound = true;
                $content = file_get_contents($fullPath);
                
                // Check if method exists
                if ($action && preg_match("/function\s+$action\s*\(/", $content)) {
                    $methodFound = true;
                    echo "  ✅ $controller::$action (found at $path)\n";
                    
                    // Extract what page this controller renders
                    $this->extractRenderedPage($content, $action, $route);
                } else {
                    echo "  ⚠️  $controller found but method '$action' missing (at $path)\n";
                    $this->warnings[] = "Method $action missing in controller $controller";
                }
                break;
            }
        }

        if (!$controllerFound) {
            echo "  ❌ Controller not found: $controller\n";
            $this->errors[] = "Controller not found: $controller";
        }
    }

    private function extractRenderedPage($controllerContent, $action, $route)
    {
        // Look for Inertia::render calls in the method
        preg_match_all("/Inertia::render\s*\(\s*['\"]([^'\"]+)['\"]/", $controllerContent, $inertiaRenders);
        
        // Look for view() calls
        preg_match_all("/view\s*\(\s*['\"]([^'\"]+)['\"]/", $controllerContent, $viewRenders);

        if (!empty($inertiaRenders[1])) {
            foreach ($inertiaRenders[1] as $pagePath) {
                $this->results['pages'][] = [
                    'route' => $route,
                    'page_path' => $pagePath,
                    'type' => 'Inertia',
                    'controller' => $route['controller'],
                    'action' => $action
                ];
                echo "    → Renders Inertia page: $pagePath\n";
            }
        }

        if (!empty($viewRenders[1])) {
            foreach ($viewRenders[1] as $viewPath) {
                $this->results['pages'][] = [
                    'route' => $route,
                    'page_path' => $viewPath,
                    'type' => 'Blade',
                    'controller' => $route['controller'],
                    'action' => $action
                ];
                echo "    → Renders Blade view: $viewPath\n";
            }
        }
    }

    private function checkStep4_Pages()
    {
        echo "STEP 4: Checking Page Files Exist\n";
        echo "---------------------------------\n";

        if (!isset($this->results['pages'])) {
            echo "⚠️  No pages found to verify\n";
            return;
        }

        foreach ($this->results['pages'] as $page) {
            $this->verifyPageFile($page);
        }

        echo "\n";
    }

    private function verifyPageFile($page)
    {
        $pagePath = $page['page_path'];
        $type = $page['type'];
        
        if ($type === 'Inertia') {
            // Check for JSX/React pages (updated for monorepo)
            $possiblePaths = [
                "resources/js/Pages/$pagePath.jsx",
                "resources/js/Tenant/Pages/$pagePath.jsx",
                "resources/js/Admin/Pages/$pagePath.jsx",
                "packages/aero-ui/resources/js/Pages/$pagePath.jsx",
                "packages/aero-hrm/resources/js/Pages/$pagePath.jsx",
                "packages/aero-core/resources/js/Pages/$pagePath.jsx",
                "packages/aero-crm/resources/js/Pages/$pagePath.jsx",
                "packages/aero-platform/resources/js/Pages/$pagePath.jsx",
            ];
        } else {
            // Check for Blade views (updated for monorepo)
            $possiblePaths = [
                "resources/views/" . str_replace('.', '/', $pagePath) . ".blade.php",
                "packages/aero-hrm/resources/views/" . str_replace('.', '/', $pagePath) . ".blade.php",
                "packages/aero-core/resources/views/" . str_replace('.', '/', $pagePath) . ".blade.php",
            ];
        }

        $pageFound = false;
        foreach ($possiblePaths as $path) {
            $fullPath = $this->basePath . '/' . $path;
            if (file_exists($fullPath)) {
                echo "  ✅ $pagePath ($type) found at: $path\n";
                $pageFound = true;
                
                // Verify page content is not empty
                $content = file_get_contents($fullPath);
                if (empty(trim($content))) {
                    echo "    ⚠️  Page file is empty\n";
                    $this->warnings[] = "Page file is empty: $path";
                }
                break;
            }
        }

        if (!$pageFound) {
            echo "  ❌ $pagePath ($type) NOT FOUND\n";
            $this->errors[] = "Page file not found: $pagePath ($type)";
            echo "    Searched in:\n";
            foreach ($possiblePaths as $path) {
                echo "      - $path\n";
            }
        }
    }

    private function generateReport()
    {
        echo "\n" . str_repeat("=", 60) . "\n";
        echo "COMPREHENSIVE NAVIGATION CHECK REPORT\n";
        echo str_repeat("=", 60) . "\n\n";

        // Summary
        $totalErrors = count($this->errors);
        $totalWarnings = count($this->warnings);
        
        if ($totalErrors === 0 && $totalWarnings === 0) {
            echo "🎉 ALL CHECKS PASSED! Navigation chain is complete.\n\n";
        } else {
            echo "📊 SUMMARY:\n";
            echo "  ❌ Errors: $totalErrors\n";
            echo "  ⚠️  Warnings: $totalWarnings\n\n";
        }

        // Detailed errors
        if (!empty($this->errors)) {
            echo "🚨 ERRORS TO FIX:\n";
            foreach ($this->errors as $i => $error) {
                echo "  " . ($i + 1) . ". $error\n";
            }
            echo "\n";
        }

        // Warnings
        if (!empty($this->warnings)) {
            echo "⚠️  WARNINGS:\n";
            foreach ($this->warnings as $i => $warning) {
                echo "  " . ($i + 1) . ". $warning\n";
            }
            echo "\n";
        }

        // Statistics
        echo "📈 STATISTICS:\n";
        echo "  Navigation Files Checked: " . (isset($this->results['navigation']) ? count($this->results['navigation']) : 0) . "\n";
        echo "  Routes Found: " . (isset($this->results['routes']) ? count($this->results['routes']) : 0) . "\n";
        echo "  Pages Verified: " . (isset($this->results['pages']) ? count($this->results['pages']) : 0) . "\n";

        echo "\n" . str_repeat("=", 60) . "\n";
        
        // Save detailed report to file
        $reportData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'summary' => [
                'errors' => $totalErrors,
                'warnings' => $totalWarnings,
                'status' => $totalErrors === 0 ? 'PASSED' : 'FAILED'
            ],
            'results' => $this->results,
            'errors' => $this->errors,
            'warnings' => $this->warnings
        ];

        $reportPath = $this->basePath . '/storage/logs/navigation-check-report.json';
        $reportDir = dirname($reportPath);
        
        if (!is_dir($reportDir)) {
            mkdir($reportDir, 0755, true);
        }
        
        file_put_contents($reportPath, json_encode($reportData, JSON_PRETTY_PRINT));
        echo "📄 Detailed report saved to: storage/logs/navigation-check-report.json\n";
    }
}

// Run the comprehensive check
$checker = new NavigationChecker();
$checker->runCompleteCheck();