<?php

namespace Aero\Crm\Models\Marketing;

use Aero\Core\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SmsCampaign extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'message',
        'sender_id',
        'status',
        'type',
        'segment_criteria',
        'list_id',
        'scheduled_at',
        'sent_at',
        'completed_at',
        'total_recipients',
        'sent_count',
        'delivered_count',
        'failed_count',
        'clicked_count',
        'cost',
        'currency',
        'created_by',
        'tags',
    ];

    protected function casts(): array
    {
        return [
            'segment_criteria' => 'array',
            'tags' => 'array',
            'scheduled_at' => 'datetime',
            'sent_at' => 'datetime',
            'completed_at' => 'datetime',
            'cost' => 'decimal:4',
        ];
    }

    const STATUS_DRAFT = 'draft';

    const STATUS_SCHEDULED = 'scheduled';

    const STATUS_SENDING = 'sending';

    const STATUS_SENT = 'sent';

    const STATUS_PAUSED = 'paused';

    const STATUS_CANCELLED = 'cancelled';

    const STATUS_FAILED = 'failed';

    const TYPE_REGULAR = 'regular';

    const TYPE_AUTOMATED = 'automated';

    const TYPE_TRIGGERED = 'triggered';

    public function recipients(): HasMany
    {
        return $this->hasMany(SmsCampaignRecipient::class, 'campaign_id');
    }

    public function list(): BelongsTo
    {
        return $this->belongsTo(SmsList::class, 'list_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function metrics(): MorphMany
    {
        return $this->morphMany(CampaignMetric::class, 'campaign');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', self::STATUS_SCHEDULED);
    }

    public function scopeReadyToSend($query)
    {
        return $query->where('status', self::STATUS_SCHEDULED)
            ->where('scheduled_at', '<=', now());
    }

    public function canSend(): bool
    {
        return $this->status === self::STATUS_DRAFT && $this->message;
    }

    public function getDeliveryRateAttribute(): float
    {
        if ($this->sent_count === 0) {
            return 0;
        }

        return round(($this->delivered_count / $this->sent_count) * 100, 2);
    }

    public function updateStats(): void
    {
        $stats = $this->recipients()
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN status != "pending" THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status = "delivered" OR status = "clicked" THEN 1 ELSE 0 END) as delivered,
                SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = "clicked" THEN 1 ELSE 0 END) as clicked,
                SUM(COALESCE(cost, 0)) as total_cost
            ')
            ->first();

        $this->update([
            'total_recipients' => $stats->total ?? 0,
            'sent_count' => $stats->sent ?? 0,
            'delivered_count' => $stats->delivered ?? 0,
            'failed_count' => $stats->failed ?? 0,
            'clicked_count' => $stats->clicked ?? 0,
            'cost' => $stats->total_cost ?? 0,
        ]);
    }
}
