<?php

namespace App\Models\Tenant\Quality;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class QualityCalibration extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'equipment_id',
        'equipment_name',
        'equipment_serial_number',
        'location',
        'calibration_date',
        'next_calibration_date',
        'performed_by',
        'calibration_certificate_number',
        'calibration_method',
        'calibration_notes',
        'status',
        'file_path',
    ];

    protected $casts = [
        'calibration_date' => 'date',
        'next_calibration_date' => 'date',
    ];

    /**
     * Get the user who performed the calibration.
     */
    public function performer()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    /**
     * Check if calibration is due.
     */
    public function isCalibrationDue()
    {
        return $this->next_calibration_date && now()->greaterThanOrEqualTo($this->next_calibration_date);
    }

    /**
     * Check if calibration is overdue.
     */
    public function isCalibrationOverdue()
    {
        return $this->next_calibration_date &&
            now()->greaterThan($this->next_calibration_date) &&
            $this->status !== 'calibrated';
    }
}
