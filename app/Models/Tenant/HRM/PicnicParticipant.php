<?php

namespace App\Models\Tenant\HRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PicnicParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'random_number',
        'payment_amount',
    ];
}
