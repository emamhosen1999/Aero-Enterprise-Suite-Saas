<?php

declare(strict_types=1);

namespace Aero\Platform\Auth;

use Illuminate\Auth\EloquentUserProvider;

/**
 * Custom user provider for Twill CMS authentication.
 *
 * Twill's LoginController appends ['published' => 1] to credentials
 * (see A17\Twill\Http\Controllers\Admin\LoginController::credentials()).
 * Our landlord_users table uses `active` instead of `published`.
 *
 * This provider intercepts the credential array before hitting the DB
 * and remaps `published` → `active` so the query works correctly.
 */
class LandlordUserProvider extends EloquentUserProvider
{
    /**
     * Retrieve a user by the given credentials.
     * Translates Twill's 'published' field to our 'active' field.
     */
    public function retrieveByCredentials(#[\SensitiveParameter] array $credentials): ?\Illuminate\Contracts\Auth\Authenticatable
    {
        if (array_key_exists('published', $credentials)) {
            $credentials['active'] = $credentials['published'];
            unset($credentials['published']);
        }

        return parent::retrieveByCredentials($credentials);
    }
}
