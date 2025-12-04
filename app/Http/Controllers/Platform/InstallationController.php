<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\InstallationRequest;
use App\Models\LandlordUser;
use App\Services\Platform\InstallationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
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
                        'host' => $request->host,
                        'port' => $request->port,
                        'database' => $request->database,
                        'username' => $request->username,
                        'password' => $request->password,
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
            'mail_mailer' => config('mail.default', 'smtp'),
            'mail_host' => config('mail.mailers.smtp.host', 'smtp.mailtrap.io'),
            'mail_port' => config('mail.mailers.smtp.port', '2525'),
            'mail_username' => config('mail.mailers.smtp.username', ''),
            'mail_password' => config('mail.mailers.smtp.password', ''),
            'mail_encryption' => config('mail.mailers.smtp.encryption', 'tls'),
            'mail_from_address' => config('mail.from.address', 'noreply@aero-enterprise-suite.com'),
            'mail_from_name' => config('mail.from.name', 'Aero Enterprise Suite'),
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
    public function savePlatform(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'app_name' => ['required', 'string', 'max:255'],
            'app_url' => ['required', 'url'],
            'mail_mailer' => ['required', 'string', 'in:smtp,sendmail,mailgun,ses,postmark,log'],
            'mail_host' => ['required', 'string'],
            'mail_port' => ['required', 'integer', 'min:1', 'max:65535'],
            'mail_username' => ['nullable', 'string'],
            'mail_password' => ['nullable', 'string'],
            'mail_encryption' => ['required', 'string', 'in:tls,ssl,null'],
            'mail_from_address' => ['required', 'email'],
            'mail_from_name' => ['required', 'string', 'max:255'],
            'sms_provider' => ['nullable', 'string', 'in:twilio,nexmo,messagebird,sns'],
            'sms_twilio_sid' => ['nullable', 'string'],
            'sms_twilio_token' => ['nullable', 'string'],
            'sms_twilio_from' => ['nullable', 'string'],
            'sms_nexmo_key' => ['nullable', 'string'],
            'sms_nexmo_secret' => ['nullable', 'string'],
            'sms_nexmo_from' => ['nullable', 'string'],
        ]);

        session(['platform_config' => $validated]);

        return response()->json([
            'success' => true,
            'message' => 'Platform settings saved.',
        ]);
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
        ]);

        try {
            // Temporarily configure mail settings
            config([
                'mail.mailers.smtp.host' => $request->mail_host,
                'mail.mailers.smtp.port' => $request->mail_port,
                'mail.mailers.smtp.username' => $request->mail_username,
                'mail.mailers.smtp.password' => $request->mail_password,
                'mail.mailers.smtp.encryption' => $request->mail_encryption === 'null' ? null : $request->mail_encryption,
                'mail.from.address' => $request->mail_from_address,
                'mail.from.name' => $request->mail_from_name,
            ]);

            // Send test email
            \Mail::raw('This is a test email from your Aero Enterprise Suite installation. If you received this, your email configuration is working correctly!', function ($message) use ($request) {
                $message->to($request->test_email)
                    ->subject('Test Email - Aero Enterprise Suite Installation');
            });

            return response()->json([
                'success' => true,
                'message' => 'Test email sent successfully! Please check your inbox.',
            ]);
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
    public function saveAdmin(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'admin_name' => ['required', 'string', 'max:255'],
            'admin_email' => ['required', 'email', 'max:255'],
            'admin_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        session(['admin_config' => $validated]);

        return response()->json([
            'success' => true,
            'message' => 'Admin account details saved.',
        ]);
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
            'config' => [
                'platform' => session('platform_config'),
                'database' => array_merge(session('db_config', []), ['password' => '***']),
                'admin' => array_merge(session('admin_config', []), ['admin_password' => '***']),
            ],
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
            ], 403);
        }

        try {
            DB::beginTransaction();

            // 1. Update .env file with database and platform configuration
            $dbConfig = session('db_config');
            $platformConfig = session('platform_config');
            $adminConfig = session('admin_config');

            $this->installationService->updateEnvironmentFile($dbConfig, $platformConfig);

            // 2. Run migrations
            Artisan::call('migrate', ['--force' => true]);

            // 3. Seed basic data (roles, permissions, super admin role)
            Artisan::call('db:seed', [
                '--class' => 'SuperAdministratorRolesSeeder',
                '--force' => true,
            ]);

            // 4. Create platform super administrator user
            $admin = LandlordUser::create([
                'name' => $adminConfig['admin_name'],
                'email' => $adminConfig['admin_email'],
                'password' => Hash::make($adminConfig['admin_password']),
                'email_verified_at' => now(),
            ]);

            // 5. Assign platform_super_administrator role
            $admin->assignRole('platform_super_administrator');

            // 6. Create installation lock file
            File::put(storage_path('installed'), json_encode([
                'installed_at' => now()->toIso8601String(),
                'version' => config('app.version', '1.0.0'),
                'admin_email' => $admin->email,
            ]));

            // 7. Clear all caches
            Artisan::call('config:clear');
            Artisan::call('cache:clear');
            Artisan::call('route:clear');
            Artisan::call('view:clear');

            DB::commit();

            // Clear installation session
            session()->forget(['installation_verified', 'db_config', 'platform_config', 'admin_config']);

            return response()->json([
                'success' => true,
                'message' => 'Platform installed successfully!',
                'redirect' => route('login'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error('Installation failed: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Installation failed: '.$e->getMessage(),
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
