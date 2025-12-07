<?php

namespace App\Models\Tenant\Procurement;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseReceipt extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'receipt_number',
        'purchase_order_id',
        'user_id',
        'receipt_date',
        'carrier',
        'tracking_number',
        'status',
        'notes',
    ];

    protected $casts = [
        'receipt_date' => 'datetime',
    ];

    /**
     * Get the purchase order that owns this receipt.
     */
    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * Get the user who received this.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the receipt items.
     */
    public function receiptItems()
    {
        return $this->hasMany(PurchaseReceiptItem::class);
    }

    /**
     * Scope to get receipts by status.
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}
