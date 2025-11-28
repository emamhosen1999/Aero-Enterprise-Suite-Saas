<?php

namespace App\Console\Commands;

use App\Http\Controllers\NotificationController;
use App\Models\User;
use Illuminate\Console\Command;

class SendPunchOutReminder extends Command
{
    protected $signature = 'send:punchout-reminder';

    protected $description = 'Send Punch Out Reminder Notification to Users at 6 PM';

    public function __construct()
    {
        parent::__construct();
    }

    public function handle()
    {
        $users = User::with(['attendances' => function ($query) {
            $query->whereNotNull('punchin'); // Filter attendances to only those with punchin data
        }])->whereHas('attendances', function ($query) {
            $query->whereNotNull('punchin'); // Ensure users have attendances with punchin
        })->whereNotNull('fcm_token')->get(); // Ensure users have the FCM token

        foreach ($users as $user) {
            $token = $user->fcm_token; // FCM token of the user

            // Call your notification controller method
            $notificationController = new NotificationController;
            $notificationController->sendPushNotification(
                $token,
                'Punch out reminder',
                'Are you forgetting to punch out?'
            );
        }

        $this->info('Punch out reminder notifications sent successfully.');
    }
}
