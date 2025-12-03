<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Models\TenantInvitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

/**
 * TenantOnboardingController
 *
 * Handles the multi-step onboarding wizard for new tenants.
 * This wizard guides new tenant admins through essential setup:
 * - Company information
 * - Branding & appearance
 * - Team invitations
 * - Module configuration
 *
 * The onboarding status is tracked in the tenant's data JSON column.
 */
class TenantOnboardingController extends Controller
{
    /**
     * Onboarding steps configuration.
     */
    protected array $steps = [
        'welcome' => [
            'title' => 'Welcome',
            'description' => 'Let\'s get your organization set up',
            'order' => 1,
        ],
        'company' => [
            'title' => 'Company Info',
            'description' => 'Tell us about your organization',
            'order' => 2,
        ],
        'branding' => [
            'title' => 'Branding',
            'description' => 'Customize your appearance',
            'order' => 3,
        ],
        'team' => [
            'title' => 'Team',
            'description' => 'Invite your team members',
            'order' => 4,
        ],
        'modules' => [
            'title' => 'Modules',
            'description' => 'Configure your features',
            'order' => 5,
        ],
        'complete' => [
            'title' => 'Complete',
            'description' => 'You\'re all set!',
            'order' => 6,
        ],
    ];

    /**
     * Show the onboarding wizard.
     */
    public function index(Request $request): Response
    {
        $tenant = tenant();
        $user = Auth::user();

        // Get current onboarding progress
        $onboardingData = $tenant->data['onboarding'] ?? [];
        $currentStep = $onboardingData['current_step'] ?? 'welcome';
        $completedSteps = $onboardingData['completed_steps'] ?? [];

        // Get system settings for pre-filling
        $systemSettings = SystemSetting::first();

        return Inertia::render('Onboarding/Index', [
            'title' => 'Setup Your Organization',
            'steps' => $this->steps,
            'currentStep' => $currentStep,
            'completedSteps' => $completedSteps,
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'email' => $tenant->email,
            ],
            'systemSettings' => $systemSettings ? [
                'organization' => $systemSettings->organization ?? [],
                'branding' => $systemSettings->branding ?? [],
            ] : null,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'roles' => Role::all()->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'guard_name' => $role->guard_name,
            ]),
        ]);
    }

    /**
     * Save company information step.
     */
    public function saveCompany(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'tagline' => 'nullable|string|max:500',
            'industry' => 'nullable|string|max:100',
            'company_size' => 'nullable|string|max:50',
            'timezone' => 'nullable|string|max:100',
            'address_line1' => 'nullable|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'support_email' => 'nullable|email|max:255',
            'support_phone' => 'nullable|string|max:50',
            'website_url' => 'nullable|url|max:255',
        ]);

        // Update or create system settings
        $systemSettings = SystemSetting::firstOrNew([]);
        $organization = $systemSettings->organization ?? [];
        $systemSettings->organization = array_merge($organization, $validated);
        $systemSettings->save();

        // Update tenant name if changed
        $tenant = tenant();
        if ($validated['company_name'] !== $tenant->name) {
            $tenant->name = $validated['company_name'];
            $tenant->save();
        }

        // Mark step as completed
        $this->markStepCompleted('company');

        return back()->with('success', 'Company information saved successfully.');
    }

    /**
     * Save branding step.
     */
    public function saveBranding(Request $request)
    {
        // Check if logos already exist (for edit mode)
        $systemSettings = SystemSetting::first();
        $existingBranding = $systemSettings?->branding ?? [];

        $rules = [
            'primary_color' => 'nullable|string|max:20',
            'accent_color' => 'nullable|string|max:20',
            'login_background' => 'nullable|string|max:50',
            'dark_mode' => 'nullable|boolean',
            'logo_light' => $existingBranding['logo_light'] ?? false ? 'nullable|image|max:4096' : 'required|image|max:4096',
            'logo_dark' => $existingBranding['logo_dark'] ?? false ? 'nullable|image|max:4096' : 'required|image|max:4096',
            'logo' => $existingBranding['logo'] ?? false ? 'nullable|image|max:4096' : 'required|image|max:4096',
            'square_logo' => $existingBranding['square_logo'] ?? false ? 'nullable|image|max:4096' : 'required|image|max:4096',
            'favicon' => $existingBranding['favicon'] ?? false ? 'nullable|image|max:2048' : 'required|image|max:2048',
        ];

        $messages = [
            'logo_light.required' => 'Please upload a logo for light mode backgrounds.',
            'logo_dark.required' => 'Please upload a logo for dark mode backgrounds.',
            'logo.required' => 'Please upload a horizontal logo for documents and headers.',
            'square_logo.required' => 'Please upload a square logo for mobile and app icons.',
            'favicon.required' => 'Please upload a favicon for browser tabs.',
        ];

        $validated = $request->validate($rules, $messages);

        $systemSettings = SystemSetting::firstOrNew([]);
        $branding = $systemSettings->branding ?? [];

        // Handle file uploads
        if ($request->hasFile('logo_light')) {
            $path = $request->file('logo_light')->store('branding', 'public');
            $branding['logo_light'] = $path;
        }

        if ($request->hasFile('logo_dark')) {
            $path = $request->file('logo_dark')->store('branding', 'public');
            $branding['logo_dark'] = $path;
        }

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('branding', 'public');
            $branding['logo'] = $path;
        }

        if ($request->hasFile('square_logo')) {
            $path = $request->file('square_logo')->store('branding', 'public');
            $branding['square_logo'] = $path;
        }

        if ($request->hasFile('favicon')) {
            $path = $request->file('favicon')->store('branding', 'public');
            $branding['favicon'] = $path;
        }

        // Merge other branding settings
        $branding['primary_color'] = $validated['primary_color'] ?? $branding['primary_color'] ?? '#0f172a';
        $branding['accent_color'] = $validated['accent_color'] ?? $branding['accent_color'] ?? '#6366f1';
        $branding['login_background'] = $validated['login_background'] ?? $branding['login_background'] ?? 'pattern-1';
        $branding['dark_mode'] = $validated['dark_mode'] ?? $branding['dark_mode'] ?? false;

        $systemSettings->branding = $branding;
        $systemSettings->save();

        $this->markStepCompleted('branding');

        return back()->with('success', 'Branding settings saved successfully.');
    }

    /**
     * Save team invitations step.
     */
    public function saveTeam(Request $request)
    {
        $validated = $request->validate([
            'invitations' => 'nullable|array',
            'invitations.*.email' => 'required|email',
            'invitations.*.role' => 'required|string',
            'skip' => 'nullable|boolean',
        ]);

        Log::info('Onboarding saveTeam called', [
            'validated' => $validated,
            'user_id' => Auth::id(),
            'tenant_id' => tenant()?->id,
        ]);

        $sentCount = 0;
        $skippedCount = 0;
        $errors = [];
        $emailResults = [];

        if (! ($validated['skip'] ?? false) && ! empty($validated['invitations'])) {
            Log::info('Processing team invitations', [
                'count' => count($validated['invitations']),
            ]);

            foreach ($validated['invitations'] as $invitation) {
                Log::info('Processing invitation', ['email' => $invitation['email']]);

                // Skip if user already exists
                if (User::where('email', $invitation['email'])->exists()) {
                    $skippedCount++;
                    $errors[] = "{$invitation['email']} is already a team member.";
                    Log::info('Skipped - user exists', ['email' => $invitation['email']]);

                    continue;
                }

                // Skip if invitation already pending
                if (TenantInvitation::hasPendingInvitation($invitation['email'])) {
                    $skippedCount++;
                    $errors[] = "{$invitation['email']} was already invited.";
                    Log::info('Skipped - pending invitation exists', ['email' => $invitation['email']]);

                    continue;
                }

                try {
                    // Create and send invitation
                    $invite = TenantInvitation::create([
                        'email' => $invitation['email'],
                        'role' => $invitation['role'],
                        'invited_by' => Auth::id(),
                        'metadata' => [
                            'source' => 'onboarding',
                        ],
                    ]);

                    Log::info('Invitation created', [
                        'invitation_id' => $invite->id,
                        'email' => $invite->email,
                    ]);

                    // Send invitation email using MailService
                    $notification = new \App\Notifications\InviteTeamMember($invite);
                    $emailSent = $notification->sendEmail();

                    $emailResults[] = [
                        'email' => $invitation['email'],
                        'sent' => $emailSent,
                    ];

                    Log::info('Invitation email result', [
                        'email' => $invitation['email'],
                        'sent' => $emailSent,
                    ]);

                    if ($emailSent) {
                        $sentCount++;
                    } else {
                        $errors[] = "Email failed to send to {$invitation['email']}.";
                    }
                } catch (\Exception $e) {
                    $errors[] = "Failed to invite {$invitation['email']}: {$e->getMessage()}";
                    Log::error('Onboarding team invite failed', [
                        'email' => $invitation['email'],
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            }
        } else {
            Log::info('Team step skipped or no invitations', [
                'skip' => $validated['skip'] ?? false,
                'invitations_count' => count($validated['invitations'] ?? []),
            ]);
        }

        $this->markStepCompleted('team');

        // Build user-friendly message
        if ($sentCount > 0 && $skippedCount > 0) {
            $message = "{$sentCount} invitation(s) sent, {$skippedCount} skipped.";
        } elseif ($sentCount > 0) {
            $message = "{$sentCount} invitation(s) sent successfully!";
        } elseif ($skippedCount > 0) {
            $message = "No new invitations sent. {$skippedCount} already exist.";
        } else {
            $message = 'Team invitations processed.';
        }

        Log::info('Onboarding saveTeam completed', [
            'sent_count' => $sentCount,
            'skipped_count' => $skippedCount,
            'errors' => $errors,
            'email_results' => $emailResults,
        ]);

        // Always flash email results for frontend feedback (even empty arrays for consistency)
        session()->flash('email_results', $emailResults);
        session()->flash('invitation_errors', $errors);

        return back()->with('success', $message);
    }

    /**
     * Save modules configuration step.
     */
    public function saveModules(Request $request)
    {
        $validated = $request->validate([
            'enabled_modules' => 'nullable|array',
            'enabled_modules.*' => 'string',
        ]);

        $tenant = tenant();
        $modules = $tenant->modules ?? [];

        // Update module configuration
        foreach ($validated['enabled_modules'] ?? [] as $moduleId) {
            if (! isset($modules[$moduleId])) {
                $modules[$moduleId] = ['enabled' => true, 'enabled_at' => now()->toIso8601String()];
            }
        }

        $tenant->modules = $modules;
        $tenant->save();

        $this->markStepCompleted('modules');

        return back()->with('success', 'Module configuration saved.');
    }

    /**
     * Complete the onboarding process.
     */
    public function complete(Request $request)
    {
        $tenant = tenant();

        // Get current data as array to ensure proper serialization
        $currentData = is_array($tenant->data) ? $tenant->data : (array) ($tenant->data ?? []);

        $currentData['onboarding'] = [
            'completed' => true,
            'completed_at' => now()->toIso8601String(),
            'completed_by' => Auth::id(),
            'completed_steps' => array_keys($this->steps),
        ];

        // Force update using query builder to ensure data is saved
        \Illuminate\Support\Facades\DB::connection('mysql')
            ->table('tenants')
            ->where('id', $tenant->id)
            ->update(['data' => json_encode($currentData)]);

        return redirect()->route('dashboard')->with('success', 'Welcome! Your organization is all set up.');
    }

    /**
     * Skip the onboarding process entirely.
     */
    public function skip(Request $request)
    {
        $tenant = tenant();

        // Get current data as array to ensure proper serialization
        $currentData = is_array($tenant->data) ? $tenant->data : (array) ($tenant->data ?? []);

        $currentData['onboarding'] = [
            'completed' => true,
            'completed_at' => now()->toIso8601String(),
            'completed_by' => Auth::id(),
            'skipped' => true,
        ];

        // Force update using query builder to ensure data is saved
        \Illuminate\Support\Facades\DB::connection('mysql')
            ->table('tenants')
            ->where('id', $tenant->id)
            ->update(['data' => json_encode($currentData)]);

        return redirect()->route('dashboard')->with('info', 'You can complete the setup later in Settings.');
    }

    /**
     * Update the current step.
     */
    public function updateStep(Request $request)
    {
        $validated = $request->validate([
            'step' => 'required|string|in:'.implode(',', array_keys($this->steps)),
        ]);

        $tenant = tenant();
        $data = $tenant->data ?? new \ArrayObject;
        $onboarding = $data['onboarding'] ?? [];
        $onboarding['current_step'] = $validated['step'];
        $data['onboarding'] = $onboarding;
        $tenant->data = $data;
        $tenant->save();

        return back();
    }

    /**
     * Check if onboarding is completed.
     */
    public static function isOnboardingCompleted(): bool
    {
        if (! tenant()) {
            return true;
        }

        $data = tenant()->data ?? [];

        return ($data['onboarding']['completed'] ?? false) === true;
    }

    /**
     * Mark a step as completed.
     */
    protected function markStepCompleted(string $step): void
    {
        $tenant = tenant();
        $data = $tenant->data ?? new \ArrayObject;
        $onboarding = $data['onboarding'] ?? [];

        $completedSteps = $onboarding['completed_steps'] ?? [];
        if (! in_array($step, $completedSteps)) {
            $completedSteps[] = $step;
        }

        // Find the next step
        $stepOrder = array_keys($this->steps);
        $currentIndex = array_search($step, $stepOrder);
        $nextStep = $stepOrder[$currentIndex + 1] ?? 'complete';

        $onboarding['completed_steps'] = $completedSteps;
        $onboarding['current_step'] = $nextStep;
        $data['onboarding'] = $onboarding;

        $tenant->data = $data;
        $tenant->save();
    }
}
