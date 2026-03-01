<?php

namespace Aero\Crm\Models\Marketing;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SmsCampaignRecipient extends Model
{
    use HasFactory;

    protected $fillable = [
        'campaign_id',
        'phone_number',
        'name',
        'recipient_type',
        'recipient_id',
        'status',
        'sent_at',
        'delivered_at',
        'clicked_at',
        'error_code',
        'error_message',
        'message_id',
        'cost',
        'merge_fields',
    ];

    protected function casts(): array
    {
        return [
            'merge_fields' => 'array',
            'sent_at' => 'datetime',
            'delivered_at' => 'datetime',
            'clicked_at' => 'datetime',
            'cost' => 'decimal:4',
        ];
    }

    const STATUS_PENDING = 'pending';

    const STATUS_SENT = 'sent';

    const STATUS_DELIVERED = 'delivered';

    const STATUS_FAILED = 'failed';

    const STATUS_CLICKED = 'clicked';

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(SmsCampaign::class, 'campaign_id');
    }

    public function recipient(): MorphTo
    {
        return $this->morphTo();
    }

    public function markAsSent(?string $messageId = null, ?float $cost = null): void
    {
        $this->update([
            'status' => self::STATUS_SENT,
            'sent_at' => now(),
            'message_id' => $messageId,
            'cost' => $cost,
        ]);
    }

    public function markAsDelivered(): void
    {
        $this->update([
            'status' => self::STATUS_DELIVERED,
            'delivered_at' => now(),
        ]);
    }

    public function markAsFailed(string $code, ?string $message = null): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'error_code' => $code,
            'error_message' => $message,
        ]);
    }

    public function recordClick(): void
    {
        if (! $this->clicked_at) {
            $this->update([
                'status' => self::STATUS_CLICKED,
                'clicked_at' => now(),
            ]);
        }
    }
}
