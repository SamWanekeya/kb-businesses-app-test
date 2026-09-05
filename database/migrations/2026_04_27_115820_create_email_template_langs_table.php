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
        Schema::create('email_template_langs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('email_templates')->cascadeOnDelete();
            $table->string('lang', 6);
            $table->string('subject');
            $table->longText('email_template_content');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_template_langs');
    }
};
