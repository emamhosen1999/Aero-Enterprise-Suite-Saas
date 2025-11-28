<?php

namespace App\Models\IMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasFactory;

    protected $table = 'ims_stock_movements';

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'type',
        'quantity',
        'reference_type',
        'reference_id',
        'reference_number',
        'reason',
        'unit_cost',
        'total_cost',
        'user_id',
        'notes',
        'movement_date',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'warehouse_id' => 'integer',
        'quantity' => 'integer',
        'reference_id' => 'integer',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'user_id' => 'integer',
        'movement_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    const TYPE_INBOUND = 'inbound';

    const TYPE_OUTBOUND = 'outbound';

    const TYPE_ADJUSTMENT = 'adjustment';

    const TYPE_TRANSFER = 'transfer';

    /**
     * Get the product this movement belongs to
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the warehouse this movement belongs to
     */
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the user who made this movement
     */
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    /**
     * Get the related reference model (polymorphic)
     */
    public function reference()
    {
        return $this->morphTo();
    }

    /**
     * Scope for inbound movements
     */
    public function scopeInbound($query)
    {
        return $query->where('type', self::TYPE_INBOUND);
    }

    /**
     * Scope for outbound movements
     */
    public function scopeOutbound($query)
    {
        return $query->where('type', self::TYPE_OUTBOUND);
    }

    /**
     * Scope for adjustments
     */
    public function scopeAdjustments($query)
    {
        return $query->where('type', self::TYPE_ADJUSTMENT);
    }

    /**
     * Scope for transfers
     */
    public function scopeTransfers($query)
    {
        return $query->where('type', self::TYPE_TRANSFER);
    }

    /**
     * Scope for movements within date range
     */
    public function scopeInDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('movement_date', [$startDate, $endDate]);
    }
}
