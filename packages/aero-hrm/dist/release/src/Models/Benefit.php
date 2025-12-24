<?php

namespace Aero\HRM\Models;

use App\Models\Tenant\HRM\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Benefit extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'type', // health, dental, vision, retirement, insurance, perks, etc.
        'provider',
        'cost',
        'eligibility_criteria',
        'start_date',
        'end_date',
        'status', // active, inactive
    ];

    protected $casts = [
        'cost' => 'float',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    /**
     * Get the employees with this benefit.
     */
    public function employees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'employee_benefits')
            ->withPivot('enrollment_date', 'end_date', 'coverage_level', 'cost_to_employee', 'status', 'notes')
            ->withTimestamps();
    }
}
