<?php

namespace App\Listeners;

use App\Events\AccountCreate;
use App\Models\User;
use App\Services\SlackService;
use Exception;

class SlackAccountCreateListener
{
    public function __construct(
        private SlackService $slackService
    ) {
        //
    }

    public function handle(AccountCreate $event): void
    {
        $account = $event->account;
        if (isNotificationTemplateEnabled('Account create', 'slack', createdBy())) {
            $variables = [
                '{account_name}' => $account->name,
                '{organization_name}' => getOrganizationName(),
            ];

            try {
                session()->forget('slack_error');

                $webhookUrl = getSetting('slack_webhook_url', '', createdBy());

                if (filled($webhookUrl)) {
                    $createdByUser = User::find(createdBy());
                    $userLanguage = $createdByUser->lang ?? 'en';
                    $this->slackService->sendTemplateMessageWithLanguage(
                        templateName: 'Account create',
                        variables: $variables,
                        language: $userLanguage
                    );
                } else {
                    session()->flash('slack_error', 'Slack webhook URL is not set.');
                }
            } catch (Exception $e) {
                session()->flash('slack_error', 'Failed to send account create notification: ' . $e->getMessage());
            }
        }
    }
}
