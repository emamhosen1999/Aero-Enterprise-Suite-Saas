<?php

namespace Aero\HRM\Http\Controllers;

use Aero\HRM\Http\Requests\ApplyTalentOpportunityRequest;
use Aero\HRM\Http\Requests\StoreTalentOpportunityRequest;
use Aero\HRM\Http\Requests\UpdateTalentOpportunityRequest;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Opportunity;
use Aero\HRM\Models\TalentMobilityRecommendation;
use Aero\HRM\Services\AIAnalytics\TalentMobilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class TalentMarketplaceController extends Controller
{
    public function __construct(private TalentMobilityService $talentMobilityService) {}

    public function index(): Response
    {
        try {
            $opportunities = Opportunity::query()
                ->with('department:id,name')
                ->where('status', 'open')
                ->orderByDesc('created_at')
                ->get();

            $employee = Employee::query()
                ->where('user_id', auth()->id())
                ->orWhere('id', auth()->id())
                ->first();
            $myRecommendations = [];

            if ($employee instanceof Employee) {
                $myRecommendations = $this->talentMobilityService->generateRecommendations($employee);
            }

            return Inertia::render('HRM/TalentMarketplace/Index', [
                'title' => 'Internal Talent Marketplace',
                'opportunities' => $opportunities,
                'myRecommendations' => $myRecommendations,
                'stats' => [
                    'open_positions' => Opportunity::query()->where('status', 'open')->count(),
                    'total_applicants' => TalentMobilityRecommendation::query()
                        ->where('recommendation_type', 'project_assignment')
                        ->whereIn('status', ['accepted', 'completed'])
                        ->count(),
                    'successful_placements' => TalentMobilityRecommendation::query()
                        ->where('recommendation_type', 'project_assignment')
                        ->where('status', 'completed')
                        ->count(),
                ],
            ]);
        } catch (Throwable $exception) {
            return Inertia::render('HRM/TalentMarketplace/Index', [
                'title' => 'Internal Talent Marketplace',
                'opportunities' => [],
                'myRecommendations' => [],
                'stats' => [
                    'open_positions' => 0,
                    'total_applicants' => 0,
                    'successful_placements' => 0,
                ],
                'error' => 'Unable to load talent marketplace.',
            ]);
        }
    }

    public function applyOpportunity(ApplyTalentOpportunityRequest $request, int $id): JsonResponse
    {
        try {
            $opportunity = Opportunity::query()
                ->where('status', 'open')
                ->findOrFail($id);

            $validated = $request->validated();

            $employee = Employee::query()
                ->where('user_id', auth()->id())
                ->orWhere('id', auth()->id())
                ->first();

            if (! $employee instanceof Employee) {
                return response()->json([
                    'message' => 'No employee profile found for the current user.',
                ], 422);
            }

            $application = TalentMobilityRecommendation::query()->updateOrCreate(
                [
                    'employee_id' => $employee->id,
                    'recommendation_type' => 'project_assignment',
                    'target_role_name' => $opportunity->title,
                    'status' => 'accepted',
                ],
                [
                    'target_department_id' => $opportunity->department_id ?? null,
                    'match_score' => $validated['match_score'] ?? 70,
                    'matching_skills' => $opportunity->required_skills ?? [],
                    'skill_gaps' => [],
                    'development_path' => [],
                    'rationale' => $validated['cover_note'] ?? 'Applied through internal talent marketplace.',
                    'estimated_readiness_months' => 0,
                    'created_by' => auth()->id(),
                    'valid_until' => now()->addMonths(6),
                ]
            );

            return response()->json([
                'data' => $application,
                'message' => 'Applied to opportunity successfully.',
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Unable to apply to this opportunity.',
            ], 422);
        }
    }

    public function adminIndex(): JsonResponse
    {
        try {
            $opportunities = Opportunity::query()
                ->orderByDesc('created_at')
                ->paginate(20);

            $titles = collect($opportunities->items())->pluck('title')->all();

            $applicantPools = TalentMobilityRecommendation::query()
                ->select('target_role_name', DB::raw('COUNT(*) as applicants'))
                ->where('recommendation_type', 'project_assignment')
                ->whereIn('target_role_name', $titles)
                ->groupBy('target_role_name')
                ->pluck('applicants', 'target_role_name');

            return response()->json([
                'data' => [
                    'opportunities' => $opportunities,
                    'applicantPools' => $applicantPools,
                ],
                'message' => 'Talent marketplace admin data loaded successfully.',
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Unable to load talent marketplace admin data.',
            ], 422);
        }
    }

    public function storeOpportunity(StoreTalentOpportunityRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            $opportunity = new Opportunity();
            $opportunity->forceFill([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'department_id' => $validated['department_id'],
                'type' => $validated['type'],
                'status' => $validated['status'] ?? 'open',
                'application_deadline' => $validated['application_deadline'] ?? null,
                'required_skills' => $validated['required_skills'] ?? null,
                'requirements' => $validated['requirements'] ?? null,
            ]);
            $opportunity->save();

            return response()->json([
                'data' => $opportunity,
                'message' => 'Opportunity created successfully.',
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Unable to create opportunity.',
            ], 422);
        }
    }

    public function updateOpportunity(UpdateTalentOpportunityRequest $request, int $id): JsonResponse
    {
        try {
            $opportunity = Opportunity::query()->findOrFail($id);
            $validated = $request->validated();

            $opportunity->forceFill($validated);
            $opportunity->save();

            return response()->json([
                'data' => $opportunity->fresh(),
                'message' => 'Opportunity updated successfully.',
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Unable to update opportunity.',
            ], 422);
        }
    }

    public function closeOpportunity(int $id): JsonResponse
    {
        try {
            $opportunity = Opportunity::query()->findOrFail($id);
            $opportunity->forceFill(['status' => 'closed']);
            $opportunity->save();

            return response()->json([
                'data' => $opportunity->fresh(),
                'message' => 'Opportunity closed successfully.',
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Unable to close opportunity.',
            ], 422);
        }
    }
}
