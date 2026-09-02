<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['percentage', 'flat']);
            $table->decimal('minimum_spend', total: 19, places: 7)->nullable();
            $table->decimal('maximum_spend', total: 19, places: 7)->nullable();
            $table->decimal('discount_amount', total: 19, places: 7);
            $table->integer('use_limit_per_coupon')->nullable();
            $table->integer('use_limit_per_user')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('code')->unique();
            $table->enum('code_type', ['manual', 'auto'])->default('manual');
            $table->boolean('status')->default(true);
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};
