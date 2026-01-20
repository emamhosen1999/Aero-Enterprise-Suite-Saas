<?php

namespace Aero\Crm\Models\Marketing;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailLinkClick extends Model
{
    use HasFactory;

    protected $fillable = [
        'link_id',
        'recipient_id',
        'ip_address',
        'user_agent',
        'device_type',
        'browser',
        'os',
        'country',
        'city',
        'clicked_at',
    ];

    protected function casts(): array
    {
        return [
            'clicked_at' => 'datetime',
        ];
    }

    /**
     * Get the link
     */
    public function link(): BelongsTo
    {
        return $this->belongsTo(EmailCampaignLink::class, 'link_id');
    }

    /**
     * Get the recipient
     */
    public function recipient(): BelongsTo
    {
        return $this->belongsTo(EmailCampaignRecipient::class, 'recipient_id');
    }
}
