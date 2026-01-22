<?php

namespace Aero\Crm\Models\Marketing;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SmsListSubscriber extends Model
{
    use HasFactory;

    protected $fillable = [
        'list_id',
        'phone_number',
        'name',
        'subscribable_type',
        'subscribable_id',
        'status',
        'opted_out_at',
        'custom_fields',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'custom_fields' => 'array',
            'opted_out_at' => 'datetime',
        ];
    }

    const STATUS_ACTIVE = 'active';
    const STATUS_OPTED_OUT = 'opted_out';
    const STATUS_INVALID = 'invalid';
    const STATUS_BLOCKED = 'blocked';

    public function list(): BelongsTo
    {
        return $this->belongsTo(SmsList::class, 'list_id');
    }

    public function subscribable(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function optOut(): void
    {
        $this->update([
            'status' => self::STATUS_OPTED_OUT,
            'opted_out_at' => now(),
        ]);
        $this->list->updateCounts();
    }

    public function markAsInvalid(): void
    {
        $this->update(['status' => self::STATUS_INVALID]);
        $this->list->updateCounts();
    }
}
