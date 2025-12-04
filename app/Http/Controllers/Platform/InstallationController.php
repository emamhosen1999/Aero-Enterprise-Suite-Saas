<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\InstallationRequest;
use App\Models\LandlordUser;
use App\Models\PlatformSetting;
use App\Services\Mail\MailService;
use App\Services\Platform\InstallationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class InstallationController extends Controller
{
    /**
     * Installation secret code hash (bcrypt)
     * Plain text secret: aEos365^T9*zB6_3
     *
     * This hash should be stored in .env as INSTALLATION_SECRET_HASH
     * Generated using: Hash::make('aEos365^T9*zB6_3')
     */
    private const INSTALLATION_SECRET_HASH = '$2y$12$8SvfCq6g4M7lywD6T.x5kOEvqRGSGZNoZrj7J4tO2Fb.tRijPbniK';

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
            return Inertia::render('Installation/AlreadyInstalled');
        }

        return Inertia::render('Installation/Welcome', [
            'title' => 'Welcome to Aero Enterprise Suite',
            'version' => config('app.version', '1.0.0'),
        ]);
    }

    /**
     * Show secret code verification page
     */
    public function showSecretVerification(): \Inertia\Response
    {
        if ($this->isInstalled()) {
            return redirect()->route('login');
        }

        return Inertia::render('Installation/SecretVerification', [
            'title' => 'Installation Security',
        ]);
    }

    /**
     * Verify installation secret code
     */
    public function verifySecret(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'secret_code' => ['required', 'string'],
        ]);

        // Get hash from .env or use hardcoded fallback
        $secretHash = config('app.installation_secret_hash', self::INSTALLATION_SECRET_HASH);

        // Verify using bcrypt
        if (! Hash::check($request->secret_code, $secretHash)) {
            return back()->withErrors([
                'secret_code' => 'Invalid installation secret code. Please contact your system administrator.',
            ]);
        }

        // Store verification in session
        session(['installation_verified' => true]);

        return redirect()->route('installation.requirements')->with('success', 'Secret code verified successfully.');
    }

    /**
     * Show requirements check page
     */
    public function showRequirements(): \Inertia\Response
    {
        if (! session('installation_verified')) {
            return redirect()->route('installation.secret');
        }

        $requirements = $this->checkRequirements();

        // Determine if all requirements are satisfied
        $canProceed = collect($requirements)->every(function ($group) {
            return collect($group)->every(fn ($item) => $item['satisfied']);
        });

        return Inertia::render('Installation/Requirements', [
            'title' => 'System Requirements',
            'requirements' => $requirements,
            'canProceed' => $canProceed,
        ]);
    }

    /**
     * Show database configuration page
     */
    public function showDatabase(): \Inertia\Response
    {
        if (! session('installation_verified')) {
            return redirect()->route('installation.secret');
        }

        return Inertia::render('Installation/Database', [
            'title' => 'Database Configuration',
            'currentConfig' => [
                'host' => config('database.connections.mysql.host'),
                'port' => config('database.connections.mysql.port'),
                'database' => config('database.connections.mysql.database'),
                'username' => config('database.connections.mysql.username'),
            ],
        ]);
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
                session([
                    'db_config' => [
                        'db_host' => $request->host,
                        'db_port' => $request->port,
                        'db_database' => $request->database,
                        'db_username' => $request->username,
                        'db_password' => $request->password,
                    ],
                ]);

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
    public function showPlatform(): \Inertia\Response
    {
        if (! session('installation_verified') || ! session('db_config')) {
            return redirect()->route('installation.database');
        }

        // Get current configuration from session or .env
        $platformConfig = session('platform_config', [
            'app_name' => config('app.name', 'Aero Enterprise Suite'),
            'app_url' => config('app.url', url('/')),
            'app_timezone' => config('app.timezone', 'UTC'),
            'app_locale' => config('app.locale', 'en'),
            'app_debug' => config('app.debug', false),
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
            'queue_connection' => config('queue.default', 'sync'),
            'session_driver' => config('session.driver', 'database'),
            'cache_driver' => config('cache.default', 'database'),
            'filesystem_disk' => config('filesystems.default', 'local'),
            'sms_provider' => config('services.sms.default', 'twilio'),
            'sms_twilio_sid' => config('services.twilio.sid', ''),
            'sms_twilio_token' => config('services.twilio.token', ''),
            'sms_twilio_from' => config('services.twilio.from', ''),
            'sms_nexmo_key' => config('services.nexmo.key', ''),
            'sms_nexmo_secret' => config('services.nexmo.secret', ''),
            'sms_nexmo_from' => config('services.nexmo.from', ''),
        ]);

        return Inertia::render('Installation/PlatformSettings', [
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
            'app_name' => ['required', 'string', 'max:255'],
            'app_url' => ['required', 'url'],
            'app_timezone' => ['required', 'string'],
            'app_locale' => ['required', 'string', 'in:en,bn,zh-CN,zh-TW'],
            'app_debug' => ['required', 'boolean'],
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
            'queue_connection' => ['required', 'string', 'in:sync,database,redis,beanstalkd,sqs'],
            'session_driver' => ['required', 'string', 'in:file,cookie,database,apc,memcached,redis,array'],
            'cache_driver' => ['required', 'string', 'in:file,database,apc,memcached,redis,array'],
            'filesystem_disk' => ['required', 'string', 'in:local,public,s3'],
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
    public function showAdmin(): \Inertia\Response
    {
        if (! session('installation_verified') || ! session('db_config')) {
            return redirect()->route('installation.database');
        }

        return Inertia::render('Installation/AdminAccount', [
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

        session(['admin_config' => $validated]);

        return redirect()->route('installation.review');
    }

    /**
     * Show final review page
     */
    public function showReview(): \Inertia\Response
    {
        if (! session('installation_verified') || ! session('db_config')) {
            return redirect()->route('installation.database');
        }

        return Inertia::render('Installation/Review', [
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
            $dbConfig = [
                'db_host' => $dbConfig['db_host'] ?? $dbConfig['host'] ?? null,
                'db_port' => $dbConfig['db_port'] ?? $dbConfig['port'] ?? null,
                'db_database' => $dbConfig['db_database'] ?? $dbConfig['database'] ?? null,
                'db_username' => $dbConfig['db_username'] ?? $dbConfig['username'] ?? null,
                'db_password' => $dbConfig['db_password'] ?? $dbConfig['password'] ?? null,
            ];

            // Stage 1: Update environment file
            \Log::info('Installation Stage: environment', ['stage' => 'environment']);
            $this->installationService->updateEnvironmentFile($dbConfig, $platformConfig);

            // Reconnect to use new database configuration
            DB::purge('mysql');
            config(['database.connections.mysql' => [
                'driver' => 'mysql',
                'host' => $dbConfig['db_host'],
                'port' => $dbConfig['db_port'],
                'database' => $dbConfig['db_database'],
                'username' => $dbConfig['db_username'],
                'password' => $dbConfig['db_password'],
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

            // Stage 3: Seed basic data
            \Log::info('Installation Stage: seeding', ['stage' => 'seeding']);
            Artisan::call('db:seed', [
                '--class' => 'SuperAdministratorRolesSeeder',
                '--force' => true,
            ]);
            $seedOutput = Artisan::output();
            \Log::info('Seeding output', ['output' => $seedOutput]);

            // Stage 4: Create admin user
            \Log::info('Installation Stage: admin', ['stage' => 'admin']);
            $admin = LandlordUser::create([
                'name' => $adminConfig['admin_name'],
                'email' => $adminConfig['admin_email'],
                'password' => Hash::make($adminConfig['admin_password']),
                'email_verified_at' => now(),
            ]);
            \Log::info('Admin created', ['admin_id' => $admin->id, 'email' => $admin->email]);

            // Assign platform_super_administrator role
            $admin->assignRole('platform_super_administrator');
            \Log::info('Role assigned', ['role' => 'platform_super_administrator']);

            // Stage 5: Create platform settings
            \Log::info('Installation Stage: settings', ['stage' => 'settings']);
            PlatformSetting::create([
                'slug' => 'platform',
                'site_name' => $platformConfig['app_name'],
                'support_email' => $platformConfig['mail_from_address'],
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

            return response()->json([
                'success' => true,
                'message' => 'Platform installed successfully!',
                'redirect' => route('login'),
                'stages' => $stages,
            ]);
        } catch (\Exception $e) {
            \Log::error('Installation failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'stage' => 'error',
            ], 500);
        }
    }

    /**
     * Show installation complete page
     */
    public function complete(): \Inertia\Response
    {
        return Inertia::render('Installation/Complete', [
            'title' => 'Installation Complete',
            'loginUrl' => route('login'),
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
}
