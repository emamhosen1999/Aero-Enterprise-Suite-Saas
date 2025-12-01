<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

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
        $validated = $request->validate([
            'primary_color' => 'nullable|string|max:20',
            'accent_color' => 'nullable|string|max:20',
            'login_background' => 'nullable|string|max:50',
            'dark_mode' => 'nullable|boolean',
            'logo_light' => 'nullable|image|max:2048',
            'logo_dark' => 'nullable|image|max:2048',
            'favicon' => 'nullable|image|max:1024',
        ]);

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

        if (! ($validated['skip'] ?? false) && ! empty($validated['invitations'])) {
            // Queue invitation emails
            foreach ($validated['invitations'] as $invitation) {
                // TODO: Create TenantInvitation model and send invite emails
                // TenantInvitation::create([...]);
                // Mail::to($invitation['email'])->queue(new TeamInvite(...));
            }
        }

        $this->markStepCompleted('team');

        return back()->with('success', 'Team invitations processed.');
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
        $data = $tenant->data ?? new \ArrayObject;

        $data['onboarding'] = [
            'completed' => true,
            'completed_at' => now()->toIso8601String(),
            'completed_by' => Auth::id(),
            'completed_steps' => array_keys($this->steps),
        ];

        $tenant->data = $data;
        $tenant->save();

        return redirect()->route('dashboard')->with('success', 'Welcome! Your organization is all set up.');
    }

    /**
     * Skip the onboarding process entirely.
     */
    public function skip(Request $request)
    {
        $tenant = tenant();
        $data = $tenant->data ?? new \ArrayObject;

        $data['onboarding'] = [
            'completed' => true,
            'completed_at' => now()->toIso8601String(),
            'completed_by' => Auth::id(),
            'skipped' => true,
        ];

        $tenant->data = $data;
        $tenant->save();

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

        return response()->json(['success' => true]);
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
