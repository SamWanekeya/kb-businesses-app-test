<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'price',
        'yearly_price',
        'duration',
        'description',
        'maximum_users',
        'maximum_projects',
        'maximum_contacts',
        'maximum_accounts',
        'enable_branding',
        'enable_kakbima_intelligence',
        'storage_limit',
        'is_trial',
        'trial_days',
        'is_plan_enabled',
        'is_default',
        'module',
    ];

    protected $casts = [
        'themes' => 'array',
        'module' => 'array',
        'is_default' => 'boolean',
        'price' => 'float',
        'yearly_price' => 'float',
    ];

    /**
     * Get the default plan
     *
     * @return Plan|null
     */
    public static function getDefaultPlan()
    {
        return self::where('is_default', true)->first();
    }

    /**
     * Check if the plan is the default plan
     *
     * @return bool
     */
    public function isDefault()
    {
        return (bool)$this->is_default;
    }

    /**
     * Get the price based on billing cycle
     *
     * @param string $cycle 'monthly' or 'yearly'
     *
     * @return float
     */
    public function getPriceForCycle($cycle = 'monthly')
    {
        if ($cycle === 'yearly' && $this->yearly_price) {
            return $this->yearly_price;
        }

        return $this->price;
    }

    /**
     * Get users subscribed to this plan
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get plan orders for this plan
     */
    public function planOrders()
    {
        return $this->hasMany(PlanOrder::class);
    }
}
