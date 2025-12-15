<?php

namespace Aero\Platform\Http\Controllers;

use Aero\Platform\Http\Requests\InstallationRequest;
use Aero\Platform\Models\LandlordUser;
use Aero\Platform\Models\PlatformSetting;
use Aero\Platform\Services\InstallationService;
use Aero\Platform\Services\MailService;
use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;

class InstallationController extends Controller
{
    /**
     * Rate limit key for secret code verification
     */
    private const RATE_LIMIT_KEY = 'installation_secret_attempts';

    /**
     * Maximum attempts allowed before lockout
     */
    private const MAX_ATTEMPTS = 5;

    /**
     * Lockout duration in seconds (15 minutes)
     */
    private const LOCKOUT_DURATION = 900;

    public function __construct(
        private readonly InstallationService $installationService
    ) {}

    /**
     * Show installation welcome page
     */
    public function index(): \Inertia\Response
    {
        // Check if already installed
        if ($this->isInstalled()) {
            return Inertia::render('Platform/Installation/AlreadyInstalled');
        }

        return Inertia::render('Platform/Installation/Welcome', [
            'title' => 'Welcome to Aero Enterprise Suite',
            'version' => config('app.version', '1.0.0'),
        ]);
    }

    /**
     * Show secret code verification page
     */
    public function showSecretVerification(): \Inertia\Response|\Illuminate\Http\RedirectResponse
    {
        if ($this->isInstalled()) {
            return redirect()->route('login');
        }

        return Inertia::render('Platform/Installation/SecretVerification', [
            'title' => 'Installation Security',
        ]);
    }

