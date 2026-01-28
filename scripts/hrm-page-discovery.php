<?php
/**
 * Simple HRM Page Discovery Script
 * 
 * This script simply scans for existing HRM-related React pages and matches them
 * with the routes defined in the module configuration.
 */

class HRMPageDiscovery
{
    private array $existingPages = [];
    private array $configRoutes = [];
    
    public function __construct()
    {
        echo "🔍 HRM Page Discovery Script\n";
        echo "===========================\n\n";
    }
    
    public function scanExistingPages(): void
    {
        echo "📁 Scanning for existing React pages...\n";
        
        $searchPaths = [
            'D:/laragon/www/Aero-Enterprise-Suite-Saas/packages/aero-ui/resources/js/Pages/HRM',
            'D:/laragon/www/Aero-Enterprise-Suite-Saas/packages/aero-hrm/resources/js/Pages',
            'D:/laragon/www/dbedc-erp/resources/js/Tenant/Pages/HRM',
            'D:/laragon/www/dbedc-erp/resources/js/Pages/HRM',
            'D:/laragon/www/dbedc-erp/resources/js/Tenant/Pages',
            'D:/laragon/www/dbedc-erp/resources/js/Pages'
        ];
        
        foreach ($searchPaths as $path) {
            if (is_dir($path)) {
                $this->scanDirectory($path, $path);
            }
        }
        
        echo "✅ Found " . count($this->existingPages) . " existing pages\n\n";
        
        foreach ($this->existingPages as $page) {
            echo "   → " . $page['relative_path'] . "\n";
        }
        echo "\n";
    }
    
