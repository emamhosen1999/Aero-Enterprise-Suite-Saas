<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('education', function (Blueprint $table) {
            $table->id();
            $table->string('institution');
            $table->string('subject');
            $table->date('starting_date');
            $table->date('complete_date');
            $table->string('degree');
            $table->string('grade');
            $table->unsignedBigInteger('user_id'); // Add user_id column
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade'); // Foreign key constraint
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::table('education', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });

        Schema::dropIfExists('education');
    }
};
