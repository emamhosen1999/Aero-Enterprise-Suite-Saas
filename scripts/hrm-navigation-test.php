<?php
/**
 * HRM Navigation Testing Script
 * 
 * This script tests all unique HRM pages by:
 * 1. Parsing the module configuration
 * 2. Extracting unique routes
 * 3. Testing each route for navigation, controller, and page file existence
 * 4. Providing detailed pass/fail report
 * 
 * Usage: php hrm-navigation-test.php
 */

// Standalone script - no autoload needed for basic functionality

class HRMNavigationTester
{
    private array $uniqueRoutes = [];
    private array $testResults = [];
    private string $packageBasePath;
    private string $hostBasePath;
    private array $routeControllerMap = [];
    
    public function __construct()
    {
        $this->packageBasePath = dirname(__DIR__) . '/packages/aero-hrm';
        $this->hostBasePath = dirname(__DIR__) . '/dbedc-erp';
        
        echo "🔍 HRM Navigation Testing Script\n";
        echo "================================\n\n";
        echo "📁 Package Path: {$this->packageBasePath}\n";
        echo "📁 Host Path: {$this->hostBasePath}\n\n";
    }
    
    /**
     * Extract unique routes from HRM module configuration
     */
    public function extractUniqueRoutes(): void
    {
        echo "📋 Step 1: Extracting unique routes from module config...\n";
        
        $moduleConfigPath = $this->packageBasePath . '/config/module.php';
        
        if (!file_exists($moduleConfigPath)) {
            echo "❌ Module config not found: {$moduleConfigPath}\n";
            return;
        }
        
        $config = require $moduleConfigPath;
        $routes = [];
        
        // Extract self-service routes
        if (isset($config['self_service'])) {
            foreach ($config['self_service'] as $item) {
                if (!empty($item['route'])) {
                    $routes[] = [
                        'category' => 'self-service',
                        'name' => $item['name'],
                        'route' => $item['route'],
                        'code' => $item['code'],
                        'priority' => $item['priority']
                    ];
                }
            }
        }
        
        // Extract submodule component routes
        if (isset($config['submodules'])) {
            foreach ($config['submodules'] as $submodule) {
                if (isset($submodule['components'])) {
                    foreach ($submodule['components'] as $component) {
                        if (!empty($component['route']) && $component['type'] === 'page') {
                            $routes[] = [
                                'category' => 'admin',
                                'submodule' => $submodule['code'],
                                'name' => $component['name'],
                                'route' => $component['route'],
                                'code' => $component['code'],
                                'priority' => $submodule['priority']
                            ];
                        }
                    }
                }
            }
        }
        
        // Remove duplicates and sort by route
        $uniqueRoutes = [];
        foreach ($routes as $route) {
            $key = $route['route'];
            if (!isset($uniqueRoutes[$key])) {
                $uniqueRoutes[$key] = $route;
            }
        }
        
        $this->uniqueRoutes = array_values($uniqueRoutes);
        
        echo "✅ Found " . count($this->uniqueRoutes) . " unique routes\n\n";
        
        // Display summary
        echo "📊 Route Summary:\n";
        foreach ($this->uniqueRoutes as $route) {
            echo "   → {$route['route']} ({$route['name']})\n";
        }
        echo "\n";
    }
    
    /**
     * Parse route files to build route-controller mapping
     */
    public function parseRouteFiles(): void
    {
        echo "🔍 Step 2: Parsing route files for controller mapping...\n";
        
        $routeFiles = [
            $this->packageBasePath . '/routes/web.php',
            $this->packageBasePath . '/routes/tenant.php',
            $this->hostBasePath . '/routes/web.php',
            $this->hostBasePath . '/routes/tenant.php'
        ];
        
        foreach ($routeFiles as $routeFile) {
            if (file_exists($routeFile)) {
                $this->parseRouteFile($routeFile);
            }
        }
        
        echo "✅ Parsed " . count($this->routeControllerMap) . " route mappings\n\n";
    }
    
    /**
     * Parse individual route file
     */
    private function parseRouteFile(string $filePath): void
    {
        $content = file_get_contents($filePath);
        $lines = explode("\n", $content);
        
        foreach ($lines as $line) {
            $line = trim($line);
            
            // Match Laravel route patterns
            if (preg_match('/Route::(get|post|put|patch|delete|any|match)\\s*\\(\\s*[\'"]([^\'"]*)[\'"]\\s*,\\s*[\'"]?([^\'",\\)]+)[\'"]?/i', $line, $matches)) {
                $method = strtoupper($matches[1]);
                $route = $matches[2];
                $action = $matches[3];
                
                // Convert route parameters
                $route = preg_replace('/\\{([^}]+)\\}/', '{id}', $route);
                
                $this->routeControllerMap[$route] = [
                    'method' => $method,
                    'action' => $action,
                    'file' => basename($filePath)
                ];
            }
        }
    }
    
