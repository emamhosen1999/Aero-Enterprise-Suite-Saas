<?php

namespace Aero\HRM\Models;

use Aero\Core\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

/**
 * Employee Personal Document Model
 *
 * Stores personal documents for employees (passports, contracts, IDs, etc.)
 * Has a 1:Many relationship with User model.
 */
class EmployeePersonalDocument extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'employee_personal_documents';

    protected $fillable = [
        'user_id',
        'name',
        'document_type',
        'document_number',
        'file_path',
        'file_name',
        'mime_type',
        'file_size_kb',
        'issue_date',
        'expiry_date',
        'issued_by',
        'issued_country',
        'status',
        'rejection_reason',
        'verified_by',
        'verified_at',
        'notes',
        'is_confidential',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'expiry_date' => 'date',
        'verified_at' => 'datetime',
        'is_confidential' => 'boolean',
        'file_size_kb' => 'integer',
    ];

    // =========================================================================
    // RELATIONSHIPS
    // =========================================================================

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verifier(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeVerified($query)
    {
        return $query->where('status', 'verified');
    }

    public function scopeExpired($query)
    {
        return $query->where('expiry_date', '<', now())->orWhere('status', 'expired');
    }

    public function scopeExpiringSoon($query, int $days = 30)
    {
        return $query->whereBetween('expiry_date', [now(), now()->addDays($days)]);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('document_type', $type);
    }

    // =========================================================================
    // ACCESSORS
    // =========================================================================

    public function getIsExpiredAttribute(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? Storage::url($this->file_path) : null;
    }

    // =========================================================================
    // METHODS
    // =========================================================================

    public function markAsVerified(int $verifiedBy): bool
    {
        return $this->update([
            'status' => 'verified',
            'verified_at' => now(),
            'verified_by' => $verifiedBy,
        ]);
    }

    public function reject(string $reason): bool
    {
        return $this->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);
    }
}
