<?php

namespace App\Models\Tenant\FMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'transaction_date',
        'amount',
        'type', // income, expense, transfer
        'category_id',
        'account_id',
        'to_account_id', // for transfers
        'description',
        'reference_number',
        'user_id',
        'status',
        'payment_method',
        'customer_id', // linked to CRM
        'vendor_id', // linked to Vendor Management
        'project_id', // linked to Project Management
        'attachments', // JSON format for multiple attachments
    ];

    protected $casts = [
        'transaction_date' => 'datetime',
        'amount' => 'decimal:2',
        'attachments' => 'array',
    ];

    // Relationships
    public function category()
    {
        return $this->belongsTo(FinancialCategory::class, 'category_id');
    }

    public function account()
    {
        return $this->belongsTo(FinancialAccount::class, 'account_id');
    }

    public function toAccount()
    {
        return $this->belongsTo(FinancialAccount::class, 'to_account_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
