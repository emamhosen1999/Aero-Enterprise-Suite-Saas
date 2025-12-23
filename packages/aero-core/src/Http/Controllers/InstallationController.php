<?php

namespace Aero\Core\Http\Controllers;

use Aero\Core\Models\Module;
use Aero\Core\Models\ModuleLicense;
use Aero\Core\Models\SystemSetting;
use Aero\Core\Models\User;
use Aero\Core\Services\LicenseValidationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class InstallationController extends Controller
{
    /**
     * Installation lock file
     */
    private const LOCK_FILE = 'storage/framework/aero-installation.lock';
    
    /**
     * Configuration persistence path
     */
    private const CONFIG_PATH = 'storage/framework/installation_config.json';

    /**
     * License validation service
     */
    protected LicenseValidationService $licenseService;

    public function __construct(LicenseValidationService $licenseService)
    {
        $this->licenseService = $licenseService;
    }

    /**
     * Show installation welcome page
     */
    public function index()
    {
        // Check if already installed
        if ($this->isInstalled()) {
            return Inertia::render('Core/Installation/AlreadyInstalled', [
                'title' => 'Already Installed',
                'appUrl' => config('app.url'),
            ]);
        }

        // Detect product from composer.json
        $product = $this->detectProduct();

        return Inertia::render('Core/Installation/Welcome', [
            'title' => 'Welcome to ' . ($product['name'] ?? 'Aero Enterprise Suite'),
            'product' => $product,
            'version' => config('app.version', '1.0.0'),
            'phpVersion' => PHP_VERSION,
            'laravelVersion' => app()->version(),
        ]);
    }
    
    /**
     * Show license validation page
     */
    public function license()
    {
        if ($this->isInstalled()) {
            return redirect()->route('login');
        }

        return Inertia::render('Core/Installation/License', [
            'title' => 'License Validation',
            'providers' => $this->getAvailableProviders(),
            'products' => config('license.products', []),
        ]);
    }
    
    /**
     * Validate license
     */
    public function validateLicense(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'license_key' => 'required|string|min:20',
            'email' => 'required|email',
            'domain' => 'nullable|url',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid input',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Validate license
        $result = $this->licenseService->validate(
            $request->license_key,
            $request->email,
            $request->domain ?? request()->getHost()
        );

        if (!$result['success']) {
            return response()->json($result, 422);
        }

        // Store in session
        Session::put('installation.license', [
            'license_key' => $request->license_key,
            'email' => $request->email,
            'domain' => $request->domain,
            'validation_data' => $result['data'],
        ]);

        // Persist config
        $this->persistConfig('license', Session::get('installation.license'));

        return response()->json([
            'success' => true,
            'message' => 'License validated successfully',
            'data' => $result['data'],
        ]);
    }

    /**
     * Show requirements check page
     */
    public function requirements()
    {
        if ($this->isInstalled()) {
            return redirect()->route('login');
        }

        $checks = $this->performRequirementsCheck();

        return Inertia::render('Core/Installation/Requirements', [
            'title' => 'System Requirements',
            'checks' => $checks,
            'canProceed' => $checks['allPassed'],
        ]);
    }

    /**
     * Show database configuration page
     */
    public function database()
    {
        if ($this->isInstalled()) {
            return redirect()->route('login');
        }

        return Inertia::render('Core/Installation/Database', [
            'title' => 'Database Configuration',
            'currentConfig' => [
                'connection' => config('database.default'),
                'host' => config('database.connections.' . config('database.default') . '.host'),
                'port' => config('database.connections.' . config('database.default') . '.port'),
                'database' => config('database.connections.' . config('database.default') . '.database'),
                'username' => config('database.connections.' . config('database.default') . '.username'),
            ],
        ]);
    }

    /**
     * Test database connection
     */
    public function testDatabase(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'host' => 'required|string',
            'port' => 'required|integer',
            'database' => 'required|string',
            'username' => 'required|string',
            'password' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid input',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $connection = config('database.default');
            config([
                "database.connections.{$connection}.host" => $request->host,
                "database.connections.{$connection}.port" => $request->port,
                "database.connections.{$connection}.database" => $request->database,
                "database.connections.{$connection}.username" => $request->username,
                "database.connections.{$connection}.password" => $request->password,
            ]);

            DB::purge($connection);
            DB::reconnect($connection);
            DB::connection()->getPdo();
            
            // Store in session
            Session::put('installation.database', [
                'host' => $request->host,
                'port' => $request->port,
                'database' => $request->database,
                'username' => $request->username,
                'password' => $request->password,
            ]);
            
            // Persist config
            $this->persistConfig('database', Session::get('installation.database'));

            return response()->json([
                'success' => true,
                'message' => 'Database connection successful!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database connection failed: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Show application settings page
     */
    public function application()
    {
        if ($this->isInstalled()) {
            return redirect()->route('login');
        }

        // Auto-detect mode based on installed packages
        $detectedMode = $this->detectInstallationMode();

        return Inertia::render('Core/Installation/Application', [
            'title' => 'Application Settings',
            'timezones' => timezone_identifiers_list(),
            'licenseEmail' => Session::get('installation.license.email'),
            'detectedMode' => $detectedMode,
            'modeDescription' => $detectedMode === 'saas' 
                ? 'Multi-tenant SaaS platform (Platform package detected)' 
                : 'Single organization installation (Platform package not detected)',
        ]);
    }
    
    /**
     * Auto-detect installation mode based on installed packages
     */
    protected function detectInstallationMode(): string
    {
        // Check if Platform package service provider exists
        $platformExists = class_exists('Aero\\Platform\\AeroPlatformServiceProvider');
        
        return $platformExists ? 'saas' : 'standalone';
    }
    
    /**
     * Save application settings
     */
    public function saveApplication(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'app_name' => 'required|string|max:255',
            'app_url' => 'required|url',
            'timezone' => 'required|string',
            'company_name' => 'nullable|string|max:255',
            'company_email' => 'nullable|email',
            'company_phone' => 'nullable|string|max:20',
            // Email configuration (REQUIRED)
            'mail_mailer' => 'required|in:smtp,sendmail,mailgun,ses,postmark,log',
            'mail_host' => 'required_if:mail_mailer,smtp',
            'mail_port' => 'required_if:mail_mailer,smtp',
            'mail_username' => 'required_if:mail_mailer,smtp',
            'mail_password' => 'required_if:mail_mailer,smtp',
            'mail_encryption' => 'nullable|in:tls,ssl',
            'mail_from_address' => 'required|email',
            'mail_from_name' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Auto-detect and inject mode
        $data = $request->all();
        $data['mode'] = $this->detectInstallationMode();

        // Store in session
        Session::put('installation.application', $data);
        
        // Persist config
        $this->persistConfig('application', Session::get('installation.application'));

        return response()->json([
            'success' => true,
            'message' => 'Application settings saved successfully',
        ]);
    }
    
    /**
     * Test email configuration
     */
    public function testEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'test_email' => 'required|email',
            'mail_mailer' => 'required',
            'mail_host' => 'required_if:mail_mailer,smtp',
            'mail_port' => 'required_if:mail_mailer,smtp',
            'mail_username' => 'required_if:mail_mailer,smtp',
            'mail_password' => 'required_if:mail_mailer,smtp',
            'mail_from_address' => 'required|email',
            'mail_from_name' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Temporarily configure mail
            Config::set('mail.default', $request->mail_mailer);
            Config::set('mail.mailers.smtp', [
                'transport' => 'smtp',
                'host' => $request->mail_host,
                'port' => $request->mail_port,
                'encryption' => $request->mail_encryption ?? 'tls',
                'username' => $request->mail_username,
                'password' => $request->mail_password,
            ]);
            Config::set('mail.from.address', $request->mail_from_address);
            Config::set('mail.from.name', $request->mail_from_name);

            // Send test email
            Mail::raw('This is a test email from Aero Enterprise Suite installation.', function ($message) use ($request) {
                $message->to($request->test_email)
                        ->subject('Test Email - Aero Installation');
            });

            return response()->json([
                'success' => true,
                'message' => 'Test email sent successfully!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Email test failed: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Show admin user creation page
     */
    public function admin()
    {
        if ($this->isInstalled()) {
            return redirect()->route('login');
        }

        return Inertia::render('Core/Installation/Admin', [
            'title' => 'Create Admin User',
            'licenseEmail' => Session::get('installation.license.email'),
        ]);
    }
    
    /**
     * Save admin user details
     */
    public function saveAdmin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|max:255',
            'admin_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Store in session
        Session::put('installation.admin', [
            'name' => $request->admin_name,
            'email' => $request->admin_email,
            'password' => $request->admin_password,
        ]);
        
        // Persist config
        $this->persistConfig('admin', [
            'name' => $request->admin_name,
            'email' => $request->admin_email,
            // Don't persist password in plain text
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admin details saved successfully',
        ]);
    }

    /**
     * Run installation process
     */
    public function install(Request $request)
    {
        if ($this->isInstalled()) {
            return response()->json([
                'success' => false,
                'message' => 'System is already installed',
            ], 400);
        }

        // Validate all required data is in session
        if (!Session::has('installation.license') || 
            !Session::has('installation.database') || 
            !Session::has('installation.application') || 
            !Session::has('installation.admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Missing installation configuration. Please complete all steps.',
            ], 400);
        }

        // Create lock
        $this->createLock();

        try {
            DB::beginTransaction();

            // Re-validate license
            $licenseData = Session::get('installation.license');
            $licenseResult = $this->licenseService->validate(
                $licenseData['license_key'],
                $licenseData['email'],
                $licenseData['domain']
            );

            if (!$licenseResult['success']) {
                throw new \Exception('License validation failed: ' . $licenseResult['message']);
            }

            // Step 1: Run migrations
            $this->runMigrations();

            // Step 2: Seed core data
            $this->seedCoreData();

            // Step 3: Create admin user
            $adminData = Session::get('installation.admin');
            $user = $this->createAdminUser($adminData);

            // Step 4: Store license
            $this->storeLicense($licenseResult['data']);

            // Step 5: Sync modules (filtered by license)
            $this->syncModules($licenseResult['data']['allowed_modules'] ?? ['core']);

            // Step 6: Write environment variables
            $this->writeEnvFile();

            // Step 7: Mark as installed
            $this->markAsInstalled();

            DB::commit();
            
            // Store license to encrypted file
            $this->licenseService->storeLicense(
                $licenseData['license_key'],
                $licenseResult['data']
            );
            
            // Clear session
            Session::forget('installation');
            
            // Remove lock
            $this->removeLock();
            
            // Clear config persistence
            $this->clearPersistedConfig();

            return response()->json([
                'success' => true,
                'message' => 'Installation completed successfully!',
                'redirect' => route('login'),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            $this->removeLock();

            return response()->json([
                'success' => false,
                'message' => 'Installation failed: ' . $e->getMessage(),
                'error' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }
    
    /**
     * Get installation progress for SSE
     */
    public function progress(Request $request)
    {
        return response()->stream(function () {
            $steps = [
                'Validating license...',
                'Running database migrations...',
                'Seeding core data...',
                'Creating admin user...',
                'Storing license information...',
                'Syncing modules...',
                'Writing environment configuration...',
                'Finalizing installation...',
                'Installation complete!',
            ];

            foreach ($steps as $index => $step) {
                echo "data: " . json_encode([
                    'step' => $index + 1,
                    'total' => count($steps),
                    'message' => $step,
                    'progress' => round((($index + 1) / count($steps)) * 100),
                ]) . "\n\n";
                
                ob_flush();
                flush();
                
                sleep(1); // Simulate work
            }
        }, 200, [
            'Cache-Control' => 'no-cache',
            'Content-Type' => 'text/event-stream',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /**
     * Perform requirements check
     */
    private function performRequirementsCheck(): array
    {
        $checks = [
            'php' => [
                'name' => 'PHP Version >= 8.2',
                'passed' => version_compare(PHP_VERSION, '8.2.0', '>='),
                'value' => PHP_VERSION,
            ],
            'extensions' => [],
            'permissions' => [],
        ];

        // Check PHP extensions
        $requiredExtensions = [
            'PDO' => 'pdo',
            'Mbstring' => 'mbstring',
            'OpenSSL' => 'openssl',
            'Tokenizer' => 'tokenizer',
            'XML' => 'xml',
            'Ctype' => 'ctype',
            'JSON' => 'json',
            'BCMath' => 'bcmath',
        ];

        foreach ($requiredExtensions as $name => $ext) {
            $checks['extensions'][] = [
                'name' => $name . ' Extension',
                'passed' => extension_loaded($ext),
                'value' => extension_loaded($ext) ? 'Enabled' : 'Disabled',
            ];
        }

        // Check directory permissions
        $writableDirs = [
            'Storage Directory' => storage_path(),
            'Bootstrap Cache' => bootstrap_path('cache'),
            'Storage Framework' => storage_path('framework'),
            'Storage Logs' => storage_path('logs'),
        ];

        foreach ($writableDirs as $name => $dir) {
            $writable = is_writable($dir);
            $checks['permissions'][] = [
                'name' => $name,
                'passed' => $writable,
                'value' => $writable ? 'Writable' : 'Not Writable',
                'path' => $dir,
            ];
        }

        // Check database connection
        try {
            DB::connection()->getPdo();
            $checks['database'] = [
                'name' => 'Database Connection',
                'passed' => true,
                'value' => 'Connected (' . DB::connection()->getDatabaseName() . ')',
            ];
        } catch (\Exception $e) {
            $checks['database'] = [
                'name' => 'Database Connection',
                'passed' => false,
                'value' => 'Failed: ' . $e->getMessage(),
            ];
        }

        // Calculate if all checks passed
        $allPassed = $checks['php']['passed'] && 
                     $checks['database']['passed'] &&
                     collect($checks['extensions'])->every(fn($check) => $check['passed']) &&
                     collect($checks['permissions'])->every(fn($check) => $check['passed']);

        $checks['allPassed'] = $allPassed;

        return $checks;
    }

    /**
     * Run migrations
     */
    private function runMigrations(): void
    {
        Artisan::call('migrate', [
            '--force' => true,
        ]);
    }

    /**
     * Seed core data
     */
    private function seedCoreData(): void
    {
        $appData = Session::get('installation.application');
        
        // Create roles
        $roles = [
            'Super Admin' => 'Full system access',
            'Admin' => 'Administrative access',
            'Manager' => 'Management access',
            'Employee' => 'Basic employee access',
        ];

        foreach ($roles as $name => $description) {
            Role::firstOrCreate(
                ['name' => $name, 'guard_name' => 'web'],
                ['description' => $description]
            );
        }

        // Create system settings
        $settings = [
            ['key' => 'app_name', 'value' => $appData['app_name'] ?? config('app.name'), 'type' => 'general'],
            ['key' => 'timezone', 'value' => $appData['timezone'] ?? config('app.timezone'), 'type' => 'general'],
            ['key' => 'company_name', 'value' => $appData['company_name'] ?? null, 'type' => 'general'],
            ['key' => 'company_email', 'value' => $appData['company_email'] ?? null, 'type' => 'general'],
            ['key' => 'company_phone', 'value' => $appData['company_phone'] ?? null, 'type' => 'general'],
            ['key' => 'date_format', 'value' => 'Y-m-d', 'type' => 'general'],
            ['key' => 'time_format', 'value' => 'H:i:s', 'type' => 'general'],
            ['key' => 'currency', 'value' => 'USD', 'type' => 'general'],
            ['key' => 'installation_date', 'value' => now()->toDateTimeString(), 'type' => 'system'],
            ['key' => 'mode', 'value' => 'standalone', 'type' => 'system'],
        ];

        foreach ($settings as $setting) {
            SystemSetting::firstOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }

    /**
     * Create admin user
     */
    private function createAdminUser(array $adminData): User
    {
        $user = User::firstOrCreate(
            ['email' => $adminData['email']],
            [
                'name' => $adminData['name'],
                'password' => Hash::make($adminData['password']),
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );

        // Assign Super Admin role
        $superAdminRole = Role::where('name', 'Super Admin')->first();
        if ($superAdminRole) {
            $user->assignRole($superAdminRole);
        }

        return $user;
    }
    
    /**
     * Store license information
     */
    private function storeLicense(array $licenseData): void
    {
        $licenseInfo = Session::get('installation.license');
        
        // Determine modules from license
        $allowedModules = $licenseData['allowed_modules'] ?? ['core'];
        
        // Store license for each module
        foreach ($allowedModules as $moduleCode) {
            if ($moduleCode === 'all') {
                // Store license for all available modules
                $modules = config('license.modules', []);
                foreach (array_keys($modules) as $code) {
                    $this->createModuleLicense($code, $licenseInfo, $licenseData);
                }
                break;
            } else {
                $this->createModuleLicense($moduleCode, $licenseInfo, $licenseData);
            }
        }
    }
    
    /**
     * Create module license record
     */
    private function createModuleLicense(string $moduleCode, array $licenseInfo, array $licenseData): void
    {
        ModuleLicense::create([
            'module_code' => $moduleCode,
            'module_name' => config("license.modules.{$moduleCode}", ucfirst($moduleCode)),
            'license_key' => $licenseInfo['license_key'],
            'provider' => $licenseData['provider'] ?? 'unknown',
            'license_type' => $licenseData['license_type'] ?? 'regular',
            'customer_name' => $licenseData['customer_name'] ?? null,
            'customer_email' => $licenseInfo['email'],
            'domain' => $licenseInfo['domain'] ?? request()->getHost(),
            'purchase_code' => $licenseData['purchase_code'] ?? null,
            'activation_id' => Str::uuid()->toString(),
            'purchase_date' => $licenseData['purchase_date'] ?? now(),
            'activated_at' => now(),
            'status' => 'active',
            'expires_at' => $licenseData['expires_at'] ?? null,
            'support_until' => $licenseData['support_until'] ?? null,
            'updates_until' => $licenseData['updates_until'] ?? null,
            'last_verified_at' => now(),
            'metadata' => $licenseData,
        ]);
    }

    /**
     * Sync modules (filtered by license)
     */
    private function syncModules(array $allowedModules): void
    {
        // Sync all modules first
        Artisan::call('aero:sync-module', [
            '--prune' => true,
        ]);
        
        // If not all modules are allowed, deactivate unlicensed ones
        if (!in_array('all', $allowedModules)) {
            Module::whereNotIn('code', $allowedModules)
                  ->update(['is_active' => false]);
        }
    }
    
    /**
     * Write environment variables
     */
    private function writeEnvFile(): void
    {
        $appData = Session::get('installation.application');
        $dbData = Session::get('installation.database');
        $licenseData = Session::get('installation.license');
        
        $envPath = base_path('.env');
        $envContent = File::get($envPath);
        
        $replacements = [
            'APP_NAME' => $appData['app_name'],
            'APP_URL' => $appData['app_url'],
            'APP_TIMEZONE' => $appData['timezone'],
            
            'DB_HOST' => $dbData['host'],
            'DB_PORT' => $dbData['port'],
            'DB_DATABASE' => $dbData['database'],
            'DB_USERNAME' => $dbData['username'],
            'DB_PASSWORD' => $dbData['password'],
            
            'MAIL_MAILER' => $appData['mail_mailer'],
            'MAIL_HOST' => $appData['mail_host'] ?? '',
            'MAIL_PORT' => $appData['mail_port'] ?? '',
            'MAIL_USERNAME' => $appData['mail_username'] ?? '',
            'MAIL_PASSWORD' => $appData['mail_password'] ?? '',
            'MAIL_ENCRYPTION' => $appData['mail_encryption'] ?? 'tls',
            'MAIL_FROM_ADDRESS' => $appData['mail_from_address'],
            'MAIL_FROM_NAME' => $appData['mail_from_name'],
            
            'LICENSE_KEY' => $licenseData['license_key'],
        ];
        
        foreach ($replacements as $key => $value) {
            $pattern = "/^{$key}=.*$/m";
            $replacement = "{$key}=\"{$value}\"";
            
            if (preg_match($pattern, $envContent)) {
                $envContent = preg_replace($pattern, $replacement, $envContent);
            } else {
                $envContent .= "\n{$replacement}";
            }
        }
        
        File::put($envPath, $envContent);
    }

    /**
     * Check if already installed using file-based detection.
     * 
     * This is the ONLY authoritative method for checking installation status.
     * Never use database queries for installation detection.
     */
    private function isInstalled(): bool
    {
        return file_exists(storage_path('app/aeos.installed'));
    }

    /**
     * Mark system as installed by creating the installation flag file.
     * 
     * This file is the authoritative source for installation status.
     * Also stores timestamp, mode, and DB settings in system_settings table.
     */
    private function markAsInstalled(): void
    {
        // Create the installation flag file (REQUIRED)
        $flagPath = storage_path('app/aeos.installed');
        File::ensureDirectoryExists(dirname($flagPath));
        File::put($flagPath, now()->toIso8601String());

        // Create the mode flag file (REQUIRED)
        $appData = Session::get('installation.application', []);
        $mode = $appData['mode'] ?? 'standalone';
        $modePath = storage_path('app/aeos.mode');
        File::ensureDirectoryExists(dirname($modePath));
        File::put($modePath, $mode);

        // Also update system_settings table (for metadata)
        SystemSetting::updateOrCreate(
            ['key' => 'installation_completed'],
            [
                'value' => now()->toDateTimeString(),
                'type' => 'system',
            ]
        );

        SystemSetting::updateOrCreate(
            ['key' => 'mode'],
            [
                'value' => $mode,
                'type' => 'system',
            ]
        );
    }

    /**
     * Create installation lock
     */
    private function createLock(): void
    {
        $lockPath = base_path(self::LOCK_FILE);
        File::ensureDirectoryExists(dirname($lockPath));
        File::put($lockPath, json_encode([
            'started_at' => now()->toDateTimeString(),
            'pid' => getmypid(),
        ]));
    }

    /**
     * Remove installation lock
     */
    private function removeLock(): void
    {
        $lockPath = base_path(self::LOCK_FILE);
        if (File::exists($lockPath)) {
            File::delete($lockPath);
        }
    }
    
    /**
     * Detect product from installed aero packages
     */
    private function detectProduct(): array
    {
        $composerPath = base_path('composer.json');
        
        if (!File::exists($composerPath)) {
            return [
                'code' => 'AES-FULL',
                'name' => 'Aero Enterprise Suite',
                'description' => 'Complete ERP Suite',
                'included_modules' => ['all'],
            ];
        }
        
        $composer = json_decode(File::get($composerPath), true);
        $require = $composer['require'] ?? [];
        
        // Detect installed aero modules from require section
        $installedModules = [];
        $modulePackages = [
            'aero/hrm' => 'hrm',
            'aero/crm' => 'crm',
            'aero/rfi' => 'rfi',
            'aero/finance' => 'finance',
            'aero/project' => 'project',
            'aero/ims' => 'ims',
            'aero/pos' => 'pos',
            'aero/scm' => 'scm',
            'aero/quality' => 'quality',
            'aero/dms' => 'dms',
            'aero/compliance' => 'compliance',
        ];
        
        foreach ($modulePackages as $package => $moduleCode) {
            if (isset($require[$package])) {
                $installedModules[] = $moduleCode;
            }
        }
        
        // Check if aero/platform is installed (SaaS mode)
        $hasPlatform = isset($require['aero/platform']);
        
        // Determine product based on installed modules
        $productName = 'Aero Enterprise Suite';
        $productDescription = 'ERP System';
        $productCode = 'AES-CUSTOM';
        
        if (empty($installedModules)) {
            // Only core is installed
            $productCode = 'AES-CORE';
            $productDescription = 'Core Platform';
            $installedModules = []; // Don't show 'core' - it's a hidden system module
        } elseif (count($installedModules) >= 5) {
            $productCode = 'AES-FULL';
            $productDescription = 'Complete ERP Suite';
        }
        
        if ($hasPlatform) {
            $productName = 'Aero Enterprise Suite - SaaS';
            $productDescription .= ' (Multi-Tenant)';
        }
        
        return [
            'code' => $productCode,
            'name' => $productName,
            'description' => $productDescription,
            'included_modules' => $installedModules,
        ];
    }
    
    /**
     * Get available license providers
     */
    private function getAvailableProviders(): array
    {
        $providers = [];
        
        if (config('license.providers.aero.enabled')) {
            $providers[] = [
                'id' => 'aero',
                'name' => 'Aero Platform',
                'description' => 'Official Aero Platform licenses',
                'icon' => 'globe-alt',
            ];
        }
        
        if (config('license.providers.codecanyon.enabled')) {
            $providers[] = [
                'id' => 'codecanyon',
                'name' => 'CodeCanyon',
                'description' => 'Envato CodeCanyon marketplace',
                'icon' => 'shopping-cart',
            ];
        }
        
        if (config('license.providers.enterprise.enabled')) {
            $providers[] = [
                'id' => 'enterprise',
                'name' => 'Enterprise',
                'description' => 'Enterprise license (offline)',
                'icon' => 'building-office',
            ];
        }
        
        return $providers;
    }
    
    /**
     * Persist configuration to JSON file
     */
    private function persistConfig(string $section, array $data): void
    {
        $configPath = base_path(self::CONFIG_PATH);
        File::ensureDirectoryExists(dirname($configPath));
        
        $existingConfig = [];
        if (File::exists($configPath)) {
            $existingConfig = json_decode(File::get($configPath), true) ?? [];
        }
        
        $existingConfig[$section] = $data;
        
        File::put($configPath, json_encode($existingConfig, JSON_PRETTY_PRINT));
    }
    
    /**
     * Clear persisted configuration
     */
    private function clearPersistedConfig(): void
    {
        $configPath = base_path(self::CONFIG_PATH);
        if (File::exists($configPath)) {
            File::delete($configPath);
        }
    }
    
    /**
     * Load persisted configuration (for recovery)
     */
    private function loadPersistedConfig(): ?array
    {
        $configPath = base_path(self::CONFIG_PATH);
        
        if (!File::exists($configPath)) {
            return null;
        }
        
        return json_decode(File::get($configPath), true);
    }
}
