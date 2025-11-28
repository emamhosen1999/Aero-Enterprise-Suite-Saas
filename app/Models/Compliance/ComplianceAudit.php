<?php

namespace App\Models\Compliance;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ComplianceAudit extends Model
{
    use HasFactory;

    protected $fillable = [
        'audit_id',
        'title',
        'description',
        'type',
        'scope',
        'status',
        'scheduled_date',
        'start_date',
        'end_date',
        'auditor_id',
        'lead_auditor_id',
        'auditee_department',
        'audit_criteria',
        'methodology',
        'risk_level',
        'overall_rating',
        'summary',
        'recommendations',
        'follow_up_required',
        'follow_up_date',
        'certification_body',
        'metadata',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'start_date' => 'date',
        'end_date' => 'date',
        'follow_up_date' => 'date',
        'follow_up_required' => 'boolean',
        'metadata' => 'json',
        'audit_criteria' => 'json',
        'recommendations' => 'json',
    ];

    // Status constants
    const STATUS_PLANNED = 'planned';

    const STATUS_IN_PROGRESS = 'in_progress';

    const STATUS_COMPLETED = 'completed';

    const STATUS_CANCELLED = 'cancelled';

    const STATUS_FOLLOW_UP = 'follow_up';

    // Type constants
    const TYPE_INTERNAL = 'internal';

    const TYPE_EXTERNAL = 'external';

    const TYPE_REGULATORY = 'regulatory';

    const TYPE_CERTIFICATION = 'certification';

    const TYPE_SURVEILLANCE = 'surveillance';

    // Risk level constants
    const RISK_LOW = 'low';

    const RISK_MEDIUM = 'medium';

    const RISK_HIGH = 'high';

    const RISK_CRITICAL = 'critical';

    // Rating constants
    const RATING_EXCELLENT = 'excellent';

    const RATING_GOOD = 'good';

    const RATING_SATISFACTORY = 'satisfactory';

    const RATING_NEEDS_IMPROVEMENT = 'needs_improvement';

    const RATING_UNSATISFACTORY = 'unsatisfactory';

    /**
     * Get the primary auditor
     */
    public function auditor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'auditor_id');
    }

    /**
     * Get the lead auditor
     */
    public function leadAuditor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lead_auditor_id');
    }

    /**
     * Get the audit findings
     */
    public function findings(): HasMany
    {
        return $this->hasMany(AuditFinding::class);
    }

    /**
     * Get critical findings
     */
    public function criticalFindings(): HasMany
    {
        return $this->hasMany(AuditFinding::class)->where('severity', AuditFinding::SEVERITY_CRITICAL);
    }

    /**
     * Get major findings
     */
    public function majorFindings(): HasMany
    {
        return $this->hasMany(AuditFinding::class)->where('severity', AuditFinding::SEVERITY_MAJOR);
    }

    /**
     * Get minor findings
     */
    public function minorFindings(): HasMany
    {
        return $this->hasMany(AuditFinding::class)->where('severity', AuditFinding::SEVERITY_MINOR);
    }

    /**
     * Calculate audit duration in days
     */
    public function getDurationAttribute(): int
    {
        if ($this->start_date && $this->end_date) {
            return $this->start_date->diffInDays($this->end_date) + 1;
        }

        return 0;
    }

    /**
     * Check if audit is overdue
     */
    public function isOverdue(): bool
    {
        return $this->scheduled_date < now() && $this->status === self::STATUS_PLANNED;
    }

    /**
     * Check if follow-up is overdue
     */
    public function isFollowUpOverdue(): bool
    {
        return $this->follow_up_required &&
            $this->follow_up_date < now() &&
            $this->status !== self::STATUS_COMPLETED;
    }

    /**
     * Scope for active audits
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', [self::STATUS_PLANNED, self::STATUS_IN_PROGRESS]);
    }

    /**
     * Scope for completed audits
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope for overdue audits
     */
    public function scopeOverdue($query)
    {
        return $query->where('scheduled_date', '<', now())
            ->where('status', self::STATUS_PLANNED);
    }

    /**
     * Scope for high risk audits
     */
    public function scopeHighRisk($query)
    {
        return $query->whereIn('risk_level', [self::RISK_HIGH, self::RISK_CRITICAL]);
    }

    /**
     * Scope for external audits
     */
    public function scopeExternal($query)
    {
        return $query->where('type', self::TYPE_EXTERNAL);
    }

    /**
     * Scope for internal audits
     */
    public function scopeInternal($query)
    {
        return $query->where('type', self::TYPE_INTERNAL);
    }
}
