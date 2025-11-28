<?php

namespace Database\Seeders;

use App\Models\LogisticsCarrier;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class SCMAdvancedSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Create SCM Advanced Permissions
        $permissions = [
            // Procurement Management
            'scm.procurement.view' => 'View Procurement Requests',
            'scm.procurement.create' => 'Create Procurement Requests',
            'scm.procurement.update' => 'Update Procurement Requests',
            'scm.procurement.delete' => 'Delete Procurement Requests',
            'scm.procurement.approve' => 'Approve Procurement Requests',
            'scm.procurement.reject' => 'Reject Procurement Requests',

            // Demand Forecasting
            'scm.forecast.view' => 'View Demand Forecasts',
            'scm.forecast.create' => 'Create Demand Forecasts',
            'scm.forecast.update' => 'Update Demand Forecasts',
            'scm.forecast.delete' => 'Delete Demand Forecasts',

            // Production Planning
            'scm.production.view' => 'View Production Plans',
            'scm.production.create' => 'Create Production Plans',
            'scm.production.update' => 'Update Production Plans',
            'scm.production.delete' => 'Delete Production Plans',
            'scm.production.manage' => 'Manage Production Plans',

            // Return Management (RMA)
            'scm.returns.view' => 'View Return Requests',
            'scm.returns.create' => 'Create Return Requests',
            'scm.returns.update' => 'Update Return Requests',
            'scm.returns.delete' => 'Delete Return Requests',
            'scm.returns.approve' => 'Approve Return Requests',
            'scm.returns.reject' => 'Reject Return Requests',

            // Import/Export Management
            'scm.trade.view' => 'View Trade Documents & Declarations',
            'scm.trade.create' => 'Create Trade Documents & Declarations',
            'scm.trade.update' => 'Update Trade Documents & Declarations',
            'scm.trade.delete' => 'Delete Trade Documents & Declarations',
            'scm.trade.manage' => 'Manage Import/Export Operations',
        ];

        foreach ($permissions as $name => $description) {
            Permission::firstOrCreate([
                'name' => $name,
                'guard_name' => 'web',
            ], [
                'description' => $description,
            ]);
        }

        // Assign permissions to roles
        $superAdminRole = Role::where('name', 'Super Admin')->first();
        $adminRole = Role::where('name', 'Admin')->first();
        $managerRole = Role::where('name', 'Manager')->first();
        $userRole = Role::where('name', 'User')->first();

        if ($superAdminRole) {
            $superAdminRole->givePermissionTo(array_keys($permissions));
        }

        if ($adminRole) {
            $adminRole->givePermissionTo(array_keys($permissions));
        }

        if ($managerRole) {
            $managerPermissions = [
                'scm.procurement.view',
                'scm.procurement.create',
                'scm.procurement.update',
                'scm.procurement.approve',
                'scm.forecast.view',
                'scm.forecast.create',
                'scm.forecast.update',
                'scm.production.view',
                'scm.production.create',
                'scm.production.update',
                'scm.production.manage',
                'scm.returns.view',
                'scm.returns.create',
                'scm.returns.update',
                'scm.returns.approve',
                'scm.trade.view',
                'scm.trade.create',
                'scm.trade.update',
                'scm.trade.manage',
            ];
            $managerRole->givePermissionTo($managerPermissions);
        }

        if ($userRole) {
            $userPermissions = [
                'scm.procurement.view',
                'scm.procurement.create',
                'scm.forecast.view',
                'scm.production.view',
                'scm.returns.view',
                'scm.returns.create',
                'scm.trade.view',
            ];
            $userRole->givePermissionTo($userPermissions);
        }

        // Create default logistics carriers
        $carriers = [
            [
                'name' => 'FedEx',
                'contact_info' => '1-800-FEDEX (1-800-333-3339)',
                'website' => 'https://www.fedex.com',
                'tracking_url_format' => 'https://www.fedex.com/apps/fedextrack/?tracknumber={tracking_number}',
                'is_active' => true,
            ],
            [
                'name' => 'UPS',
                'contact_info' => '1-800-PICK-UPS (1-800-742-5877)',
                'website' => 'https://www.ups.com',
                'tracking_url_format' => 'https://www.ups.com/track?tracknum={tracking_number}',
                'is_active' => true,
            ],
            [
                'name' => 'DHL',
                'contact_info' => '1-800-CALL-DHL (1-800-225-5345)',
                'website' => 'https://www.dhl.com',
                'tracking_url_format' => 'https://www.dhl.com/track?trackingNumber={tracking_number}',
                'is_active' => true,
            ],
            [
                'name' => 'USPS',
                'contact_info' => '1-800-ASK-USPS (1-800-275-8777)',
                'website' => 'https://www.usps.com',
                'tracking_url_format' => 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}',
                'is_active' => true,
            ],
            [
                'name' => 'Local Carrier',
                'contact_info' => 'Contact via local office',
                'website' => null,
                'tracking_url_format' => null,
                'is_active' => true,
            ],
        ];

        foreach ($carriers as $carrier) {
            LogisticsCarrier::firstOrCreate(
                ['name' => $carrier['name']],
                $carrier
            );
        }

        $this->command->info('SCM Advanced module seeded successfully!');
    }
}
