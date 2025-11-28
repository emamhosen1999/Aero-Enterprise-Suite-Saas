<?php

namespace App\Models\HRM;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
    use HasFactory, SoftDeletes;

    // Specify the table name if it's different from the default
    protected $table = 'departments';

    // Define the fillable attributes - ISO compliant attributes
    protected $fillable = [
        'name',
        'code',
        'description',
        'parent_id',
        'manager_id',
        'location',
        'is_active',
        'established_date',
    ];

    protected $casts = [
        'id' => 'integer',
        'parent_id' => 'integer',
        'is_active' => 'boolean',
        'established_date' => 'date',
    ];

    /**
     * Get the parent department
     */
    public function parent()
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    /**
     * Get child departments
     */
    public function children()
    {
        return $this->hasMany(Department::class, 'parent_id');
    }

    /**
     * Get the department manager
     */
    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * Get employees belonging to this department
     */
    public function employees()
    {
        return $this->hasMany(User::class, 'department_id');
    }

    /**
     * Alias for employees relationship (for consistency with other models)
     */
    public function users()
    {
        return $this->hasMany(User::class, 'department_id');
    }

    /**
     * Scope for active departments
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Format department according to ISO standards
     */
    public function toArray()
    {
        $array = parent::toArray();
        $array['employee_count'] = $this->employees()->count();

        return $array;
    }
}
