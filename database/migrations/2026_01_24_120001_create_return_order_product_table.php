<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up()
    {
        Schema::create('return_order_product', function (Blueprint $table) {
            $table->id();
            $table->foreignId('return_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_price', total: 19, places: 7);
            $table->decimal('total_price', total: 19, places: 7);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('return_order_product');
    }
};
