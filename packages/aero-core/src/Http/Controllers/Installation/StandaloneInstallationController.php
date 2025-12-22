<?php

namespace Aero\Core\Http\Controllers\Installation;

use Aero\Core\Services\StandaloneInstallationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Config;
use Inertia\Inertia;
use Illuminate\Routing\Controller;

/**
 * Standalone Installation Controller
 *
 * Handles the first-run installation wizard for standalone mode.
 * Robust 6-step wizard: Welcome → Requirements → Database → Seeding → Admin → Review/Complete
 * Creates database tables, seeds essential data, and creates the first super admin user.
 */
class StandaloneInstallationController extends Controller
{
    protected StandaloneInstallationService $installationService;

    /**
     * Installation steps configuration
     */
    protected const TOTAL_STEPS = 6;

    /**
     * Required PHP extensions
     */
    protected const REQUIRED_EXTENSIONS = [
        'pdo' => 'PDO (Database connectivity)',
        'pdo_mysql' => 'PDO MySQL Driver',
        'mbstring' => 'Multibyte String',
        'openssl' => 'OpenSSL Encryption',
        'json' => 'JSON Processing',
        'tokenizer' => 'PHP Tokenizer',
        'xml' => 'XML Processing',
        'ctype' => 'Character Type Checking',
        'fileinfo' => 'File Information',
        'bcmath' => 'BC Math (Arbitrary Precision)',
        'curl' => 'cURL for HTTP Requests',
    ];

    /**
     * Optional but recommended extensions
     */
    protected const OPTIONAL_EXTENSIONS = [
        'gd' => 'GD Image Processing',
        'imagick' => 'ImageMagick Processing',
        'redis' => 'Redis Cache Driver',
        'zip' => 'ZIP Archive Support',
    ];

    public function __construct()
    {
        $this->installationService = app(StandaloneInstallationService::class);
    }

    /**
     * Check if installation is needed (static for middleware)
     * 
     * This method is called on every request in standalone mode to check if:
     * 1. The .installed marker file exists (fastest check)
     * 2. The database is accessible
     * 3. The users table exists
     * 4. At least one user has been created
     */
    public static function needsInstallation(): bool
    {
        // Check marker file first (fastest check - skips database entirely)
        $markerPath = storage_path('app/.installed');
        if (File::exists($markerPath)) {
            return false;
        }

        // Try to connect to database and check for essential data
        try {
            // Attempt database connection first
            DB::connection()->getPdo();

            // Check if users table exists
            if (!Schema::hasTable('users')) {
                return true;
            }

            // If users table exists but has no users, need installation
            $userCount = DB::table('users')->count();
            if ($userCount === 0) {
                return true;
            }

            // Has users, mark as installed and return false
            static::markAsInstalled();
            return false;

        } catch (\PDOException $e) {
            // Database connection failed (server down, wrong credentials, database doesn't exist)
            // Need installation to configure database
            return true;

        } catch (\Illuminate\Database\QueryException $e) {
            // Query failed (table doesn't exist, etc.)
            // Need installation to run migrations
            return true;

        } catch (\Exception $e) {
            // Any other database-related error means we need installation
            // Log for debugging but don't block the installation redirect
            if (config('app.debug')) {
                logger()->debug('CheckInstallation: Database check failed', [
                    'error' => $e->getMessage(),
                    'type' => get_class($e),
                ]);
            }
            return true;
        }
    }

    /**
     * Mark the application as installed
     */
    protected static function markAsInstalled(): void
    {
        $markerPath = storage_path('app/.installed');
        $data = json_encode([
            'installed_at' => now()->toIso8601String(),
            'version' => config('aero.version', '1.0.0'),
            'mode' => 'standalone',
            'php_version' => PHP_VERSION,
        ], JSON_PRETTY_PRINT);
        File::ensureDirectoryExists(dirname($markerPath));
        File::put($markerPath, $data);
    }

    /**
     * Already installed page
     */
    public function alreadyInstalled()
    {
        return Inertia::render('Core/Installation/AlreadyInstalled/Index', [
            'title' => 'Already Installed',
            'installInfo' => $this->installationService->getInstallationInfo(),
        ]);
    }

