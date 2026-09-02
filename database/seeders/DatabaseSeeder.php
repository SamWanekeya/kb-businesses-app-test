<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (config('app.demo')) {
            $this->call([
                PermissionSeeder::class,
                RoleSeeder::class,
                PlanSeeder::class,
                UserSeeder::class,
                OrganizationSeeder::class,
                StaffRoleSeeder::class,
                CouponSeeder::class,
                PlanOrderSeeder::class,
                PlanRequestSeeder::class,
                ReferralSettingSeeder::class,
                CurrencySeeder::class,
                LandingPageCustomPageSeeder::class,
                LeadStatusSeeder::class,
                LeadSourceSeeder::class,
                TaskStatusSeeder::class,
                OpportunityStageSeeder::class,
                // ReferralProgramSeeder::class,
                TaxSeeder::class,
                BrandSeeder::class,
                CategorySeeder::class,
                ProductSeeder::class,
                AccountTypeSeeder::class,
                AccountIndustrySeeder::class,
                AccountSeeder::class,
                ContactSeeder::class,
                OpportunitySourceSeeder::class,
                OpportunitySeeder::class,
                LeadSeeder::class,
                LeadActivitySeeder::class,
                CampaignTypeSeeder::class,
                TargetListSeeder::class,
                CampaignSeeder::class,
                ShippingProviderTypeSeeder::class,
                QuoteSeeder::class,
                SalesOrderSeeder::class,
                PurchaseOrderSeeder::class,
                InvoiceSeeder::class,
                InvoiceReminderSeeder::class,
                DeliveryOrderSeeder::class,
                ReturnOrderSeeder::class,
                ReceiptOrderSeeder::class,
                ProjectSeeder::class,
                ProjectTaskSeeder::class,
                MeetingSeeder::class,
                CallSeeder::class,
                CaseSeeder::class,
                DocumentFolderSeeder::class,
                DocumentTypeSeeder::class,
                DocumentSeeder::class,
                SarahJohnsonDataSeeder::class,
                WebhookSeeder::class,
                EmailTemplateSeeder::class,
                NotificationTemplateSeeder::class,
                NoteSeeder::class,
                AnnouncementSeeder::class,
                ContactMessageSeeder::class,
                NewsletterSeeder::class,
                SignInHistorySeeder::class,
            ]);
        } else {
            $this->call([
                PermissionSeeder::class,
                RoleSeeder::class,
                PlanSeeder::class,
                UserSeeder::class,
                StaffRoleSeeder::class,
                EmailTemplateSeeder::class,
                NotificationTemplateSeeder::class,
                LandingPageCustomPageSeeder::class,
                CurrencySeeder::class,
            ]);
        }
    }
}
