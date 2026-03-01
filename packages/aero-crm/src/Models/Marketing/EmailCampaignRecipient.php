<?php

namespace Aero\Crm\Models\Marketing;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class EmailCampaignRecipient extends Model
{
    use HasFactory;

    protected $fillable = [
        'campaign_id',
        'email',
        'name',
        'recipient_type',
        'recipient_id',
        'status',
        'sent_at',
        'delivered_at',
        'opened_at',
        'clicked_at',
        'open_count',
        'click_count',
        'bounce_type',
        'bounce_message',
        'complaint_type',
        'merge_fields',
        'message_id',
    ];

    protected function casts(): array
    {
        return [
            'merge_fields' => 'array',
            'sent_at' => 'datetime',
            'delivered_at' => 'datetime',
            'opened_at' => 'datetime',
            'clicked_at' => 'datetime',
        ];
    }

    /**
     * Recipient statuses
     */
    const STATUS_PENDING = 'pending';

    const STATUS_SENT = 'sent';

    const STATUS_DELIVERED = 'delivered';

    const STATUS_OPENED = 'opened';

    const STATUS_CLICKED = 'clicked';

    const STATUS_BOUNCED = 'bounced';

    const STATUS_UNSUBSCRIBED = 'unsubscribed';

    const STATUS_COMPLAINED = 'complained';

    const STATUS_FAILED = 'failed';

    /**
     * Get the campaign
     */
    public function campaign(): BelongsTo
    {
        return $this->belongsTo(EmailCampaign::class, 'campaign_id');
    }

    /**
     * Get the recipient entity (Lead, Customer, etc.)
     */
    public function recipient(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope for pending recipients
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope for delivered recipients
     */
    public function scopeDelivered($query)
    {
        return $query->whereIn('status', [self::STATUS_DELIVERED, self::STATUS_OPENED, self::STATUS_CLICKED]);
    }

    /**
     * Scope for engaged recipients
     */
    public function scopeEngaged($query)
    {
        return $query->whereIn('status', [self::STATUS_OPENED, self::STATUS_CLICKED]);
    }

    /**
     * Scope for bounced recipients
     */
    public function scopeBounced($query)
    {
        return $query->where('status', self::STATUS_BOUNCED);
    }

    /**
     * Mark as sent
     */
    public function markAsSent(?string $messageId = null): void
    {
        $this->update([
            'status' => self::STATUS_SENT,
            'sent_at' => now(),
            'message_id' => $messageId,
        ]);
    }

    /**
     * Mark as delivered
     */
    public function markAsDelivered(): void
    {
        $this->update([
            'status' => self::STATUS_DELIVERED,
            'delivered_at' => now(),
        ]);
    }

    /**
     * Record an open
     */
    public function recordOpen(): void
    {
        $this->increment('open_count');

        if (! $this->opened_at) {
            $this->update([
                'status' => self::STATUS_OPENED,
                'opened_at' => now(),
            ]);
        }
    }

    /**
     * Record a click
     */
    public function recordClick(): void
    {
        $this->increment('click_count');

        if (! $this->clicked_at) {
            $this->update([
                'status' => self::STATUS_CLICKED,
                'clicked_at' => now(),
            ]);
        }
    }

    /**
     * Mark as bounced
     */
    public function markAsBounced(string $type, ?string $message = null): void
    {
        $this->update([
            'status' => self::STATUS_BOUNCED,
            'bounce_type' => $type,
            'bounce_message' => $message,
        ]);
    }

    /**
     * Mark as unsubscribed
     */
    public function markAsUnsubscribed(): void
    {
        $this->update([
            'status' => self::STATUS_UNSUBSCRIBED,
        ]);
    }

    /**
     * Mark as complained
     */
    public function markAsComplained(?string $type = null): void
    {
        $this->update([
            'status' => self::STATUS_COMPLAINED,
            'complaint_type' => $type,
        ]);
    }
}
