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
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('budget', total: 19, places: 7)->nullable();
            $table->decimal('actual_cost', total: 19, places: 7)->default(0);
            $table->integer('expected_response')->default(0);
            $table->integer('actual_response')->default(0);
            $table->foreignId('campaign_type_id')->constrained('campaign_types')->cascadeOnDelete();
            $table->foreignId('target_list_id')->nullable()->constrained('target_lists')->nullOnDelete();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
