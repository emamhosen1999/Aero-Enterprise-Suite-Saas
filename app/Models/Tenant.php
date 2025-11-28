<?php

namespace App\Models;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains, HasFactory;

    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'type',
            'subdomain',
            'email',
            'phone',
            'subscription_plan',
            'modules',
            'trial_ends_at',
            'subscription_ends_at',
        ];
    }

    protected $casts = [
        'modules' => 'array',
        'trial_ends_at' => 'date',
        'subscription_ends_at' => 'date',
    ];
}
