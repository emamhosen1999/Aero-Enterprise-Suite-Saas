<?php

namespace Aero\Crm\Models\Marketing;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SmsProvider extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'provider',
        'credentials',
        'settings',
        'is_default',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'credentials' => 'encrypted:array',
            'settings' => 'array',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    const PROVIDER_TWILIO = 'twilio';

    const PROVIDER_NEXMO = 'nexmo';

    const PROVIDER_MESSAGEBIRD = 'messagebird';

    const PROVIDER_SSLWIRELESS = 'sslwireless';

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public static function getDefault(): ?self
    {
        return static::active()->default()->first()
            ?? static::active()->first();
    }

    public function setAsDefault(): void
    {
        static::query()->update(['is_default' => false]);
        $this->update(['is_default' => true]);
    }
}
