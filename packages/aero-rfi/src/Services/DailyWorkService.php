<?php

namespace Aero\Rfi\Services;

use Aero\Rfi\Models\DailyWork;
use Aero\Rfi\Models\Objection;
use Aero\Rfi\Models\SubmissionOverrideLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;

/**
 * DailyWorkService
 *
 * Service for managing Daily Work (RFI) operations.
 */
class DailyWorkService
{
    /**
     * Get paginated daily works with optional filters.
     *
     * @param  array<string, mixed>  $filters
     */
    public function getPaginated(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = DailyWork::query()
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
     * Create a new daily work.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): DailyWork
    {
        return DailyWork::create($data);
    }

    /**
     * Update a daily work.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(DailyWork $dailyWork, array $data): DailyWork
    {
        $dailyWork->update($data);

        return $dailyWork->fresh();
    }

    /**
     * Delete a daily work.
     */
    public function delete(DailyWork $dailyWork): bool
    {
        return $dailyWork->delete();
    }

    /**
     * Submit RFI for inspection.
     * If there are active objections, requires override authorization.
     */
    public function submitRfi(DailyWork $dailyWork, ?string $overrideReason = null): DailyWork
    {
        $activeObjections = $dailyWork->activeObjections()->get();

        // If there are active objections, require override
        if ($activeObjections->isNotEmpty()) {
            if (empty($overrideReason)) {
                throw new \InvalidArgumentException(
                    'Cannot submit RFI with active objections without providing an override reason.'
                );
            }

            // Log the override
            SubmissionOverrideLog::create([
                'daily_work_id' => $dailyWork->id,
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

        $dailyWork->update([
            'rfi_submission_date' => now()->toDateString(),
            'status' => DailyWork::STATUS_PENDING,
        ]);

        return $dailyWork->fresh();
    }

    /**
     * Record inspection result.
     *
     * @param  array<string, mixed>  $inspectionData
     */
    public function recordInspection(DailyWork $dailyWork, array $inspectionData): DailyWork
    {
        $newStatus = match ($inspectionData['result']) {
            DailyWork::INSPECTION_PASS, DailyWork::INSPECTION_APPROVED => DailyWork::STATUS_COMPLETED,
            DailyWork::INSPECTION_FAIL, DailyWork::INSPECTION_REJECTED => DailyWork::STATUS_REJECTED,
            DailyWork::INSPECTION_CONDITIONAL => DailyWork::STATUS_RESUBMISSION,
            default => $dailyWork->status,
        };

        // Handle resubmission if rejected or conditional
        if (in_array($newStatus, [DailyWork::STATUS_REJECTED, DailyWork::STATUS_RESUBMISSION])) {
            $dailyWork->update([
                'inspection_result' => $inspectionData['result'],
                'inspection_details' => $inspectionData['details'] ?? null,
                'status' => DailyWork::STATUS_RESUBMISSION,
                'resubmission_count' => $dailyWork->resubmission_count + 1,
                'resubmission_date' => now()->toDateString(),
            ]);
        } else {
            $dailyWork->update([
                'inspection_result' => $inspectionData['result'],
                'inspection_details' => $inspectionData['details'] ?? null,
                'status' => $newStatus,
                'completion_time' => $newStatus === DailyWork::STATUS_COMPLETED ? now() : null,
            ]);
        }

        return $dailyWork->fresh();
    }

    /**
     * Upload files to daily work.
     *
     * @param  array<UploadedFile>|UploadedFile  $files
     */
    public function uploadFiles(DailyWork $dailyWork, $files): Collection
    {
        $files = is_array($files) ? $files : [$files];
        $uploadedMedia = collect();

        foreach ($files as $file) {
            $media = $dailyWork
                ->addMedia($file)
                ->toMediaCollection('rfi_files');
            $uploadedMedia->push($media);
        }

        return $uploadedMedia;
    }

    /**
     * Delete a file from daily work.
     */
    public function deleteFile(DailyWork $dailyWork, int $mediaId): bool
    {
        $media = $dailyWork->getMedia('rfi_files')->where('id', $mediaId)->first();

        if (! $media) {
            return false;
        }

        $media->delete();

        return true;
    }

    /**
     * Get daily works summary by user.
     *
     * @return array<string, mixed>
     */
    public function getSummaryByUser(int $userId, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = DailyWork::query()
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
     * Get daily works for a specific work location.
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
        if (! DailyWork::isValidStatus($status)) {
            throw new \InvalidArgumentException("Invalid status: {$status}");
        }

        return DailyWork::whereIn('id', $ids)->update(['status' => $status]);
    }

    /**
     * Attach objections to daily work.
     *
     * @param  array<int>  $objectionIds
     */
    public function attachObjections(DailyWork $dailyWork, array $objectionIds, ?string $notes = null): void
    {
        $attachData = [];
        foreach ($objectionIds as $objectionId) {
            $attachData[$objectionId] = [
                'attached_by' => auth()->id(),
                'attached_at' => now(),
                'attachment_notes' => $notes,
            ];
        }

        $dailyWork->objections()->syncWithoutDetaching($attachData);
    }

    /**
     * Detach objections from daily work.
     *
     * @param  array<int>  $objectionIds
     */
    public function detachObjections(DailyWork $dailyWork, array $objectionIds): int
    {
        return $dailyWork->objections()->detach($objectionIds);
    }
}
