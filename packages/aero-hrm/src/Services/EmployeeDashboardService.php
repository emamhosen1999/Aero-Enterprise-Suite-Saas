<?php

declare(strict_types=1);

namespace Aero\HRM\Services;

use Aero\HRM\Models\Asset;
use Aero\HRM\Models\AssetAllocation;
use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\Benefit;
use Aero\HRM\Models\CareerPath;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\EmployeeCareerProgression;
use Aero\HRM\Models\EmployeeCertification;
use Aero\HRM\Models\EmployeePersonalDocument;
use Aero\HRM\Models\Event;
use Aero\HRM\Models\ExpenseClaim;
use Aero\HRM\Models\Feedback360;
use Aero\HRM\Models\Feedback360Response;
use Aero\HRM\Models\Grievance;
use Aero\HRM\Models\Holiday;
use Aero\HRM\Models\KPI;
use Aero\HRM\Models\KPIValue;
use Aero\HRM\Models\Leave;
use Aero\HRM\Models\Onboarding;
use Aero\HRM\Models\OnboardingTask;
use Aero\HRM\Models\OvertimeRequest;
use Aero\HRM\Models\Payslip;
use Aero\HRM\Models\PerformanceReview;
use Aero\HRM\Models\PulseSurvey;
use Aero\HRM\Models\PulseSurveyResponse;
use Aero\HRM\Models\Skill;
use Aero\HRM\Models\Training;
use Aero\HRM\Models\TrainingEnrollment;
use Aero\HRM\Models\TrainingSession;
use Aero\HRM\Models\Warning;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class EmployeeDashboardService
{
    public function __construct(
        protected LeaveBalanceService $leaveBalanceService
    ) {}

    /**
     * @return array{clock_in: ?string, clock_out: ?string, status: ?string, worked_hours: float, is_late: bool, expected_hours: float}
     */
    public function getAttendanceData(Employee $employee): array
    {
        try {
            $today = Attendance::where('user_id', $employee->user_id)
                ->whereDate('date', today())
                ->first();

            $monthStart = now()->startOfMonth();
            $monthEnd = now()->endOfMonth();

            $monthAttendance = Attendance::where('user_id', $employee->user_id)
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->get();

            $workingDays = (int) now()->day;

            $weeklyAttendance = Attendance::where('user_id', $employee->user_id)
                ->whereBetween('date', [now()->subDays(6)->startOfDay(), now()->endOfDay()])
                ->orderBy('date')
                ->get()
                ->map(fn ($a) => [
                    'date' => $a->date?->format('Y-m-d'),
                    'status' => $a->status,
                    'worked_hours' => (float) ($a->worked_hours ?? 0),
                    'clock_in' => $a->punchin?->format('H:i'),
                    'clock_out' => $a->punchout?->format('H:i'),
                ]);

            return [
                'todayAttendance' => $today ? [
                    'clock_in' => $today->punchin?->format('H:i'),
                    'clock_out' => $today->punchout?->format('H:i'),
                    'status' => $today->status,
                    'worked_hours' => (float) ($today->worked_hours ?? 0),
                    'is_late' => (bool) $today->is_late,
                    'expected_hours' => 8.0,
                ] : null,
                'attendanceStats' => [
                    'present_days' => $monthAttendance->where('status', 'present')->count(),
                    'absent_days' => $monthAttendance->where('status', 'absent')->count(),
                    'late_days' => $monthAttendance->where('is_late', true)->count(),
                    'total_hours' => (float) $monthAttendance->sum('worked_hours'),
                    'working_days_in_month' => $workingDays,
                    'attendance_percentage' => $workingDays > 0
                        ? round(($monthAttendance->where('status', 'present')->count() / $workingDays) * 100, 1)
                        : 0,
                ],
                'weeklyAttendance' => $weeklyAttendance,
            ];
        } catch (\Throwable $e) {
            return [
                'todayAttendance' => null,
                'attendanceStats' => [
                    'present_days' => 0, 'absent_days' => 0, 'late_days' => 0,
                    'total_hours' => 0, 'working_days_in_month' => 0, 'attendance_percentage' => 0,
                ],
                'weeklyAttendance' => [],
            ];
        }
    }

    public function getLeaveData(Employee $employee): array
    {
        try {
            $leaveBalances = $this->leaveBalanceService->getAllBalances($employee);

            $pendingLeaves = Leave::where('user_id', $employee->user_id)
                ->whereIn('status', ['pending', 'submitted'])
                ->with('leaveSetting')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get()
                ->map(fn ($leave) => [
                    'id' => $leave->id,
                    'type' => $leave->leaveSetting?->name ?? 'Unknown',
                    'start_date' => $leave->from_date ? Carbon::parse($leave->from_date)->format('Y-m-d') : null,
                    'end_date' => $leave->to_date ? Carbon::parse($leave->to_date)->format('Y-m-d') : null,
                    'days' => $leave->no_of_days ?? 1,
                    'status' => $leave->status,
                    'reason' => $leave->reason,
                    'created_at' => $leave->created_at?->format('Y-m-d'),
                ]);

            $recentLeaves = Leave::where('user_id', $employee->user_id)
                ->with('leaveSetting')
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get()
                ->map(fn ($leave) => [
                    'id' => $leave->id,
                    'type' => $leave->leaveSetting?->name ?? 'Unknown',
                    'start_date' => $leave->from_date ? Carbon::parse($leave->from_date)->format('Y-m-d') : null,
                    'end_date' => $leave->to_date ? Carbon::parse($leave->to_date)->format('Y-m-d') : null,
                    'days' => $leave->no_of_days ?? 1,
                    'status' => $leave->status,
                ]);

            $upcomingApproved = Leave::where('user_id', $employee->user_id)
                ->where('status', 'approved')
                ->where('from_date', '>=', today())
                ->with('leaveSetting')
                ->orderBy('from_date')
                ->take(5)
                ->get()
                ->map(fn ($leave) => [
                    'id' => $leave->id,
                    'type' => $leave->leaveSetting?->name ?? 'Unknown',
                    'start_date' => $leave->from_date ? Carbon::parse($leave->from_date)->format('Y-m-d') : null,
                    'end_date' => $leave->to_date ? Carbon::parse($leave->to_date)->format('Y-m-d') : null,
                    'days' => $leave->no_of_days ?? 1,
                    'status' => $leave->status,
                ]);

            return [
                'leaveBalances' => $leaveBalances,
                'pendingLeaves' => $pendingLeaves,
                'recentLeaves' => $recentLeaves,
                'upcomingApprovedLeaves' => $upcomingApproved,
            ];
        } catch (\Throwable $e) {
            return [
                'leaveBalances' => [],
                'pendingLeaves' => [],
                'recentLeaves' => [],
                'upcomingApprovedLeaves' => [],
            ];
        }
    }

    public function getPayrollData(Employee $employee): array
    {
        try {
            $latestPayslip = Payslip::where('user_id', $employee->user_id)
                ->where('status', '!=', 'draft')
                ->orderBy('pay_period_end', 'desc')
                ->first();

            $payrollHistory = Payslip::where('user_id', $employee->user_id)
                ->where('status', '!=', 'draft')
                ->orderBy('pay_period_end', 'desc')
                ->take(6)
                ->get()
                ->map(fn ($p) => [
                    'month' => $p->pay_period_end?->format('M Y'),
                    'net_pay' => (float) $p->net_salary,
                    'gross_pay' => (float) $p->gross_salary,
                ])->reverse()->values();

            return [
                'latestPayslip' => $latestPayslip ? [
                    'id' => $latestPayslip->id,
                    'month' => $latestPayslip->pay_period_end?->format('F'),
                    'year' => $latestPayslip->pay_period_end?->format('Y'),
                    'net_pay' => (float) $latestPayslip->net_salary,
                    'gross_pay' => (float) $latestPayslip->gross_salary,
                    'total_deductions' => (float) $latestPayslip->total_deductions,
                    'total_allowances' => (float) $latestPayslip->total_allowances,
                    'payment_date' => $latestPayslip->generated_at?->format('Y-m-d'),
                    'status' => $latestPayslip->status,
                ] : null,
                'payrollHistory' => $payrollHistory,
            ];
        } catch (\Throwable $e) {
            return ['latestPayslip' => null, 'payrollHistory' => []];
        }
    }

    public function getPerformanceData(Employee $employee): array
    {
        try {
            $currentReview = PerformanceReview::where('employee_id', $employee->user_id)
                ->orderBy('review_date', 'desc')
                ->with('reviewer', 'template')
                ->first();

            $myKPIs = KPI::where('responsible_user_id', $employee->user_id)
                ->with(['values' => fn ($q) => $q->latest()->limit(1)])
                ->where('status', 'active')
                ->take(5)
                ->get()
                ->map(fn ($kpi) => [
                    'id' => $kpi->id,
                    'name' => $kpi->name,
                    'target' => (float) $kpi->target_value,
                    'actual' => (float) ($kpi->values->first()?->value ?? 0),
                    'percentage' => $kpi->target_value > 0
                        ? round((($kpi->values->first()?->value ?? 0) / $kpi->target_value) * 100, 1)
                        : 0,
                    'status' => $kpi->status,
                ]);

            return [
                'currentReview' => $currentReview ? [
                    'id' => $currentReview->id,
                    'cycle_name' => $currentReview->template?->name ?? 'Performance Review',
                    'status' => $currentReview->status,
                    'overall_score' => $currentReview->overall_rating,
                    'reviewer_name' => $currentReview->reviewer?->name,
                    'due_date' => $currentReview->next_review_date?->format('Y-m-d'),
                ] : null,
                'myKPIs' => $myKPIs,
            ];
        } catch (\Throwable $e) {
            return ['currentReview' => null, 'myKPIs' => []];
        }
    }

    public function getTrainingData(Employee $employee): array
    {
        try {
            $enrollments = TrainingEnrollment::where('user_id', $employee->user_id)
                ->with('training.category')
                ->whereIn('status', ['enrolled', 'in_progress'])
                ->orderBy('enrollment_date', 'desc')
                ->take(5)
                ->get()
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'name' => $e->training?->title,
                    'category' => $e->training?->category?->name,
                    'status' => $e->status,
                    'start_date' => $e->training?->start_date?->format('Y-m-d'),
                    'end_date' => $e->training?->end_date?->format('Y-m-d'),
                    'score' => $e->score,
                ]);

            $upcomingSessions = TrainingSession::whereHas('training.enrollments', function ($q) use ($employee) {
                $q->where('user_id', $employee->user_id);
            })
                ->where('start_time', '>=', today())
                ->with('training')
                ->orderBy('start_time')
                ->take(5)
                ->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'training_name' => $s->training?->title,
                    'session_date' => $s->start_time?->format('Y-m-d'),
                    'location' => $s->location,
                ]);

            $certifications = EmployeeCertification::where('user_id', $employee->user_id)
                ->orderBy('expiry_date')
                ->take(10)
                ->get()
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'issued_date' => $c->issue_date?->format('Y-m-d'),
                    'expiry_date' => $c->expiry_date?->format('Y-m-d'),
                    'is_expired' => $c->expiry_date && $c->expiry_date->isPast(),
                    'is_expiring_soon' => $c->expiry_date && $c->expiry_date->isBetween(now(), now()->addDays(30)),
                ]);

            return [
                'myTrainings' => $enrollments,
                'upcomingTrainingSessions' => $upcomingSessions,
                'certifications' => $certifications,
            ];
        } catch (\Throwable $e) {
            return ['myTrainings' => [], 'upcomingTrainingSessions' => [], 'certifications' => []];
        }
    }

    public function getExpenseData(Employee $employee): array
    {
        try {
            $pending = ExpenseClaim::where('employee_id', $employee->id)
                ->where('status', 'pending');

            $approved = ExpenseClaim::where('employee_id', $employee->id)
                ->where('status', 'approved')
                ->whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month);

            $ytd = ExpenseClaim::where('employee_id', $employee->id)
                ->where('status', 'approved')
                ->whereYear('created_at', now()->year);

            $recent = ExpenseClaim::where('employee_id', $employee->id)
                ->with('category')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get()
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'title' => $e->description,
                    'amount' => (float) $e->amount,
                    'category' => $e->category?->name,
                    'status' => $e->status,
                    'submitted_date' => $e->submitted_at?->format('Y-m-d'),
                ]);

            return [
                'expenseSummary' => [
                    'pending_count' => $pending->count(),
                    'pending_amount' => (float) $pending->sum('amount'),
                    'approved_this_month' => (float) $approved->sum('amount'),
                    'total_claimed_ytd' => (float) $ytd->sum('amount'),
                ],
                'recentExpenses' => $recent,
            ];
        } catch (\Throwable $e) {
            return [
                'expenseSummary' => ['pending_count' => 0, 'pending_amount' => 0, 'approved_this_month' => 0, 'total_claimed_ytd' => 0],
                'recentExpenses' => [],
            ];
        }
    }

    public function getAssetData(Employee $employee): array
    {
        try {
            return [
                'myAssets' => AssetAllocation::where('employee_id', $employee->id)
                    ->where('is_active', true)
                    ->with('asset.category')
                    ->take(10)
                    ->get()
                    ->map(fn ($a) => [
                        'id' => $a->id,
                        'name' => $a->asset?->name,
                        'category' => $a->asset?->category?->name,
                        'serial_number' => $a->asset?->serial_number ?? null,
                        'allocated_date' => $a->allocated_date?->format('Y-m-d'),
                        'expected_return_date' => $a->expected_return_date?->format('Y-m-d'),
                    ]),
            ];
        } catch (\Throwable $e) {
            return ['myAssets' => []];
        }
    }

    public function getDocumentData(Employee $employee): array
    {
        try {
            $docs = EmployeePersonalDocument::where('user_id', $employee->user_id)
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get();

            $alerts = $docs->filter(fn ($d) => $d->expiry_date && $d->expiry_date->isBetween(now(), now()->addDays(30)))
                ->map(fn ($d) => [
                    'id' => $d->id,
                    'name' => $d->name,
                    'expiry_date' => $d->expiry_date->format('Y-m-d'),
                    'days_until_expiry' => (int) now()->diffInDays($d->expiry_date, false),
                ])->values();

            return [
                'myDocuments' => $docs->map(fn ($d) => [
                    'id' => $d->id,
                    'name' => $d->name,
                    'type' => $d->document_type,
                    'uploaded_date' => $d->created_at?->format('Y-m-d'),
                    'expiry_date' => $d->expiry_date?->format('Y-m-d'),
                    'status' => $d->status,
                ]),
                'documentAlerts' => $alerts,
            ];
        } catch (\Throwable $e) {
            return ['myDocuments' => [], 'documentAlerts' => []];
        }
    }

    public function getCareerData(Employee $employee): array
    {
        try {
            $progression = EmployeeCareerProgression::where('employee_id', $employee->id)
                ->with(['careerPath', 'currentMilestone', 'targetMilestone'])
                ->where('status', 'active')
                ->first();

            return [
                'careerPath' => $progression ? [
                    'current_position' => $progression->currentMilestone?->name ?? $employee->designation?->name,
                    'next_position' => $progression->targetMilestone?->name,
                    'progress_percentage' => (float) $progression->progress_percentage,
                    'career_path_name' => $progression->careerPath?->name,
                ] : null,
            ];
        } catch (\Throwable $e) {
            return ['careerPath' => null];
        }
    }

    public function getFeedbackData(Employee $employee): array
    {
        try {
            $pending = Feedback360Response::whereHas('feedback360', function ($q) {
                $q->where('status', 'active');
            })
                ->where('reviewer_id', $employee->user_id)
                ->where('status', 'pending')
                ->with('feedback360.employee')
                ->take(5)
                ->get()
                ->map(fn ($r) => [
                    'id' => $r->id,
                    'subject_name' => $r->feedback360?->employee?->full_name ?? 'N/A',
                    'due_date' => $r->feedback360?->end_date?->format('Y-m-d'),
                    'status' => $r->status,
                ]);

            $myFeedback = Feedback360::where('employee_id', $employee->id)
                ->withCount('responses')
                ->withAvg('responses', 'overall_rating')
                ->latest()
                ->first();

            return [
                'pendingFeedbackRequests' => $pending,
                'myFeedbackSummary' => $myFeedback ? [
                    'average_score' => round((float) ($myFeedback->responses_avg_overall_rating ?? 0), 1),
                    'total_reviews' => $myFeedback->responses_count ?? 0,
                ] : null,
            ];
        } catch (\Throwable $e) {
            return ['pendingFeedbackRequests' => [], 'myFeedbackSummary' => null];
        }
    }

    public function getOnboardingData(Employee $employee): array
    {
        try {
            $onboarding = Onboarding::where('employee_id', $employee->id)
                ->where('status', '!=', 'completed')
                ->with(['tasks' => fn ($q) => $q->orderBy('due_date')])
                ->first();

            if (! $onboarding) {
                return ['onboardingProgress' => null];
            }

            $totalTasks = $onboarding->tasks->count();
            $completedTasks = $onboarding->tasks->where('status', 'completed')->count();

            return [
                'onboardingProgress' => [
                    'is_onboarding' => true,
                    'total_tasks' => $totalTasks,
                    'completed_tasks' => $completedTasks,
                    'progress_percentage' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0,
                    'pending_tasks' => $onboarding->tasks
                        ->where('status', '!=', 'completed')
                        ->take(5)
                        ->map(fn ($t) => [
                            'id' => $t->id,
                            'name' => $t->task,
                            'due_date' => $t->due_date?->format('Y-m-d'),
                            'status' => $t->status,
                        ])->values(),
                ],
            ];
        } catch (\Throwable $e) {
            return ['onboardingProgress' => null];
        }
    }

    public function getTeamData(Employee $employee): array
    {
        try {
            $manager = $employee->managerEmployee;
            $teamMembers = Employee::where('department_id', $employee->department_id)
                ->where('id', '!=', $employee->id)
                ->where('status', 'active')
                ->with('user', 'designation')
                ->take(8)
                ->get()
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'name' => $e->user?->name,
                    'designation' => $e->designation?->name,
                    'avatar' => $e->profile_image_url ?? null,
                ]);

            $birthdays = Employee::where('department_id', $employee->department_id)
                ->whereMonth('birthday', now()->month)
                ->with('user')
                ->get()
                ->map(fn ($e) => [
                    'name' => $e->user?->name,
                    'birthday' => $e->birthday?->format('M d'),
                    'avatar' => $e->profile_image_url ?? null,
                ]);

            return [
                'teamInfo' => [
                    'department_name' => $employee->department?->name,
                    'team_size' => Employee::where('department_id', $employee->department_id)->where('status', 'active')->count(),
                    'manager' => $manager ? [
                        'name' => $manager->user?->name,
                        'avatar' => $manager->profile_image_url ?? null,
                    ] : null,
                    'team_members' => $teamMembers,
                    'team_birthdays' => $birthdays,
                ],
            ];
        } catch (\Throwable $e) {
            return ['teamInfo' => null];
        }
    }

    public function getOvertimeData(Employee $employee): array
    {
        try {
            $pending = OvertimeRequest::where('employee_id', $employee->id)
                ->where('status', 'pending')
                ->count();

            $approvedMonth = OvertimeRequest::where('employee_id', $employee->id)
                ->where('status', 'approved')
                ->whereMonth('request_date', now()->month)
                ->whereYear('request_date', now()->year)
                ->sum('actual_hours');

            $ytd = OvertimeRequest::where('employee_id', $employee->id)
                ->where('status', 'approved')
                ->whereYear('request_date', now()->year)
                ->sum('actual_hours');

            return [
                'overtimeSummary' => [
                    'pending_requests' => $pending,
                    'approved_this_month_hours' => (float) $approvedMonth,
                    'total_overtime_ytd_hours' => (float) $ytd,
                ],
            ];
        } catch (\Throwable $e) {
            return ['overtimeSummary' => ['pending_requests' => 0, 'approved_this_month_hours' => 0, 'total_overtime_ytd_hours' => 0]];
        }
    }

    public function getGrievanceData(Employee $employee): array
    {
        try {
            $grievances = Grievance::where('employee_id', $employee->id)
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get()
                ->map(fn ($g) => [
                    'id' => $g->id,
                    'subject' => $g->subject,
                    'status' => $g->status,
                    'submitted_date' => $g->created_at?->format('Y-m-d'),
                ]);

            $warningCount = Warning::where('employee_id', $employee->id)
                ->where('status', 'active')
                ->count();

            return [
                'myGrievances' => $grievances,
                'activeWarnings' => [
                    'count' => $warningCount,
                ],
            ];
        } catch (\Throwable $e) {
            return ['myGrievances' => [], 'activeWarnings' => ['count' => 0]];
        }
    }

    public function getHolidayAndEventData(): array
    {
        try {
            $holidays = Holiday::where('date', '>=', today())
                ->where('is_active', true)
                ->orderBy('date')
                ->take(5)
                ->get()
                ->map(fn ($h) => [
                    'id' => $h->id,
                    'name' => $h->title,
                    'date' => $h->date?->format('Y-m-d'),
                    'type' => $h->type,
                ]);

            $events = Event::where('event_date', '>=', today())
                ->where('is_published', true)
                ->orderBy('event_date')
                ->take(5)
                ->get()
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'title' => $e->title,
                    'date' => $e->event_date?->format('Y-m-d'),
                    'location' => $e->venue,
                    'type' => 'event',
                ]);

            return [
                'upcomingHolidays' => $holidays,
                'companyEvents' => $events,
            ];
        } catch (\Throwable $e) {
            return ['upcomingHolidays' => [], 'companyEvents' => []];
        }
    }

    public function getSurveyData(Employee $employee): array
    {
        try {
            $surveys = PulseSurvey::where('status', 'active')
                ->where('end_date', '>=', today())
                ->get()
                ->map(function ($s) use ($employee) {
                    $completed = PulseSurveyResponse::where('pulse_survey_id', $s->id)
                        ->where('user_id', $employee->user_id)
                        ->exists();

                    return [
                        'id' => $s->id,
                        'title' => $s->title,
                        'description' => $s->description,
                        'due_date' => $s->end_date?->format('Y-m-d'),
                        'is_completed' => $completed,
                    ];
                });

            return ['activeSurveys' => $surveys];
        } catch (\Throwable $e) {
            return ['activeSurveys' => []];
        }
    }

    public function getBenefitData(Employee $employee): array
    {
        try {
            $benefits = Benefit::whereHas('employees', function ($q) use ($employee) {
                $q->where('user_id', $employee->user_id)->where('employee_benefits.status', 'active');
            })
                ->take(10)
                ->get()
                ->map(fn ($b) => [
                    'id' => $b->id,
                    'name' => $b->name,
                    'type' => $b->type,
                    'provider' => $b->provider,
                    'status' => $b->status,
                ]);

            return ['myBenefits' => $benefits];
        } catch (\Throwable $e) {
            return ['myBenefits' => []];
        }
    }

    /**
     * Build aggregated alerts from multiple data sources.
     *
     * @return array<int, array{type: string, title: string, message: string, severity: string, action_url: ?string}>
     */
    public function buildAlerts(Employee $employee, array $dashboardData): array
    {
        $alerts = [];

        // Document expiry alerts
        foreach (($dashboardData['documentAlerts'] ?? []) as $doc) {
            $alerts[] = [
                'type' => 'document_expiry',
                'title' => 'Document Expiring',
                'message' => "{$doc['name']} expires in {$doc['days_until_expiry']} days",
                'severity' => $doc['days_until_expiry'] <= 7 ? 'danger' : 'warning',
                'action_url' => null,
            ];
        }

        // Certification expiry alerts
        foreach (($dashboardData['certifications'] ?? []) as $cert) {
            if ($cert['is_expired'] ?? false) {
                $alerts[] = [
                    'type' => 'certification_expired',
                    'title' => 'Certification Expired',
                    'message' => "{$cert['name']} has expired",
                    'severity' => 'danger',
                    'action_url' => null,
                ];
            } elseif ($cert['is_expiring_soon'] ?? false) {
                $alerts[] = [
                    'type' => 'certification_expiring',
                    'title' => 'Certification Expiring',
                    'message' => "{$cert['name']} is expiring soon",
                    'severity' => 'warning',
                    'action_url' => null,
                ];
            }
        }

        // Pending feedback alerts
        if (count($dashboardData['pendingFeedbackRequests'] ?? []) > 0) {
            $count = count($dashboardData['pendingFeedbackRequests']);
            $alerts[] = [
                'type' => 'pending_feedback',
                'title' => 'Feedback Pending',
                'message' => "You have {$count} pending feedback request(s)",
                'severity' => 'primary',
                'action_url' => null,
            ];
        }

        // Onboarding tasks
        if (($dashboardData['onboardingProgress']['is_onboarding'] ?? false)) {
            $pending = count($dashboardData['onboardingProgress']['pending_tasks'] ?? []);
            if ($pending > 0) {
                $alerts[] = [
                    'type' => 'onboarding',
                    'title' => 'Onboarding Tasks',
                    'message' => "You have {$pending} pending onboarding task(s)",
                    'severity' => 'primary',
                    'action_url' => null,
                ];
            }
        }

        return array_slice($alerts, 0, 10);
    }

    public function getQuickActions(Employee $employee): array
    {
        return [
            ['id' => 'apply_leave', 'label' => 'Apply for Leave', 'icon' => 'CalendarIcon', 'route' => 'hrm.leave.create', 'color' => 'primary'],
            ['id' => 'clock_in_out', 'label' => 'Clock In/Out', 'icon' => 'ClockIcon', 'route' => 'hrm.attendance.punch', 'color' => 'success'],
            ['id' => 'view_payslip', 'label' => 'View Payslip', 'icon' => 'CurrencyDollarIcon', 'route' => 'hrm.payroll.my-payslips', 'color' => 'success'],
            ['id' => 'my_profile', 'label' => 'My Profile', 'icon' => 'UserIcon', 'route' => 'hrm.employee.profile', 'color' => 'secondary'],
            ['id' => 'submit_expense', 'label' => 'Submit Expense', 'icon' => 'ReceiptPercentIcon', 'route' => 'hrm.expenses.create', 'color' => 'warning'],
            ['id' => 'my_documents', 'label' => 'My Documents', 'icon' => 'DocumentIcon', 'route' => 'selfservice.documents', 'color' => 'default'],
            ['id' => 'my_trainings', 'label' => 'My Trainings', 'icon' => 'AcademicCapIcon', 'route' => 'selfservice.trainings', 'color' => 'primary'],
            ['id' => 'my_performance', 'label' => 'My Performance', 'icon' => 'ChartBarIcon', 'route' => 'selfservice.performance', 'color' => 'secondary'],
            ['id' => 'request_overtime', 'label' => 'Request Overtime', 'icon' => 'ClockIcon', 'route' => 'hrm.overtime.request', 'color' => 'warning'],
            ['id' => 'my_goals', 'label' => 'My Goals', 'icon' => 'FlagIcon', 'route' => 'selfservice.performance', 'color' => 'success'],
            ['id' => 'attendance_history', 'label' => 'Attendance History', 'icon' => 'CalendarDaysIcon', 'route' => 'hrm.attendance.my-history', 'color' => 'default'],
        ];
    }

    /**
     * Get manager approval counts if employee is a manager.
     */
    public function getManagerApprovals(Employee $employee): ?array
    {
        try {
            $directReportIds = Employee::where('manager_id', $employee->user_id)
                ->pluck('user_id')
                ->toArray();

            if (empty($directReportIds)) {
                return null;
            }

            $directReportEmployeeIds = Employee::where('manager_id', $employee->user_id)
                ->pluck('id')
                ->toArray();

            return [
                'pending_leaves' => Leave::whereIn('user_id', $directReportIds)
                    ->whereIn('status', ['pending', 'submitted'])
                    ->count(),
                'pending_expenses' => ExpenseClaim::whereIn('employee_id', $directReportEmployeeIds)
                    ->where('status', 'pending')
                    ->count(),
                'pending_overtime' => OvertimeRequest::whereIn('employee_id', $directReportEmployeeIds)
                    ->where('status', 'pending')
                    ->count(),
            ];
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function getEmployeeProfile(Employee $employee): array
    {
        return [
            'id' => $employee->id,
            'name' => $employee->user?->name,
            'full_name' => $employee->full_name ?? $employee->user?->name,
            'email' => $employee->user?->email,
            'phone' => $employee->user?->phone ?? null,
            'department' => $employee->department?->name ?? 'N/A',
            'designation' => $employee->designation?->name ?? 'N/A',
            'employee_code' => $employee->employee_code,
            'avatar' => $employee->profile_image_url ?? null,
            'date_of_joining' => $employee->date_of_joining?->format('Y-m-d'),
            'employment_type' => $employee->employment_type,
            'status' => $employee->status,
            'probation_end_date' => $employee->probation_end_date?->format('Y-m-d'),
            'is_on_probation' => $employee->probation_end_date && $employee->probation_end_date->isFuture(),
            'tenure_years' => $employee->date_of_joining ? (int) $employee->date_of_joining->diffInYears(now()) : 0,
            'tenure_months' => $employee->date_of_joining ? (int) ($employee->date_of_joining->diffInMonths(now()) % 12) : 0,
            'work_location' => $employee->work_location,
            'shift' => $employee->shift,
        ];
    }
}
