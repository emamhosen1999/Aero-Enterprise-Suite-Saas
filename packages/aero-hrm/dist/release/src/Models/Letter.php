<?php

namespace Aero\HRM\Models;

use App\Models\Tenant\HRM\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Letter extends Model
{
    use HasFactory;

    protected $fillable = [
        'from',
        'status',
        'received_date',
        'memo_number',
        'handling_memo',
        'subject',
        'action_taken',
        'handling_link',
        'handling_status',
        'need_reply',
        'replied_status',
        'need_forward',
        'forwarded_status',
        'dealt_by',          // Foreign key for User model
    ];

    protected $casts = [
        'need_reply' => 'boolean',
        'replied_status' => 'boolean',

    ];

    /**
     * Get the user who dealt with the letter.
     */
    public function dealtBy()
    {
        return $this->belongsTo(User::class, 'dealt_by');
    }
}
