<?php

namespace App\Models\Tenant\Procurement;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RFQQuote extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'rfq_quotes';

    protected $fillable = [
        'rfq_id',
        'supplier_id',
        'total_amount',
        'currency',
        'delivery_time',
        'delivery_terms',
        'payment_terms',
        'validity_period',
        'notes',
        'status',
        'submitted_at',
        'approved_at',
        'rejected_at',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function rfq()
    {
        return $this->belongsTo(RFQ::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(RFQQuoteItem::class);
    }

    public function attachments()
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }
}
