<?php

namespace App\Models\Tenant\Procurement;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseReceiptItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_receipt_id',
        'purchase_order_item_id',
        'received_quantity',
        'condition',
        'notes',
    ];

    protected $casts = [
        'received_quantity' => 'decimal:2',
    ];

    /**
     * Get the purchase receipt that owns this item.
     */
    public function purchaseReceipt()
    {
        return $this->belongsTo(PurchaseReceipt::class);
    }

    /**
     * Get the purchase order item.
     */
    public function purchaseOrderItem()
    {
        return $this->belongsTo(PurchaseOrderItem::class);
    }

    /**
     * Scope to get items by condition.
     */
    public function scopeByCondition($query, $condition)
    {
        return $query->where('condition', $condition);
    }

    /**
     * Check if item is in good condition.
     */
    public function isGoodCondition()
    {
        return $this->condition === 'good';
    }
}