    /**
     * Test each unique route
     */
    public function testRoutes(): void
    {
        echo "🧪 Step 3: Testing each unique route...\n\n";
        
        $passed = 0;
        $failed = 0;
        
        foreach ($this->uniqueRoutes as $route) {
            $testResult = $this->testSingleRoute($route);
            $this->testResults[] = $testResult;
            
            if ($testResult['passed']) {
                $passed++;
                echo "✅ {$route['route']} - {$route['name']}\n";
            } else {
                $failed++;
                echo "❌ {$route['route']} - {$route['name']}\n";
                foreach ($testResult['issues'] as $issue) {
                    echo "   └─ {$issue}\n";
                }
            }
        }
        
        echo "\n📊 Test Summary:\n";
        echo "✅ Passed: {$passed}\n";
        echo "❌ Failed: {$failed}\n";
        echo "📈 Success Rate: " . round(($passed / ($passed + $failed)) * 100, 1) . "%\n\n";
    }
    
    /**
     * Test individual route
     */
    private function testSingleRoute(array $route): array
    {
        $issues = [];
        $passed = true;
        
        $routePath = $route['route'];
        
        // 1. Check if route exists in route files
        $routeFound = false;
        $controllerInfo = null;
        
        foreach ($this->routeControllerMap as $mappedRoute => $info) {
            if ($this->routesMatch($routePath, $mappedRoute)) {
                $routeFound = true;
                $controllerInfo = $info;
                break;
            }
        }
        
        if (!$routeFound) {
            $issues[] = "Route not found in route files";
            $passed = false;
        }
        
        // 2. Check controller existence (if route found)
        if ($routeFound && $controllerInfo) {
            $controllerExists = $this->checkControllerExists($controllerInfo['action']);
            if (!$controllerExists) {
                $issues[] = "Controller not found: {$controllerInfo['action']}";
                $passed = false;
            }
        }
        
        // 3. Check page file existence
        $pageExists = $this->checkPageFileExists($route);
        if (!$pageExists) {
            $issues[] = "Page file not found";
            $passed = false;
        }
        
        // 4. Check for React page implementation
        $pageFileDetails = $this->getPageFileDetails($route);
        
        return [
            'route' => $route,
            'passed' => $passed,
            'issues' => $issues,
            'route_found' => $routeFound,
            'controller_info' => $controllerInfo,
            'page_file_details' => $pageFileDetails
        ];
    }
    
    /**
     * Check if two routes match (considering parameters)
     */
    private function routesMatch(string $route1, string $route2): bool
    {
        // Normalize routes - replace {id}, {any}, etc. with wildcards
        $pattern1 = preg_replace('/\\{[^}]+\\}/', '[^/]+', preg_quote($route1, '/'));
        $pattern2 = preg_replace('/\\{[^}]+\\}/', '[^/]+', preg_quote($route2, '/'));
        
        return $pattern1 === $pattern2 || preg_match("/^{$pattern1}$/", $route2) || preg_match("/^{$pattern2}$/", $route1);
    }
    
