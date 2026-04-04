<?php

declare(strict_types=1);

namespace Aero\Cms\Policies;

use Aero\Cms\Models\CmsPage;
use Illuminate\Foundation\Auth\User;

class CmsPagePolicy
{
    /**
     * Determine if the user can view pages.
     */
    public function view(User $user): bool
    {
        return $user->hasPermission('cms.pages.list.index') || 
               $user->hasPermission('cms.page.view');
    }

    /**
     * Determine if the user can create a page.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('cms.pages.list.create') || 
               $user->hasPermission('cms.page.create');
    }

    /**
     * Determine if the user can update the page.
     */
    public function update(User $user, CmsPage $page): bool
    {
        return $user->hasPermission('cms.pages.editor.edit') || 
               $user->hasPermission('cms.page.edit');
    }

    /**
     * Determine if the user can delete the page.
     */
    public function delete(User $user, CmsPage $page): bool
    {
        return $user->hasPermission('cms.pages.list.delete') || 
               $user->hasPermission('cms.page.delete');
    }

    /**
     * Determine if the user can publish the page.
     */
    public function publish(User $user, CmsPage $page): bool
    {
        return $user->hasPermission('cms.pages.editor.publish') || 
               $user->hasPermission('cms.page.publish');
    }

    /**
     * Determine if the user can duplicate the page.
     */
    public function duplicate(User $user): bool
    {
        return $user->hasPermission('cms.pages.list.duplicate') || 
               $user->hasPermission('cms.page.duplicate');
    }
}
