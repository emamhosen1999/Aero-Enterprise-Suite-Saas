<?php

namespace Aero\Crm\Models\Marketing;

use Aero\Core\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmailTemplate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'category',
        'html_content',
        'plain_content',
        'variables',
        'thumbnail',
        'is_system',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'variables' => 'array',
            'is_system' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the creator
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get campaigns using this template
     */
    public function campaigns(): HasMany
    {
        return $this->hasMany(EmailCampaign::class, 'template_id');
    }

    /**
     * Scope for active templates
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for system templates
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * Scope for user templates
     */
    public function scopeUser($query)
    {
        return $query->where('is_system', false);
    }

    /**
     * Scope by category
     */
    public function scopeCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Render the template with variables
     */
    public function render(array $data = []): string
    {
        $content = $this->html_content;

        foreach ($data as $key => $value) {
            $content = str_replace("{{$key}}", $value, $content);
            $content = str_replace("{{{$key}}}", $value, $content);
            $content = str_replace("{{ $key }}", $value, $content);
            $content = str_replace("{{{ $key }}}", $value, $content);
        }

        return $content;
    }

    /**
     * Extract variables from template
     */
    public function extractVariables(): array
    {
        preg_match_all('/\{\{\s*(\w+)\s*\}\}/', $this->html_content, $matches);

        return array_unique($matches[1] ?? []);
    }
}
