<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up()
    {
        Schema::create('return_orders', function (Blueprint $table) {
            $table->id();
            $table->string('return_number')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('sales_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('shipping_provider_type_id')->nullable()->constrained()->nullOnDelete();
            $table->string('tracking_number')->nullable();
            $table->enum('status', ['pending', 'approved', 'shipped', 'received', 'processed', 'cancelled'])->default('pending');
            $table->enum('reason', ['defective', 'wrong_item', 'damaged', 'not_needed', 'other'])->default('other');
            $table->text('reason_description')->nullable();
            $table->date('return_date');
            $table->decimal('subtotal', total: 19, places: 7)->default(0);
            $table->decimal('tax_amount', total: 19, places: 7)->default(0);
            $table->decimal('total_amount', total: 19, places: 7)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('return_orders');
    }
};
