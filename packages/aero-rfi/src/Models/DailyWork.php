<?php

namespace Aero\Rfi\Models;

use Aero\Core\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * DailyWork Model
 *
 * Represents a Request for Inspection (RFI) submitted for daily construction work.
 * Supports file attachments, objections, and work location relationships.
 *
 * @property int $id
 * @property string $date
 * @property string $number
 * @property string $status
 * @property string|null $inspection_result
 * @property string $type
 * @property string|null $description
 * @property string|null $location
 * @property int|null $work_location_id
 * @property string|null $side
 * @property int|null $qty_layer
 * @property string|null $planned_time
 * @property int|null $incharge_user_id
 * @property int|null $assigned_user_id
 * @property \DateTime|null $completion_time
 * @property string|null $inspection_details
 * @property int $resubmission_count
 * @property string|null $resubmission_date
 * @property string|null $rfi_submission_date
 * @property \DateTime $created_at
 * @property \DateTime $updated_at
 * @property \DateTime|null $deleted_at
 */
class DailyWork extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, SoftDeletes;

    // ==================== Status Constants ====================

    public const STATUS_NEW = 'new';

    public const STATUS_IN_PROGRESS = 'in-progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_RESUBMISSION = 'resubmission';

    public const STATUS_PENDING = 'pending';

    public const STATUS_EMERGENCY = 'emergency';

    // ==================== Inspection Result Constants ====================

    public const INSPECTION_PASS = 'pass';

    public const INSPECTION_FAIL = 'fail';

    public const INSPECTION_CONDITIONAL = 'conditional';

    public const INSPECTION_PENDING = 'pending';

    public const INSPECTION_APPROVED = 'approved';

    public const INSPECTION_REJECTED = 'rejected';

    // ==================== Type Constants ====================

    public const TYPE_EMBANKMENT = 'Embankment';

    public const TYPE_STRUCTURE = 'Structure';

    public const TYPE_PAVEMENT = 'Pavement';

    /**
     * Valid statuses for validation
     *
     * @var array<string>
     */
    public static array $statuses = [
        self::STATUS_NEW,
        self::STATUS_IN_PROGRESS,
        self::STATUS_COMPLETED,
        self::STATUS_REJECTED,
        self::STATUS_RESUBMISSION,
        self::STATUS_PENDING,
        self::STATUS_EMERGENCY,
    ];

    /**
     * Valid inspection results for validation
     *
     * @var array<string>
     */
    public static array $inspectionResults = [
        self::INSPECTION_PASS,
        self::INSPECTION_FAIL,
        self::INSPECTION_CONDITIONAL,
        self::INSPECTION_PENDING,
        self::INSPECTION_APPROVED,
        self::INSPECTION_REJECTED,
    ];

    /**
     * Valid work types for validation
     *
     * @var array<string>
     */
    public static array $types = [
        self::TYPE_EMBANKMENT,
        self::TYPE_STRUCTURE,
        self::TYPE_PAVEMENT,
    ];

    /**
     * Valid side/road types for validation
     *
     * @var array<string>
     */
    public static array $sides = [
        'TR-R',
        'TR-L',
        'SR-R',
        'SR-L',
        'Both',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'date',
        'number',
        'status',
        'inspection_result',
        'type',
        'description',
        'location',
        'work_location_id',
        'side',
        'qty_layer',
        'planned_time',
        'incharge_user_id',
        'assigned_user_id',
        'completion_time',
        'inspection_details',
        'resubmission_count',
        'resubmission_date',
        'rfi_submission_date',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date' => 'date',
        'completion_time' => 'datetime',
        'rfi_submission_date' => 'date',
        'resubmission_date' => 'date',
        'resubmission_count' => 'integer',
        'qty_layer' => 'integer',
    ];

    /**
     * Append RFI files count and objection info to JSON serialization.
     *
     * @var array<string>
     */
    protected $appends = ['rfi_files_count', 'active_objections_count', 'has_active_objections'];

    // ==================== Media Collections ====================

    /**
     * Register media collections for RFI files.
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('rfi_files')
            ->acceptsMimeTypes([
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/gif',
                'application/pdf',
            ])
            ->useDisk(config('rfi.file_storage.disk', 'public'));
    }

    /**
     * Register media conversions for thumbnails.
     */
    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(150)
            ->height(150)
            ->sharpen(10)
            ->nonQueued()
            ->performOnCollections('rfi_files');
    }

    // ==================== Relationships ====================

    /**
     * Get the user who is in charge of this daily work.
     */
    public function inchargeUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'incharge_user_id');
    }

    /**
     * Get the user who is assigned to this daily work.
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    /**
     * Get the work location for this daily work.
     */
    public function workLocation(): BelongsTo
    {
        return $this->belongsTo(WorkLocation::class);
    }

    /**
     * Get all objections for this RFI (many-to-many).
     */
    public function objections(): BelongsToMany
    {
        return $this->belongsToMany(Objection::class, 'daily_work_objection')
            ->withPivot(['attached_by', 'attached_at', 'attachment_notes'])
            ->withTimestamps()
            ->orderBy('daily_work_objection.attached_at', 'desc');
    }

    /**
     * Get only active (blocking) objections for this RFI.
     */
    public function activeObjections(): BelongsToMany
    {
        return $this->belongsToMany(Objection::class, 'daily_work_objection')
            ->withPivot(['attached_by', 'attached_at', 'attachment_notes'])
            ->withTimestamps()
            ->whereIn('objections.status', Objection::$activeStatuses)
            ->orderBy('daily_work_objection.attached_at', 'desc');
    }

    /**
     * Get submission override logs for this RFI.
     */
    public function submissionOverrideLogs(): HasMany
    {
        return $this->hasMany(SubmissionOverrideLog::class)->orderBy('created_at', 'desc');
    }

    // ==================== Accessors ====================

    /**
     * Get RFI files count.
     */
    public function getRfiFilesCountAttribute(): int
    {
        return $this->getMedia('rfi_files')->count();
    }

    /**
     * Get RFI files with formatted data.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getRfiFilesAttribute(): array
    {
        return $this->getMedia('rfi_files')->map(function ($media) {
            return [
                'id' => $media->id,
                'name' => $media->file_name,
                'url' => $media->getUrl(),
                'thumb_url' => $media->hasGeneratedConversion('thumb') ? $media->getUrl('thumb') : null,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
                'human_size' => $this->formatBytes($media->size),
                'is_image' => str_starts_with($media->mime_type, 'image/'),
                'is_pdf' => $media->mime_type === 'application/pdf',
                'created_at' => $media->created_at->toISOString(),
            ];
        })->toArray();
    }

    /**
     * Get count of active objections.
     */
    public function getActiveObjectionsCountAttribute(): int
    {
        return $this->objections()
            ->whereIn('status', Objection::$activeStatuses)
            ->count();
    }

    /**
     * Check if RFI has any active objections.
     */
    public function getHasActiveObjectionsAttribute(): bool
    {
        return $this->active_objections_count > 0;
    }

    /**
     * Check if work is completed.
     */
    public function getIsCompletedAttribute(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Check if RFI has been submitted.
     */
    public function getHasRfiSubmissionAttribute(): bool
    {
        return $this->rfi_submission_date !== null;
    }

    /**
     * Check if this is a resubmission.
     */
    public function getIsResubmissionAttribute(): bool
    {
        return $this->resubmission_count > 0;
    }

    // ==================== Scopes ====================

    /**
     * Scope to completed daily works.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope to pending (not completed) daily works.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePending($query)
    {
        return $query->where('status', '!=', self::STATUS_COMPLETED);
    }

    /**
     * Scope to daily works with RFI submission.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithRFI($query)
    {
        return $query->whereNotNull('rfi_submission_date');
    }

    /**
     * Scope to resubmissions only.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeResubmissions($query)
    {
        return $query->where('resubmission_count', '>', 0);
    }

    /**
     * Scope by work type.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope by incharge user.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByIncharge($query, int $userId)
    {
        return $query->where('incharge_user_id', $userId);
    }

    /**
     * Scope by assigned user.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByAssigned($query, int $userId)
    {
        return $query->where('assigned_user_id', $userId);
    }

    /**
     * Scope by date range.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    /**
     * Scope to RFIs with active objections.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithActiveObjections($query)
    {
        return $query->whereHas('objections', function ($q) {
            $q->whereIn('status', Objection::$activeStatuses);
        });
    }

    /**
     * Scope to RFIs without active objections.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithoutActiveObjections($query)
    {
        return $query->whereDoesntHave('objections', function ($q) {
            $q->whereIn('status', Objection::$activeStatuses);
        });
    }

    /**
     * Scope by work location.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByWorkLocation($query, int $workLocationId)
    {
        return $query->where('work_location_id', $workLocationId);
    }

    // ==================== Validation Methods ====================

    /**
     * Check if a status is valid.
     */
    public static function isValidStatus(?string $status): bool
    {
        return $status === null || in_array($status, self::$statuses, true);
    }

    /**
     * Check if an inspection result is valid.
     */
    public static function isValidInspectionResult(?string $result): bool
    {
        return $result === null || in_array($result, self::$inspectionResults, true);
    }

    // ==================== Helper Methods ====================

    /**
     * Format bytes to human readable size.
     */
    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, $precision).' '.$units[$pow];
    }

    // ==================== Boot Method ====================

    /**
     * Boot method with validation.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::saving(function (self $dailyWork) {
            // Validate status
            if ($dailyWork->status && ! self::isValidStatus($dailyWork->status)) {
                throw new \InvalidArgumentException(
                    "Invalid status '{$dailyWork->status}'. Valid statuses are: ".implode(', ', self::$statuses)
                );
            }

            // Validate inspection_result
            if ($dailyWork->inspection_result && ! self::isValidInspectionResult($dailyWork->inspection_result)) {
                throw new \InvalidArgumentException(
                    "Invalid inspection result '{$dailyWork->inspection_result}'. Valid results are: ".implode(', ', self::$inspectionResults)
                );
            }
        });
    }
}
