<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

/**
 * AdminSetupController
 *
 * Handles the initial admin user creation for a newly provisioned tenant.
 * This controller is accessed AFTER the tenant database has been provisioned
 * and before the tenant is fully operational.
 *
 * Flow:
 * 1. Platform registration creates tenant record (pending status)
 * 2. ProvisionTenant job creates database, runs migrations, seeds roles/permissions
 * 3. Tenant is activated (status = active, needs_admin_setup = true)
 * 4. User is redirected to tenant domain's /admin-setup page
 * 5. This controller handles admin user creation
 * 6. Once admin is created, needs_admin_setup is set to false
 */
class AdminSetupController extends Controller
{
    /**
     * Show the admin setup form.
     *
     * This page is shown when a tenant has been provisioned but doesn't yet
     * have an admin user. Access is only allowed for tenants in the
     * 'needs_admin_setup' state.
     */
    public function show(): Response|RedirectResponse
    {
        $tenant = tenant();

        // If tenant already has admin user, redirect to login
        if ($this->tenantHasAdminUser()) {
            return redirect()->route('login')
                ->with('info', 'Admin account already exists. Please login.');
        }

        return Inertia::render('Pages/AdminSetup', [
            'title' => 'Complete Your Account Setup',
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'email' => $tenant->email,
                'phone' => $tenant->phone,
            ],
            // Pre-fill email and phone from company verification
            'prefillEmail' => $tenant->email,
            'prefillPhone' => $tenant->phone,
            // Pass verification status from tenant (verified during registration)
            'emailVerified' => ! empty($tenant->admin_email_verified_at),
            'phoneVerified' => ! empty($tenant->admin_phone_verified_at),
        ]);
    }

    /**
     * Store the admin user details.
     *
     * Creates the initial admin user for the tenant and assigns the
     * Super Administrator role.
     */
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $tenant = tenant();

        // Prevent creating duplicate admin users
        if ($this->tenantHasAdminUser()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin account already exists.',
                ], 409);
            }

            return redirect()->route('login')
                ->with('error', 'Admin account already exists.');
        }

        // Validate admin user data
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'user_name' => ['required', 'string', 'max:50', 'alpha_dash', 'unique:users,user_name'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ], [
            'name.required' => 'Please enter your full name.',
            'user_name.required' => 'Please choose a username.',
            'user_name.alpha_dash' => 'Username can only contain letters, numbers, dashes and underscores.',
            'user_name.unique' => 'This username is already taken.',
            'email.required' => 'Please enter your email address.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'This email is already registered.',
            'password.required' => 'Please create a password.',
            'password.confirmed' => 'Password confirmation does not match.',
        ]);

        try {
            // Create the admin user
            // Apply email/phone verification from tenant if they match the registration verified values
            $emailVerifiedAt = null;
            $phoneVerifiedAt = null;

            // If using the same email that was verified during registration
            if ($validated['email'] === $tenant->email && ! empty($tenant->admin_email_verified_at)) {
                $emailVerifiedAt = $tenant->admin_email_verified_at;
            }

            // If using the same phone that was verified during registration
            if (! empty($validated['phone']) && $validated['phone'] === $tenant->phone && ! empty($tenant->admin_phone_verified_at)) {
                $phoneVerifiedAt = $tenant->admin_phone_verified_at;
            }

            $user = User::create([
                'name' => $validated['name'],
                'user_name' => $validated['user_name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? $tenant->phone,
                'password' => Hash::make($validated['password']),
                'active' => true,
                'email_verified_at' => $emailVerifiedAt,
                'phone_verified_at' => $phoneVerifiedAt,
            ]);

            Log::info('Admin user created for tenant', [
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'user_email' => $user->email,
                'email_verified' => ! empty($emailVerifiedAt),
                'phone_verified' => ! empty($phoneVerifiedAt),
            ]);

            // Assign Super Administrator role
            $this->assignSuperAdminRole($user);

            // Mark tenant as having admin setup complete
            $this->markAdminSetupComplete($tenant);

            // Log the user in
            auth()->login($user);

            Log::info('Admin user logged in and tenant setup complete', [
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Admin account created successfully!',
                    'redirect' => route('dashboard'),
                ]);
            }

            return redirect()->route('dashboard')
                ->with('success', 'Welcome! Your admin account has been created.');

        } catch (\Throwable $e) {
            Log::error('Failed to create admin user', [
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create admin account. Please try again.',
                ], 500);
            }

            return back()->withErrors([
                'email' => 'Failed to create admin account. Please try again.',
            ]);
        }
    }

    /**
     * Check if tenant already has an admin user.
     */
    protected function tenantHasAdminUser(): bool
    {
        return User::query()->exists();
    }

    /**
     * Assign Super Administrator role to user.
     */
    protected function assignSuperAdminRole(User $user): void
    {
        try {
            $role = Role::where('name', 'Super Administrator')->first();

            if (! $role) {
                Log::warning('Super Administrator role not found, attempting to create', [
                    'user_id' => $user->id,
                ]);

                // Create the role if it doesn't exist
                $role = Role::create(['name' => 'Super Administrator', 'guard_name' => 'web']);
            }

            $user->assignRole($role);

            Log::info('Super Administrator role assigned to user', [
                'user_id' => $user->id,
                'role_id' => $role->id,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to assign Super Administrator role', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            // Don't throw - user is created, role assignment is secondary
        }
    }

    /**
     * Mark tenant as having completed admin setup.
     */
    protected function markAdminSetupComplete(Tenant $tenant): void
    {
        try {
            // Update tenant data to indicate admin setup is complete
            $data = $tenant->data ?? [];
            $data['admin_setup_completed'] = true;
            $data['admin_setup_completed_at'] = now()->toISOString();

            // Use central connection to update tenant record
            tenancy()->central(function () use ($tenant, $data) {
                $tenant->update([
                    'data' => $data,
                ]);
            });

            Log::info('Tenant admin setup marked as complete', [
                'tenant_id' => $tenant->id,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to mark admin setup as complete', [
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage(),
            ]);
            // Don't throw - this is just metadata
        }
    }
}
