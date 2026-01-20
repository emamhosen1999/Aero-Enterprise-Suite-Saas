<?php

namespace Aero\Crm\Models\Marketing;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class EmailCampaignLink extends Model
{
    use HasFactory;

    protected $fillable = [
        'campaign_id',
        'url',
        'short_code',
        'click_count',
        'unique_clicks',
    ];

    /**
     * Boot the model
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($link) {
            if (empty($link->short_code)) {
                $link->short_code = static::generateShortCode();
            }
        });
    }

    /**
     * Generate a unique short code
     */
    public static function generateShortCode(): string
    {
        do {
            $code = Str::random(8);
        } while (static::where('short_code', $code)->exists());

        return $code;
    }

    /**
     * Get the campaign
     */
    public function campaign(): BelongsTo
    {
        return $this->belongsTo(EmailCampaign::class, 'campaign_id');
    }

    /**
     * Get the clicks for this link
     */
    public function clicks(): HasMany
    {
        return $this->hasMany(EmailLinkClick::class, 'link_id');
    }

    /**
     * Record a click
     */
    public function recordClick(int $recipientId, array $data = []): EmailLinkClick
    {
        $this->increment('click_count');

        // Check if this is a unique click
        $existingClick = $this->clicks()
            ->where('recipient_id', $recipientId)
            ->exists();

        if (! $existingClick) {
            $this->increment('unique_clicks');
        }

        return $this->clicks()->create([
            'recipient_id' => $recipientId,
            'ip_address' => $data['ip_address'] ?? null,
            'user_agent' => $data['user_agent'] ?? null,
            'device_type' => $data['device_type'] ?? null,
            'browser' => $data['browser'] ?? null,
            'os' => $data['os'] ?? null,
            'country' => $data['country'] ?? null,
            'city' => $data['city'] ?? null,
            'clicked_at' => now(),
        ]);
    }

    /**
     * Get the tracking URL
     */
    public function getTrackingUrlAttribute(): string
    {
        return url("/track/click/{$this->short_code}");
    }
}
