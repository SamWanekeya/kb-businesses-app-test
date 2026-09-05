<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('quote_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', total: 19, places: 7);
            $table->decimal('total_price', total: 19, places: 7);
            $table->enum('discount_type', ['percentage', 'fixed', 'none'])->nullable();
            $table->decimal('discount_value', total: 19, places: 7)->nullable();
            $table->decimal('discount_amount', total: 19, places: 7)->default(0);
            $table->timestamps();

            $table->unique(['quote_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_products');
    }
};
