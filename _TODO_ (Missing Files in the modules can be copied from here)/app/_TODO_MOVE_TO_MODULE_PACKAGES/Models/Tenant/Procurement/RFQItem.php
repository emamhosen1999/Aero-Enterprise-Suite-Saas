<?php

namespace App\Models\Tenant\Procurement;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RFQItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'rfq_items';

    protected $fillable = [
        'rfq_id',
        'name',
        'description',
        'quantity',
        'unit',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
    ];

    public function rfq()
    {
        return $this->belongsTo(RFQ::class);
    }

    public function quoteItems()
    {
        return $this->hasMany(RFQQuoteItem::class);
    }
}
