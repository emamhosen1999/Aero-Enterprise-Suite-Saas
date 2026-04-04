<?php

declare(strict_types=1);

namespace Aero\Cms\Database\Seeders;

use Illuminate\Database\Seeder;

class CmsPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define CMS module permissions following HRMAC pattern
        $permissions = [
            // Page Management
            ['name' => 'cms.page.view', 'module' => 'cms', 'component' => 'page', 'action' => 'view'],
            ['name' => 'cms.page.create', 'module' => 'cms', 'component' => 'page', 'action' => 'create'],
            ['name' => 'cms.page.edit', 'module' => 'cms', 'component' => 'page', 'action' => 'update'],
            ['name' => 'cms.page.delete', 'module' => 'cms', 'component' => 'page', 'action' => 'delete'],
            ['name' => 'cms.page.publish', 'module' => 'cms', 'component' => 'page', 'action' => 'publish'],
            ['name' => 'cms.page.duplicate', 'module' => 'cms', 'component' => 'page', 'action' => 'duplicate'],

            // Block Management
            ['name' => 'cms.block.view', 'module' => 'cms', 'component' => 'block', 'action' => 'view'],
            ['name' => 'cms.block.create', 'module' => 'cms', 'component' => 'block', 'action' => 'create'],
            ['name' => 'cms.block.edit', 'module' => 'cms', 'component' => 'block', 'action' => 'update'],
            ['name' => 'cms.block.delete', 'module' => 'cms', 'component' => 'block', 'action' => 'delete'],

            // Template Management
            ['name' => 'cms.template.view', 'module' => 'cms', 'component' => 'template', 'action' => 'view'],
            ['name' => 'cms.template.create', 'module' => 'cms', 'component' => 'template', 'action' => 'create'],
            ['name' => 'cms.template.edit', 'module' => 'cms', 'component' => 'template', 'action' => 'update'],
            ['name' => 'cms.template.delete', 'module' => 'cms', 'component' => 'template', 'action' => 'delete'],

            // Menu Management
            ['name' => 'cms.menu.view', 'module' => 'cms', 'component' => 'menu', 'action' => 'view'],
            ['name' => 'cms.menu.create', 'module' => 'cms', 'component' => 'menu', 'action' => 'create'],
            ['name' => 'cms.menu.edit', 'module' => 'cms', 'component' => 'menu', 'action' => 'update'],
            ['name' => 'cms.menu.delete', 'module' => 'cms', 'component' => 'menu', 'action' => 'delete'],

            // Category Management
            ['name' => 'cms.category.view', 'module' => 'cms', 'component' => 'category', 'action' => 'view'],
            ['name' => 'cms.category.create', 'module' => 'cms', 'component' => 'category', 'action' => 'create'],
            ['name' => 'cms.category.edit', 'module' => 'cms', 'component' => 'category', 'action' => 'update'],
            ['name' => 'cms.category.delete', 'module' => 'cms', 'component' => 'category', 'action' => 'delete'],

            // Analytics & Settings
            ['name' => 'cms.analytics.view', 'module' => 'cms', 'component' => 'analytics', 'action' => 'view'],
            ['name' => 'cms.settings.manage', 'module' => 'cms', 'component' => 'settings', 'action' => 'manage'],
        ];

        // Check if permissions table exists (varies by HRMAC setup)
        if (\Schema::hasTable('permissions')) {
            foreach ($permissions as $perm) {
                \DB::table('permissions')->updateOrInsert(
                    ['name' => $perm['name']],
                    $perm
                );
            }
        }

        // You can also sync with Role::Landlord or specific CMS admin role
        // Example: Assign all permissions to 'CMS Manager' role
        if (\Schema::hasTable('roles') && \Schema::hasTable('role_permissions')) {
            $cmsManagerRole = \DB::table('roles')->where('name', 'CMS Manager')->first();

            if (!$cmsManagerRole) {
                $roleId = \DB::table('roles')->insertGetId([
                    'name' => 'CMS Manager',
                    'description' => 'Full CMS management access for platform administrators',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $cmsManagerRole = (object)['id' => $roleId];
            }

            // Assign all permissions to CMS Manager role
            $permissionIds = \DB::table('permissions')
                ->whereIn('name', array_column($permissions, 'name'))
                ->pluck('id', 'name')
                ->toArray();

            foreach ($permissionIds as $name => $permId) {
                \DB::table('role_permissions')->updateOrInsert(
                    ['role_id' => $cmsManagerRole->id, 'permission_id' => $permId],
                    ['created_at' => now()]
                );
            }
        }
    }
}