    /**
     * Step 1: Show the installation welcome page
     */
    public function index()
    {
        if (!static::needsInstallation()) {
            return redirect('/login');
        }

        // Get requirements and database status for overview
        $requirements = $this->checkRequirements();
        $dbStatus = $this->installationService->checkDatabaseStatus();

        return Inertia::render('Core/Installation/Welcome/Index', [
            'title' => 'Installation Wizard',
            'step' => 1,
            'totalSteps' => self::TOTAL_STEPS,
            'appName' => config('app.name', 'Aero Enterprise Suite'),
            'appVersion' => config('aero.version', '1.0.0'),
            'requirements' => $requirements,
            'databaseStatus' => $dbStatus,
            'features' => [
                'Multi-module ERP system',
                'Role-based access control',
                'Modern React UI with HeroUI',
                'Real-time notifications',
                'Comprehensive audit logging',
            ],
        ]);
    }

    /**
     * Step 2: Show requirements check page
     */
    public function requirements()
    {
        if (!static::needsInstallation()) {
            return redirect('/login');
        }

        $requirements = $this->checkRequirements();
        $allPassed = $this->allRequirementsMet($requirements);

        return Inertia::render('Core/Installation/Requirements/Index', [
            'title' => 'System Requirements',
            'step' => 2,
            'totalSteps' => self::TOTAL_STEPS,
            'requirements' => $requirements,
            'allPassed' => $allPassed,
        ]);
    }

    /**
     * Step 3: Show database setup step
     */
    public function database()
    {
        if (!static::needsInstallation()) {
            return redirect('/login');
        }

        $dbStatus = $this->installationService->checkDatabaseStatus();
        $envConfig = $this->getEnvDatabaseConfig();

        return Inertia::render('Core/Installation/Database/Index', [
            'title' => 'Database Configuration',
            'step' => 3,
            'totalSteps' => self::TOTAL_STEPS,
            'databaseStatus' => $dbStatus,
            'envConfig' => $envConfig,
        ]);
    }

