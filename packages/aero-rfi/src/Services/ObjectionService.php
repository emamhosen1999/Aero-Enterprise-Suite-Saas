<?php

namespace Aero\Rfi\Services;

use Aero\Rfi\Models\Objection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;

/**
 * ObjectionService
 *
 * Service for managing Objection operations.
 */
class ObjectionService
{
    /**
     * Get paginated objections with optional filters.
     *
     * @param  array<string, mixed>  $filters
     */
    public function getPaginated(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Objection::query()
            ->with(['createdByUser', 'resolvedByUser'])
            ->withCount('dailyWorks');

        // Apply filters
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('reason', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['created_by'])) {
            $query->where('created_by', $filters['created_by']);
        }

        if (! empty($filters['resolved_by'])) {
            $query->where('resolved_by', $filters['resolved_by']);
        }

        if (isset($filters['active_only']) && $filters['active_only']) {
            $query->active();
        }

        if (isset($filters['resolved_only']) && $filters['resolved_only']) {
            $query->resolved();
        }

        // Date filters
        if (! empty($filters['created_from'])) {
            $query->where('created_at', '>=', $filters['created_from']);
        }

        if (! empty($filters['created_to'])) {
            $query->where('created_at', '<=', $filters['created_to']);
        }

        // Apply sorting
        $sortField = $filters['sort_by'] ?? 'created_at';
        $sortDirection = $filters['sort_direction'] ?? 'desc';
        $query->orderBy($sortField, $sortDirection);

        return $query->paginate($perPage);
    }

    /**
     * Create a new objection.
     *
     * @param  array<string, mixed>  $data
     * @param  array<int>|null  $attachToRfiIds
     */
    public function create(array $data, ?array $attachToRfiIds = null): Objection
    {
        $objection = Objection::create($data);

        if ($attachToRfiIds) {
            $objection->attachToRfis($attachToRfiIds);
        }

        return $objection;
    }

    /**
     * Update an objection.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Objection $objection, array $data): Objection
    {
        $objection->update($data);

        return $objection->fresh();
    }

    /**
     * Delete an objection.
     */
    public function delete(Objection $objection): bool
    {
        // Only allow deletion of draft objections
        if ($objection->status !== Objection::STATUS_DRAFT) {
            throw new \InvalidArgumentException('Only draft objections can be deleted.');
        }

        return $objection->delete();
    }

    /**
     * Submit objection for review.
     */
    public function submit(Objection $objection, ?string $notes = null): Objection
    {
        $objection->submit($notes);

        return $objection->fresh();
    }

    /**
     * Start review process.
     */
    public function startReview(Objection $objection, ?string $notes = null): Objection
    {
        $objection->startReview($notes);

        return $objection->fresh();
    }

    /**
     * Resolve an objection.
     */
    public function resolve(Objection $objection, string $resolutionNotes): Objection
    {
        $objection->resolve($resolutionNotes);

        return $objection->fresh();
    }

    /**
     * Reject an objection.
     */
    public function reject(Objection $objection, string $rejectionReason): Objection
    {
        $objection->reject($rejectionReason);

        return $objection->fresh();
    }

    /**
     * Upload files to objection.
     *
     * @param  array<UploadedFile>|UploadedFile  $files
     */
    public function uploadFiles(Objection $objection, $files): Collection
    {
        $files = is_array($files) ? $files : [$files];
        $uploadedMedia = collect();

        foreach ($files as $file) {
            $media = $objection
                ->addMedia($file)
                ->toMediaCollection('objection_files');
            $uploadedMedia->push($media);
        }

        return $uploadedMedia;
    }

    /**
     * Delete a file from objection.
     */
    public function deleteFile(Objection $objection, int $mediaId): bool
    {
        $media = $objection->getMedia('objection_files')->where('id', $mediaId)->first();

        if (! $media) {
            return false;
        }

        $media->delete();

        return true;
    }

    /**
     * Attach objection to RFIs.
     *
     * @param  array<int>  $rfiIds
     */
    public function attachToRfis(Objection $objection, array $rfiIds, ?string $notes = null): void
    {
        $objection->attachToRfis($rfiIds, $notes);
    }

    /**
     * Detach objection from RFIs.
     *
     * @param  array<int>  $rfiIds
     */
    public function detachFromRfis(Objection $objection, array $rfiIds): int
    {
        return $objection->detachFromRfis($rfiIds);
    }

    /**
     * Get suggested RFIs based on chainage range.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getSuggestedRfis(Objection $objection)
    {
        return $objection->suggestAffectedRfis();
    }

    /**
     * Get objection statistics.
     *
     * @return array<string, mixed>
     */
    public function getStatistics(): array
    {
        return [
            'total' => Objection::count(),
            'by_status' => [
                'draft' => Objection::byStatus(Objection::STATUS_DRAFT)->count(),
                'submitted' => Objection::byStatus(Objection::STATUS_SUBMITTED)->count(),
                'under_review' => Objection::byStatus(Objection::STATUS_UNDER_REVIEW)->count(),
                'resolved' => Objection::byStatus(Objection::STATUS_RESOLVED)->count(),
                'rejected' => Objection::byStatus(Objection::STATUS_REJECTED)->count(),
            ],
            'by_category' => Objection::selectRaw('category, count(*) as count')
                ->groupBy('category')
                ->pluck('count', 'category')
                ->toArray(),
            'active' => Objection::active()->count(),
            'resolution_rate' => $this->calculateResolutionRate(),
            'average_resolution_time' => $this->calculateAverageResolutionTime(),
        ];
    }

    /**
     * Calculate resolution rate percentage.
     */
    protected function calculateResolutionRate(): float
    {
        $total = Objection::count();

        if ($total === 0) {
            return 0.0;
        }

        $resolved = Objection::resolved()->count();

        return round(($resolved / $total) * 100, 2);
    }

    /**
     * Calculate average resolution time in days.
     */
    protected function calculateAverageResolutionTime(): ?float
    {
        $resolved = Objection::whereNotNull('resolved_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(DAY, created_at, resolved_at)) as avg_days')
            ->value('avg_days');

        return $resolved ? round((float) $resolved, 1) : null;
    }

    /**
     * Get objections for a specific user (created by them).
     *
     * @param  array<string, mixed>  $filters
     */
    public function getByUser(int $userId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $filters['created_by'] = $userId;

        return $this->getPaginated($filters, $perPage);
    }

    /**
     * Get objections pending review (for reviewers).
     */
    public function getPendingReview(int $perPage = 15): LengthAwarePaginator
    {
        return Objection::query()
            ->with(['createdByUser'])
            ->withCount('dailyWorks')
            ->where('status', Objection::STATUS_SUBMITTED)
            ->orderBy('created_at', 'asc')
            ->paginate($perPage);
    }
}