    /**
     * Verify installation secret code with rate limiting
     */
    public function verifySecret(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'secret_code' => ['required', 'string'],
        ]);

        // Rate limiting to prevent brute-force attacks
        $rateLimitKey = self::RATE_LIMIT_KEY.':'.$request->ip();

        if (RateLimiter::tooManyAttempts($rateLimitKey, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            $minutes = ceil($seconds / 60);

            return back()->withErrors([
                'secret_code' => "Too many failed attempts. Please try again in {$minutes} minute(s).",
            ]);
        }

        // Get hash from config - check app config first, then platform config
        $secretHash = config('app.installation_secret_hash') ?: config('platform.installation_secret_hash');

        if (empty($secretHash)) {
            \Log::error('Installation secret hash not configured', [
                'app_config' => config('app.installation_secret_hash') ? 'set' : 'empty',
                'platform_config' => config('platform.installation_secret_hash') ? 'set' : 'empty',
            ]);

            return back()->withErrors([
                'secret_code' => 'Installation not properly configured. INSTALLATION_SECRET_HASH must be set in .env file or platform config.',
            ]);
        }

        // Verify using bcrypt
        if (! Hash::check($request->secret_code, $secretHash)) {
            // Increment rate limiter on failed attempt
            RateLimiter::hit($rateLimitKey, self::LOCKOUT_DURATION);
            $attemptsLeft = self::MAX_ATTEMPTS - RateLimiter::attempts($rateLimitKey);

            \Log::warning('Failed installation secret verification attempt', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'attempts_left' => $attemptsLeft,
            ]);

            return back()->withErrors([
                'secret_code' => "Invalid installation secret code. {$attemptsLeft} attempt(s) remaining.",
            ]);
        }

        // Clear rate limiter on success
        RateLimiter::clear($rateLimitKey);

        // Store verification in session
        session(['installation_verified' => true]);

        \Log::info('Installation secret verified successfully', [
            'ip' => $request->ip(),
        ]);

        return redirect()->route('installation.requirements')->with('success', 'Secret code verified successfully.');
    }

    /**
     * Show requirements check page
     */
    public function showRequirements(): \Inertia\Response|\Illuminate\Http\RedirectResponse
    {
        if (! session('installation_verified')) {
            return redirect()->route('installation.secret');
        }

        $requirements = $this->checkRequirements();

        // Determine if all requirements are satisfied
        $canProceed = collect($requirements)->every(function ($group) {
            return collect($group)->every(fn ($item) => $item['satisfied']);
        });

        return Inertia::render('Platform/Installation/Requirements', [
            'title' => 'System Requirements',
            'requirements' => $requirements,
            'canProceed' => $canProceed,
        ]);
    }

    /**
     * Show database configuration page
     */
    public function showDatabase(): \Inertia\Response|\Illuminate\Http\RedirectResponse
    {
        if (! session('installation_verified')) {
            return redirect()->route('installation.secret');
        }

        // Check environment prerequisites
        $envCheck = $this->installationService->validateEnvironmentPrerequisites();

        return Inertia::render('Platform/Installation/Database', [
            'title' => 'Database Configuration',
            'currentConfig' => [
                'host' => config('database.connections.mysql.host'),
                'port' => config('database.connections.mysql.port'),
                'database' => config('database.connections.mysql.database'),
                'username' => config('database.connections.mysql.username'),
            ],
            'environmentIssues' => $envCheck['issues'],
        ]);
    }

    /**
     * Test database server connection (without database)
     */
    public function testServerConnection(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'host' => ['required', 'string'],
            'port' => ['required', 'integer', 'min:1', 'max:65535'],
            'username' => ['required', 'string'],
            'password' => ['nullable', 'string'],
        ]);

        try {
            $testConnection = $this->installationService->testServerConnection(
                $request->host,
                $request->port,
                $request->username,
                $request->password
            );

            if ($testConnection['success']) {
                // Get available databases for user
                $databases = $this->installationService->listDatabases(
                    $request->host,
                    $request->port,
                    $request->username,
                    $request->password
                );

                return response()->json([
                    'success' => true,
                    'message' => 'Server connection successful!',
                    'databases' => $databases['databases'] ?? [],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $testConnection['message'],
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Server connection failed: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create database if it doesn't exist
     */
    public function createDatabase(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'host' => ['required', 'string'],
            'port' => ['required', 'integer', 'min:1', 'max:65535'],
            'database' => ['required', 'string', 'regex:/^[a-zA-Z0-9_]+$/'],
            'username' => ['required', 'string'],
            'password' => ['nullable', 'string'],
        ]);

        try {
            $result = $this->installationService->createDatabaseIfNotExists(
                $request->host,
                $request->port,
                $request->database,
                $request->username,
                $request->password
            );

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => $result['message'],
                    'created' => $result['created'],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create database: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Test database connection
     */
    public function testDatabase(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'host' => ['required', 'string'],
            'port' => ['required', 'integer', 'min:1', 'max:65535'],
            'database' => ['required', 'string'],
            'username' => ['required', 'string'],
            'password' => ['nullable', 'string'],
        ]);

        try {
            $testConnection = $this->installationService->testDatabaseConnection(
                $request->host,
                $request->port,
                $request->database,
                $request->username,
                $request->password
            );

            if ($testConnection['success']) {
                // Store config in session for later use
                // Encrypt sensitive password before storing in session
                session([
                    'db_config' => [
                        'db_host' => $request->host,
                        'db_port' => $request->port,
                        'db_database' => $request->database,
                        'db_username' => $request->username,
                        'db_password' => $request->password ? Crypt::encryptString($request->password) : '',
                        'db_password_encrypted' => true,
                    ],
                ]);

                // Also persist installation progress
                $this->persistInstallationProgress('database', ['configured' => true]);

                return response()->json([
                    'success' => true,
                    'message' => 'Database connection successful!',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $testConnection['message'],
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show platform settings page
     */
    public function showPlatform(): \Inertia\Response|\Illuminate\Http\RedirectResponse
    {
        if (! session('installation_verified') || ! session('db_config')) {
            return redirect()->route('installation.database');
        }

        // Get current configuration from session or .env
        $platformConfig = session('platform_config', [
            // Basic Platform Info
            'app_name' => config('app.name', 'Aero Enterprise Suite'),
            'legal_name' => '',
            'tagline' => '',
            'app_url' => config('app.url', url('/')),
            'app_timezone' => config('app.timezone', 'UTC'),
            'app_locale' => config('app.locale', 'en'),
            'app_debug' => config('app.debug', false),
            // Contact Info
            'support_email' => '',
            'support_phone' => '',
            'marketing_url' => '',
            'status_page_url' => '',
            // Email Settings
            'mail_mailer' => config('mail.default', 'smtp'),
            'mail_host' => config('mail.mailers.smtp.host', 'smtp.mailtrap.io'),
            'mail_port' => config('mail.mailers.smtp.port', '2525'),
            'mail_username' => config('mail.mailers.smtp.username', ''),
            'mail_password' => config('mail.mailers.smtp.password', ''),
            'mail_encryption' => config('mail.mailers.smtp.encryption', 'tls'),
            'mail_from_address' => config('mail.from.address', 'noreply@aero-enterprise-suite.com'),
            'mail_from_name' => config('mail.from.name', 'Aero Enterprise Suite'),
            'mail_verify_ssl' => config('mail.mailers.smtp.verify_peer', false),
            'mail_verify_ssl_name' => config('mail.mailers.smtp.verify_peer_name', false),
            'mail_allow_self_signed' => config('mail.mailers.smtp.allow_self_signed', false),
            // Backend Drivers
            'queue_connection' => config('queue.default', 'sync'),
            'session_driver' => config('session.driver', 'database'),
            'cache_driver' => config('cache.default', 'database'),
            'filesystem_disk' => config('filesystems.default', 'local'),
            // SMS Settings
            'sms_provider' => config('services.sms.default', 'twilio'),
            'sms_twilio_sid' => config('services.twilio.sid', ''),
            'sms_twilio_token' => config('services.twilio.token', ''),
            'sms_twilio_from' => config('services.twilio.from', ''),
            'sms_nexmo_key' => config('services.nexmo.key', ''),
            'sms_nexmo_secret' => config('services.nexmo.secret', ''),
            'sms_nexmo_from' => config('services.nexmo.from', ''),
        ]);

        return Inertia::render('Platform/Installation/PlatformSettings', [
            'title' => 'Platform Settings',
            'platformConfig' => $platformConfig,
        ]);
    }

    /**
     * Save platform settings
     */
    public function savePlatform(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            // Basic Platform Info
            'app_name' => ['required', 'string', 'max:255'],
            'legal_name' => ['nullable', 'string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:500'],
            'app_url' => ['required', 'url'],
            'app_timezone' => ['required', 'string'],
            'app_locale' => ['required', 'string', 'in:en,bn,zh-CN,zh-TW'],
            'app_debug' => ['required', 'boolean'],
            // Contact Info
            'support_email' => ['nullable', 'email', 'max:255'],
            'support_phone' => ['nullable', 'string', 'max:50'],
            'marketing_url' => ['nullable', 'url', 'max:255'],
            'status_page_url' => ['nullable', 'url', 'max:255'],
            // Email Settings
            'mail_mailer' => ['required', 'string', 'in:smtp,sendmail,mailgun,ses,postmark,log'],
            'mail_host' => ['required', 'string'],
            'mail_port' => ['required', 'integer', 'min:1', 'max:65535'],
            'mail_username' => ['nullable', 'string'],
            'mail_password' => ['nullable', 'string'],
            'mail_encryption' => ['required', 'string', 'in:tls,ssl,null'],
            'mail_from_address' => ['required', 'email'],
            'mail_from_name' => ['required', 'string', 'max:255'],
            'mail_verify_ssl' => ['required', 'boolean'],
            'mail_verify_ssl_name' => ['required', 'boolean'],
            'mail_allow_self_signed' => ['required', 'boolean'],
            // Backend Drivers
            'queue_connection' => ['required', 'string', 'in:sync,database,redis,beanstalkd,sqs'],
            'session_driver' => ['required', 'string', 'in:file,cookie,database,apc,memcached,redis,array'],
            'cache_driver' => ['required', 'string', 'in:file,database,apc,memcached,redis,array'],
            'filesystem_disk' => ['required', 'string', 'in:local,public,s3'],
            // SMS Settings
            'sms_provider' => ['nullable', 'string', 'in:twilio,nexmo,messagebird,sns'],
            'sms_twilio_sid' => ['nullable', 'string'],
            'sms_twilio_token' => ['nullable', 'string'],
            'sms_twilio_from' => ['nullable', 'string'],
            'sms_nexmo_key' => ['nullable', 'string'],
            'sms_nexmo_secret' => ['nullable', 'string'],
            'sms_nexmo_from' => ['nullable', 'string'],
        ]);

        session(['platform_config' => $validated]);

        return redirect()->route('installation.admin');
    }

    /**
     * Test email configuration
     */
    public function testEmail(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'test_email' => ['required', 'email'],
            'mail_host' => ['required', 'string'],
            'mail_port' => ['required', 'integer'],
            'mail_username' => ['nullable', 'string'],
            'mail_password' => ['nullable', 'string'],
            'mail_encryption' => ['required', 'string'],
            'mail_from_address' => ['required', 'email'],
            'mail_from_name' => ['required', 'string'],
            'mail_verify_ssl' => ['required', 'boolean'],
            'mail_verify_ssl_name' => ['required', 'boolean'],
            'mail_allow_self_signed' => ['required', 'boolean'],
        ]);

        try {
            // Build temporary config for MailService
            $tempConfig = [
                'configured' => true,
                'driver' => 'smtp',
                'host' => $request->mail_host,
                'port' => (int) $request->mail_port,
                'username' => $request->mail_username,
                'password' => $request->mail_password,
                'encryption' => $request->mail_encryption === 'null' ? 'tls' : $request->mail_encryption,
                'verify_peer' => ! $request->mail_allow_self_signed && $request->mail_verify_ssl,
                'from_address' => $request->mail_from_address,
                'from_name' => $request->mail_from_name,
            ];

            // Create HTML email body
            $html = '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4F46E5;">✅ Test Email Successful</h2>
                    <p>This is a test email from your <strong>Aero Enterprise Suite</strong> installation.</p>
                    <p>If you received this, your email configuration is working correctly!</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p><strong>Configuration:</strong></p>
                    <ul>
                        <li>Host: '.$request->mail_host.':'.$request->mail_port.'</li>
                        <li>Encryption: '.$request->mail_encryption.'</li>
                        <li>From: '.$request->mail_from_address.'</li>
                        <li>SSL Verification: '.($request->mail_verify_ssl ? 'Enabled' : 'Disabled').'</li>
                        <li>Time: '.now()->toDateTimeString().'</li>
                    </ul>
                </div>
            ';

            // Use MailService with temporary configuration
            $mailService = new MailService;

            // Temporarily override config in MailService by setting env config
            config([
                'mail.mailers.smtp.host' => $tempConfig['host'],
                'mail.mailers.smtp.port' => $tempConfig['port'],
                'mail.mailers.smtp.username' => $tempConfig['username'],
                'mail.mailers.smtp.password' => $tempConfig['password'],
                'mail.mailers.smtp.encryption' => $tempConfig['encryption'],
                'mail.from.address' => $tempConfig['from_address'],
                'mail.from.name' => $tempConfig['from_name'],
            ]);

            $result = $mailService
                ->usePlatformSettings()
                ->to($request->test_email)
                ->subject('Test Email - Aero Enterprise Suite Installation')
                ->html($html)
                ->send();

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Test email sent successfully! Please check your inbox.',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send email: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Test SMS configuration
     */
    public function testSms(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'test_phone' => ['required', 'string'],
            'sms_provider' => ['required', 'string', 'in:twilio,nexmo,messagebird,sns'],
        ]);

        try {
            $provider = $request->sms_provider;
            $message = 'This is a test SMS from Aero Enterprise Suite. Your SMS configuration is working!';

            if ($provider === 'twilio') {
                $request->validate([
                    'sms_twilio_sid' => ['required', 'string'],
                    'sms_twilio_token' => ['required', 'string'],
                    'sms_twilio_from' => ['required', 'string'],
                ]);

                // Test Twilio connection
                $twilio = new \Twilio\Rest\Client($request->sms_twilio_sid, $request->sms_twilio_token);
                $twilio->messages->create($request->test_phone, [
                    'from' => $request->sms_twilio_from,
                    'body' => $message,
                ]);
            } elseif ($provider === 'nexmo') {
                $request->validate([
                    'sms_nexmo_key' => ['required', 'string'],
                    'sms_nexmo_secret' => ['required', 'string'],
                    'sms_nexmo_from' => ['required', 'string'],
                ]);

                // Test Nexmo connection
                $basic = new \Vonage\Client\Credentials\Basic($request->sms_nexmo_key, $request->sms_nexmo_secret);
                $client = new \Vonage\Client($basic);
                $client->sms()->send(new \Vonage\SMS\Message\SMS($request->test_phone, $request->sms_nexmo_from, $message));
            }

            return response()->json([
                'success' => true,
                'message' => 'Test SMS sent successfully! Please check your phone.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send SMS: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show admin account creation page
     */
    public function showAdmin(): \Inertia\Response|\Illuminate\Http\RedirectResponse
    {
        if (! session('installation_verified') || ! session('db_config')) {
            return redirect()->route('installation.database');
        }

        return Inertia::render('Platform/Installation/AdminAccount', [
            'title' => 'Create Admin Account',
        ]);
    }

    /**
     * Save admin account details
     */
    public function saveAdmin(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'admin_name' => ['required', 'string', 'max:255'],
            'admin_email' => ['required', 'email', 'max:255'],
            'admin_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // Encrypt sensitive password before storing in session
        session([
            'admin_config' => [
                'admin_name' => $validated['admin_name'],
                'admin_email' => $validated['admin_email'],
                'admin_password' => Crypt::encryptString($validated['admin_password']),
                'admin_password_encrypted' => true,
            ],
        ]);

        return redirect()->route('installation.review');
    }

    /**
     * Show final review page
     */
    public function showReview(): \Inertia\Response|\Illuminate\Http\RedirectResponse
    {
        if (! session('installation_verified') || ! session('db_config')) {
            return redirect()->route('installation.database');
        }

        return Inertia::render('Platform/Installation/Review', [
            'title' => 'Review & Install',
            'dbConfig' => array_merge(session('db_config', []), ['db_password' => '***']),
            'platformConfig' => session('platform_config'),
            'adminConfig' => array_merge(session('admin_config', []), ['admin_password' => '***']),
        ]);
    }

    /**
     * Process installation
     */
    public function install(InstallationRequest $request): \Illuminate\Http\JsonResponse
    {
        if (! session('installation_verified')) {
            return response()->json([
                'success' => false,
                'message' => 'Installation not verified.',
                'stage' => 'verification',
            ], 403);
        }

        $stages = [
            'environment' => 'Updating environment configuration',
            'migrations' => 'Running database migrations',
            'seeding' => 'Seeding initial data',
            'admin' => 'Creating administrator account',
            'settings' => 'Configuring platform settings',
            'finalization' => 'Finalizing installation',
        ];

        try {
            $dbConfig = session('db_config');
            $platformConfig = session('platform_config');
            $adminConfig = session('admin_config');

            // Validate session data
            if (! $dbConfig || ! $platformConfig || ! $adminConfig) {
                \Log::error('Installation failed: Missing session data', [
                    'db_config' => $dbConfig ? 'present' : 'missing',
                    'platform_config' => $platformConfig ? 'present' : 'missing',
                    'admin_config' => $adminConfig ? 'present' : 'missing',
                    'all_session' => session()->all(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Session data lost. Please go back to the Database step and continue from there.',
                    'stage' => 'validation',
                    'error' => 'Missing configuration data',
                ], 400);
            }

            // Normalize database config keys (handle both old and new format)
            // Convert to format expected by InstallationService (without db_ prefix)
            // Decrypt password if it was encrypted in session
            $dbPassword = $dbConfig['db_password'] ?? $dbConfig['password'] ?? null;
            if (! empty($dbConfig['db_password_encrypted']) && $dbPassword) {
                try {
                    $dbPassword = Crypt::decryptString($dbPassword);
                } catch (\Exception $e) {
                    \Log::warning('Failed to decrypt db_password, using as-is', ['error' => $e->getMessage()]);
                }
            }

            $dbConfig = [
                'host' => $dbConfig['db_host'] ?? $dbConfig['host'] ?? null,
                'port' => $dbConfig['db_port'] ?? $dbConfig['port'] ?? null,
                'database' => $dbConfig['db_database'] ?? $dbConfig['database'] ?? null,
                'username' => $dbConfig['db_username'] ?? $dbConfig['username'] ?? null,
                'password' => $dbPassword,
            ];

            // Stage 1: Update environment file
            \Log::info('Installation Stage: environment', ['stage' => 'environment']);
            $this->installationService->updateEnvironmentFile($dbConfig, $platformConfig);

            // Reconnect to use new database configuration
            DB::purge('mysql');
            config(['database.connections.mysql' => [
                'driver' => 'mysql',
                'host' => $dbConfig['host'],
                'port' => $dbConfig['port'],
                'database' => $dbConfig['database'],
                'username' => $dbConfig['username'],
                'password' => $dbConfig['password'],
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix' => '',
                'strict' => true,
                'engine' => null,
            ]]);
            DB::reconnect('mysql');

            // Stage 2: Run migrations
            \Log::info('Installation Stage: migrations', ['stage' => 'migrations']);
            Artisan::call('migrate', ['--force' => true]);
            $migrationOutput = Artisan::output();
            \Log::info('Migration output', ['output' => $migrationOutput]);


            Artisan::call('db:seed', [
                '--class' => 'Aero\\Platform\\Database\\Seeders\\PlanSeeder',
                '--force' => true,
            ]);
            $seedOutput = Artisan::output();
            \Log::info('PlanSeeder output', ['output' => $seedOutput]);

            // Stage 4: Create admin user
            \Log::info('Installation Stage: admin', ['stage' => 'admin']);

            // Decrypt admin password if it was encrypted in session
            $adminPassword = $adminConfig['admin_password'];
            if (! empty($adminConfig['admin_password_encrypted'])) {
                try {
                    $adminPassword = Crypt::decryptString($adminPassword);
                } catch (\Exception $e) {
                    \Log::warning('Failed to decrypt admin_password, using as-is', ['error' => $e->getMessage()]);
                }
            }

            $role = \Spatie\Permission\Models\Role::firstOrCreate(
                ['name' => 'Super Administrator'],
                ['guard_name' => 'web']
            );

            $admin = LandlordUser::updateOrCreate(
                ['email' => $adminConfig['admin_email']],
                [
                    'name' => $adminConfig['admin_name'],
                    'password' => Hash::make($adminPassword),
                    'email_verified_at' => now(),
                ]
            );

       
         

            \Log::info('Admin created/updated', ['admin_id' => $admin->id, 'email' => $admin->email]);

            // Assign Super Administrator role (syncRoles to avoid duplicates)
            try {
                $admin->syncRoles(['Super Administrator']);
                \Log::info('Role synced', ['role' => 'Super Administrator']);
            } catch (\Throwable $e) {
                // Fall back to direct pivot insert in case of schema differences
                \Log::warning('syncRoles failed, falling back to direct pivot insert', ['error' => $e->getMessage()]);

                try {
                    $role = \Spatie\Permission\Models\Role::where('name', 'Super Administrator')->first();
                    if ($role) {
                        DB::connection('central')->table('model_has_roles')->insertOrIgnore([
                            'role_id' => $role->id,
                            'model_id' => $admin->id,
                            'model_type' => \Aero\Platform\Models\LandlordUser::class,
                        ]);
                        \Log::info('Role pivot inserted (fallback)', ['role_id' => $role->id, 'admin_id' => $admin->id]);
                    } else {
                        \Log::warning('Fallback role insert skipped: role not found', []);
                    }
                } catch (\Throwable $inner) {
                    \Log::error('Fallback role insert failed', ['error' => $inner->getMessage()]);
                }
            }

            // Stage 5: Create platform settings with all collected data
            \Log::info('Installation Stage: settings', ['stage' => 'settings']);

            // Build SMS settings array
            $smsSettings = [];
            if (! empty($platformConfig['sms_provider'])) {
                $smsSettings = [
                    'provider' => $platformConfig['sms_provider'],
                    'configured' => true,
                ];

                if ($platformConfig['sms_provider'] === 'twilio') {
                    $smsSettings['twilio'] = [
                        'sid' => $platformConfig['sms_twilio_sid'] ? Crypt::encryptString($platformConfig['sms_twilio_sid']) : '',
                        'token' => $platformConfig['sms_twilio_token'] ? Crypt::encryptString($platformConfig['sms_twilio_token']) : '',
                        'from' => $platformConfig['sms_twilio_from'] ?? '',
                    ];
                } elseif ($platformConfig['sms_provider'] === 'nexmo') {
                    $smsSettings['nexmo'] = [
                        'key' => $platformConfig['sms_nexmo_key'] ? Crypt::encryptString($platformConfig['sms_nexmo_key']) : '',
                        'secret' => $platformConfig['sms_nexmo_secret'] ? Crypt::encryptString($platformConfig['sms_nexmo_secret']) : '',
                        'from' => $platformConfig['sms_nexmo_from'] ?? '',
                    ];
                }
            }

            PlatformSetting::create([
                'slug' => 'platform',
                'site_name' => $platformConfig['app_name'],
                'legal_name' => $platformConfig['legal_name'] ?? null,
                'tagline' => $platformConfig['tagline'] ?? null,
                'support_email' => $platformConfig['support_email'] ?? $platformConfig['mail_from_address'],
                'support_phone' => $platformConfig['support_phone'] ?? null,
                'marketing_url' => $platformConfig['marketing_url'] ?? null,
                'status_page_url' => $platformConfig['status_page_url'] ?? null,
                'email_settings' => [
                    'driver' => $platformConfig['mail_mailer'] ?? 'smtp',
                    'host' => $platformConfig['mail_host'] ?? '127.0.0.1',
                    'port' => (int) ($platformConfig['mail_port'] ?? 587),
                    'username' => $platformConfig['mail_username'] ?? '',
                    'password' => $platformConfig['mail_password'] ? Crypt::encryptString($platformConfig['mail_password']) : '',
                    'encryption' => $platformConfig['mail_encryption'] ?? 'tls',
                    'verify_peer' => ! ($platformConfig['mail_allow_self_signed'] ?? false),
                    'from_address' => $platformConfig['mail_from_address'],
                    'from_name' => $platformConfig['mail_from_name'],
                ],
                'sms_settings' => $smsSettings,
                'metadata' => [
                    'timezone' => $platformConfig['app_timezone'] ?? 'UTC',
                    'locale' => $platformConfig['app_locale'] ?? 'en',
                    'installed_version' => config('app.version', '1.0.0'),
                    'installed_at' => now()->toIso8601String(),
                ],
            ]);

            // Stage 6: Finalization
            \Log::info('Installation Stage: finalization', ['stage' => 'finalization']);
            File::put(storage_path('installed'), json_encode([
                'installed_at' => now()->toIso8601String(),
                'version' => config('app.version', '1.0.0'),
                'admin_email' => $admin->email,
            ]));

            // Clear all caches
            Artisan::call('config:clear');
            Artisan::call('cache:clear');
            Artisan::call('route:clear');
            Artisan::call('view:clear');

            // Clear installation session
            session()->forget(['installation_verified', 'db_config', 'platform_config', 'admin_config']);

            \Log::info('Installation completed successfully', [
                'admin_email' => $admin->email,
                'platform' => $platformConfig['app_name'],
            ]);

            // Redirect to admin subdomain login
            $appUrl = config('app.url') ?: env('APP_URL', 'http://localhost');
            $parsedHost = parse_url($appUrl, PHP_URL_HOST) ?: $appUrl;
            $adminDomain = env('ADMIN_DOMAIN') ?: 'admin.'.$parsedHost;
            $scheme = parse_url($appUrl, PHP_URL_SCHEME) ?: 'https';
            $redirectUrl = $scheme.'://'.$adminDomain.'/login';

            return response()->json([
                'success' => true,
                'message' => 'Platform installed successfully!',
                'redirect' => $redirectUrl,
                'stages' => $stages,
            ]);
        } catch (\Exception $e) {
            \Log::error('Installation failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Attempt rollback
            $adminEmail = $adminConfig['admin_email'] ?? null;
            $this->rollbackInstallation('error', $adminEmail);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'stage' => 'error',
                'rollback_attempted' => true,
            ], 500);
        }
    }

    /**
     * Show installation complete page
     */
    public function complete(): \Inertia\Response
    {
        $appUrl = config('app.url') ?: env('APP_URL', 'http://localhost');
        $parsedHost = parse_url($appUrl, PHP_URL_HOST) ?: $appUrl;
        $adminDomain = env('ADMIN_DOMAIN') ?: 'admin.'.$parsedHost;
        $scheme = parse_url($appUrl, PHP_URL_SCHEME) ?: 'https';
        $adminLoginUrl = $scheme.'://'.$adminDomain.'/login';

        return Inertia::render('Platform/Installation/Complete', [
            'title' => 'Installation Complete',
            'loginUrl' => $adminLoginUrl,
        ]);
    }

    /**
     * Check if platform is already installed
     */
    private function isInstalled(): bool
    {
        return File::exists(storage_path('installed'));
    }

    /**
     * Check system requirements
     */
    private function checkRequirements(): array
    {
        $requirements = [
            'php' => [
                'PHP Version (>= 8.2)' => [
                    'satisfied' => version_compare(PHP_VERSION, '8.2.0', '>='),
                    'message' => 'Current: '.PHP_VERSION,
                ],
            ],
            'extensions' => [],
            'permissions' => [],
        ];

        // Check required PHP extensions
        $requiredExtensions = [
            'BCMath' => 'bcmath',
            'Ctype' => 'ctype',
            'JSON' => 'json',
            'Mbstring' => 'mbstring',
            'OpenSSL' => 'openssl',
            'PDO' => 'pdo',
            'PDO MySQL' => 'pdo_mysql',
            'Tokenizer' => 'tokenizer',
            'XML' => 'xml',
            'cURL' => 'curl',
            'Fileinfo' => 'fileinfo',
            'GD' => 'gd',
            'Zip' => 'zip',
        ];

        foreach ($requiredExtensions as $name => $extension) {
            $requirements['extensions'][$name] = [
                'satisfied' => extension_loaded($extension),
                'message' => extension_loaded($extension) ? 'Installed' : 'Not installed',
            ];
        }

        // Check directory permissions
        $requiredPermissions = [
            'storage' => storage_path(),
            'bootstrap/cache' => base_path('bootstrap/cache'),
            'public' => public_path(),
        ];

        foreach ($requiredPermissions as $name => $path) {
            $isWritable = is_writable($path);
            $requirements['permissions'][$name] = [
                'satisfied' => $isWritable,
                'message' => $isWritable ? 'Writable' : 'Not writable - '.$path,
            ];
        }

        return $requirements;
    }

    /**
     * Persist installation progress to session (for recovery)
     */
    private function persistInstallationProgress(string $step, array $data = []): void
    {
        $progress = session('installation_progress', []);
        $progress[$step] = [
            'completed_at' => now()->toIso8601String(),
            'checksum' => hash('sha256', json_encode($data)),
        ];
        session(['installation_progress' => $progress]);

        \Log::info('Installation progress saved', ['step' => $step]);
    }

    /**
     * Rollback installation on failure
     *
     * Attempts to clean up any partial installation state.
     */
    private function rollbackInstallation(string $failedStage, ?string $adminEmail = null): void
    {
        \Log::warning('Rolling back installation', ['failed_stage' => $failedStage]);

        try {
            // Remove admin user if created
            if ($adminEmail && in_array($failedStage, ['settings', 'finalization'])) {
                try {
                    LandlordUser::where('email', $adminEmail)->delete();
                    \Log::info('Rollback: Admin user deleted', ['email' => $adminEmail]);
                } catch (\Throwable $e) {
                    \Log::warning('Rollback: Failed to delete admin user', ['error' => $e->getMessage()]);
                }
            }

            // Remove platform settings if created
            if ($failedStage === 'finalization') {
                try {
                    PlatformSetting::where('slug', 'platform')->delete();
                    \Log::info('Rollback: Platform settings deleted');
                } catch (\Throwable $e) {
                    \Log::warning('Rollback: Failed to delete platform settings', ['error' => $e->getMessage()]);
                }
            }

            // Remove lock file if it exists
            $lockFile = storage_path('installed');
            if (File::exists($lockFile)) {
                File::delete($lockFile);
                \Log::info('Rollback: Installation lock file removed');
            }

            // Note: We don't rollback migrations as that could cause more issues
            // The user will need to manually clean the database if needed

        } catch (\Throwable $e) {
            \Log::error('Rollback failed', [
                'stage' => $failedStage,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get installation progress for recovery UI
     */
    public function getInstallationProgress(): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'progress' => session('installation_progress', []),
            'hasDbConfig' => session()->has('db_config'),
            'hasPlatformConfig' => session()->has('platform_config'),
            'hasAdminConfig' => session()->has('admin_config'),
            'isVerified' => session('installation_verified', false),
        ]);
    }
}
