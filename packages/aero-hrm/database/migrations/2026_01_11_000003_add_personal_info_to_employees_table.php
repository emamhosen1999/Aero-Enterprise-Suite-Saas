<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPersonalInfoToEmployeesTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('employees')) {
            return;
        }

        Schema::table('employees', function (Blueprint $table) {
            if (! Schema::hasColumn('employees', 'birthday')) {
                $table->date('birthday')->nullable()->after('shift');
            }
            if (! Schema::hasColumn('employees', 'gender')) {
                $table->string('gender')->nullable()->after('birthday');
            }
            if (! Schema::hasColumn('employees', 'nationality')) {
                $table->string('nationality')->nullable()->after('gender');
            }
            if (! Schema::hasColumn('employees', 'religion')) {
                $table->string('religion')->nullable()->after('nationality');
            }
            if (! Schema::hasColumn('employees', 'marital_status')) {
                $table->string('marital_status')->nullable()->after('religion');
            }
            if (! Schema::hasColumn('employees', 'blood_group')) {
                $table->string('blood_group')->nullable()->after('marital_status');
            }
            if (! Schema::hasColumn('employees', 'passport_no')) {
                $table->string('passport_no')->nullable()->after('blood_group');
            }
            if (! Schema::hasColumn('employees', 'passport_expiry')) {
                $table->date('passport_expiry')->nullable()->after('passport_no');
            }
            if (! Schema::hasColumn('employees', 'visa_no')) {
                $table->string('visa_no')->nullable()->after('passport_expiry');
            }
            if (! Schema::hasColumn('employees', 'visa_expiry')) {
                $table->date('visa_expiry')->nullable()->after('visa_no');
            }
            if (! Schema::hasColumn('employees', 'emirates_id')) {
                $table->string('emirates_id')->nullable()->after('visa_expiry');
            }
            if (! Schema::hasColumn('employees', 'emirates_id_expiry')) {
                $table->date('emirates_id_expiry')->nullable()->after('emirates_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('employees')) {
            return;
        }

        Schema::table('employees', function (Blueprint $table) {
            $columns = [
                'birthday', 'gender', 'nationality', 'religion', 'marital_status', 'blood_group',
                'passport_no', 'passport_expiry', 'visa_no', 'visa_expiry', 'emirates_id', 'emirates_id_expiry'
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('employees', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
}
