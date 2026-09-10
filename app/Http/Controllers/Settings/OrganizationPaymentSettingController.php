<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use ReflectionClass;

class OrganizationPaymentSettingController extends Controller
{
    public function index()
    {
        $paymentSettings = getPaymentSettings();

        return Inertia::render('settings/Index', [
            'paymentSettings' => $paymentSettings,
        ]);
    }

    public function store(Request $request)
    {
        // Use the same validation and logic as PaymentSettingController
        $paymentController = new PaymentSettingController();

        return $paymentController->store($request);
    }

    public function getOrganizationPaymentMethods()
    {
        $paymentSettings = getPaymentSettings();

        // Use the same filtering logic as PaymentSettingController
        $paymentController = new PaymentSettingController();
        $reflection = new ReflectionClass($paymentController);
        $method = $reflection->getMethod('filterSensitiveData');
        $method->setAccessible(true);
        $safeSettings = $method->invoke($paymentController, $paymentSettings);

        return response()->json($safeSettings);
    }
}
