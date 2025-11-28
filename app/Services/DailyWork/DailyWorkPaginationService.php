<?php

namespace App\Services\DailyWork;

use App\Models\DailyWork;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DailyWorkPaginationService
{
    /**
     * Get paginated daily works based on user role and filters
     */
    public function getPaginatedDailyWorks(Request $request): LengthAwarePaginator
    {
        $startTime = microtime(true);

        $user = Auth::user();
        $perPage = (int) $request->get('perPage', 30);
        $page = $request->get('search') != '' ? 1 : $request->get('page', 1);
        $search = $request->get('search');
        $statusFilter = $request->get('status');
        $inChargeFilter = $request->get('inCharge');
        $startDate = $request->get('startDate');
        $endDate = $request->get('endDate');

        // Log the request parameters for debugging
        Log::info('DailyWork pagination request', [
            'perPage' => $perPage,
            'perPage_type' => gettype($perPage),
            'page' => $page,
            'is_mobile_mode' => $perPage >= 1000,
            'date_range' => [$startDate, $endDate],
            'user_id' => $user->id,
            'search' => $search,
            'statusFilter' => $statusFilter,
            'inChargeFilter' => $inChargeFilter,
        ]);

        $query = $this->buildBaseQuery($user);
        $query = $this->applyFilters($query, $search, $statusFilter, $inChargeFilter, $startDate, $endDate);

        // Mobile mode detection: if perPage is very large (1000+), return all data without pagination
        if ($perPage >= 1000) {
            Log::info('Mobile mode: fetching all data without pagination', [
                'startDate' => $startDate,
                'endDate' => $endDate,
                'statusFilter' => $statusFilter,
                'inChargeFilter' => $inChargeFilter,
                'search' => $search,
            ]);

            // Limit to reasonable number to prevent memory issues (increased for daily work dates)
            $allData = $query->orderBy('date', 'desc')
                ->limit(2000) // Safety limit for mobile - increased to handle busy work days
                ->get();

            $endTime = microtime(true);
            Log::info('DailyWork mobile query completed', [
                'execution_time' => round(($endTime - $startTime) * 1000, 2).'ms',
                'records_count' => $allData->count(),
                'startDate' => $startDate,
                'endDate' => $endDate,
                'records' => $allData->pluck('id')->toArray(),
            ]);

            // Create a manual paginator with all data on page 1
            return new LengthAwarePaginator(
                $allData,
                $allData->count(),
                $allData->count() ?: 1, // perPage = total count to show all on one page
                1,
                ['path' => $request->url(), 'pageName' => 'page']
            );
        }

        $result = $query->orderBy('date', 'desc')->paginate($perPage, ['*'], 'page', $page);

        $endTime = microtime(true);
        Log::info('DailyWork desktop query completed', [
            'execution_time' => round(($endTime - $startTime) * 1000, 2).'ms',
            'records_count' => $result->count(),
            'total_records' => $result->total(),
        ]);

        return $result;
    }

    /**
     * Get all daily works based on user role and filters
     */
    public function getAllDailyWorks(Request $request): array
    {
        $user = Auth::user();
        $search = $request->get('search');
        $statusFilter = $request->get('status');
        $inChargeFilter = $request->get('inCharge');
        $startDate = $request->get('startDate');
        $endDate = $request->get('endDate');

        $query = $this->buildBaseQuery($user);
        $query = $this->applyFilters($query, $search, $statusFilter, $inChargeFilter, $startDate, $endDate);

        $dailyWorks = $query->orderBy('date', 'desc')->get();

        return [
            'dailyWorks' => $dailyWorks,
            'role' => $this->getUserRole($user),
            'userInfo' => $this->getUserInfo($user),
        ];
    }

    /**
     * Build base query based on user designation with optimized eager loading
     */
    private function buildBaseQuery(User $user)
    {
        $userWithDesignation = User::with('designation')->find($user->id);
        $userDesignationTitle = $userWithDesignation->designation?->title;

        // Use optimized eager loading to prevent N+1 queries
        $baseQuery = DailyWork::with([

            'inchargeUser:id,name', // Load user names for display
            'assignedUser:id,name',  // Load assigned user names
        ]);

        if ($userDesignationTitle === 'Supervision Engineer') {
            return $baseQuery->where('incharge', $user->id);
        }

        if (in_array($userDesignationTitle, ['Quality Control Inspector', 'Asst. Quality Control Inspector'])) {
            return $baseQuery->where('assigned', $user->id);
        }

        // Super Administrator and Administrator get all data
        if ($user->hasRole('Super Administrator') || $user->hasRole('Administrator')) {
            return $baseQuery;
        }

        return $baseQuery;
    }

    /**
     * Apply filters to the query with optimized date filtering
     */
    private function applyFilters($query, ?string $search, ?string $statusFilter, ?string $inChargeFilter, ?string $startDate, ?string $endDate)
    {
        // Apply date range filter FIRST for better performance (most selective)
        if ($startDate && $endDate) {
            // For single date (mobile), use exact match instead of range
            if ($startDate === $endDate) {
                $query->whereDate('date', $startDate);
            } else {
                $query->whereBetween('date', [$startDate, $endDate]);
            }
        } elseif ($startDate) {
            $query->whereDate('date', '>=', $startDate);
        }

        // Apply status filter if provided
        if ($statusFilter) {
            $query->where('status', $statusFilter);
        }

        // Apply in-charge filter if provided
        if ($inChargeFilter) {
            $query->where('incharge', $inChargeFilter);
        }

        // Apply search LAST as it's least selective
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('number', 'LIKE', "%{$search}%")
                    ->orWhere('location', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%");
                // Remove date search as it's handled above
            });
        }

        return $query;
    }

    /**
     * Get user role for response based on designation
     */
    private function getUserRole(User $user): string
    {
        $userWithDesignation = User::with('designation')->find($user->id);
        $userDesignationTitle = $userWithDesignation->designation?->title;

        if ($userDesignationTitle === 'Supervision Engineer') {
            return 'Supervision Engineer';
        }

        if ($userDesignationTitle === 'Quality Control Inspector') {
            return 'Quality Control Inspector';
        }

        if ($userDesignationTitle === 'Asst. Quality Control Inspector') {
            return 'Asst. Quality Control Inspector';
        }

        if ($user->hasRole('Super Administrator')) {
            return 'Super Administrator';
        }

        if ($user->hasRole('Administrator')) {
            return 'Administrator';
        }

        return 'Unknown';
    }

    /**
     * Get additional user info for response based on designation
     */
    private function getUserInfo(User $user): array
    {
        $userWithDesignation = User::with('designation')->find($user->id);
        $userDesignationTitle = $userWithDesignation->designation?->title;

        if ($userDesignationTitle === 'Supervision Engineer') {
            return [
                'allInCharges' => [],
                'juniors' => User::where('report_to', $user->id)->get(),
            ];
        }

        if ($user->hasRole('Super Administrator') || $user->hasRole('Administrator')) {
            return [
                'allInCharges' => User::whereHas('designation', function ($q) {
                    $q->where('title', 'Supervision Engineer');
                })->get(),
                'juniors' => [],
            ];
        }

        return [];
    }
}
