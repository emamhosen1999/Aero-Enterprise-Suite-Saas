<?php

namespace Aero\HRM\Models;

use App\Models\Tenant\HRM\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SafetyIncident extends Model
{
    use HasFactory;

    protected $fillable = [
        'incident_date',
        'incident_time',
        'location',
        'incident_type', // injury, near-miss, property-damage, environmental, other
        'severity', // minor, moderate, serious, critical
        'reported_by',
        'description',
        'immediate_actions',
        'root_cause',
        'corrective_actions',
        'status', // reported, investigating, resolved, closed
        'witnesses',
        'reported_to_authorities',
        'authority_report_date',
        'related_documents',
    ];

    protected $casts = [
        'incident_date' => 'date',
        'incident_time' => 'datetime',
        'authority_report_date' => 'date',
        'reported_to_authorities' => 'boolean',
        'witnesses' => 'array',
        'related_documents' => 'array',
    ];

    /**
     * Get the user who reported the incident.
     */
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    /**
     * Get the incident participants.
     */
    public function participants(): HasMany
    {
        return $this->hasMany(SafetyIncidentParticipant::class, 'incident_id');
    }
}
