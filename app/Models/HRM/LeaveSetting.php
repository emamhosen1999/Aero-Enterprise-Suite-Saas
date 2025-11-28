<?php

namespace App\Models\HRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'days',
        'eligibility',
        'carry_forward',
        'earned_leave',
        'requires_approval',
        'auto_approve',
        'special_conditions',
    ];

    protected $casts = [
        'id' => 'integer',
        'type' => 'string',
        'days' => 'integer',
        'eligibility' => 'string',
        'carry_forward' => 'boolean',
        'earned_leave' => 'boolean',
        'requires_approval' => 'boolean',
        'auto_approve' => 'boolean',
        'special_conditions' => 'string',

    ];

    public function leaves()
    {
        return $this->hasMany(Leave::class, 'leave_type');
    }
}
