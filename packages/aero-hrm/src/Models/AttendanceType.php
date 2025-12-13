<?php

namespace Aero\HRM\Models;

use Aero\Core\Models\User;
use Database\Factories\AttendanceTypeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'config',
        'is_active',
        'priority',
        'required_permissions',
    ];

    protected $casts = [
        'config' => 'array',
        'required_permissions' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): AttendanceTypeFactory
    {
        return AttendanceTypeFactory::new();
    }

    // Relationship with users
    public function users()
    {
        return $this->hasMany(User::class, 'attendance_type_id');
    }

    // Scope for active attendance types
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
