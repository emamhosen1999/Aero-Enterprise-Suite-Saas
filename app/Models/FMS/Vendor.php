<?php

namespace App\Models\FMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vendor extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'tax_id',
        'payment_terms',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the accounts payable entries for this vendor
     */
    public function accountsPayable()
    {
        return $this->hasMany(AccountsPayable::class);
    }

    /**
     * Scope for active vendors
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
