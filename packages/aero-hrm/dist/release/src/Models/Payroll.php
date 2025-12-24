<?php

namespace Aero\HRM\Models;

use Aero\Core\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    use HasFactory;

    protected $table = 'payrolls';

    protected $fillable = [
        'user_id',
        'pay_period_start',
        'pay_period_end',
        'basic_salary',
        'gross_salary',
        'total_deductions',
        'net_salary',
        'working_days',
        'present_days',
        'absent_days',
        'leave_days',
        'overtime_hours',
        'overtime_amount',
        'status',
        'processed_by',
        'processed_at',
        'remarks',
    ];

    protected $casts = [
        'pay_period_start' => 'date',
        'pay_period_end' => 'date',
        'basic_salary' => 'decimal:2',
        'gross_salary' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'net_salary' => 'decimal:2',
        'overtime_amount' => 'decimal:2',
        'processed_at' => 'datetime',
        'working_days' => 'integer',
        'present_days' => 'integer',
        'absent_days' => 'integer',
        'leave_days' => 'integer',
        'overtime_hours' => 'decimal:2',
    ];

    /**
     * Get the employee that owns the payroll.
     */
    public function employee()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the user who processed the payroll.
     */
    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /**
     * Get the allowances for the payroll.
     */
    public function allowances()
    {
        return $this->hasMany(PayrollAllowance::class);
    }

    /**
     * Get the deductions for the payroll.
     */
    public function deductions()
    {
        return $this->hasMany(PayrollDeduction::class);
    }

    /**
     * Get the payslip for this payroll.
     */
    public function payslip()
    {
        return $this->hasOne(Payslip::class);
    }

    /**
     * Calculate total allowances.
     */
    public function getTotalAllowancesAttribute()
    {
        return $this->allowances()->sum('amount');
    }

    /**
     * Calculate total deductions.
     */
    public function getTotalDeductionsAttribute()
    {
        return $this->deductions()->sum('amount');
    }

    /**
     * Get formatted pay period.
     */
    public function getPayPeriodAttribute()
    {
        return $this->pay_period_start->format('M Y');
    }

    /**
     * Check if payroll is processed.
     */
    public function isProcessed()
    {
        return $this->status === 'processed';
    }

    /**
     * Check if payroll is draft.
     */
    public function isDraft()
    {
        return $this->status === 'draft';
    }

    /**
     * Scope for filtering by status.
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for filtering by pay period.
     */
    public function scopeByPayPeriod($query, $start, $end)
    {
        return $query->whereBetween('pay_period_start', [$start, $end]);
    }
}
