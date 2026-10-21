<?php

namespace App\Enums;

/**
 * Supported subscription billing cycles.
 *
 * This enum intentionally represents the billing options currently
 * exposed to customers. Quarterly plan duration exists in the database
 * for future product requirements but is not currently a customer-facing
 * billing cycle.
 */
enum BillingCycle: string
{
    case Monthly = 'monthly';
    case Yearly = 'yearly';
}
