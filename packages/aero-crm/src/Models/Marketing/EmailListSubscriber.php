<?php

namespace Aero\Crm\Models\Marketing;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Str;

class EmailListSubscriber extends Model
{
    use HasFactory;

    protected $fillable = [
        'list_id',
        'email',
        'name',
        'subscribable_type',
        'subscribable_id',
        'status',
        'confirmation_token',
        'confirmed_at',
        'unsubscribed_at',
        'custom_fields',
        'tags',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'custom_fields' => 'array',
            'tags' => 'array',
            'confirmed_at' => 'datetime',
            'unsubscribed_at' => 'datetime',
        ];
    }

    /**
     * Subscriber statuses
     */
    const STATUS_PENDING = 'pending';

    const STATUS_ACTIVE = 'active';

    const STATUS_UNSUBSCRIBED = 'unsubscribed';

    const STATUS_BOUNCED = 'bounced';

    const STATUS_COMPLAINED = 'complained';

    /**
     * Boot the model
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($subscriber) {
            if (empty($subscriber->confirmation_token)) {
                $subscriber->confirmation_token = Str::random(64);
            }
        });
    }

    /**
     * Get the list
     */
    public function list(): BelongsTo
    {
        return $this->belongsTo(EmailList::class, 'list_id');
    }

    /**
     * Get the subscribable entity
     */
    public function subscribable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope for active subscribers
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope for pending subscribers
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Confirm subscription
     */
    public function confirm(): void
    {
        $this->update([
            'status' => self::STATUS_ACTIVE,
            'confirmed_at' => now(),
            'confirmation_token' => null,
        ]);

        $this->list->updateCounts();
    }

    /**
     * Unsubscribe
     */
    public function unsubscribe(): void
    {
        $this->update([
            'status' => self::STATUS_UNSUBSCRIBED,
            'unsubscribed_at' => now(),
        ]);

        $this->list->updateCounts();
    }

    /**
     * Mark as bounced
     */
    public function markAsBounced(): void
    {
        $this->update([
            'status' => self::STATUS_BOUNCED,
        ]);

        $this->list->updateCounts();
    }

    /**
     * Mark as complained
     */
    public function markAsComplained(): void
    {
        $this->update([
            'status' => self::STATUS_COMPLAINED,
        ]);

        $this->list->updateCounts();
    }

    /**
     * Add a tag
     */
    public function addTag(string $tag): void
    {
        $tags = $this->tags ?? [];
        if (! in_array($tag, $tags)) {
            $tags[] = $tag;
            $this->update(['tags' => $tags]);
        }
    }

    /**
     * Remove a tag
     */
    public function removeTag(string $tag): void
    {
        $tags = $this->tags ?? [];
        $tags = array_filter($tags, fn ($t) => $t !== $tag);
        $this->update(['tags' => array_values($tags)]);
    }

    /**
     * Check if has tag
     */
    public function hasTag(string $tag): bool
    {
        return in_array($tag, $this->tags ?? []);
    }
}
