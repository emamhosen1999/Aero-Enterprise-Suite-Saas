<?php
/**
 * HRM Navigation Route Testing Script
 * 
 * Tests navigation for confirmed implemented HRM pages by checking:
 * 1. Route definitions in package route files
 * 2. Controller existence 
 * 3. Page file confirmation
 */

class HRMNavigationTester
{
    private array $implementedPages = [
        // Self-Service Pages - 9 confirmed
        '/hrm/employee/dashboard' => 'AIAnalytics/Dashboard.jsx',
        '/hrm/attendance-employee' => 'MyAttendance.jsx',
        '/hrm/leaves-employee' => 'LeavesEmployee.jsx',
        '/hrm/self-service/time-off' => 'SelfService/TimeOff.jsx',
        '/hrm/self-service/payslips' => 'SelfService/Payslips.jsx',
        '/hrm/my-expenses' => 'SelfService/MyExpenses.jsx',
        '/hrm/self-service/documents' => 'SelfService/Documents.jsx',
        '/hrm/self-service/benefits' => 'SelfService/Benefits.jsx',
        '/hrm/self-service/trainings' => 'SelfService/Trainings.jsx',
        '/hrm/self-service/performance' => 'SelfService/Performance.jsx',
        '/hrm/self-service/career-path' => 'SelfService/CareerPath.jsx',
        
        // Core Admin Pages - 8 confirmed  
        '/hrm/org-chart' => 'OrgChart.jsx',
        '/hrm/departments' => 'Departments.jsx',
        '/hrm/designations' => 'Designations.jsx',
        '/hrm/my-attendance' => 'MyAttendance.jsx',
        '/hrm/holidays' => 'Holidays.jsx',
        '/hrm/overtime' => 'OvertimeRules.jsx',
        
        // Payroll - 6 confirmed
        '/hrm/payroll/tax-setup' => 'Payroll/TaxSetup.jsx',
        '/hrm/payroll/tax-declarations' => 'Payroll/TaxDeclarations.jsx', 
        '/hrm/payroll/loans' => 'Payroll/Loans.jsx',
        '/hrm/payroll/bank-file' => 'Payroll/BankFile.jsx',
        
        // Recruitment - 3 confirmed
        '/hrm/recruitment/applicants' => 'Recruitment/Applicants.jsx',
        '/hrm/recruitment/interviews' => 'Recruitment/InterviewScheduling.jsx',
        '/hrm/recruitment/offers' => 'Recruitment/OfferLetters.jsx',
        
        // Training - 3 confirmed
        '/hrm/training/trainers' => 'Training/Trainers.jsx',
        '/hrm/training/enrollment' => 'Training/Enrollment.jsx',
        '/hrm/training/certifications' => 'Training/Certifications.jsx',
    ];
    
    public function __construct()
    {
        echo "🧪 HRM Navigation Route Testing\n";
        echo "==============================\n\n";
        echo "Testing " . count($this->implementedPages) . " confirmed implemented pages...\n\n";
    }
    
    public function testImplementedRoutes(): void
    {
        $routeFiles = [
            'D:/laragon/www/Aero-Enterprise-Suite-Saas/packages/aero-hrm/routes/web.php',
            'D:/laragon/www/Aero-Enterprise-Suite-Saas/packages/aero-hrm/routes/tenant.php',
            'D:/laragon/www/Aero-Enterprise-Suite-Saas/packages/aero-hrmac/routes/web.php',
            'D:/laragon/www/Aero-Enterprise-Suite-Saas/packages/aero-hrmac/routes/tenant.php',
            'D:/laragon/www/dbedc-erp/routes/web.php',
            'D:/laragon/www/dbedc-erp/routes/tenant.php'
        ];
        
        // Parse routes from files
        $foundRoutes = [];
        foreach ($routeFiles as $file) {
            if (file_exists($file)) {
                $routes = $this->parseRouteFile($file);
                $foundRoutes = array_merge($foundRoutes, $routes);
            }
        }
        
        echo "📋 Found " . count($foundRoutes) . " routes in route files\n\n";
        
        // Test each implemented page
        $passed = 0;
        $failed = 0;
        
        echo "🧪 Testing Navigation Chain for Implemented Pages:\n\n";
        
        foreach ($this->implementedPages as $route => $pageFile) {
            $status = $this->testRoute($route, $pageFile, $foundRoutes);
            
            if ($status['success']) {
                echo "✅ {$route}\n";
                echo "   → Route: " . ($status['route_found'] ? '✅ Found' : '❌ Missing') . "\n";
                echo "   → Page:  ✅ {$pageFile}\n";
                if ($status['controller']) {
                    echo "   → Controller: ✅ {$status['controller']}\n";
                }
                $passed++;
            } else {
                echo "❌ {$route}\n";
                echo "   → Route: " . ($status['route_found'] ? '✅ Found' : '❌ Missing') . "\n";
                echo "   → Page:  " . ($status['page_exists'] ? '✅' : '❌') . " {$pageFile}\n";
                if (isset($status['controller']) && $status['controller']) {
                    echo "   → Controller: " . ($status['controller_exists'] ? '✅' : '❌') . " {$status['controller']}\n";
                }
                foreach ($status['issues'] as $issue) {
                    echo "   ⚠️  {$issue}\n";
                }
                $failed++;
            }
            echo "\n";
        }
        
        echo "📊 Implementation Test Results:\n";
        echo "✅ Working: {$passed}\n";
        echo "❌ Issues: {$failed}\n";
        
        if ($passed + $failed > 0) {
            $percentage = round(($passed / ($passed + $failed)) * 100, 1);
            echo "📈 Navigation Success Rate: {$percentage}%\n\n";
        }
        
        if ($failed > 0) {
            echo "🚨 Issues Found - Next Steps:\n";
            echo "1. Add missing route definitions to package route files\n";
            echo "2. Create missing controllers with proper actions\n"; 
            echo "3. Verify page file paths and names\n";
            echo "4. Test actual navigation in browser\n\n";
        }
    }
    
