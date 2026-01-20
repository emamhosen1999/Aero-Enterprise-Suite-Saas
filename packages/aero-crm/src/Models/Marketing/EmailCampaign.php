<?php

namespace Aero\Crm\Models\Marketing;

use Aero\Core\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmailCampaign extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'subject',
        'preview_text',
        'from_name',
        'from_email',
        'reply_to',
        'html_content',
        'plain_content',
        'template_data',
        'template_id',
        'status',
        'type',
        'segment_criteria',
        'ab_test_config',
        'list_id',
        'template_version_id',
        'scheduled_at',
        'sent_at',
        'completed_at',
        'total_recipients',
        'sent_count',
        'delivered_count',
        'opened_count',
        'clicked_count',
        'bounced_count',
        'unsubscribed_count',
        'complained_count',
        'open_rate',
        'click_rate',
        'created_by',
        'tags',
        'tracking_settings',
    ];

    protected function casts(): array
    {
        return [
            'template_data' => 'array',
            'segment_criteria' => 'array',
            'ab_test_config' => 'array',
            'tags' => 'array',
            'tracking_settings' => 'array',
            'scheduled_at' => 'datetime',
            'sent_at' => 'datetime',
            'completed_at' => 'datetime',
            'open_rate' => 'decimal:2',
            'click_rate' => 'decimal:2',
        ];
    }

    /**
     * Campaign statuses
     */
    const STATUS_DRAFT = 'draft';

    const STATUS_SCHEDULED = 'scheduled';

    const STATUS_SENDING = 'sending';

    const STATUS_SENT = 'sent';

    const STATUS_PAUSED = 'paused';

    const STATUS_CANCELLED = 'cancelled';

    const STATUS_FAILED = 'failed';

    /**
     * Campaign types
     */
    const TYPE_REGULAR = 'regular';

    const TYPE_AUTOMATED = 'automated';

    const TYPE_AB_TEST = 'ab_test';

    const TYPE_TRIGGERED = 'triggered';

    /**
     * Get the recipients for this campaign
     */
    public function recipients(): HasMany
    {
        return $this->hasMany(EmailCampaignRecipient::class, 'campaign_id');
    }

    /**
     * Get the tracked links for this campaign
     */
    public function links(): HasMany
    {
        return $this->hasMany(EmailCampaignLink::class, 'campaign_id');
    }

    /**
     * Get the email list for this campaign
     */
    public function list(): BelongsTo
    {
        return $this->belongsTo(EmailList::class, 'list_id');
    }

    /**
     * Get the template for this campaign
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(EmailTemplate::class, 'template_id');
    }

    /**
     * Get the user who created the campaign
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get campaign metrics
     */
    public function metrics(): MorphMany
    {
        return $this->morphMany(CampaignMetric::class, 'campaign');
    }

    /**
     * Get campaign conversions
     */
    public function conversions(): MorphMany
    {
        return $this->morphMany(CampaignConversion::class, 'campaign');
    }

    /**
     * Scope for draft campaigns
     */
    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    /**
     * Scope for scheduled campaigns
     */
    public function scopeScheduled($query)
    {
        return $query->where('status', self::STATUS_SCHEDULED);
    }

    /**
     * Scope for sent campaigns
     */
    public function scopeSent($query)
    {
        return $query->where('status', self::STATUS_SENT);
    }

    /**
     * Scope for campaigns ready to send
     */
    public function scopeReadyToSend($query)
    {
        return $query->where('status', self::STATUS_SCHEDULED)
            ->where('scheduled_at', '<=', now());
    }

    /**
     * Check if campaign can be edited
     */
    public function canEdit(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_SCHEDULED]);
    }

    /**
     * Check if campaign can be sent
     */
    public function canSend(): bool
    {
        return $this->status === self::STATUS_DRAFT
            && $this->subject
            && ($this->html_content || $this->template_id);
    }

    /**
     * Check if campaign can be paused
     */
    public function canPause(): bool
    {
        return in_array($this->status, [self::STATUS_SCHEDULED, self::STATUS_SENDING]);
    }

    /**
     * Check if campaign can be resumed
     */
    public function canResume(): bool
    {
        return $this->status === self::STATUS_PAUSED;
    }

    /**
     * Calculate engagement rate
     */
    public function getEngagementRateAttribute(): float
    {
        if ($this->delivered_count === 0) {
            return 0;
        }

        $engaged = $this->opened_count + $this->clicked_count;

        return round(($engaged / $this->delivered_count) * 100, 2);
    }

    /**
     * Calculate bounce rate
     */
    public function getBounceRateAttribute(): float
    {
        if ($this->sent_count === 0) {
            return 0;
        }

        return round(($this->bounced_count / $this->sent_count) * 100, 2);
    }

    /**
     * Calculate unsubscribe rate
     */
    public function getUnsubscribeRateAttribute(): float
    {
        if ($this->delivered_count === 0) {
            return 0;
        }

        return round(($this->unsubscribed_count / $this->delivered_count) * 100, 2);
    }

    /**
     * Update campaign statistics
     */
    public function updateStats(): void
    {
        $stats = $this->recipients()
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN status != "pending" THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status IN ("delivered", "opened", "clicked") THEN 1 ELSE 0 END) as delivered,
                SUM(CASE WHEN status IN ("opened", "clicked") THEN 1 ELSE 0 END) as opened,
                SUM(CASE WHEN status = "clicked" THEN 1 ELSE 0 END) as clicked,
                SUM(CASE WHEN status = "bounced" THEN 1 ELSE 0 END) as bounced,
                SUM(CASE WHEN status = "unsubscribed" THEN 1 ELSE 0 END) as unsubscribed,
                SUM(CASE WHEN status = "complained" THEN 1 ELSE 0 END) as complained
            ')
            ->first();

        $this->update([
            'total_recipients' => $stats->total ?? 0,
            'sent_count' => $stats->sent ?? 0,
            'delivered_count' => $stats->delivered ?? 0,
            'opened_count' => $stats->opened ?? 0,
            'clicked_count' => $stats->clicked ?? 0,
            'bounced_count' => $stats->bounced ?? 0,
            'unsubscribed_count' => $stats->unsubscribed ?? 0,
            'complained_count' => $stats->complained ?? 0,
            'open_rate' => $stats->delivered > 0 ? round(($stats->opened / $stats->delivered) * 100, 2) : 0,
            'click_rate' => $stats->delivered > 0 ? round(($stats->clicked / $stats->delivered) * 100, 2) : 0,
        ]);
    }
}