    /**
     * Check if controller exists
     */
    private function checkControllerExists(string $action): bool
    {
        // Parse controller@method or class string
        if (strpos($action, '@') !== false) {
            [$controller, $method] = explode('@', $action);
        } else {
            $controller = $action;
        }
        
        // Check in multiple locations
        $possiblePaths = [
            $this->packageBasePath . '/src/Http/Controllers/' . str_replace('\\', '/', $controller) . '.php',
            $this->hostBasePath . '/app/Http/Controllers/' . str_replace('\\', '/', $controller) . '.php',
            $this->hostBasePath . '/app/Http/Controllers/Tenant/' . str_replace('\\', '/', $controller) . '.php'
        ];
        
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check if page file exists
     */
    private function checkPageFileExists(array $route): bool
    {
        $details = $this->getPageFileDetails($route);
        return !empty($details['existing_files']);
    }
    
    /**
     * Get page file details
     */
    private function getPageFileDetails(array $route): array
    {
        $routePath = $route['route'];
        
        // Generate possible page file names
        $possibleNames = [];
        
        // Based on route segments
        $segments = array_filter(explode('/', $routePath));
        if (count($segments) >= 2) {
            $lastSegment = end($segments);
            $possibleNames[] = ucfirst($lastSegment) . '.jsx';
            $possibleNames[] = ucfirst(str_replace('-', '', ucwords($lastSegment, '-'))) . '.jsx';
        }
        
        // Based on component code
        if (isset($route['code'])) {
            $code = $route['code'];
            $possibleNames[] = ucfirst(str_replace('-', '', ucwords($code, '-'))) . '.jsx';
            $possibleNames[] = ucfirst($code) . '.jsx';
        }
        
        // Based on name
        $name = $route['name'];
        $possibleNames[] = str_replace(' ', '', $name) . '.jsx';
        $possibleNames[] = str_replace([' ', '/', '&', '°'], ['', '', '', ''], $name) . '.jsx';
        
        // Remove duplicates
        $possibleNames = array_unique($possibleNames);
        
        // Search locations
        $searchPaths = [
            $this->packageBasePath . '/resources/js/Pages',
            $this->hostBasePath . '/resources/js/Tenant/Pages',
            $this->hostBasePath . '/resources/js/Pages'
        ];
        
        $existingFiles = [];
        
        foreach ($searchPaths as $basePath) {
            if (is_dir($basePath)) {
                foreach ($possibleNames as $fileName) {
                    $filePath = $this->findFileRecursively($basePath, $fileName);
                    if ($filePath) {
                        $existingFiles[] = $filePath;
                    }
                }
            }
        }
        
        return [
            'possible_names' => $possibleNames,
            'search_paths' => $searchPaths,
            'existing_files' => array_unique($existingFiles)
        ];
    }
    
    /**
     * Find file recursively
     */
    private function findFileRecursively(string $dir, string $fileName): ?string
    {
        if (!is_dir($dir)) {
            return null;
        }
        
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS)
        );
        
        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getFilename() === $fileName) {
                return $file->getPathname();
            }
        }
        
        return null;
    }
    
    /**
     * Generate detailed report
     */
    public function generateDetailedReport(): void
    {
        echo "📋 Step 4: Generating detailed report...\n\n";
        
        echo "=" . str_repeat("=", 120) . "\n";
        echo sprintf("| %-40s | %-15s | %-15s | %-15s | %-30s |\n", 
            "Route", "Route Found", "Controller", "Page File", "Status");
        echo "|" . str_repeat("-", 120) . "|\n";
        
        foreach ($this->testResults as $result) {
            $route = $result['route']['route'];
            $routeFound = $result['route_found'] ? '✅ Found' : '❌ Missing';
            $controller = isset($result['controller_info']) ? '✅ Found' : '❌ Missing';
            $pageFile = !empty($result['page_file_details']['existing_files']) ? '✅ Found' : '❌ Missing';
            $status = $result['passed'] ? '✅ PASS' : '❌ FAIL';
            
            echo sprintf("| %-40s | %-15s | %-15s | %-15s | %-30s |\n",
                substr($route, 0, 40), 
                substr($routeFound, 0, 15), 
                substr($controller, 0, 15),
                substr($pageFile, 0, 15), 
                substr($status, 0, 30)
            );
        }
        
        echo "=" . str_repeat("=", 120) . "\n\n";
    }
    
    /**
     * Generate missing items report
     */
    public function generateMissingItemsReport(): void
    {
        echo "📋 Step 5: Missing Items Report...\n\n";
        
        $missingRoutes = [];
        $missingControllers = [];
        $missingPages = [];
        
        foreach ($this->testResults as $result) {
            if (!$result['passed']) {
                $routePath = $result['route']['route'];
                
                if (!$result['route_found']) {
                    $missingRoutes[] = $routePath;
                }
                
                if (isset($result['controller_info']) && !empty($result['controller_info'])) {
                    // Controller mapping exists but controller file missing
                    if (in_array("Controller not found: {$result['controller_info']['action']}", $result['issues'])) {
                        $missingControllers[] = $result['controller_info']['action'];
                    }
                } else if ($result['route_found']) {
                    // Route found but no controller mapping
                    $missingControllers[] = "Unknown controller for: " . $routePath;
                }
                
                if (empty($result['page_file_details']['existing_files'])) {
                    $missingPages[] = [
                        'route' => $routePath,
                        'name' => $result['route']['name'],
                        'possible_names' => $result['page_file_details']['possible_names']
                    ];
                }
            }
        }
        
        // Missing Routes
        if (!empty($missingRoutes)) {
            echo "🚫 Missing Routes (" . count($missingRoutes) . "):\n";
            foreach ($missingRoutes as $route) {
                echo "   → {$route}\n";
            }
            echo "\n";
        }
        
        // Missing Controllers
        if (!empty($missingControllers)) {
            echo "🚫 Missing Controllers (" . count($missingControllers) . "):\n";
            foreach (array_unique($missingControllers) as $controller) {
                echo "   → {$controller}\n";
            }
            echo "\n";
        }
        
        // Missing Pages
        if (!empty($missingPages)) {
            echo "🚫 Missing Page Files (" . count($missingPages) . "):\n";
            foreach ($missingPages as $page) {
                echo "   → {$page['route']} ({$page['name']})\n";
                echo "     Possible names: " . implode(', ', $page['possible_names']) . "\n\n";
            }
        }
    }
    
    /**
     * Run all tests
     */
    public function runAllTests(): void
    {
        $this->extractUniqueRoutes();
        $this->parseRouteFiles();
        $this->testRoutes();
        $this->generateDetailedReport();
        $this->generateMissingItemsReport();
        
        echo "✅ HRM Navigation Testing Complete!\n";
    }
}

// Run the tests
try {
    $tester = new HRMNavigationTester();
    $tester->runAllTests();
} catch (Exception $e) {
    echo "❌ Error running tests: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}