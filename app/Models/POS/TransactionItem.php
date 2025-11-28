<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransactionItem extends Model
{
    use HasFactory;

    protected $table = 'pos_transaction_items';

    protected $fillable = [
        'transaction_id',
        'product_id',
        'quantity',
        'price',
        'total',
        'tax_amount',
        'discount_amount',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'price' => 'decimal:2',
        'total' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
    ];

    /**
     * Get the transaction that owns the item
     */
    public function transaction()
    {
        return $this->belongsTo(Transaction::class, 'transaction_id');
    }

    /**
     * Get the product that owns the item
     */
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
