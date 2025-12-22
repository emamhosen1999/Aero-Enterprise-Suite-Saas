<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Models\Department;
use Aero\HRM\Models\Designation;
use Aero\HRM\Http\Controllers\Controller;
use Aero\Core\Models\User;
use Aero\Core\Services\Profile\ProfileCrudService;
use Aero\Core\Services\Profile\ProfileUpdateService;
use Aero\Core\Services\Profile\ProfileValidationService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    protected ProfileValidationService $validationService;

    protected ProfileCrudService $crudService;

    protected ProfileUpdateService $updateService;

    public function __construct(
        ProfileValidationService $validationService,
        ProfileCrudService $crudService,
        ProfileUpdateService $updateService
    ) {
        $this->validationService = $validationService;
        $this->crudService = $crudService;
        $this->updateService = $updateService;
    }

    /**
     * Display the user's profile form.
     */
    public function index(Request $request, User $user): Response
    {
        $reportTo = User::find($user->report_to);
        $userDetails = $this->crudService->getUserWithDetails($user->id);

        return Inertia::render('Pages/Shared/Profile/UserProfile', [
            'title' => 'Profile',
            'user' => $userDetails,
            'allUsers' => User::all(),
            'departments' => Department::all(),
            'designations' => Designation::all(),
            'report_to' => $reportTo,
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    public function store(Request $request)
    {
        // Validate the incoming request
        $validator = $this->validationService->validateUserCreation($request);

        // If validation fails, return the errors
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Create a new user
        $user = $this->crudService->createUser($validator->validated());

        // Return a success response with the created user data
        return response()->json([
            'message' => 'User created successfully.',
            'user' => $user,
        ], 201);
    }

    /**
     * Update the user's profile information.
     * Note: Profile image upload/removal is now handled by ProfileImageController
     */
    public function update(Request $request)
    {
        $user = $this->crudService->findUser($request->id);

        try {
            // Validate the request (excluding profile image handling)
            $validated = $this->validationService->validateUserUpdate($request);

            // Update user profile
            $messages = $this->updateService->updateUserProfile($user, $validated);

            // Save the user
            $this->crudService->saveUser($user);

            // Get fresh user data with profile image URL
            $freshUser = $user->fresh();

            return response()->json([
                'messages' => $messages,
                'user' => $freshUser,
                'profile_image_url' => $freshUser->profile_image_url, // Explicitly include accessor
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get profile statistics for dashboard cards
     */
    public function stats(Request $request, User $user)
    {
        try {
            // Cache key for user stats
            $cacheKey = "profile_stats_{$user->id}";

            $stats = Cache::remember($cacheKey, 3600, function () use ($user) {
                // Calculate profile completion percentage
                $sections = [
                    'basic_info' => $user->name && $user->email,
                    'contact_info' => $user->phone && $user->address,
                    'personal_info' => $user->birthday && $user->gender,
                    'work_info' => $user->department && $user->designation,
                    'emergency_contact' => $user->emergency_contact_primary_name,
                    'bank_info' => $user->bank_name || $user->bank_account_no,
                    'education' => $user->educations && $user->educations->count() > 0,
                    'experience' => $user->experiences && $user->experiences->count() > 0,
                ];

                $completed = collect($sections)->filter()->count();
                $total = count($sections);
                $completion_percentage = round(($completed / $total) * 100);

                // Get profile views (if tracking is implemented)
                $profile_views = DB::table('profile_views')
                    ->where('user_id', $user->id)
                    ->count() ?? 0;

                return [
                    'completion_percentage' => $completion_percentage,
                    'total_sections' => $total,
                    'completed_sections' => $completed,
                    'last_updated' => $user->updated_at,
                    'profile_views' => $profile_views,
                    'sections_status' => $sections,
                ];
            });

            return response()->json([
                'success' => true,
                'stats' => $stats,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch profile statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export profile data (consistent with other modules)
     */
    public function export(Request $request, User $user)
    {
        try {
            // Check permissions (simplified for now)
            if (Auth::id() !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $profileData = $this->crudService->getUserWithDetails($user->id);

            // Format data for export
            $exportData = [
                'basic_information' => [
                    'name' => $profileData->name,
                    'email' => $profileData->email,
                    'phone' => $profileData->phone,
                    'employee_id' => $profileData->employee_id,
                    'date_of_joining' => $profileData->date_of_joining,
                ],
                'personal_information' => [
                    'birthday' => $profileData->birthday,
                    'gender' => $profileData->gender,
                    'address' => $profileData->address,
                    'nationality' => $profileData->nationality,
                    'religion' => $profileData->religion,
                    'marital_status' => $profileData->marital_status,
                ],
                'work_information' => [
                    'department' => $profileData->department,
                    'designation' => $profileData->designation,
                    'report_to' => $profileData->report_to,
                ],
                'emergency_contacts' => [
                    'primary' => [
                        'name' => $profileData->emergency_contact_primary_name,
                        'relationship' => $profileData->emergency_contact_primary_relationship,
                        'phone' => $profileData->emergency_contact_primary_phone,
                    ],
                    'secondary' => [
                        'name' => $profileData->emergency_contact_secondary_name,
                        'relationship' => $profileData->emergency_contact_secondary_relationship,
                        'phone' => $profileData->emergency_contact_secondary_phone,
                    ],
                ],
                'bank_information' => [
                    'bank_name' => $profileData->bank_name,
                    'account_number' => $profileData->bank_account_no,
                    'ifsc_code' => $profileData->ifsc_code,
                    'pan_number' => $profileData->pan_no,
                ],
                'education' => $profileData->educations->toArray(),
                'experience' => $profileData->experiences->toArray(),
                'exported_at' => now()->toISOString(),
                'exported_by' => Auth::user()->name,
            ];

            return response()->json([
                'success' => true,
                'data' => $exportData,
                'filename' => "profile_{$user->name}_".now()->format('Y-m-d_H-i-s').'.json',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export profile data',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Search profiles (for admin usage - consistent with other modules)
     */
    public function search(Request $request)
    {
        try {
            $query = User::with(['department', 'designation']);

            // Search filters
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            if ($request->filled('department')) {
                $query->where('department', $request->department);
            }

            if ($request->filled('designation')) {
                $query->where('designation', $request->designation);
            }

            if ($request->filled('status')) {
                $query->where('active', $request->status === 'active');
            }

            // Sorting
            $sortField = $request->get('sort_field', 'name');
            $sortDirection = $request->get('sort_direction', 'asc');
            $query->orderBy($sortField, $sortDirection);

            // Pagination
            $perPage = $request->get('per_page', 15);
            $profiles = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $profiles->items(),
                'pagination' => [
                    'current_page' => $profiles->currentPage(),
                    'last_page' => $profiles->lastPage(),
                    'per_page' => $profiles->perPage(),
                    'total' => $profiles->total(),
                    'from' => $profiles->firstItem(),
                    'to' => $profiles->lastItem(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search profiles',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Track profile view (for analytics)
     */
    public function trackView(Request $request, User $user)
    {
        try {
            // Only track if viewer is different from profile owner
            if (Auth::id() !== $user->id) {
                DB::table('profile_views')->insert([
                    'user_id' => $user->id,
                    'viewer_id' => Auth::id(),
                    'viewed_at' => now(),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                // Clear cache to refresh stats
                Cache::forget("profile_stats_{$user->id}");
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            // Fail silently for tracking
            return response()->json(['success' => false], 200);
        }
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
