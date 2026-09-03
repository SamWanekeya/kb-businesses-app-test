<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('quotes', function (Blueprint $table) {
            $table->id();
            $table->string('quote_number')->unique();
            $table->string('name');
            $table->text('description')->nullable();

            // Relationships
            $table->foreignId('opportunity_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('account_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('billing_contact_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->foreignId('shipping_contact_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->foreignId('shipping_provider_type_id')->nullable()->constrained()->nullOnDelete();

            // Financial Information
            $table->decimal('subtotal', total: 19, places: 7)->default(0);
            $table->decimal('discount_amount', total: 19, places: 7)->default(0);
            $table->decimal('total_amount', total: 19, places: 7)->default(0);

            // Billing Address
            $table->text('billing_address')->nullable();
            $table->string('billing_city')->nullable();
            $table->string('billing_state')->nullable();
            $table->string('billing_postal_code', 20)->nullable();
            $table->string('billing_country')->nullable();

            // Shipping Address
            $table->text('shipping_address')->nullable();
            $table->string('shipping_city')->nullable();
            $table->string('shipping_state')->nullable();
            $table->string('shipping_postal_code', 20)->nullable();
            $table->string('shipping_country')->nullable();

            // Status and Dates
            $table->enum('status', ['draft', 'sent', 'accepted', 'rejected', 'expired'])->default('draft');
            $table->date('valid_until')->nullable();

            // Audit Fields
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Indexes
            $table->index(['created_by', 'status']);
            $table->index('quote_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotes');
    }
};
