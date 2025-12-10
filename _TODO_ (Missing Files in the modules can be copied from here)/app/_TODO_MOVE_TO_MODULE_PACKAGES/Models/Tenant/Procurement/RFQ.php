<?php

namespace App\Models\Tenant\Procurement;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RFQ extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'rfqs';

    protected $fillable = [
        'title',
        'description',
        'deadline',
        'status',
        'specifications',
        'terms_conditions',
        'created_by',
        'published_at',
        'closed_at',
        'awarded_at',
        'cancelled_at',
    ];

    protected $casts = [
        'deadline' => 'datetime',
        'published_at' => 'datetime',
        'closed_at' => 'datetime',
        'awarded_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function suppliers()
    {
        return $this->belongsToMany(Supplier::class, 'rfq_suppliers');
    }

    public function items()
    {
        return $this->hasMany(RFQItem::class);
    }

    public function quotes()
    {
        return $this->hasMany(RFQQuote::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class);
    }
}
