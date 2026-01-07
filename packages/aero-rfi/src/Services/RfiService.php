<?php

namespace Aero\Rfi\Services;

use Aero\Rfi\Models\Rfi;
use Aero\Rfi\Models\Objection;
use Aero\Rfi\Models\SubmissionOverrideLog;
use Aero\Rfi\Models\WorkLocation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;

/**
 * RfiService
 *
 * Main service for RFI module providing CRUD, statistics, and aggregate operations.
 */
class RfiService
{
    /**
     * Get paginated RFIs with optional filters.
     *
     * @param  array<string, mixed>  $filters
     */
    public function getPaginated(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Rfi::query()
            ->with(['inchargeUser', 'assignedUser', 'workLocation'])
            ->withCount(['objections', 'activeObjections']);

        // Apply filters
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['inspection_result'])) {
            $query->where('inspection_result', $filters['inspection_result']);
        }

        if (! empty($filters['incharge_user_id'])) {
            $query->where('incharge_user_id', $filters['incharge_user_id']);
        }

        if (! empty($filters['assigned_user_id'])) {
            $query->where('assigned_user_id', $filters['assigned_user_id']);
        }

        if (! empty($filters['work_location_id'])) {
            $query->where('work_location_id', $filters['work_location_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->where('date', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->where('date', '<=', $filters['date_to']);
        }

        if (! empty($filters['has_objections'])) {
            $query->withActiveObjections();
        }

        if (! empty($filters['without_objections'])) {
            $query->withoutActiveObjections();
        }

        // Apply sorting
        $sortField = $filters['sort_by'] ?? 'date';
        $sortDirection = $filters['sort_direction'] ?? 'desc';
        $query->orderBy($sortField, $sortDirection);

        return $query->paginate($perPage);
    }

    /**
     * Create a new RFI.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Rfi
    {
        return Rfi::create($data);
    }

    /**
     * Update an RFI.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Rfi $rfi, array $data): Rfi
    {
        $rfi->update($data);

        return $rfi->fresh();
    }

    /**
     * Delete an RFI.
     */
    public function delete(Rfi $rfi): bool
    {
        return $rfi->delete();
    }

    /**
     * Submit RFI for inspection.
     * If there are active objections, requires override authorization.
     */
    public function submitRfi(Rfi $rfi, ?string $overrideReason = null): Rfi
    {
        $activeObjections = $rfi->activeObjections()->get();

        // If there are active objections, require override
        if ($activeObjections->isNotEmpty()) {
            if (empty($overrideReason)) {
                throw new \InvalidArgumentException(
                    'Cannot submit RFI with active objections without providing an override reason.'
                );
            }

            // Log the override
            SubmissionOverrideLog::create([
                'daily_work_id' => $rfi->id,
                'reason' => $overrideReason,
                'overridden_by' => auth()->id(),
                'overridden_at' => now(),
                'objection_ids' => $activeObjections->pluck('id')->toArray(),
            ]);

            // Mark objections as overridden
            foreach ($activeObjections as $objection) {
                $objection->update([
                    'was_overridden' => true,
                    'override_reason' => $overrideReason,
                    'overridden_by' => auth()->id(),
                    'overridden_at' => now(),
                ]);
            }
        }

        $rfi->update([
            'rfi_submission_date' => now()->toDateString(),
            'status' => Rfi::STATUS_PENDING,
        ]);

        return $rfi->fresh();
    }

    /**
     * Record inspection result.
     *
     * @param  array<string, mixed>  $inspectionData
     */
    public function recordInspection(Rfi $rfi, array $inspectionData): Rfi
    {
        $newStatus = match ($inspectionData['result']) {
            Rfi::INSPECTION_PASS, Rfi::INSPECTION_APPROVED => Rfi::STATUS_COMPLETED,
            Rfi::INSPECTION_FAIL, Rfi::INSPECTION_REJECTED => Rfi::STATUS_REJECTED,
            Rfi::INSPECTION_CONDITIONAL => Rfi::STATUS_RESUBMISSION,
            default => $rfi->status,
        };

        // Handle resubmission if rejected or conditional
        if (in_array($newStatus, [Rfi::STATUS_REJECTED, Rfi::STATUS_RESUBMISSION])) {
            $rfi->update([
                'inspection_result' => $inspectionData['result'],
                'inspection_details' => $inspectionData['details'] ?? null,
                'status' => Rfi::STATUS_RESUBMISSION,
                'resubmission_count' => $rfi->resubmission_count + 1,
                'resubmission_date' => now()->toDateString(),
            ]);
        } else {
            $rfi->update([
                'inspection_result' => $inspectionData['result'],
                'inspection_details' => $inspectionData['details'] ?? null,
                'status' => $newStatus,
                'completion_time' => $newStatus === Rfi::STATUS_COMPLETED ? now() : null,
            ]);
        }

        return $rfi->fresh();
    }

    /**
     * Upload files to RFI.
     *
     * @param  array<UploadedFile>|UploadedFile  $files
     */
    public function uploadFiles(Rfi $rfi, $files): Collection
    {
        $files = is_array($files) ? $files : [$files];
        $uploadedMedia = collect();

        foreach ($files as $file) {
            $media = $rfi
                ->addMedia($file)
                ->toMediaCollection('rfi_files');
            $uploadedMedia->push($media);
        }

        return $uploadedMedia;
    }

    /**
     * Delete a file from RFI.
     */
    public function deleteFile(Rfi $rfi, int $mediaId): bool
    {
        $media = $rfi->getMedia('rfi_files')->where('id', $mediaId)->first();

        if (! $media) {
            return false;
        }

        $media->delete();

        return true;
    }

    /**
     * Get RFI summary by user.
     *
     * @return array<string, mixed>
     */
    public function getSummaryByUser(int $userId, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = Rfi::query()
            ->where(function ($q) use ($userId) {
                $q->where('incharge_user_id', $userId)
                    ->orWhere('assigned_user_id', $userId);
            });

        if ($startDate) {
            $query->where('date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('date', '<=', $endDate);
        }

        return [
            'total' => $query->count(),
            'as_incharge' => (clone $query)->where('incharge_user_id', $userId)->count(),
            'as_assigned' => (clone $query)->where('assigned_user_id', $userId)->count(),
            'completed' => (clone $query)->completed()->count(),
            'pending' => (clone $query)->pending()->count(),
            'with_objections' => (clone $query)->withActiveObjections()->count(),
        ];
    }

    /**
     * Get RFIs for a specific work location.
     *
     * @param  array<string, mixed>  $filters
     */
    public function getByWorkLocation(int $workLocationId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $filters['work_location_id'] = $workLocationId;

        return $this->getPaginated($filters, $perPage);
    }

    /**
     * Bulk update status.
     *
     * @param  array<int>  $ids
     */
    public function bulkUpdateStatus(array $ids, string $status): int
    {
        if (! Rfi::isValidStatus($status)) {
            throw new \InvalidArgumentException("Invalid status: {$status}");
        }

        return Rfi::whereIn('id', $ids)->update(['status' => $status]);
    }

    /**
     * Attach objections to RFI.
     *
     * @param  array<int>  $objectionIds
     */
    public function attachObjections(Rfi $rfi, array $objectionIds, ?string $notes = null): void
    {
        $attachData = [];
        foreach ($objectionIds as $objectionId) {
            $attachData[$objectionId] = [
                'attached_by' => auth()->id(),
                'attached_at' => now(),
                'attachment_notes' => $notes,
            ];
        }

        $rfi->objections()->syncWithoutDetaching($attachData);
    }

    /**
     * Detach objections from RFI.
     *
     * @param  array<int>  $objectionIds
     */
    public function detachObjections(Rfi $rfi, array $objectionIds): int
    {
        return $rfi->objections()->detach($objectionIds);
    }

    /**
     * Get RFI dashboard statistics.
     *
     * @return array<string, mixed>
     */
    public function getDashboardStats(): array
    {
        $today = now()->startOfDay();
        $thisWeek = now()->startOfWeek();
        $thisMonth = now()->startOfMonth();

        return [
            'rfis' => [
                'total' => Rfi::count(),
                'today' => Rfi::whereDate('date', $today)->count(),
                'this_week' => Rfi::where('date', '>=', $thisWeek)->count(),
                'this_month' => Rfi::where('date', '>=', $thisMonth)->count(),
                'pending' => Rfi::pending()->count(),
                'completed' => Rfi::completed()->count(),
                'with_objections' => Rfi::withActiveObjections()->count(),
            ],
            'objections' => [
                'total' => Objection::count(),
                'active' => Objection::active()->count(),
                'resolved' => Objection::resolved()->count(),
                'by_category' => Objection::selectRaw('category, count(*) as count')
                    ->groupBy('category')
                    ->pluck('count', 'category')
                    ->toArray(),
            ],
            'work_locations' => [
                'total' => WorkLocation::count(),
                'active' => WorkLocation::active()->count(),
            ],
        ];
    }

    /**
     * Get RFI summary for a date range.
     *
     * @return array<string, mixed>
     */
    public function getRfiSummary(?string $startDate = null, ?string $endDate = null): array
    {
        $query = Rfi::query();

        if ($startDate) {
            $query->where('date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('date', '<=', $endDate);
        }

        return [
            'total' => $query->count(),
            'by_status' => (clone $query)
                ->selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray(),
            'by_type' => (clone $query)
                ->selectRaw('type, count(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray(),
            'by_inspection_result' => (clone $query)
                ->whereNotNull('inspection_result')
                ->selectRaw('inspection_result, count(*) as count')
                ->groupBy('inspection_result')
                ->pluck('count', 'inspection_result')
                ->toArray(),
            'rfi_submitted' => (clone $query)->withRFI()->count(),
            'resubmissions' => (clone $query)->resubmissions()->count(),
        ];
    }

    /**
     * Get work completion rate.
     */
    public function getCompletionRate(?string $startDate = null, ?string $endDate = null): float
    {
        $query = Rfi::query();

        if ($startDate) {
            $query->where('date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('date', '<=', $endDate);
        }

        $total = $query->count();

        if ($total === 0) {
            return 0.0;
        }

        $completed = (clone $query)->completed()->count();

        return round(($completed / $total) * 100, 2);
    }

    /**
     * Get objection resolution rate.
     */
    public function getObjectionResolutionRate(): float
    {
        $total = Objection::count();

        if ($total === 0) {
            return 0.0;
        }

        $resolved = Objection::resolved()->count();

        return round(($resolved / $total) * 100, 2);
    }

    /**
     * Get pending work locations with active objections.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getLocationsPendingReview()
    {
        return WorkLocation::query()
            ->active()
            ->whereHas('rfis', function ($query) {
                $query->pending();
            })
            ->withCount(['rfis' => function ($query) {
                $query->pending();
            }])
            ->orderByDesc('rfis_count')
            ->get();
    }
}
