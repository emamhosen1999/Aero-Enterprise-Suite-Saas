<?php

namespace AeroModules\Hrm\Models;

use App\Models\Tenant\CRM\Customer;
use App\Models\OpportunityActivity;
use AeroModules\Core\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Opportunity extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'customer_id',
        'title',
        'description',
        'value',
        'status',
        'stage',
        'probability',
        'expected_close_date',
        'assigned_to',
        'source',
    ];

    protected $casts = [
        'expected_close_date' => 'date',
        'value' => 'decimal:2',
        'probability' => 'integer',
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function activities()
    {
        return $this->hasMany(OpportunityActivity::class);
    }
}
