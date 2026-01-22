<?php

namespace Aero\HRM\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

/**
 * Grievance Communication Model
 *
 * Tracks communication threads for grievances.
 */
class GrievanceCommunication extends Model
{
    use HasFactory;

    protected $fillable = [
        'grievance_id',
        'user_id',
        'message',
        'message_type',
        'is_internal',
        'attachments',
    ];

    protected function casts(): array
    {
        return [
            'is_internal' => 'boolean',
            'attachments' => 'array',
        ];
    }

    public function grievance(): BelongsTo
    {
        return $this->belongsTo(Grievance::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
