<?php

namespace App\Http\Controllers;

use App\Models\DailyWork;
use App\Models\Jurisdiction;
use App\Models\Report;
use App\Models\User;
use App\Services\DailyWork\DailyWorkCrudService;
use App\Services\DailyWork\DailyWorkFileService;
use App\Services\DailyWork\DailyWorkImportService;
use App\Services\DailyWork\DailyWorkPaginationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class DailyWorkController extends Controller
{
    private DailyWorkPaginationService $paginationService;

    private DailyWorkImportService $importService;

    private DailyWorkCrudService $crudService;

    private DailyWorkFileService $fileService;

    public function __construct(
        DailyWorkPaginationService $paginationService,
        DailyWorkImportService $importService,
        DailyWorkCrudService $crudService,
        DailyWorkFileService $fileService
    ) {
        $this->paginationService = $paginationService;
        $this->importService = $importService;
        $this->crudService = $crudService;
        $this->fileService = $fileService;
    }

    public function index()
    {
        $user = User::with('designation')->find(Auth::id());
        $userDesignationTitle = $user->designation?->title;

        $allData = $userDesignationTitle === 'Supervision Engineer'
            ? [
                'allInCharges' => [],
                'juniors' => User::where('report_to', $user->id)->get(),

            ]
            : (in_array($userDesignationTitle, ['Quality Control Inspector', 'Asst. Quality Control Inspector'])
                ? []
                : ($user->hasRole('Super Administrator') || $user->hasRole('Administrator')
                    ? [
                        'allInCharges' => User::whereHas('designation', function ($q) {
                            $q->where('title', 'Supervision Engineer');
                        })->get(),
                        'juniors' => [],
                    ]
                    : []
                )
            );
        $reports = Report::all();
        $reports_with_daily_works = Report::with('daily_works')->has('daily_works')->get();
        $users = User::with(['roles', 'designation'])->get();

        // Loop through each user and add role and designation_title fields
        $users->transform(function ($user) {
            $user->role = $user->roles->first()?->name;
            $user->designation_title = $user->designation?->title;

            return $user;
        });

        $overallStartDate = DailyWork::min('date'); // Earliest date from all records
        $overallEndDate = DailyWork::max('date'); // Latest date from all records

        return Inertia::render('Project/DailyWorks', [
            'allData' => $allData,
            'jurisdictions' => Jurisdiction::all(),
            'users' => $users,
            'title' => 'Daily Works',
            'reports' => $reports,
            'reports_with_daily_works' => $reports_with_daily_works,
            'overallStartDate' => $overallStartDate,
            'overallEndDate' => $overallEndDate,
        ]);
    }

    public function paginate(Request $request)
    {
        try {
            $paginatedDailyWorks = $this->paginationService->getPaginatedDailyWorks($request);

            return response()->json($paginatedDailyWorks);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function all(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $result = $this->paginationService->getAllDailyWorks($request);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function import(Request $request)
    {
        try {
            $results = $this->importService->processImport($request);

            return response()->json([
                'message' => 'Import completed successfully',
                'results' => $results,
            ]);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $result = $this->crudService->update($request);

            return response()->json($result);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function delete(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $result = $this->crudService->delete($request);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function export(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $user = User::with('designation')->find(Auth::id());
            $userDesignationTitle = $user->designation?->title;

            $query = DailyWork::with(['inchargeUser', 'assignedUser', 'reports']);

            // Apply user role filter
            if ($userDesignationTitle === 'Supervision Engineer') {
                $query->where('incharge', $user->id);
            }

            // Apply filters from request
            if ($request->has('startDate') && $request->has('endDate')) {
                $query->whereBetween('date', [$request->startDate, $request->endDate]);
            }

            if ($request->has('incharge') && $request->incharge !== 'all') {
                $query->where('incharge', $request->incharge);
            }

            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            if ($request->has('type') && $request->type !== 'all') {
                $query->where('type', $request->type);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('number', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%");
                });
            }

            $dailyWorks = $query->get();

            // Prepare export data based on selected columns
            $selectedColumns = $request->get('columns', [
                'date', 'number', 'type', 'description', 'location', 'status',
                'incharge', 'assigned', 'completion_time', 'rfi_submission_date',
            ]);

            $exportData = $dailyWorks->map(function ($work) use ($selectedColumns) {
                $row = [];

                foreach ($selectedColumns as $column) {
                    switch ($column) {
                        case 'date':
                            $row['Date'] = $work->date->format('Y-m-d');
                            break;
                        case 'number':
                            $row['RFI Number'] = $work->number;
                            break;
                        case 'type':
                            $row['Type'] = $work->type;
                            break;
                        case 'description':
                            $row['Description'] = $work->description;
                            break;
                        case 'location':
                            $row['Location'] = $work->location;
                            break;
                        case 'status':
                            $row['Status'] = ucfirst($work->status);
                            break;
                        case 'incharge':
                            $row['In Charge'] = $work->inchargeUser?->name ?? 'N/A';
                            break;
                        case 'assigned':
                            $row['Assigned To'] = $work->assignedUser?->name ?? 'N/A';
                            break;
                        case 'completion_time':
                            $row['Completion Time'] = $work->completion_time?->format('Y-m-d H:i') ?? 'N/A';
                            break;
                        case 'rfi_submission_date':
                            $row['RFI Submission Date'] = $work->rfi_submission_date?->format('Y-m-d') ?? 'N/A';
                            break;
                        case 'side':
                            $row['Side'] = $work->side ?? 'N/A';
                            break;
                        case 'qty_layer':
                            $row['Qty/Layer'] = $work->qty_layer ?? 'N/A';
                            break;
                        case 'planned_time':
                            $row['Planned Time'] = $work->planned_time ?? 'N/A';
                            break;
                        case 'resubmission_count':
                            $row['Resubmission Count'] = $work->resubmission_count ?? 0;
                            break;
                    }
                }

                return $row;
            });

            return response()->json([
                'data' => $exportData,
                'filename' => 'daily_works_'.now()->format('Y_m_d_H_i_s'),
                'total_records' => $exportData->count(),
                'message' => 'Export data prepared successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Export failed: '.$e->getMessage()], 500);
        }
    }

    public function updateStatus(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $request->validate([
                'id' => 'required|exists:daily_works,id',
                'status' => 'required|in:new,completed,resubmission,emergency',
                'inspection_result' => 'nullable|in:pass,fail',
            ]);

            $dailyWork = DailyWork::findOrFail($request->id);

            // Check authorization: admin, incharge, or assigned user can update status
            $user = User::with('roles')->find(Auth::id());
            $isAdmin = $user->roles->contains('name', 'Super Administrator') || $user->roles->contains('name', 'Administrator');
            $isIncharge = (int) $dailyWork->incharge === (int) $user->id;
            $isAssigned = (int) $dailyWork->assigned === (int) $user->id;

            if (! $isAdmin && ! $isIncharge && ! $isAssigned) {
                return response()->json(['error' => 'Unauthorized to update status for this work'], 403);
            }

            $updateData = [
                'status' => $request->status,
            ];

            // Add inspection result if provided
            if ($request->has('inspection_result')) {
                $updateData['inspection_result'] = $request->inspection_result;
            }

            // Auto-set completion and submission times for completed status
            if ($request->status === 'completed') {
                $updateData['completion_time'] = $dailyWork->completion_time ?? now();
                $updateData['submission_time'] = $dailyWork->submission_time ?? now();
            }

            // Reset times for new status
            if ($request->status === 'new') {
                $updateData['completion_time'] = null;
                $updateData['submission_time'] = null;
                $updateData['inspection_result'] = null;
            }

            $dailyWork->update($updateData);

            return response()->json([
                'message' => 'Status updated successfully',
                'dailyWork' => $dailyWork->fresh(['inchargeUser', 'assignedUser']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateCompletionTime(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $request->validate([
                'id' => 'required|exists:daily_works,id',
                'completion_time' => 'required|date',
            ]);

            $dailyWork = DailyWork::findOrFail($request->id);

            // Check authorization: admin, incharge, or assigned user can update completion time
            $user = User::with('roles')->find(Auth::id());
            $isAdmin = $user->roles->contains('name', 'Super Administrator') || $user->roles->contains('name', 'Administrator');
            $isIncharge = (int) $dailyWork->incharge === (int) $user->id;
            $isAssigned = (int) $dailyWork->assigned === (int) $user->id;

            if (! $isAdmin && ! $isIncharge && ! $isAssigned) {
                return response()->json(['error' => 'Unauthorized to update completion time for this work'], 403);
            }

            $dailyWork->update(['completion_time' => $request->completion_time]);

            return response()->json([
                'message' => 'Completion time updated successfully',
                'dailyWork' => $dailyWork->fresh(['inchargeUser', 'assignedUser']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateSubmissionTime(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $request->validate([
                'id' => 'required|exists:daily_works,id',
                'rfi_submission_date' => 'required|date',
            ]);

            $dailyWork = DailyWork::findOrFail($request->id);

            // Check authorization: admin, incharge, or assigned user can update submission time
            $user = User::with('roles')->find(Auth::id());
            $isAdmin = $user->roles->contains('name', 'Super Administrator') || $user->roles->contains('name', 'Administrator');
            $isIncharge = (int) $dailyWork->incharge === (int) $user->id;
            $isAssigned = (int) $dailyWork->assigned === (int) $user->id;

            if (! $isAdmin && ! $isIncharge && ! $isAssigned) {
                return response()->json(['error' => 'Unauthorized to update submission date for this work'], 403);
            }

            $dailyWork->update(['rfi_submission_date' => $request->rfi_submission_date]);

            return response()->json([
                'message' => 'RFI submission date updated successfully',
                'dailyWork' => $dailyWork->fresh(['inchargeUser', 'assignedUser']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateInspectionDetails(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $request->validate([
                'id' => 'required|exists:daily_works,id',
                'inspection_details' => 'nullable|string|max:1000',
            ]);

            $dailyWork = DailyWork::findOrFail($request->id);
            $dailyWork->update(['inspection_details' => $request->inspection_details]);

            return response()->json([
                'message' => 'Inspection details updated successfully',
                'dailyWork' => $dailyWork->fresh(['inchargeUser', 'assignedUser']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateIncharge(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $request->validate([
                'id' => 'required|exists:daily_works,id',
                'incharge' => 'nullable|exists:users,id',
            ]);

            $dailyWork = DailyWork::findOrFail($request->id);
            $dailyWork->update(['incharge' => $request->incharge]);

            return response()->json([
                'message' => 'Incharge updated successfully',
                'dailyWork' => $dailyWork->fresh(['inchargeUser', 'assignedUser']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateAssigned(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $request->validate([
                'id' => 'required|exists:daily_works,id',
                'assigned' => 'nullable|exists:users,id',
            ]);

            $dailyWork = DailyWork::findOrFail($request->id);

            // Check authorization: only admin or incharge can update assigned
            $user = User::with('roles')->find(Auth::id());
            $isAdmin = $user->roles->contains('name', 'Super Administrator') || $user->roles->contains('name', 'Administrator');
            $isIncharge = (int) $dailyWork->incharge === (int) $user->id;

            if (! $isAdmin && ! $isIncharge) {
                return response()->json(['error' => 'Unauthorized to update assigned user for this work'], 403);
            }

            $dailyWork->update(['assigned' => $request->assigned]);

            return response()->json([
                'message' => 'Assigned user updated successfully',
                'dailyWork' => $dailyWork->fresh(['inchargeUser', 'assignedUser']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function assignWork(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $request->validate([
                'id' => 'required|exists:daily_works,id',
                'assigned' => 'required|exists:users,id',
            ]);

            $dailyWork = DailyWork::findOrFail($request->id);

            // Only incharge can assign work
            $user = Auth::user();
            $isAdmin = $user->roles->contains('name', 'Administrator');

            if ($dailyWork->incharge !== Auth::id() && ! $isAdmin) {
                return response()->json(['error' => 'Unauthorized to assign this work'], 403);
            }

            $dailyWork->update(['assigned' => $request->assigned]);

            return response()->json([
                'message' => 'Work assigned successfully',
                'dailyWork' => $dailyWork->load(['inchargeUser', 'assignedUser']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function add(Request $request)
    {
        try {
            $result = $this->crudService->create($request);

            return response()->json($result);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function uploadRFIFile(Request $request)
    {
        try {
            $result = $this->fileService->uploadRfiFile($request);

            return response()->json($result);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred while uploading the RFI file.'], 500);
        }
    }

    public function getOrdinalNumber($number): string
    {
        return $this->crudService->getOrdinalNumber((int) $number);
    }

    public function attachReport(Request $request)
    {
        try {
            $result = $this->fileService->attachReport($request);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function detachReport(Request $request)
    {
        try {
            $result = $this->fileService->detachReport($request);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function downloadTemplate()
    {
        try {
            return $this->importService->downloadTemplate();
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
