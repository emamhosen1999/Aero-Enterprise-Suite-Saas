<?php

declare(strict_types=1);

namespace Aero\Project\Http\Controllers;

use Aero\Core\Models\TenantInvitation;
use Aero\Core\Models\User;
use Aero\HRMAC\Models\Role;
use Aero\Project\Contracts\EmployeeResolverContract;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

/**
 * TeamMemberController
 *
 * Handles team invitation acceptance flow for new users joining a tenant.
 * Uses service contracts for employee management (package isolation).
 */
class TeamMemberController extends Controller
{
    public function __construct(
        protected ?EmployeeResolverContract $employeeResolver = null
    ) {}

    /**
     * Show the invitation acceptance form.
     */
    public function showAcceptForm(Request $request, string $token): Response
    {
        $invitation = TenantInvitation::where('token', $token)->first();

        if (! $invitation) {
            return Inertia::render('Shared/Auth/InvitationExpired/Index', [
                'message' => 'This invitation link is invalid or has already been used.',
            ]);
        }

        if (! $invitation->is_pending) {
            if ($invitation->is_accepted) {
                return Inertia::render('Shared/Auth/InvitationExpired/Index', [
                    'message' => 'This invitation has already been accepted.',
                ]);
            }

            if ($invitation->is_expired) {
                return Inertia::render('Shared/Auth/InvitationExpired/Index', [
                    'message' => 'This invitation has expired. Please request a new invitation.',
                ]);
            }

            if ($invitation->is_cancelled) {
                return Inertia::render('Shared/Auth/InvitationExpired/Index', [
                    'message' => 'This invitation has been cancelled.',
                ]);
            }
        }

        return Inertia::render('Shared/Auth/AcceptInvitation/Index', [
            'invitation' => [
                'email' => $invitation->email,
                'role' => $invitation->role,
                'token' => $invitation->token,
                'expires_at' => $invitation->expires_at->format('F j, Y'),
                'inviter_name' => $invitation->inviter?->name ?? 'Team Administrator',
            ],
            'organization_name' => config('app.name'),
        ]);
    }

    /**
     * Process the invitation acceptance and create user account.
     */
    public function accept(Request $request, string $token)
    {
        $invitation = TenantInvitation::where('token', $token)->pending()->first();

        if (! $invitation) {
            return back()->withErrors([
                'token' => 'This invitation is no longer valid.',
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'password' => 'required|string|min:8|confirmed',
        ]);

        try {
            DB::beginTransaction();

            // Create the user account
            $user = User::create([
                'name' => $validated['name'],
                'email' => $invitation->email,
                'password' => Hash::make($validated['password']),
                'email_verified_at' => now(), // Pre-verified since email was confirmed via invitation link
            ]);

            // Assign the role from the invitation
            $role = Role::where('name', $invitation->role)->first();
            if ($role) {
                $user->assignRole($role);
            }

            // Create Employee record if department/designation provided in invitation
            if ($this->employeeResolver && (! empty($invitation->metadata['department_id']) || ! empty($invitation->metadata['designation_id']))) {
                $this->employeeResolver->createEmployee($user->id, [
                    'department_id' => $invitation->metadata['department_id'] ?? null,
                    'designation_id' => $invitation->metadata['designation_id'] ?? null,
                    'date_of_joining' => now()->toDateString(),
                    'status' => 'active',
                    'employment_type' => 'full_time',
                ]);
            }

            // Mark invitation as accepted
            $invitation->markAsAccepted();

            // Log the user in
            Auth::login($user);

            DB::commit();

            Log::info('Team invitation accepted', [
                'user_id' => $user->id,
                'email' => $user->email,
                'invitation_id' => $invitation->id,
                'role' => $invitation->role,
            ]);

            return redirect()->route('dashboard')->with('success', 'Welcome! Your account has been created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to accept team invitation', [
                'token' => $token,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors([
                'error' => 'Failed to create account. Please try again.',
            ]);
        }
    }
}
