<?php

namespace App\Models;

use Aero\Core\Models\User as BaseUser;
use Laravel\Fortify\TwoFactorAuthenticatable;
use NotificationChannels\WebPush\HasPushSubscriptions;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

/**
 * User Model - Extended from Aero Core
 *
 * This model extends the core User model and adds optional traits
 * based on packages installed in the main application.
 *
 * Core functionality (auth, roles, permissions) is in Aero\Core\Models\User.
 * This extension adds:
 * - TwoFactorAuthenticatable (laravel/fortify)
 * - InteractsWithMedia (spatie/laravel-medialibrary)
 * - HasPushSubscriptions (laravel-notification-channels/webpush)
 */
class User extends BaseUser implements HasMedia
{
    use HasPushSubscriptions;
    use InteractsWithMedia;
    use TwoFactorAuthenticatable;

    /**
     * Register media collections.
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('avatar')
            ->singleFile()
            ->useFallbackUrl('/images/default-avatar.png');

        $this->addMediaCollection('documents');
    }

    /**
     * Register media conversions.
     */
    public function registerMediaConversions($media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(100)
            ->height(100)
            ->performOnCollections('avatar');

        $this->addMediaConversion('medium')
            ->width(300)
            ->height(300)
            ->performOnCollections('avatar');
    }
}
