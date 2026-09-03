<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class PaymentSetting extends Model
{
    protected $fillable = ['user_id', 'key', 'value'];

    protected $casts = [
        'user_id' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function setValueAttribute($value)
    {
        $this->attributes['value'] = is_bool($value) ? ($value ? '1' : '0') : $value;
    }

    public function getValueAttribute($value)
    {
        $booleanKeys = [
            'is_manual_payment_mode_enabled',
            'is_bank_payment_mode_enabled',
//            'is_stripe_payment_mode_enabled',
//            'is_paypal_payment_mode_enabled',
//            'is_razorpay_payment_mode_enabled',
//            'is_mercadopago_payment_mode_enabled',
            'is_paystack_payment_mode_enabled',
//            'is_flutterwave_payment_mode_enabled',
//            'is_paytabs_payment_mode_enabled',
//            'is_skrill_payment_mode_enabled',
//            'is_coingate_payment_mode_enabled',
//            'is_payfast_payment_mode_enabled',
//            'is_tap_payment_mode_enabled',
//            'is_xendit_payment_mode_enabled',
//            'is_paytr_payment_mode_enabled',
//            'is_mollie_payment_mode_enabled',
//            'is_toyyibpay_payment_mode_enabled',
//            'is_benefit_payment_mode_enabled',
//            'is_iyzipay_payment_mode_enabled',
//            'is_aamarpay_payment_mode_enabled',
//            'is_midtrans_payment_mode_enabled',
//            'is_yookassa_payment_mode_enabled',
//            'is_nepalste_payment_mode_enabled',
//            'is_paiement_payment_mode_enabled',
//            'is_cinetpay_payment_mode_enabled',
//            'is_payhere_payment_mode_enabled',
//            'is_fedapay_payment_mode_enabled',
//            'is_authorizenet_payment_mode_enabled',
//            'is_khalti_payment_mode_enabled',
//            'is_easebuzz_payment_mode_enabled',
//            'is_ozow_payment_mode_enabled',
//            'is_cashfree_payment_mode_enabled'
        ];

        if (isset($this->key) && in_array($this->key, $booleanKeys)) {
            return $value === '1' || $value === 1 || $value === true;
        }

        return $value;
    }

    public static function updateOrCreateSetting($userId, $key, $value)
    {
        return self::updateOrCreate(
            ['user_id' => $userId, 'key' => $key],
            ['value' => $value]
        );
    }

    public static function getUserSettings($userId)
    {
        if (!$userId) {
            return [];
        }

        return self::where('user_id', $userId)->pluck('value', 'key')->toArray();
    }
}
