<?php

namespace App\Models\Tenant\LMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'category_id',
        'instructor_id',
        'duration', // in minutes
        'level',  // beginner, intermediate, advanced
        'status', // draft, published, archived
        'image',
        'featured',
        'requirements',
        'outcomes',
        'certificate_enabled',
        'passing_score',
        'max_attempts',
    ];

    protected $casts = [
        'requirements' => 'array',
        'outcomes' => 'array',
        'featured' => 'boolean',
        'certificate_enabled' => 'boolean',
        'passing_score' => 'integer',
        'max_attempts' => 'integer',
    ];

    // Relationships
    public function category()
    {
        return $this->belongsTo(CourseCategory::class);
    }

    public function instructor()
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function modules()
    {
        return $this->hasMany(CourseModule::class);
    }

    public function enrollments()
    {
        return $this->hasMany(CourseEnrollment::class);
    }

    public function assessments()
    {
        return $this->hasMany(CourseAssessment::class);
    }

    public function completions()
    {
        return $this->hasMany(CourseCompletion::class);
    }
}
