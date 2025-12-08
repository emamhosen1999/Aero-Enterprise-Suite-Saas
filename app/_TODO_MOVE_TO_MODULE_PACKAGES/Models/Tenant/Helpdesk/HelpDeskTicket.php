<?php

namespace App\Models\Tenant\Helpdesk;

use Aero\HRM\Models\Department;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class HelpDeskTicket extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'ticket_number',
        'subject',
        'description',
        'status', // open, in-progress, resolved, closed, on-hold
        'priority', // low, medium, high, critical
        'category_id',
        'requester_id',
        'assignee_id',
        'department_id',
        'due_date',
        'resolution',
        'resolution_date',
        'source', // email, web, phone, etc.
        'satisfaction_rating',
        'first_response_time',
        'resolution_time',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'resolution_date' => 'datetime',
        'first_response_time' => 'integer', // in minutes
        'resolution_time' => 'integer', // in minutes
        'satisfaction_rating' => 'integer',
    ];

    // Relationships
    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function category()
    {
        return $this->belongsTo(TicketCategory::class, 'category_id');
    }

    public function comments()
    {
        return $this->hasMany(TicketComment::class, 'ticket_id');
    }

    public function attachments()
    {
        return $this->hasMany(TicketAttachment::class, 'ticket_id');
    }

    public function activities()
    {
        return $this->hasMany(TicketActivity::class, 'ticket_id');
    }
}
