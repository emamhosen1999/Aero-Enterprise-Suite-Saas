<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->integer('client_id')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->decimal('rate', 10, 2)->nullable(); // Adjust precision as needed
            $table->string('rate_type')->nullable();
            $table->string('priority')->nullable();
            $table->foreignId('project_leader_id')->constrained('users')->nullable(); // Adjust column name if needed
            $table->foreignId('team_leader_id')->constrained('users')->nullable(); // Adjust column name if needed
            $table->text('description')->nullable();
            $table->json('files')->nullable();
            $table->integer('open_tasks')->default(0);
            $table->integer('completed_tasks')->default(0);
            $table->integer('progress')->default(0);
            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('projects');
    }
};
