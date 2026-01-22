<?php

namespace Aero\Crm\Models\Marketing;

use Aero\Core\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SmsList extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'subscriber_count',
        'active_count',
        'opted_out_count',
        'created_by',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function subscribers(): HasMany
    {
        return $this->hasMany(SmsListSubscriber::class, 'list_id');
    }

    public function campaigns(): HasMany
    {
        return $this->hasMany(SmsCampaign::class, 'list_id');
    }

    public function updateCounts(): void
    {
        $counts = $this->subscribers()
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = "opted_out" THEN 1 ELSE 0 END) as opted_out
            ')
            ->first();

        $this->update([
            'subscriber_count' => $counts->total ?? 0,
            'active_count' => $counts->active ?? 0,
            'opted_out_count' => $counts->opted_out ?? 0,
        ]);
    }

    public function addSubscriber(string $phoneNumber, array $data = []): SmsListSubscriber
    {
        $subscriber = $this->subscribers()->updateOrCreate(
            ['phone_number' => $phoneNumber],
            array_merge($data, ['status' => 'active'])
        );

        $this->updateCounts();

        return $subscriber;
    }
}
