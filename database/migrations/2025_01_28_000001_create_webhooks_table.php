<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('webhooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('module', [
                'New User',
                'Lead Assigned',
                'Case Created',
                'Meeting Invitation',
                'Opportunity Created',
                'Quote Created',
                'Task Assigned',
            ]);
            $table->enum('method', ['GET', 'POST']);
            $table->string('url');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhooks');
    }
};
