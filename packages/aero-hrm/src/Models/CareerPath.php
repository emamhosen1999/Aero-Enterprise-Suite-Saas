<?php

namespace Aero\HRM\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;

/**
 * Career Path Model
 *
 * Defines career progression paths and tracks employee career development.
 */
class CareerPath extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'department_id',
        'path_type',
        'levels',
        'typical_duration_months',
        'required_competencies',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'levels' => 'array',
            'required_competencies' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(CareerPathMilestone::class)->orderBy('sequence');
    }

    public function employeeProgressions(): HasMany
    {
        return $this->hasMany(EmployeeCareerProgression::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
