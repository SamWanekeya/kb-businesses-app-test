<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->decimal('price', total: 19, places: 7)->default(0); // Monthly price
            $table->decimal('yearly_price', total: 19, places: 7)->nullable(); // Yearly price
            $table->enum('duration', ['monthly', 'quarterly', 'yearly'])->default('monthly');
            $table->integer('maximum_users')->default(0);
            $table->integer('maximum_projects')->default(0);
            $table->integer('maximum_contacts')->default(0);
            $table->integer('maximum_accounts')->default(0);
            $table->text('description')->nullable();
            $table->enum('enable_branding', ['on', 'off']);
            $table->enum('enable_kakbima_intelligence', ['on', 'off']);
            $table->decimal('storage_limit', total: 19, places: 7)->default(0);
            $table->enum('is_trial', ['on', 'off'])->nullable();
            $table->integer('trial_days')->default(0);
            $table->enum('is_plan_enabled', ['on', 'off'])->default('on');
            $table->boolean('is_default')->default(false);
            $table->text('module')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
