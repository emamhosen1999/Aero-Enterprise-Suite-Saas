<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'user_name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Override to disable direct permission loading
     * We use role-based access only, not individual permissions
     */
    public function getAllPermissions()
    {
        return collect([]);
    }

    /**
     * Check if user has a specific permission (always false since we don't use permissions)
     */
    public function hasPermissionTo($permission, $guardName = null): bool
    {
        return false;
    }

    /**
     * Check if user has any of the given permissions (always false)
     */
    public function hasAnyPermission(...$permissions): bool
    {
        return false;
    }

    /**
     * Check if user has all of the given permissions (always false)
     */
    public function hasAllPermissions(...$permissions): bool
    {
        return false;
    }
}
