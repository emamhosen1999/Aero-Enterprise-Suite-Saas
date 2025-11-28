<?php

namespace App\Models\CRM;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'company',
        'type',
        'status',
        'assigned_to',
        'created_by',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'website',
        'industry',
        'annual_revenue',
        'employee_count',
        'notes',
        'lead_id',
    ];

    protected $casts = [
        'annual_revenue' => 'decimal:2',
        'employee_count' => 'integer',
    ];

    /**
     * Customer types
     */
    const TYPE_INDIVIDUAL = 'individual';

    const TYPE_BUSINESS = 'business';

    const TYPE_ENTERPRISE = 'enterprise';

    /**
     * Customer statuses
     */
    const STATUS_ACTIVE = 'active';

    const STATUS_INACTIVE = 'inactive';

    const STATUS_PROSPECT = 'prospect';

    /**
     * Get the user assigned to the customer
     */
    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the user who created the customer
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the lead this customer was converted from
     */
    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    /**
     * Get the opportunities for this customer
     */
    public function opportunities()
    {
        return $this->hasMany(Opportunity::class);
    }

    /**
     * Scope for active customers
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope by customer type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Check if customer is active
     */
    public function isActive()
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Get full address
     */
    public function getFullAddressAttribute()
    {
        return trim("{$this->address}, {$this->city}, {$this->state} {$this->postal_code}, {$this->country}");
    }
}