    private function testRoute(string $route, string $pageFile, array $foundRoutes): array
    {
        $issues = [];
        $success = true;
        
        // Check if route exists in route files
        $routeFound = false;
        $controller = null;
        foreach ($foundRoutes as $foundRoute) {
            if ($this->routeMatches($route, $foundRoute['pattern'])) {
                $routeFound = true;
                $controller = $foundRoute['action'];
                break;
            }
        }
        
        if (!$routeFound) {
            $issues[] = "Route definition missing from route files";
            $success = false;
        }
        
        // Check if page file exists
        $pageExists = $this->checkPageFileExists($pageFile);
        if (!$pageExists) {
            $issues[] = "Page file not found: {$pageFile}";
            $success = false;
        }
        
        // Check controller if route was found
        $controllerExists = false;
        if ($routeFound && $controller) {
            $controllerExists = $this->checkControllerExists($controller);
            if (!$controllerExists) {
                $issues[] = "Controller not found: {$controller}";
                $success = false;
            }
        }
        
        return [
            'success' => $success,
            'route_found' => $routeFound,
            'page_exists' => $pageExists,
            'controller' => $controller,
            'controller_exists' => $controllerExists,
            'issues' => $issues
        ];
    }
    
    private function parseRouteFile(string $filePath): array
    {
        $routes = [];
        $content = file_get_contents($filePath);
        $lines = explode("\n", $content);
        
        foreach ($lines as $line) {
            $line = trim($line);
            
            // Match Laravel route patterns
            if (preg_match('/Route::(get|post|put|patch|delete|any|match)\s*\(\s*[\'"]([^\'"]*)[\'"][\s,]*[\'"]?([^\'",\)]+)[\'"]?/i', $line, $matches)) {
                $routes[] = [
                    'method' => strtoupper($matches[1]),
                    'pattern' => $matches[2],
                    'action' => isset($matches[3]) ? $matches[3] : null,
                    'file' => basename($filePath)
                ];
            }
        }
        
        return $routes;
    }
    
    private function routeMatches(string $route1, string $route2): bool
    {
        // Simple route matching - could be enhanced
        $pattern1 = preg_replace('/\{[^}]+\}/', '[^/]+', preg_quote($route1, '/'));
        $pattern2 = preg_replace('/\{[^}]+\}/', '[^/]+', preg_quote($route2, '/'));
        
        return $pattern1 === $pattern2;
    }
    
    private function checkPageFileExists(string $pageFile): bool
    {
        $searchPaths = [
            'D:/laragon/www/Aero-Enterprise-Suite-Saas/packages/aero-ui/resources/js/Pages/HRM/',
            'D:/laragon/www/Aero-Enterprise-Suite-Saas/packages/aero-hrm/resources/js/Pages/',
        ];
        
        foreach ($searchPaths as $path) {
            $fullPath = $path . $pageFile;
            if (file_exists($fullPath)) {
                return true;
            }
        }
        
        return false;
    }
    
    private function checkControllerExists(string $action): bool
    {
        // Parse controller@method format
        if (strpos($action, '@') !== false) {
            [$controller, $method] = explode('@', $action);
        } else {
            $controller = $action;
        }
        
        // Check in package locations
        $searchPaths = [
            'D:/laragon/www/Aero-Enterprise-Suite-Saas/packages/aero-hrm/src/Http/Controllers/',
            'D:/laragon/www/Aero-Enterprise-Suite-Saas/packages/aero-hrmac/src/Http/Controllers/',
            'D:/laragon/www/dbedc-erp/app/Http/Controllers/',
        ];
        
        foreach ($searchPaths as $path) {
            $fullPath = $path . str_replace('\\', '/', $controller) . '.php';
            if (file_exists($fullPath)) {
                return true;
            }
        }
        
        return false;
    }
    
    public function generateRouteTemplate(): void
    {
        echo "📝 Sample Route Template for Missing Routes:\n\n";
        
        echo "```php\n";
        echo "// Add to packages/aero-hrm/routes/tenant.php\n";
        echo "Route::middleware(['auth', 'tenant'])->prefix('hrm')->group(function () {\n\n";
        
        $sampleRoutes = [
            "Route::get('/employee/dashboard', [EmployeeController::class, 'dashboard'])->name('hrm.employee.dashboard');",
            "Route::get('/attendance-employee', [AttendanceController::class, 'employee'])->name('hrm.attendance.employee');", 
            "Route::get('/leaves-employee', [LeaveController::class, 'employee'])->name('hrm.leaves.employee');",
            "Route::get('/self-service/time-off', [SelfServiceController::class, 'timeOff'])->name('hrm.selfservice.timeoff');",
            "Route::get('/departments', [DepartmentController::class, 'index'])->name('hrm.departments.index');"
        ];
        
        foreach ($sampleRoutes as $route) {
            echo "    {$route}\n";
        }
        
        echo "\n});\n";
        echo "```\n\n";
    }
    
    public function run(): void
    {
        $this->testImplementedRoutes();
        $this->generateRouteTemplate();
        
        echo "✅ HRM Navigation Testing Complete!\n";
        echo "\n💡 Recommendation: Focus on adding route definitions and controllers\n";
        echo "   for the confirmed implemented pages to get quick wins.\n";
    }
}

// Run the tests
try {
    $tester = new HRMNavigationTester();
    $tester->run();
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}