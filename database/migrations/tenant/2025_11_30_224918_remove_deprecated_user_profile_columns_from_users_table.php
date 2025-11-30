<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Remove Deprecated User Profile Columns Migration
 *
 * This migration removes deprecated columns from the users table that have been
 * replaced by dedicated normalized tables:
 *
 * - emergency_contact_* → emergency_contacts table
 * - bank_*, ifsc_code, pan_no → employee_bank_details table
 * - family_member_* → employee_dependents table
 *
 * IMPORTANT: This migration includes a data migration step that transfers
 * existing data to the new tables before dropping the columns.
 */
return new class extends Migration
{
    /**
     * Deprecated columns to be removed.
     */
    private array $deprecatedColumns = [
        // Emergency contacts (now in emergency_contacts table)
        'emergency_contact_primary_name',
        'emergency_contact_primary_relationship',
        'emergency_contact_primary_phone',
        'emergency_contact_secondary_name',
        'emergency_contact_secondary_relationship',
        'emergency_contact_secondary_phone',

        // Bank details (now in employee_bank_details table)
        'bank_name',
        'bank_account_no',
        'ifsc_code',
        'pan_no',

        // Family member (now in employee_dependents table)
        'family_member_name',
        'family_member_relationship',
        'family_member_dob',
        'family_member_phone',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Migrate existing data to new tables
        $this->migrateExistingData();

        // Step 2: Drop deprecated columns
        Schema::table('users', function (Blueprint $table) {
            foreach ($this->deprecatedColumns as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Log::info('Deprecated user profile columns removed successfully', [
            'columns' => $this->deprecatedColumns,
        ]);
    }

    /**
     * Migrate existing data from deprecated columns to new tables.
     */
    private function migrateExistingData(): void
    {
        // Get users with data in deprecated columns
        $users = DB::table('users')
            ->whereNotNull('emergency_contact_primary_name')
            ->orWhereNotNull('bank_name')
            ->orWhereNotNull('family_member_name')
            ->get();

        foreach ($users as $user) {
            // Migrate primary emergency contact
            if (! empty($user->emergency_contact_primary_name)) {
                $this->migrateEmergencyContact($user, 'primary');
            }

            // Migrate secondary emergency contact
            if (! empty($user->emergency_contact_secondary_name)) {
                $this->migrateEmergencyContact($user, 'secondary');
            }

            // Migrate bank details
            if (! empty($user->bank_name) || ! empty($user->bank_account_no)) {
                $this->migrateBankDetails($user);
            }

            // Migrate family member as dependent
            if (! empty($user->family_member_name)) {
                $this->migrateFamilyMember($user);
            }
        }
    }

    /**
     * Migrate emergency contact data.
     */
    private function migrateEmergencyContact(object $user, string $type): void
    {
        $prefix = "emergency_contact_{$type}_";
        $name = $user->{$prefix.'name'} ?? null;
        $relationship = $user->{$prefix.'relationship'} ?? null;
        $phone = $user->{$prefix.'phone'} ?? null;

        if (empty($name)) {
            return;
        }

        // Check if already migrated
        $exists = DB::table('emergency_contacts')
            ->where('user_id', $user->id)
            ->where('name', $name)
            ->where('phone', $phone)
            ->exists();

        if (! $exists) {
            DB::table('emergency_contacts')->insert([
                'user_id' => $user->id,
                'name' => $name,
                'relationship' => $relationship ?? 'Other',
                'phone' => $phone ?? '',
                'priority' => $type === 'primary' ? 1 : 2,
                'is_primary' => $type === 'primary',
                'notify_on_emergency' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Migrate bank details data.
     */
    private function migrateBankDetails(object $user): void
    {
        // Check if already migrated
        $exists = DB::table('employee_bank_details')
            ->where('user_id', $user->id)
            ->exists();

        if (! $exists && (! empty($user->bank_name) || ! empty($user->bank_account_no))) {
            DB::table('employee_bank_details')->insert([
                'user_id' => $user->id,
                'bank_name' => $user->bank_name ?? 'Unknown',
                'account_holder_name' => $user->name ?? 'Unknown',
                'account_number' => ! empty($user->bank_account_no)
                    ? encrypt($user->bank_account_no)
                    : encrypt('0000'),
                'swift_code' => $user->ifsc_code ?? null,
                'tax_id' => ! empty($user->pan_no) ? encrypt($user->pan_no) : null,
                'account_type' => 'salary',
                'currency' => 'BDT',
                'is_primary' => true,
                'is_verified' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Migrate family member as dependent.
     */
    private function migrateFamilyMember(object $user): void
    {
        // Check if already migrated
        $exists = DB::table('employee_dependents')
            ->where('user_id', $user->id)
            ->where('name', $user->family_member_name)
            ->exists();

        if (! $exists && ! empty($user->family_member_name)) {
            // Map relationship to enum value
            $relationship = $this->mapRelationship($user->family_member_relationship ?? 'other');

            DB::table('employee_dependents')->insert([
                'user_id' => $user->id,
                'name' => $user->family_member_name,
                'relationship' => $relationship,
                'date_of_birth' => $user->family_member_dob ?? null,
                'phone' => $user->family_member_phone ?? null,
                'is_beneficiary' => false,
                'is_insurance_covered' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Map old relationship values to new enum values.
     */
    private function mapRelationship(?string $relationship): string
    {
        if (empty($relationship)) {
            return 'other';
        }

        $mapping = [
            'wife' => 'spouse',
            'husband' => 'spouse',
            'spouse' => 'spouse',
            'son' => 'child',
            'daughter' => 'child',
            'child' => 'child',
            'father' => 'parent',
            'mother' => 'parent',
            'parent' => 'parent',
            'brother' => 'sibling',
            'sister' => 'sibling',
            'sibling' => 'sibling',
        ];

        $normalized = strtolower(trim($relationship));

        return $mapping[$normalized] ?? 'other';
    }

    /**
     * Reverse the migrations.
     *
     * Note: Data migration back is not supported - data remains in new tables.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Emergency contacts
            if (! Schema::hasColumn('users', 'emergency_contact_primary_name')) {
                $table->string('emergency_contact_primary_name')->nullable();
                $table->string('emergency_contact_primary_relationship')->nullable();
                $table->string('emergency_contact_primary_phone')->nullable();
                $table->string('emergency_contact_secondary_name')->nullable();
                $table->string('emergency_contact_secondary_relationship')->nullable();
                $table->string('emergency_contact_secondary_phone')->nullable();
            }

            // Bank details
            if (! Schema::hasColumn('users', 'bank_name')) {
                $table->string('bank_name')->nullable();
                $table->string('bank_account_no')->nullable();
                $table->string('ifsc_code')->nullable();
                $table->string('pan_no')->nullable();
            }

            // Family member
            if (! Schema::hasColumn('users', 'family_member_name')) {
                $table->string('family_member_name')->nullable();
                $table->string('family_member_relationship')->nullable();
                $table->date('family_member_dob')->nullable();
                $table->string('family_member_phone')->nullable();
            }
        });
    }
};
