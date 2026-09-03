<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('receipt_orders', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('purchase_order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('account_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('return_order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained()->nullOnDelete();
            $table->date('receipt_date');
            $table->date('expected_date')->nullable();
            $table->enum('status', ['pending', 'received', 'partial', 'completed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->decimal('subtotal', total: 19, places: 7)->default(0);
            $table->decimal('tax_amount', total: 19, places: 7)->default(0);
            $table->decimal('shipping_amount', total: 19, places: 7)->default(0);
            $table->decimal('discount_amount', total: 19, places: 7)->default(0);
            $table->decimal('total_amount', total: 19, places: 7)->default(0);
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipt_orders');
    }
};
