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

    /**
     * Minimum disk space required for installation (in bytes)
     */
    private const MIN_DISK_SPACE = 100 * 1024 * 1024; // 100MB

    /**
     * Required database tables for installation verification
     */
    private const REQUIRED_TABLES = [
        'landlord_users', 'tenants', 'domains', 'plans',
        'modules', 'platform_settings', 'roles', 'model_has_roles', 'role_module_access',
    ];

    /**
     * Installation stages that require migration rollback during cleanup
     */
    private const STAGES_REQUIRING_MIGRATION_ROLLBACK = [
        'seeding', 'admin', 'settings', 'verification', 'finalization', 'error',
    ];

    /**
     * Installation lock timeout (30 minutes)
     */
    private const INSTALLATION_LOCK_TIMEOUT = 1800; // 30 minutes

    /**
     * Config file paths for persistence
     */
    private const CONFIG_FILE_DB = 'installation_db_config.json';
    private const CONFIG_FILE_PLATFORM = 'installation_platform_config.json';
    private const CONFIG_FILE_ADMIN = 'installation_admin_config.json';

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
                // Note: Not encrypting password here because APP_KEY may change during installation
                // Session data is server-side and config files are cleaned up after installation
                $dbConfig = [
                    'db_host' => $request->host,
                    'db_port' => $request->port,
                    'db_database' => $request->database,
                    'db_username' => $request->username,
                    'db_password' => $request->password ?? '',
                    'db_password_encrypted' => false,
                ];
                
                session(['db_config' => $dbConfig]);
                
                // Phase 2: Persist to file
                $this->persistConfig('db', $dbConfig);

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
        
        // Phase 2: Persist to file
        $this->persistConfig('platform', $validated);

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

        // Note: Not encrypting password here because APP_KEY may change during installation
        // Session data is server-side and config files are cleaned up after installation
        $adminConfig = [
            'admin_name' => $validated['admin_name'],
            'admin_email' => $validated['admin_email'],
            'admin_password' => $validated['admin_password'],
            'admin_password_encrypted' => false,
        ];
        
        session(['admin_config' => $adminConfig]);
        
        // Phase 2: Persist to file
        $this->persistConfig('admin', $adminConfig);

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
            'lock' => 'Acquiring installation lock',
            'validation' => 'Validating prerequisites',
            'environment' => 'Updating environment configuration',
            'migrations' => 'Running database migrations',
            'seeding' => 'Seeding initial data',
            'admin' => 'Creating administrator account',
            'settings' => 'Configuring platform settings',
            'verification' => 'Verifying installation',
            'finalization' => 'Finalizing installation',
        ];

        try {
            // Phase 2: Acquire installation lock
            $this->trackProgress('lock', 'in_progress', 'Acquiring installation lock');
            $this->acquireInstallationLock();
            $this->trackProgress('lock', 'completed', 'Lock acquired');

            // Phase 2: Load config from files with session fallback
            $persistedConfig = $this->loadPersistedConfig();
            $dbConfig = $persistedConfig['db_config'] ?? session('db_config');
            $platformConfig = $persistedConfig['platform_config'] ?? session('platform_config');
            $adminConfig = $persistedConfig['admin_config'] ?? session('admin_config');

            // Validate session/file data
            if (! $dbConfig || ! $platformConfig || ! $adminConfig) {
                \Log::error('Installation failed: Missing session data', [
                    'db_config' => $dbConfig ? 'present' : 'missing',
                    'platform_config' => $platformConfig ? 'present' : 'missing',
                    'admin_config' => $adminConfig ? 'present' : 'missing',
                    'all_session' => session()->all(),
                ]);

                $this->trackProgress('validation', 'failed', 'Missing configuration data');
                $this->releaseInstallationLock();

                return response()->json([
                    'success' => false,
                    'message' => 'Session data lost. Please go back to the Database step and continue from there.',
                    'stage' => 'validation',
                    'error' => 'Missing configuration data',
                ], 400);
            }

            // Pre-flight validation
            \Log::info('Installation Stage: validation', ['stage' => 'validation']);
            $this->trackProgress('validation', 'in_progress', 'Validating prerequisites');
            $this->validatePreInstallation();
            $this->trackProgress('validation', 'completed', 'Validation passed');

            // Normalize database config keys (handle both old and new format)
            // Convert to format expected by InstallationService (without db_ prefix)
            // Decrypt password if it was encrypted in session
            // Get database password (may be encrypted if from older installation attempt)
            $dbPassword = $dbConfig['db_password'] ?? $dbConfig['password'] ?? null;
            if (! empty($dbConfig['db_password_encrypted']) && $dbPassword) {
                try {
                    $dbPassword = Crypt::decryptString($dbPassword);
                } catch (\Exception $e) {
                    \Log::warning('Failed to decrypt db_password, assuming it is plain text', ['error' => $e->getMessage()]);
                    // Password is likely already plain text from newer installation flow
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
            $this->trackProgress('environment', 'in_progress', 'Updating environment configuration');
            $this->installationService->updateEnvironmentFile($dbConfig, $platformConfig);
            $this->trackProgress('environment', 'completed', 'Environment updated');

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

            // Verify database connection after reconnect
            try {
                DB::connection()->getPdo();
                \Log::info('Database reconnection successful');
            } catch (\Exception $e) {
                throw new \RuntimeException('Failed to reconnect to database after configuration update: ' . $e->getMessage());
            }

            // Stage 2: Run migrations (outside transaction - migrations manage their own transactions)
            \Log::info('Installation Stage: migrations', ['stage' => 'migrations']);
            $this->trackProgress('migrations', 'in_progress', 'Running database migrations');
            Artisan::call('migrate', ['--force' => true]);
            $migrationOutput = Artisan::output();
            \Log::info('Migration output', ['output' => $migrationOutput]);
            $this->trackProgress('migrations', 'completed', 'Migrations completed');

            // Stage 3: Seed plans and modules (outside transaction - seeders manage their own transactions)
            \Log::info('Installation Stage: seeding', ['stage' => 'seeding']);
            $this->trackProgress('seeding', 'in_progress', 'Seeding initial data');
            
            // Seed plans
            Artisan::call('db:seed', [
                '--class' => 'Aero\\Platform\\Database\\Seeders\\PlanSeeder',
                '--force' => true,
            ]);
            $seedOutput = Artisan::output();
            \Log::info('PlanSeeder output', ['output' => $seedOutput]);
            
            // Sync platform modules from config to database
            // Note: We call the command class directly to avoid command discovery issues during installation
            $this->trackProgress('seeding', 'in_progress', 'Syncing platform modules');
            $this->syncPlatformModules();
            
            $this->trackProgress('seeding', 'completed', 'Seeding completed');

            // Wrap post-migration database operations in a transaction for atomicity
            DB::beginTransaction();

            try {

            // Stage 4: Create admin user
            \Log::info('Installation Stage: admin', ['stage' => 'admin']);
            $this->trackProgress('admin', 'in_progress', 'Creating administrator account');

            // Get admin password (may be encrypted if from older installation attempt)
            $adminPassword = $adminConfig['admin_password'];
            if (! empty($adminConfig['admin_password_encrypted'])) {
                try {
                    $adminPassword = Crypt::decryptString($adminPassword);
                } catch (\Exception $e) {
                    \Log::warning('Failed to decrypt admin_password, assuming it is plain text', ['error' => $e->getMessage()]);
                    // Password is likely already plain text from newer installation flow
                }
            }

            // Create Super Administrator role for landlord guard (matching LandlordUser's guard_name)
            $role = \Spatie\Permission\Models\Role::firstOrCreate(
                ['name' => 'Super Administrator', 'guard_name' => 'landlord', 'scope' => 'platform']
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
                    $role = \Spatie\Permission\Models\Role::where('name', 'Super Administrator')
                        ->where('guard_name', 'landlord')
                        ->first();
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

            $this->trackProgress('admin', 'completed', 'Administrator account created');

            // Stage 5: Create platform settings with all collected data
            \Log::info('Installation Stage: settings', ['stage' => 'settings']);
            $this->trackProgress('settings', 'in_progress', 'Configuring platform settings');

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

                $this->trackProgress('settings', 'completed', 'Platform settings configured');

                // Commit transaction - all database operations succeeded
                DB::commit();
                \Log::info('Database transaction committed successfully');

            } catch (\Throwable $transactionException) {
                // Rollback transaction on any failure
                DB::rollBack();
                \Log::error('Transaction rolled back due to error', [
                    'error' => $transactionException->getMessage(),
                ]);
                $this->trackProgress('transaction', 'failed', $transactionException->getMessage());
                throw $transactionException;
            }

            // Stage 6: Verify Installation
            \Log::info('Installation Stage: verification', ['stage' => 'verification']);
            $this->trackProgress('verification', 'in_progress', 'Verifying installation');
            $this->verifyInstallation($adminConfig['admin_email']);
            $this->trackProgress('verification', 'completed', 'Verification passed');

            // Stage 7: Finalization
            \Log::info('Installation Stage: finalization', ['stage' => 'finalization']);
            $this->trackProgress('finalization', 'in_progress', 'Finalizing installation');
            File::put(storage_path('app/aeos.installed'), json_encode([
                'installed_at' => now()->toIso8601String(),
                'version' => config('app.version', '1.0.0'),
                'admin_email' => $adminConfig['admin_email'],
            ]));

            // Clear all caches
            Artisan::call('config:clear');
            Artisan::call('cache:clear');
            Artisan::call('route:clear');
            Artisan::call('view:clear');

            // Phase 2 & 3: Clean up
            $this->cleanupPersistedConfig();
            $this->releaseInstallationLock();
            $this->cleanupProgressTracking();

            // Clear installation session
            session()->forget(['installation_verified', 'db_config', 'platform_config', 'admin_config']);

            \Log::info('Installation completed successfully', [
                'admin_email' => $adminConfig['admin_email'],
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

            // Phase 2 & 3: Clean up on failure
            $this->releaseInstallationLock();
            $this->trackProgress('installation', 'failed', $e->getMessage());

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
        return File::exists(storage_path('app/aeos.installed'));
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
            // If database operations failed, transaction will already be rolled back
            // But we still need to clean up other artifacts

            // 1. Remove admin user if created (belt and suspenders with transaction rollback)
            if ($adminEmail) {
                try {
                    // Find and delete specific admin user created during installation
                    $admin = LandlordUser::where('email', $adminEmail)->first();
                    if ($admin) {
                        $admin->delete();
                        \Log::info('Rollback: Admin user deleted', ['email' => $adminEmail, 'user_id' => $admin->id]);
                    } else {
                        \Log::info('Rollback: Admin user not found (may already be rolled back)', ['email' => $adminEmail]);
                    }
                } catch (\Throwable $e) {
                    \Log::warning('Rollback: Failed to delete admin user (may already be rolled back)', ['error' => $e->getMessage()]);
                }
            }

            // 2. Remove platform settings if created
            try {
                PlatformSetting::where('slug', 'platform')->delete();
                \Log::info('Rollback: Platform settings deleted');
            } catch (\Throwable $e) {
                \Log::warning('Rollback: Failed to delete platform settings (may already be rolled back)', ['error' => $e->getMessage()]);
            }

            // 3. Rollback migrations if they were run - use migrate:reset to drop ALL tables
            if (in_array($failedStage, self::STAGES_REQUIRING_MIGRATION_ROLLBACK, true)) {
                try {
                    \Log::info('Rollback: Attempting to reset all migrations (drop all tables)');
                    Artisan::call('migrate:reset', ['--force' => true]);
                    $rollbackOutput = Artisan::output();
                    \Log::info('Rollback: All migrations reset (tables dropped)', ['output' => $rollbackOutput]);
                } catch (\Throwable $e) {
                    \Log::warning('Rollback: Failed to rollback migrations', ['error' => $e->getMessage()]);
                }
            }

            // 4. Remove lock file if it exists
            $lockFile = storage_path('app/aeos.installed');
            if (File::exists($lockFile)) {
                File::delete($lockFile);
                \Log::info('Rollback: Installation lock file removed');
            }

            // 5. Restore .env backup if it exists
            $backupPath = storage_path('.env.backup');
            if (File::exists($backupPath)) {
                try {
                    File::copy($backupPath, base_path('.env'));
                    File::delete($backupPath);
                    \Log::info('Rollback: .env file restored from backup');
                } catch (\Throwable $e) {
                    \Log::warning('Rollback: Failed to restore .env backup', ['error' => $e->getMessage()]);
                }
            }

            \Log::info('Rollback completed');

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

    /**
     * Validate prerequisites before installation
     */
    private function validatePreInstallation(): void
    {
        // 1. Check if already installed
        if (File::exists(storage_path('app/aeos.installed'))) {
            throw new \RuntimeException('Platform is already installed. Remove storage/installed file to reinstall.');
        }

        // 2. Check storage directory is writable
        if (! is_writable(storage_path())) {
            throw new \RuntimeException('Storage directory is not writable. Please check permissions.');
        }

        // 3. Check .env file is writable
        $envPath = base_path('.env');
        if (File::exists($envPath) && ! is_writable($envPath)) {
            throw new \RuntimeException('.env file exists but is not writable. Please check permissions.');
        }

        // 4. Check disk space (require minimum specified in constant)
        $freeSpace = disk_free_space(storage_path());
        if ($freeSpace < self::MIN_DISK_SPACE) {
            $freeMB = round($freeSpace / 1024 / 1024, 2);
            $requiredMB = round(self::MIN_DISK_SPACE / 1024 / 1024, 2);
            throw new \RuntimeException("Insufficient disk space. Only {$freeMB}MB available, {$requiredMB}MB required.");
        }

        // 5. Backup existing .env if it exists
        if (File::exists($envPath)) {
            $backupPath = storage_path('.env.backup');
            File::copy($envPath, $backupPath);
            \Log::info('Backed up existing .env file', ['backup' => $backupPath]);
        }

        \Log::info('Pre-flight validation passed');
    }

    /**
     * Verify installation completed successfully
     */
    private function verifyInstallation(string $adminEmail): void
    {
        // 1. Check migrations table exists and has records
        if (! \Illuminate\Support\Facades\Schema::hasTable('migrations')) {
            throw new \RuntimeException('Migrations table not found. Database migration may have failed.');
        }

        $migrationCount = DB::table('migrations')->count();
        if ($migrationCount === 0) {
            throw new \RuntimeException('No migrations were executed. Migration process may have failed.');
        }
        \Log::info('Migration verification passed', ['migration_count' => $migrationCount]);

        // 2. Check required tables exist
        $missingTables = [];
        foreach (self::REQUIRED_TABLES as $table) {
            if (! \Illuminate\Support\Facades\Schema::hasTable($table)) {
                $missingTables[] = $table;
            }
        }

        if (! empty($missingTables)) {
            throw new \RuntimeException('Required tables missing: ' . implode(', ', $missingTables));
        }
        \Log::info('Required tables verification passed', ['tables_checked' => count(self::REQUIRED_TABLES)]);

        // 3. Verify admin user exists with Super Administrator role
        $adminCount = LandlordUser::whereHas('roles', function ($q) {
            $q->where('name', 'Super Administrator');
        })->count();

        if ($adminCount === 0) {
            throw new \RuntimeException('No admin user with Super Administrator role found. Admin creation may have failed.');
        }

        // Verify specific admin user
        $admin = LandlordUser::where('email', $adminEmail)->first();
        if (! $admin) {
            throw new \RuntimeException("Admin user with email {$adminEmail} not found.");
        }

        if (! $admin->hasRole('Super Administrator')) {
            throw new \RuntimeException("Admin user exists but does not have Super Administrator role.");
        }
        \Log::info('Admin user verification passed', ['email' => $adminEmail]);

        // 4. Verify platform settings exist
        if (! PlatformSetting::where('slug', 'platform')->exists()) {
            throw new \RuntimeException('Platform settings not found. Settings creation may have failed.');
        }
        \Log::info('Platform settings verification passed');

        // 5. Verify plans seeded (at least one plan should exist)
        $planCount = DB::table('plans')->count();
        if ($planCount === 0) {
            \Log::warning('No plans found in database. Plan seeding may have been skipped or failed.');
        } else {
            \Log::info('Plan seeding verification passed', ['plan_count' => $planCount]);
        }

        // 6. Test basic database operations
        try {
            DB::select('SELECT 1');
            \Log::info('Database query test passed');
        } catch (\Exception $e) {
            throw new \RuntimeException('Database query test failed: ' . $e->getMessage());
        }

        \Log::info('Installation verification completed successfully');
    }

    /**
     * Phase 2: Persist configuration to file (not just session)
     */
    private function persistConfig(string $type, array $config): void
    {
        $filename = match($type) {
            'db' => self::CONFIG_FILE_DB,
            'platform' => self::CONFIG_FILE_PLATFORM,
            'admin' => self::CONFIG_FILE_ADMIN,
            default => throw new \InvalidArgumentException("Invalid config type: {$type}"),
        };

        $filePath = storage_path($filename);
        
        try {
            // Encrypt sensitive data before saving
            $encryptedConfig = $this->encryptSensitiveConfig($config);
            File::put($filePath, json_encode($encryptedConfig, JSON_PRETTY_PRINT));
            \Log::info("Config persisted to file", ['type' => $type, 'file' => $filename]);
        } catch (\Exception $e) {
            \Log::warning("Failed to persist config to file", [
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Load persisted configuration from file with fallback to session
     */
    private function loadPersistedConfig(): array
    {
        $config = [];

        // Try to load from files first
        foreach (['db', 'platform', 'admin'] as $type) {
            $filename = match($type) {
                'db' => self::CONFIG_FILE_DB,
                'platform' => self::CONFIG_FILE_PLATFORM,
                'admin' => self::CONFIG_FILE_ADMIN,
            };

            $filePath = storage_path($filename);
            
            if (File::exists($filePath)) {
                try {
                    $fileContent = json_decode(File::get($filePath), true);
                    $config["{$type}_config"] = $this->decryptSensitiveConfig($fileContent);
                    \Log::info("Config loaded from file", ['type' => $type]);
                } catch (\Exception $e) {
                    \Log::warning("Failed to load config from file", [
                        'type' => $type,
                        'error' => $e->getMessage(),
                    ]);
                    // Fallback to session
                    $config["{$type}_config"] = session("{$type}_config");
                }
            } else {
                // Fallback to session
                $config["{$type}_config"] = session("{$type}_config");
            }
        }

        return $config;
    }

    /**
     * Encrypt sensitive fields in configuration
     */
    private function encryptSensitiveConfig(array $config): array
    {
        $sensitiveFields = ['password', 'db_password', 'admin_password', 'mail_password'];
        
        foreach ($sensitiveFields as $field) {
            if (isset($config[$field]) && !empty($config[$field])) {
                try {
                    $config[$field] = Crypt::encryptString($config[$field]);
                    $config["{$field}_encrypted"] = true;
                } catch (\Exception $e) {
                    \Log::warning("Failed to encrypt field: {$field}");
                }
            }
        }

        return $config;
    }

    /**
     * Decrypt sensitive fields in configuration
     */
    private function decryptSensitiveConfig(array $config): array
    {
        $sensitiveFields = ['password', 'db_password', 'admin_password', 'mail_password'];
        
        foreach ($sensitiveFields as $field) {
            if (isset($config[$field]) && !empty($config["{$field}_encrypted"])) {
                try {
                    $config[$field] = Crypt::decryptString($config[$field]);
                    unset($config["{$field}_encrypted"]);
                } catch (\Exception $e) {
                    \Log::warning("Failed to decrypt field: {$field}");
                }
            }
        }

        return $config;
    }

    /**
     * Clean up persisted config files
     */
    private function cleanupPersistedConfig(): void
    {
        $files = [
            self::CONFIG_FILE_DB,
            self::CONFIG_FILE_PLATFORM,
            self::CONFIG_FILE_ADMIN,
        ];

        foreach ($files as $filename) {
            $filePath = storage_path($filename);
            if (File::exists($filePath)) {
                File::delete($filePath);
                \Log::info("Cleaned up config file", ['file' => $filename]);
            }
        }
    }

    /**
     * Phase 2: Acquire installation lock to prevent concurrent installations
     */
    private function acquireInstallationLock(): void
    {
        $lockFile = storage_path('installation.lock');
        
        if (File::exists($lockFile)) {
            $lockData = json_decode(File::get($lockFile), true);
            $createdAt = \Carbon\Carbon::parse($lockData['created_at'] ?? now());
            $lockAge = now()->diffInSeconds($createdAt);
            
            // Lock expires after timeout
            if ($lockAge < self::INSTALLATION_LOCK_TIMEOUT) {
                $remainingTime = self::INSTALLATION_LOCK_TIMEOUT - $lockAge;
                $remainingMinutes = ceil($remainingTime / 60);
                
                throw new \RuntimeException(
                    "Installation already in progress by {$lockData['user']}. " .
                    "Lock expires in {$remainingMinutes} minutes. " .
                    "If the previous installation failed, delete storage/installation.lock to retry."
                );
            }
            
            // Lock expired, remove it
            File::delete($lockFile);
            \Log::info('Expired installation lock removed', ['age_seconds' => $lockAge]);
        }
        
        // Create new lock
        File::put($lockFile, json_encode([
            'created_at' => now()->toIso8601String(),
            'user' => request()->ip() ?: 'unknown',
            'process_id' => getmypid(),
        ], JSON_PRETTY_PRINT));
        
        \Log::info('Installation lock acquired', ['user' => request()->ip()]);
    }

    /**
     * Release installation lock
     */
    private function releaseInstallationLock(): void
    {
        $lockFile = storage_path('installation.lock');
        
        if (File::exists($lockFile)) {
            File::delete($lockFile);
            \Log::info('Installation lock released');
        }
    }

    /**
     * Phase 3: Track installation progress to database (for multi-tab support)
     */
    private function trackProgress(string $stage, string $status = 'in_progress', ?string $message = null): void
    {
        try {
            $progressFile = storage_path('installation_progress.json');
            
            $progress = [];
            if (File::exists($progressFile)) {
                $progress = json_decode(File::get($progressFile), true) ?? [];
            }
            
            $progress[$stage] = [
                'status' => $status, // 'in_progress', 'completed', 'failed'
                'message' => $message,
                'timestamp' => now()->toIso8601String(),
            ];
            
            File::put($progressFile, json_encode($progress, JSON_PRETTY_PRINT));
            
            \Log::info('Installation progress tracked', [
                'stage' => $stage,
                'status' => $status,
            ]);
        } catch (\Exception $e) {
            \Log::warning('Failed to track progress', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get installation progress
     */
    public function getProgress(): \Illuminate\Http\JsonResponse
    {
        $progressFile = storage_path('installation_progress.json');
        
        if (File::exists($progressFile)) {
            try {
                $progress = json_decode(File::get($progressFile), true);
                return response()->json([
                    'success' => true,
                    'progress' => $progress,
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to read progress',
                ], 500);
            }
        }
        
        return response()->json([
            'success' => true,
            'progress' => [],
        ]);
    }

    /**
     * Clean up progress tracking file
     */
    private function cleanupProgressTracking(): void
    {
        $progressFile = storage_path('installation_progress.json');
        
        if (File::exists($progressFile)) {
            File::delete($progressFile);
            \Log::info('Installation progress file cleaned up');
        }
    }

    /**
     * Sync platform modules from package configs to the database.
     * 
     * This method directly uses the SyncModuleHierarchy command's logic
     * to avoid command discovery issues during installation when artisan
     * commands may not be fully registered after environment changes.
     */
    private function syncPlatformModules(): void
    {
        try {
            // Try to call the command via Artisan first
            Artisan::call('aero:sync-module', [
                '--scope' => 'platform',
                '--fresh' => true,
                '--force' => true,
            ]);
            $moduleSyncOutput = Artisan::output();
            \Log::info('Module sync output', ['output' => $moduleSyncOutput]);
        } catch (\Symfony\Component\Console\Exception\CommandNotFoundException $e) {
            // If command not found, run the sync logic directly
            \Log::warning('aero:sync-module command not found, running sync logic directly');
            $this->runModuleSyncDirectly();
        }
    }

    /**
     * Run module sync logic directly without using Artisan command.
     * This is a fallback for when the command isn't registered during installation.
     */
    private function runModuleSyncDirectly(): void
    {
        // Get all module config files from packages
        $moduleConfigs = $this->discoverModuleConfigs();
        
        \Log::info('Discovered module configs for direct sync', ['count' => count($moduleConfigs)]);
        
        foreach ($moduleConfigs as $packageName => $config) {
            if (empty($config['modules'])) {
                continue;
            }
            
            foreach ($config['modules'] as $moduleData) {
                // Only sync platform-scoped modules during installation
                $scope = $moduleData['scope'] ?? 'tenant';
                if ($scope !== 'platform') {
                    continue;
                }
                
                $this->syncModuleToDatabase($moduleData);
            }
        }
        
        \Log::info('Direct module sync completed');
    }

    /**
     * Discover module config files from vendor packages.
     */
    private function discoverModuleConfigs(): array
    {
        $configs = [];
        $vendorPath = base_path('vendor/aero');
        
        if (!is_dir($vendorPath)) {
            return $configs;
        }
        
        $packages = scandir($vendorPath);
        foreach ($packages as $package) {
            if ($package === '.' || $package === '..') {
                continue;
            }
            
            $configPath = $vendorPath . '/' . $package . '/config/modules.php';
            if (file_exists($configPath)) {
                $configs[$package] = require $configPath;
            }
        }
        
        return $configs;
    }

    /**
     * Sync a single module and its hierarchy to the database.
     */
    private function syncModuleToDatabase(array $moduleData): void
    {
        $moduleModel = config('aero-core.models.module', \Aero\Core\Models\Module::class);
        $subModuleModel = config('aero-core.models.sub_module', \Aero\Core\Models\SubModule::class);
        $componentModel = config('aero-core.models.module_component', \Aero\Core\Models\ModuleComponent::class);
        $actionModel = config('aero-core.models.module_component_action', \Aero\Core\Models\ModuleComponentAction::class);
        
        // Create or update module
        $module = $moduleModel::updateOrCreate(
            ['code' => $moduleData['code']],
            [
                'name' => $moduleData['name'],
                'description' => $moduleData['description'] ?? null,
                'icon' => $moduleData['icon'] ?? null,
                'category' => $moduleData['category'] ?? null,
                'scope' => $moduleData['scope'] ?? 'tenant',
                'is_active' => true,
                'display_order' => $moduleData['display_order'] ?? 0,
            ]
        );
        
        \Log::info('Synced module', ['code' => $moduleData['code'], 'id' => $module->id]);
        
        // Sync sub-modules
        if (!empty($moduleData['sub_modules'])) {
            foreach ($moduleData['sub_modules'] as $subModuleData) {
                $subModule = $subModuleModel::updateOrCreate(
                    ['code' => $subModuleData['code'], 'module_id' => $module->id],
                    [
                        'name' => $subModuleData['name'],
                        'description' => $subModuleData['description'] ?? null,
                        'icon' => $subModuleData['icon'] ?? null,
                        'is_active' => true,
                        'display_order' => $subModuleData['display_order'] ?? 0,
                    ]
                );
                
                // Sync components
                if (!empty($subModuleData['components'])) {
                    foreach ($subModuleData['components'] as $componentData) {
                        $component = $componentModel::updateOrCreate(
                            ['code' => $componentData['code'], 'sub_module_id' => $subModule->id],
                            [
                                'name' => $componentData['name'],
                                'description' => $componentData['description'] ?? null,
                                'is_active' => true,
                                'display_order' => $componentData['display_order'] ?? 0,
                            ]
                        );
                        
                        // Sync actions
                        if (!empty($componentData['actions'])) {
                            foreach ($componentData['actions'] as $actionData) {
                                $actionModel::updateOrCreate(
                                    ['code' => $actionData['code'], 'module_component_id' => $component->id],
                                    [
                                        'name' => $actionData['name'],
                                        'description' => $actionData['description'] ?? null,
                                        'is_active' => true,
                                    ]
                                );
                            }
                        }
                    }
                }
            }
        }
    }
}
