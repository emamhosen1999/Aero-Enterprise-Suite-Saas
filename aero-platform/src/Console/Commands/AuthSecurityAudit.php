<?php

namespace Aero\Platform\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\File;

class AuthSecurityAudit extends Command
{
    protected $signature = 'auth:security-audit';

    protected $description = 'Audit authentication system for ISO 27001/27002 compliance';

    public function handle()
    {
        $this->info('🔐 Running Laravel Authentication Security Audit...');

        // Check session settings
        $this->checkSetting('HTTPS enforced (SESSION_SECURE_COOKIE)', config('session.secure'), true);
        $this->checkSetting('Session HTTP Only', config('session.http_only'), true);
        $this->checkSetting('Session SameSite=strict', config('session.same_site'), 'strict');

        // Check Fortify 2FA
        $fortifyFeatures = config('fortify.features', []);
        $twoFA = in_array(\Laravel\Fortify\Features::twoFactorAuthentication(), $fortifyFeatures);
        $this->checkSetting('2FA Enabled', $twoFA, true);

        // Check password rules
        $file = base_path('app/Actions/Fortify/CreateNewUser.php');
        if (File::exists($file)) {
            $contents = File::get($file);
            $complexity = [
                'min:12',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'regex:/[@$!%*?&#]/',
            ];
            $score = 0;
            foreach ($complexity as $rule) {
                if (str_contains($contents, $rule)) {
                    $score++;
                }
            }
            $this->checkSetting('Strong password policy', $score === count($complexity), true);
        } else {
            $this->warn('⚠️ Could not find CreateNewUser.php to check password policy.');
        }

        // Check login throttling config
        $loginController = base_path('app/Http/Controllers/Auth/AuthenticatedSessionController.php');
        if (File::exists($loginController)) {
            $contents = File::get($loginController);
            $this->checkSetting('Login throttling logic found', str_contains($contents, 'RateLimiter'), true);
        } else {
            $this->warn('⚠️ Could not verify login throttling.');
        }

        // Check if login/logout events are logged
        $eventServiceProvider = base_path('app/Providers/EventServiceProvider.php');
        if (File::exists($eventServiceProvider)) {
            $contents = File::get($eventServiceProvider);
            $this->checkSetting('Auth events (login/logout/fail) are logged', str_contains($contents, 'Login::class') && str_contains($contents, 'Log::info'), true);
        } else {
            $this->warn('⚠️ EventServiceProvider not found.');
        }

        $this->info('✅ Security audit complete.');

        return Command::SUCCESS;
    }

    protected function checkSetting($label, $actual, $expected)
    {
        if ($actual === $expected) {
            $this->line("✔ {$label}");
        } else {
            $this->error("✘ {$label} - Expected: ".json_encode($expected).', Found: '.json_encode($actual));
        }
    }
}
