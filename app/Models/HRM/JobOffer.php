<?php

namespace App\Models\HRM;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobOffer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'application_id',
        'salary_offered',
        'salary_currency',
        'benefits',
        'start_date',
        'offer_date',
        'response_deadline',
        'status',
        'response_date',
        'negotiation_notes',
        'created_by',
        'approved_by',
    ];

    protected $casts = [
        'salary_offered' => 'decimal:2',
        'start_date' => 'date',
        'offer_date' => 'date',
        'response_deadline' => 'date',
        'response_date' => 'date',
    ];

    /**
     * Get the job application this offer belongs to.
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class, 'application_id');
    }

    /**
     * Get the user who created this offer.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who approved this offer.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Check if the offer is expired.
     */
    public function isExpired(): bool
    {
        return $this->response_deadline && now()->gt($this->response_deadline);
    }

    /**
     * Check if the offer is pending response.
     */
    public function isPending(): bool
    {
        return $this->status === 'sent' && ! $this->isExpired();
    }

    /**
     * Get formatted salary string.
     */
    public function getFormattedSalaryAttribute(): string
    {
        return $this->salary_currency.' '.number_format($this->salary_offered, 2);
    }

    /**
     * Get days until response deadline.
     */
    public function getDaysUntilDeadlineAttribute(): ?int
    {
        if (! $this->response_deadline) {
            return null;
        }

        return max(0, now()->diffInDays($this->response_deadline, false));
    }
}
