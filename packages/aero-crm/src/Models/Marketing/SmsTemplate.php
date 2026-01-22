<?php

namespace Aero\Crm\Models\Marketing;

use Aero\Core\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SmsTemplate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'category',
        'message',
        'variables',
        'character_count',
        'segment_count',
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

    protected static function boot(): void
    {
        parent::boot();

        static::saving(function ($template) {
            $template->character_count = mb_strlen($template->message);
            $template->segment_count = ceil($template->character_count / 160);
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function render(array $data = []): string
    {
        $content = $this->message;

        foreach ($data as $key => $value) {
            $content = str_replace("{{$key}}", $value, $content);
            $content = str_replace("{{{$key}}}", $value, $content);
        }

        return $content;
    }

    public function extractVariables(): array
    {
        preg_match_all('/\{\{\s*(\w+)\s*\}\}/', $this->message, $matches);
        return array_unique($matches[1] ?? []);
    }
}
