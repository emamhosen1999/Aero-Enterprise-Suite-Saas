<?php

namespace Aero\HRM\Http\Controllers\Performance;

use Aero\HRM\Http\Requests\StorePerformanceCalibrationSessionRequest;
use Aero\HRM\Http\Requests\UpdatePerformanceCalibrationRatingRequest;
use Aero\HRM\Models\PerformanceReview;
use Aero\HRM\Services\PerformanceCalibrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PerformanceCalibrationController extends Controller
{
    public function __construct(private PerformanceCalibrationService $calibrationService) {}

    public function index(): Response
    {
        try {
            $groupedSessions = PerformanceReview::query()
                ->whereNotNull('review_period_end')
                ->select(['review_period_end', 'status'])
                ->get()
                ->groupBy(fn (PerformanceReview $review) => Carbon::parse($review->review_period_end)->format('Y-m-d'));

            $calibrationSessions = $groupedSessions
                ->map(function (Collection $group, string $periodEnd): array {
                    $completed = $group->where('status', 'completed')->count();

                    return [
                        'id' => (int) Carbon::parse($periodEnd)->format('Ymd'),
                        'period_end' => $periodEnd,
                        'total_reviews' => $group->count(),
                        'completed_reviews' => $completed,
                        'pending_reviews' => max(0, $group->count() - $completed),
                    ];
                })
                ->values();

            $currentPeriod = optional($calibrationSessions->first())['period_end'] ?? null;
            $currentReviews = collect();

            if ($currentPeriod) {
                $currentReviews = PerformanceReview::query()
                    ->whereDate('review_period_end', $currentPeriod)
                    ->get()
                    ->map(function (PerformanceReview $review) {
                        $review->rating_category = $this->mapRatingCategory($review->overall_rating);

                        return $review;
                    });
            }

            $distributionData = $this->calibrationService->calibrateBellCurve($currentReviews);

            return Inertia::render('HRM/Performance/Calibration', [
                'title' => 'Performance Calibration',
                'calibrationSessions' => $calibrationSessions,
                'distributionData' => $distributionData,
                'stats' => [
                    'total_employees_calibrated' => PerformanceReview::query()->whereNotNull('overall_rating')->count(),
                    'pending_calibration' => PerformanceReview::query()->whereNull('overall_rating')->count(),
                    'completed_sessions' => $calibrationSessions->where('pending_reviews', 0)->count(),
                ],
            ]);
        } catch (Throwable $exception) {
            return Inertia::render('HRM/Performance/Calibration', [
                'title' => 'Performance Calibration',
                'calibrationSessions' => [],
                'distributionData' => [],
                'stats' => [
                    'total_employees_calibrated' => 0,
                    'pending_calibration' => 0,
                    'completed_sessions' => 0,
                ],
                'error' => 'Unable to load calibration data.',
            ]);
        }
    }

    public function store(StorePerformanceCalibrationSessionRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $periodEnd = Carbon::parse($validated['review_period_end'])->toDateString();

            $created = collect($validated['employee_ids'])
                ->map(function (int $employeeId) use ($periodEnd) {
                    return PerformanceReview::query()->firstOrCreate(
                        [
                            'employee_id' => $employeeId,
                            'review_period_end' => $periodEnd,
                        ],
                        [
                            'review_period_start' => Carbon::parse($periodEnd)->startOfYear()->toDateString(),
                            'reviewer_id' => auth()->id(),
                            'review_date' => now()->toDateString(),
                            'status' => 'draft',
                        ]
                    );
                });

            $distribution = $this->calibrationService->calibrateBellCurve(
                $created->map(function (PerformanceReview $review) {
                    $review->rating_category = $this->mapRatingCategory($review->overall_rating);

                    return $review;
                }),
                $validated['target_distribution'] ?? []
            );

            return response()->json([
                'data' => [
                    'session_id' => (int) Carbon::parse($periodEnd)->format('Ymd'),
                    'review_period_end' => $periodEnd,
                    'records' => $created->count(),
                    'distribution' => $distribution,
                ],
                'message' => 'Calibration session created successfully.',
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Unable to create calibration session.',
            ], 422);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $periodEnd = Carbon::createFromFormat('Ymd', (string) $id)->toDateString();

            $reviews = PerformanceReview::query()
                ->with(['employee', 'reviewer', 'department'])
                ->whereDate('review_period_end', $periodEnd)
                ->get();

            $distributionData = $this->calibrationService->calibrateBellCurve(
                $reviews->map(function (PerformanceReview $review) {
                    $review->rating_category = $this->mapRatingCategory($review->overall_rating);

                    return $review;
                })
            );

            return response()->json([
                'data' => [
                    'session_id' => $id,
                    'review_period_end' => $periodEnd,
                    'reviews' => $reviews,
                    'distribution' => $distributionData,
                ],
                'message' => 'Calibration session loaded successfully.',
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Unable to load calibration session.',
            ], 422);
        }
    }

    public function updateRating(UpdatePerformanceCalibrationRatingRequest $request, int $id): JsonResponse
    {
        try {
            $periodEnd = Carbon::createFromFormat('Ymd', (string) $id)->toDateString();
            $validated = $request->validated();

            $review = PerformanceReview::query()
                ->where('employee_id', $validated['employee_id'])
                ->whereDate('review_period_end', $periodEnd)
                ->firstOrFail();

            $review->update([
                'overall_rating' => $validated['overall_rating'],
                'comments' => $validated['comments'] ?? $review->comments,
                'status' => 'pending_manager',
            ]);

            return response()->json([
                'data' => $review->fresh(),
                'message' => 'Employee rating updated successfully.',
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Unable to update employee rating.',
            ], 422);
        }
    }

    public function finalize(int $id): JsonResponse
    {
        try {
            $periodEnd = Carbon::createFromFormat('Ymd', (string) $id)->toDateString();

            PerformanceReview::query()
                ->whereDate('review_period_end', $periodEnd)
                ->update(['status' => 'completed']);

            return response()->json([
                'message' => 'Calibration session finalized successfully.',
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Unable to finalize calibration session.',
            ], 422);
        }
    }

    private function mapRatingCategory(?float $rating): string
    {
        if ($rating === null) {
            return 'meets';
        }

        if ($rating >= 4.5) {
            return 'exceptional';
        }

        if ($rating >= 3.5) {
            return 'exceeds';
        }

        if ($rating >= 2.5) {
            return 'meets';
        }

        if ($rating >= 1.5) {
            return 'below';
        }

        return 'unsatisfactory';
    }
}