    /**
     * Test database server connection (without database name)
     */
    public function testServerConnection(Request $request)
    {
        if (!static::needsInstallation()) {
            return response()->json(['success' => false, 'message' => 'Already installed'], 400);
        }

        $request->validate([
            'host' => 'required|string',
            'port' => 'required|integer',
            'username' => 'required|string',
            'password' => 'nullable|string',
        ]);

        try {
            $dsn = "mysql:host={$request->host};port={$request->port}";
            $pdo = new \PDO($dsn, $request->username, $request->password ?? '', [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_TIMEOUT => 5,
            ]);
            $pdo->query('SELECT 1');

            // Store in session for later steps
            session(['install_db_config' => [
                'host' => $request->host,
                'port' => $request->port,
                'username' => $request->username,
                'password' => $request->password ?? '',
            ]]);

            return response()->json([
                'success' => true,
                'message' => 'Server connection successful!',
            ]);
        } catch (\PDOException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Test full database connection
     */
    public function testDatabaseConnection(Request $request)
    {
        if (!static::needsInstallation()) {
            return response()->json(['success' => false, 'message' => 'Already installed'], 400);
        }

        $request->validate([
            'host' => 'required|string',
            'port' => 'required|integer',
            'database' => 'required|string',
            'username' => 'required|string',
            'password' => 'nullable|string',
        ]);

        $result = $this->installationService->testDatabaseConnection(
            $request->host,
            $request->port,
            $request->database,
            $request->username,
            $request->password ?? ''
        );

        if ($result['success']) {
            // Store full config in session
            session(['install_db_config' => [
                'host' => $request->host,
                'port' => $request->port,
                'database' => $request->database,
                'username' => $request->username,
                'password' => $request->password ?? '',
            ]]);

            // Dynamically set config for this request
            Config::set('database.connections.mysql.host', $request->host);
            Config::set('database.connections.mysql.port', $request->port);
            Config::set('database.connections.mysql.database', $request->database);
            Config::set('database.connections.mysql.username', $request->username);
            Config::set('database.connections.mysql.password', $request->password ?? '');

            // Purge and reconnect
            DB::purge('mysql');
            DB::reconnect('mysql');
        }

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    /**
     * Create database if it doesn't exist
     */
    public function createDatabase(Request $request)
    {
        if (!static::needsInstallation()) {
            return response()->json(['success' => false, 'message' => 'Already installed'], 400);
        }

        $request->validate([
            'host' => 'required|string',
            'port' => 'required|integer',
            'database' => 'required|string|regex:/^[a-zA-Z0-9_]+$/',
            'username' => 'required|string',
            'password' => 'nullable|string',
        ]);

        $result = $this->installationService->createDatabaseIfNotExists(
            $request->host,
            $request->port,
            $request->database,
            $request->username,
            $request->password ?? ''
        );

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    /**
     * Run database migrations
     */
    public function migrate(Request $request)
    {
        if (!static::needsInstallation()) {
            return response()->json([
                'success' => false,
                'message' => 'Already installed',
            ], 400);
        }

        try {
            // Run migrations (fresh if requested, otherwise just migrate)
            $fresh = $request->boolean('fresh', false);
            $startTime = microtime(true);

            if ($fresh) {
                Artisan::call('migrate:fresh', ['--force' => true]);
            } else {
                Artisan::call('migrate', ['--force' => true]);
            }

            $duration = round(microtime(true) - $startTime, 2);

            // Mark migration as complete in session
            session(['install_migrations_complete' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Migrations completed successfully.',
                'output' => Artisan::output(),
                'duration' => $duration,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Migration failed: ' . $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }

    /**
     * Step 4: Show seeding step
     */
    public function seeding()
    {
        if (!static::needsInstallation()) {
            return redirect('/login');
        }

        $seeders = $this->getAvailableSeeders();

        return Inertia::render('Core/Installation/Seeding/Index', [
            'title' => 'Seed Essential Data',
            'step' => 4,
            'totalSteps' => self::TOTAL_STEPS,
            'seeders' => $seeders,
        ]);
    }

    /**
     * Run database seeders (individual or all)
     */
    public function seed(Request $request)
    {
        if (!static::needsInstallation()) {
            return response()->json([
                'success' => false,
                'message' => 'Already installed',
            ], 400);
        }

        try {
            $seeder = $request->input('seeder');
            $startTime = microtime(true);
            $output = [];

            if ($seeder) {
                // Run single seeder
                if (class_exists($seeder)) {
                    Artisan::call('db:seed', [
                        '--class' => $seeder,
                        '--force' => true,
                    ]);
                    $output[] = "Ran: {$seeder}";
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => "Seeder class not found: {$seeder}",
                    ], 404);
                }
            } else {
                // Run all core seeders in correct order
                $seeders = [
                    'Aero\\Core\\Database\\Seeders\\CoreDatabaseSeeder',
                    'Aero\\Core\\Database\\Seeders\\ModuleSeeder',
                    'Aero\\Core\\Database\\Seeders\\RoleModuleAccessSeeder',
                ];

                foreach ($seeders as $seederClass) {
                    if (class_exists($seederClass)) {
                        Artisan::call('db:seed', [
                            '--class' => $seederClass,
                            '--force' => true,
                        ]);
                        $output[] = "✓ {$seederClass}";
                    }
                }
            }

            $duration = round(microtime(true) - $startTime, 2);

            // Mark seeding as complete
            session(['install_seeding_complete' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Seeders completed successfully.',
                'output' => implode("\n", $output),
                'duration' => $duration,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Seeding failed: ' . $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }

    /**
     * Step 5: Show admin creation step
     */
    public function admin()
    {
        if (!static::needsInstallation()) {
            return redirect('/login');
        }

        // Get available roles from database
        $roles = [];
        try {
            if (Schema::hasTable('roles')) {
                $roles = DB::table('roles')->select('id', 'name')->get()->toArray();
            }
        } catch (\Exception $e) {
            // Roles not available yet
        }

        return Inertia::render('Core/Installation/Admin/Index', [
            'title' => 'Create Super Administrator',
            'step' => 5,
            'totalSteps' => self::TOTAL_STEPS,
            'roles' => $roles,
        ]);
    }

    /**
     * Create the super administrator user
     */
    public function createAdmin(Request $request)
    {
        if (!static::needsInstallation()) {
            return response()->json([
                'success' => false,
                'message' => 'Already installed',
            ], 400);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        try {
            // Generate user_name from email (before @ symbol)
            $userName = explode('@', $request->email)[0];
            
            // Create super admin user
            $userId = DB::table('users')->insertGetId([
                'user_name' => $userName,
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'email_verified_at' => now(),
                'is_active' => true,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Assign Super Administrator role
            $roleId = DB::table('roles')->where('name', 'Super Administrator')->value('id');
            if ($roleId) {
                DB::table('model_has_roles')->insert([
                    'role_id' => $roleId,
                    'model_type' => 'Aero\\Core\\Models\\User',
                    'model_id' => $userId,
                ]);
            }

            // Store admin info in session for review
            session(['install_admin_created' => [
                'name' => $request->name,
                'email' => $request->email,
                'role' => 'Super Administrator',
            ]]);

            return response()->json([
                'success' => true,
                'message' => 'Super Administrator created successfully!',
                'redirect' => '/installation/review',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create admin: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Step 6: Show review & finalize page
     */
    public function review()
    {
        if (!static::needsInstallation()) {
            return redirect('/login');
        }

        $installStatus = [
            'migrations' => session('install_migrations_complete', false),
            'seeding' => session('install_seeding_complete', false),
            'admin' => session('install_admin_created') !== null,
        ];

        $adminInfo = session('install_admin_created', []);

        return Inertia::render('Core/Installation/Review/Index', [
            'title' => 'Review & Finalize',
            'step' => 6,
            'totalSteps' => self::TOTAL_STEPS,
            'installStatus' => $installStatus,
            'adminInfo' => $adminInfo,
            'requirements' => $this->checkRequirements(),
            'databaseStatus' => $this->installationService->checkDatabaseStatus(),
        ]);
    }

    /**
     * Finalize installation
     */
    public function finalize(Request $request)
    {
        if (!static::needsInstallation()) {
            return response()->json([
                'success' => false,
                'message' => 'Already installed',
            ], 400);
        }

        try {
            // Clear caches
            Artisan::call('config:clear');
            Artisan::call('cache:clear');
            Artisan::call('view:clear');

            // Mark as installed
            static::markAsInstalled();

            // Clear installation session data
            session()->forget([
                'install_db_config',
                'install_migrations_complete',
                'install_seeding_complete',
                'install_admin_created',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Installation finalized successfully!',
                'redirect' => '/installation/complete',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Finalization failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * API: Run migrations (for staged installation from Review page)
     */
    public function apiMigrate(Request $request)
    {
        if (!static::needsInstallation()) {
            return response()->json([
                'success' => false,
                'message' => 'Already installed',
            ], 400);
        }

        try {
            $startTime = microtime(true);

            // Check if migrations already ran
            if (session('install_migrations_complete')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Migrations already completed.',
                    'skipped' => true,
                ]);
            }

            // Run migrations
            Artisan::call('migrate', ['--force' => true]);

            $duration = round(microtime(true) - $startTime, 2);

            // Mark as complete
            session(['install_migrations_complete' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Database migrations completed successfully.',
                'output' => Artisan::output(),
                'duration' => $duration,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Migration failed: ' . $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }

    /**
     * API: Run seeders (for staged installation from Review page)
     */
    public function apiSeed(Request $request)
    {
        if (!static::needsInstallation()) {
            return response()->json([
                'success' => false,
                'message' => 'Already installed',
            ], 400);
        }

        try {
            $startTime = microtime(true);

            // Check if seeding already ran
            if (session('install_seeding_complete')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Seeding already completed.',
                    'skipped' => true,
                ]);
            }

            $output = [];

            // Run all core seeders in correct order
            $seeders = [
                'Aero\\Core\\Database\\Seeders\\CoreDatabaseSeeder',
                'Aero\\Core\\Database\\Seeders\\ModuleSeeder',
                'Aero\\Core\\Database\\Seeders\\RoleModuleAccessSeeder',
            ];

            foreach ($seeders as $seederClass) {
                if (class_exists($seederClass)) {
                    Artisan::call('db:seed', [
                        '--class' => $seederClass,
                        '--force' => true,
                    ]);
                    $output[] = "✓ {$seederClass}";
                }
            }

            $duration = round(microtime(true) - $startTime, 2);

            // Mark as complete
            session(['install_seeding_complete' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Database seeding completed successfully.',
                'output' => implode("\n", $output),
                'duration' => $duration,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Seeding failed: ' . $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }

    /**
     * API: Verify admin user was created
     */
    public function verifyAdmin(Request $request)
    {
        if (!static::needsInstallation()) {
            return response()->json([
                'success' => false,
                'message' => 'Already installed',
            ], 400);
        }

        try {
            // Check if admin was created in session
            $adminInfo = session('install_admin_created');

            if (!$adminInfo) {
                return response()->json([
                    'success' => false,
                    'message' => 'No administrator account found. Please go back and create one.',
                ], 400);
            }

            // Verify admin exists in database
            $admin = DB::table('users')->where('email', $adminInfo['email'])->first();

            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Administrator account not found in database.',
                ], 400);
            }

            // Verify admin has Super Administrator role
            $hasRole = DB::table('model_has_roles')
                ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->where('model_has_roles.model_id', $admin->id)
                ->where('roles.name', 'Super Administrator')
                ->exists();

            if (!$hasRole) {
                return response()->json([
                    'success' => false,
                    'message' => 'Administrator role assignment failed.',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Administrator account verified successfully.',
                'admin' => [
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'role' => 'Super Administrator',
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Admin verification failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show installation complete page
     */
    public function complete()
    {
        return Inertia::render('Core/Installation/Complete/Index', [
            'title' => 'Installation Complete',
            'message' => 'Your application has been installed successfully!',
            'installInfo' => $this->installationService->getInstallationInfo(),
            'nextSteps' => [
                ['title' => 'Log In', 'description' => 'Access your admin dashboard', 'url' => '/login'],
                ['title' => 'Configure Settings', 'description' => 'Customize system settings', 'url' => '/settings'],
                ['title' => 'Manage Users', 'description' => 'Create additional users and roles', 'url' => '/users'],
                ['title' => 'Explore Modules', 'description' => 'View available modules', 'url' => '/modules'],
            ],
        ]);
    }

    /**
     * Quick install - combines all steps into one (for advanced users)
     */
    public function quickInstall(Request $request)
    {
        if (!static::needsInstallation()) {
            return redirect('/login');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:8|confirmed',
        ]);

        try {
            // Run migrations
            Artisan::call('migrate', ['--force' => true]);

            // Run seeders
            $seeders = [
                'Aero\\Core\\Database\\Seeders\\CoreDatabaseSeeder',
                'Aero\\Core\\Database\\Seeders\\ModuleSeeder',
                'Aero\\Core\\Database\\Seeders\\RoleModuleAccessSeeder',
            ];

            foreach ($seeders as $seeder) {
                if (class_exists($seeder)) {
                    Artisan::call('db:seed', ['--class' => $seeder, '--force' => true]);
                }
            }

            // Create super admin user
            $userId = DB::table('users')->insertGetId([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Assign Super Administrator role
            $roleId = DB::table('roles')->where('name', 'Super Administrator')->value('id');
            if ($roleId) {
                DB::table('model_has_roles')->insert([
                    'role_id' => $roleId,
                    'model_type' => 'Aero\\Core\\Models\\User',
                    'model_id' => $userId,
                ]);
            }

            // Clear caches
            Artisan::call('config:clear');
            Artisan::call('cache:clear');

            // Mark as installed
            static::markAsInstalled();

            return redirect('/login')->with('success', 'Installation complete! You can now log in.');
        } catch (\Exception $e) {
            return back()->withErrors(['installation' => 'Installation failed: ' . $e->getMessage()]);
        }
    }

    /**
     * Check system requirements
     */
    protected function checkRequirements(): array
    {
        $requirements = [
            'php' => [
                'name' => 'PHP Version',
                'required' => '8.2.0',
                'current' => PHP_VERSION,
                'passed' => version_compare(PHP_VERSION, '8.2.0', '>='),
            ],
            'extensions' => [],
            'optional_extensions' => [],
            'directories' => [],
            'functions' => [],
        ];

        // Check required extensions
        foreach (self::REQUIRED_EXTENSIONS as $ext => $description) {
            $requirements['extensions'][$ext] = [
                'name' => $ext,
                'description' => $description,
                'loaded' => extension_loaded($ext),
                'required' => true,
            ];
        }

        // Check optional extensions
        foreach (self::OPTIONAL_EXTENSIONS as $ext => $description) {
            $requirements['optional_extensions'][$ext] = [
                'name' => $ext,
                'description' => $description,
                'loaded' => extension_loaded($ext),
                'required' => false,
            ];
        }

        // Check directory permissions
        $directories = [
            'storage' => storage_path(),
            'storage/app' => storage_path('app'),
            'storage/framework' => storage_path('framework'),
            'storage/logs' => storage_path('logs'),
            'bootstrap/cache' => base_path('bootstrap/cache'),
        ];

        foreach ($directories as $name => $path) {
            $requirements['directories'][$name] = [
                'path' => $path,
                'writable' => is_dir($path) && is_writable($path),
                'required' => true,
            ];
        }

        // Check critical functions
        $functions = ['proc_open', 'proc_close', 'proc_get_status', 'symlink'];
        foreach ($functions as $func) {
            $disabled = explode(',', ini_get('disable_functions'));
            $requirements['functions'][$func] = [
                'name' => $func,
                'enabled' => function_exists($func) && !in_array($func, array_map('trim', $disabled)),
                'required' => false, // Recommended but not required
            ];
        }

        return $requirements;
    }

    /**
     * Check if all requirements are met
     */
    protected function allRequirementsMet(array $requirements): bool
    {
        // PHP version
        if (!$requirements['php']['passed']) {
            return false;
        }

        // Required extensions
        foreach ($requirements['extensions'] as $ext) {
            if ($ext['required'] && !$ext['loaded']) {
                return false;
            }
        }

        // Directories
        foreach ($requirements['directories'] as $dir) {
            if ($dir['required'] && !$dir['writable']) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get available seeders with their descriptions
     */
    protected function getAvailableSeeders(): array
    {
        return [
            [
                'class' => 'Aero\\Core\\Database\\Seeders\\CoreDatabaseSeeder',
                'name' => 'CoreDatabaseSeeder',
                'description' => 'Core roles and permissions (Super Administrator, Admin, Employee)',
                'order' => 1,
                'essential' => true,
            ],
            [
                'class' => 'Aero\\Core\\Database\\Seeders\\ModuleSeeder',
                'name' => 'ModuleSeeder',
                'description' => 'Module hierarchy and structure (HRM, CRM, Finance, etc.)',
                'order' => 2,
                'essential' => true,
            ],
            [
                'class' => 'Aero\\Core\\Database\\Seeders\\RoleModuleAccessSeeder',
                'name' => 'RoleModuleAccessSeeder',
                'description' => 'Role-to-module access permissions mapping',
                'order' => 3,
                'essential' => true,
            ],
        ];
    }

    /**
     * Get database configuration from .env
     */
    protected function getEnvDatabaseConfig(): array
    {
        return [
            'host' => config('database.connections.mysql.host', '127.0.0.1'),
            'port' => config('database.connections.mysql.port', 3306),
            'database' => config('database.connections.mysql.database', 'aero'),
            'username' => config('database.connections.mysql.username', 'root'),
            // Password is intentionally not returned for security
        ];
    }
}
