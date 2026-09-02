<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\AnnouncementCategory;
use App\Models\User;
use Illuminate\Database\Seeder;

class AnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('type', 'organization')->get();

        $categoryTemplates = [
            ['name' => 'Organization News', 'description' => 'General organization announcements and news'],
            ['name' => 'Policy Update', 'description' => 'Organization policy changes and updates'],
            ['name' => 'Event', 'description' => 'Upcoming events and activities'],
            ['name' => 'HR', 'description' => 'Human resources related announcements'],
            ['name' => 'IT Update', 'description' => 'IT system updates and maintenance'],
        ];

        $announcementTemplates = [
            ['title' => 'System Maintenance Scheduled', 'announcement_content' => 'Our system will undergo scheduled maintenance on Sunday from 2 AM to 4 AM. Services may be temporarily unavailable during this time.', 'category' => 'IT Update'],
            ['title' => 'New Feature Released', 'announcement_content' => 'We are excited to announce the release of our new reporting dashboard. Check it out in the Reports section!', 'category' => 'Organization News'],
            ['title' => 'Security Update Required', 'announcement_content' => 'Please update your password to comply with our new security policy. Passwords must be at least 12 characters long.', 'category' => 'Policy Update'],
            ['title' => 'Holiday Schedule', 'announcement_content' => 'Our support team will have limited availability during the upcoming holidays. Please plan accordingly.', 'category' => 'HR'],
            ['title' => 'Training Session Available', 'announcement_content' => 'Join us for a free training session on advanced features this Friday at 3 PM. Register in the Events section.', 'category' => 'Event'],
            ['title' => 'Performance Improvements', 'announcement_content' => 'We have implemented several performance improvements. You should notice faster load times across the platform.', 'category' => 'IT Update'],
            ['title' => 'Policy Update', 'announcement_content' => 'Our terms of service have been updated. Please review the changes in your account settings.', 'category' => 'Policy Update'],
            ['title' => 'Welcome to the Platform', 'announcement_content' => 'Thank you for joining us! Explore our features and let us know if you need any assistance.', 'category' => 'Organization News'],
            ['title' => 'Server Upgrade Notice', 'announcement_content' => 'We are upgrading our servers to provide better performance. Expect brief downtime this weekend.', 'category' => 'IT Update'],
            ['title' => 'Team Building Event', 'announcement_content' => 'Join us for a team building event next month. Details will be shared soon.', 'category' => 'Event'],
            ['title' => 'New HR Policy', 'announcement_content' => 'We have introduced a new remote work policy. Please check your email for details.', 'category' => 'HR'],
            ['title' => 'Product Launch', 'announcement_content' => 'We are launching a new product line next quarter. Stay tuned for more information.', 'category' => 'Organization News'],
            ['title' => 'Data Backup Reminder', 'announcement_content' => 'Please ensure all important data is backed up regularly. Contact IT for assistance.', 'category' => 'IT Update'],
            ['title' => 'Annual Review Process', 'announcement_content' => 'The annual performance review process will begin next month. Prepare your self-assessments.', 'category' => 'HR'],
            ['title' => 'Office Closure Notice', 'announcement_content' => 'Our office will be closed on Monday for a public holiday. Remote work is available.', 'category' => 'Organization News'],
            ['title' => 'Webinar Invitation', 'announcement_content' => 'Join our webinar on industry trends this Thursday at 2 PM. Registration link in your inbox.', 'category' => 'Event'],
            ['title' => 'Network Maintenance', 'announcement_content' => 'Network maintenance is scheduled for tonight. Internet connectivity may be affected briefly.', 'category' => 'IT Update'],
            ['title' => 'Benefits Enrollment', 'announcement_content' => 'Open enrollment for benefits starts next week. Review your options and make selections.', 'category' => 'HR'],
            ['title' => 'Customer Appreciation Day', 'announcement_content' => 'We are hosting a customer appreciation event. Thank you for your continued support!', 'category' => 'Event'],
            ['title' => 'Quarterly Results', 'announcement_content' => 'Our quarterly results are in! Thank you to everyone for your hard work and dedication.', 'category' => 'Organization News'],
        ];

        foreach ($users as $user) {
            foreach ($categoryTemplates as $catTemplate) {
                AnnouncementCategory::firstOrCreate(
                    [
                        'name' => $catTemplate['name'],
                        'created_by' => $user->id
                    ],
                    [
                        'description' => $catTemplate['description'],
                        'status' => 'active',
                    ]
                );
            }


            foreach ($announcementTemplates as $template) {

                $category = AnnouncementCategory::where('name', $template['category'])->where('created_by', $user->id)->first();

                $announcementsExists = Announcement::where('created_by', $user->id)->exists();
                if ($announcementsExists) {
                    continue;
                }

                Announcement::firstOrCreate(
                    [
                        'title' => $template['title'],
                        'created_by' => $user->id
                    ],
                    [
                        'announcement_content' => $template['announcement_content'],
                        'announcement_category_id' => $category?->id ?? null,
                        'start_date' => now()->subDays(rand(0, 7)),
                        'end_date' => rand(0, 1) ? now()->addDays(rand(7, 30)) : null,
                        'status' => rand(0, 10) > 2 ? 'active' : 'inactive',
                        'is_featured' => rand(0, 10) > 7,
                    ]
                );
            }
        }
    }
}
