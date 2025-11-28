<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dashboard extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'description',
        'dashboard_type',
        'user_id',
        'is_public',
        'refresh_interval',
        'layout',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'layout' => 'array',
        'is_public' => 'boolean',
        'refresh_interval' => 'integer',
    ];

    /**
     * Get the user that owns the dashboard.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the widgets for the dashboard.
     */
    public function widgets(): HasMany
    {
        return $this->hasMany(DashboardWidget::class);
    }
}