    private function scanDirectory(string $dir, string $basePath): void
    {
        if (!is_dir($dir)) return;
        
        $items = scandir($dir);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            
            $fullPath = $dir . '/' . $item;
            
            if (is_dir($fullPath)) {
                $this->scanDirectory($fullPath, $basePath);
            } elseif (pathinfo($item, PATHINFO_EXTENSION) === 'jsx') {
                $relativePath = str_replace($basePath . '/', '', $fullPath);
                $relativePath = str_replace('\\', '/', $relativePath);
                
                $this->existingPages[] = [
                    'name' => pathinfo($item, PATHINFO_FILENAME),
                    'full_path' => $fullPath,
                    'relative_path' => $relativePath,
                    'base_path' => $basePath
                ];
            }
        }
    }
    
    public function loadConfigRoutes(): void
    {
        echo "📋 Loading routes from HRM module config...\n";
        
        $configPath = 'D:/laragon/www/Aero-Enterprise-Suite-Saas/packages/aero-hrm/config/module.php';
        
        if (!file_exists($configPath)) {
            echo "❌ Config file not found\n";
            return;
        }
        
        $config = require $configPath;
        
        // Self-service routes
        if (isset($config['self_service'])) {
            foreach ($config['self_service'] as $item) {
                if (!empty($item['route'])) {
                    $this->configRoutes[] = [
                        'type' => 'self-service',
                        'name' => $item['name'],
                        'route' => $item['route'],
                        'code' => $item['code']
                    ];
                }
            }
        }
        
        // Admin routes from submodules
        if (isset($config['submodules'])) {
            foreach ($config['submodules'] as $submodule) {
                if (isset($submodule['components'])) {
                    foreach ($submodule['components'] as $component) {
                        if (!empty($component['route']) && $component['type'] === 'page') {
                            $this->configRoutes[] = [
                                'type' => 'admin',
                                'submodule' => $submodule['code'],
                                'name' => $component['name'],
                                'route' => $component['route'],
                                'code' => $component['code']
                            ];
                        }
                    }
                }
            }
        }
        
        echo "✅ Loaded " . count($this->configRoutes) . " routes from config\n\n";
    }
    
    public function matchPagesWithRoutes(): void
    {
        echo "🔗 Matching existing pages with configured routes...\n\n";
        
        $implemented = 0;
        $missing = 0;
        $possibleMatches = [];
        $definiteMissing = [];
        
        foreach ($this->configRoutes as $route) {
            $found = false;
            $routePath = $route['route'];
            $routeName = $route['name'];
            
            // Generate possible file names for this route
            $possibleNames = $this->generatePossibleFileNames($route);
            
            // Check if any existing page matches
            foreach ($this->existingPages as $page) {
                if (in_array($page['name'], $possibleNames)) {
                    echo "✅ FOUND: {$routePath} → {$page['relative_path']}\n";
                    $found = true;
                    $implemented++;
                    break;
                }
            }
            
            if (!$found) {
                // Check for partial matches
                $partialMatch = false;
                foreach ($this->existingPages as $page) {
                    $similarity = 0;
                    similar_text(strtolower($page['name']), strtolower(str_replace([' ', '-', '/', '&', '°'], '', $routeName)), $similarity);
                    if ($similarity > 70) {
                        $possibleMatches[] = [
                            'route' => $routePath,
                            'name' => $routeName,
                            'page' => $page['relative_path'],
                            'similarity' => $similarity
                        ];
                        $partialMatch = true;
                        break;
                    }
                }
                
                if (!$partialMatch) {
                    echo "❌ MISSING: {$routePath} ({$routeName})\n";
                    $definiteMissing[] = [
                        'route' => $routePath,
                        'name' => $routeName,
                        'possible_names' => $possibleNames
                    ];
                    $missing++;
                }
            }
        }
        
        echo "\n📊 Summary:\n";
        echo "✅ Implemented: {$implemented}\n";
        echo "❌ Missing: {$missing}\n";
        echo "🤔 Possible Matches: " . count($possibleMatches) . "\n";
        
        if (count($this->configRoutes) > 0) {
            $percentage = round(($implemented / count($this->configRoutes)) * 100, 1);
            echo "📈 Implementation Rate: {$percentage}%\n\n";
        }
        
        // Show possible matches
        if (!empty($possibleMatches)) {
            echo "🤔 Possible Matches (check manually):\n";
            foreach ($possibleMatches as $match) {
                echo "   → {$match['route']} might match {$match['page']} ({$match['similarity']}% similar)\n";
            }
            echo "\n";
        }
        
        // Show a sample of definitely missing
        if (!empty($definiteMissing)) {
            echo "❌ Definitely Missing (first 10):\n";
            $count = 0;
            foreach ($definiteMissing as $missing) {
                if ($count >= 10) break;
                echo "   → {$missing['route']} ({$missing['name']})\n";
                echo "     Suggested file names: " . implode(', ', array_slice($missing['possible_names'], 0, 3)) . "\n\n";
                $count++;
            }
        }
    }
    
    private function generatePossibleFileNames(array $route): array
    {
        $names = [];
        
        // Based on route path
        $pathParts = array_filter(explode('/', $route['route']));
        if (!empty($pathParts)) {
            $lastPart = end($pathParts);
            $names[] = ucfirst($lastPart);
            $names[] = ucfirst(str_replace('-', '', ucwords($lastPart, '-')));
        }
        
        // Based on component code
        if (isset($route['code'])) {
            $code = $route['code'];
            $names[] = ucfirst($code);
            $names[] = ucfirst(str_replace('-', '', ucwords($code, '-')));
        }
        
        // Based on display name
        $cleanName = str_replace([' ', '/', '&', '°', '-'], '', $route['name']);
        $names[] = $cleanName;
        $names[] = ucfirst(strtolower($cleanName));
        
        // Common variations
        $names[] = str_replace(['My ', 'Employee ', 'Daily '], '', $route['name']);
        $names[] = str_replace(' ', '', ucwords($route['name']));
        
        return array_unique($names);
    }
    
    public function run(): void
    {
        $this->scanExistingPages();
        $this->loadConfigRoutes();
        $this->matchPagesWithRoutes();
    }
}

// Run the discovery
try {
    $discovery = new HRMPageDiscovery();
    $discovery->run();
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}