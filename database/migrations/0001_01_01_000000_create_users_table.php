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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password', 128)->nullable();
            $table->rememberToken();
            $table->string('lang', 6);
            $table->string('avatar')->nullable();
            $table->string('type', 128);
            $table->unsignedBigInteger('plan_id')->nullable();
            $table->date('plan_expiry_date')->nullable();
            $table->integer('requested_plan')->default(0);
            $table->enum('theme_mode', ['light', 'dark', 'system'])->default('system');
            $table->integer('is_plan_active')->default(1);
            $table->decimal('storage_limit', total: 19, places: 7)->default(0);
            $table->integer('is_sign_in_enabled')->default(1);
            $table->integer('google2fa_enabled')->default(0);
            $table->text('google2fa_secret')->nullable();
            $table->enum('status', ['active', 'inactive']);
            $table->enum('is_trial', ['on', 'off'])->nullable();
            $table->integer('trial_days')->default(0);
            $table->date('trial_expiry_date')->nullable();
            $table->integer('referral_code')->default(0);
            $table->integer('referral_code_used')->default(0);
            $table->decimal('commission_amount', total: 19, places: 7)->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        if (Schema::hasColumn('users', 'referral_code')) {
            $users = DB::table('users')->where('type', 'organization')->get();
            foreach ($users as $user) {
                do {
                    $code = rand(100000, 999999);
                } while (DB::table('users')->where('referral_code', $code)->exists());
                DB::table('users')->where('id', $user->id)->update(['referral_code' => $code]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
