<?php

namespace Aero\HRM\Tests\Unit\Notifications;

use Aero\HRM\Notifications\BaseHrmNotification;
use Illuminate\Notifications\Messages\MailMessage;
use PHPUnit\Framework\TestCase;

class BaseHrmNotificationTest extends TestCase
{
    /**
     * Test that BaseHrmNotification can be extended.
     */
    public function test_base_notification_can_be_extended(): void
    {
        $notification = new class extends BaseHrmNotification
        {
            protected string $eventType = 'test_event';

            public function toMail(object $notifiable): MailMessage
            {
                return (new MailMessage)->subject('Test');
            }

            public function toArray(object $notifiable): array
            {
                return ['test' => true];
            }

            protected function getFcmTitle(): string
            {
                return 'Test Title';
            }

            protected function getFcmBody(): string
            {
                return 'Test Body';
            }
        };

        $this->assertInstanceOf(BaseHrmNotification::class, $notification);
    }

    /**
     * Test that notification implements ShouldQueue.
     */
    public function test_notification_implements_should_queue(): void
    {
        $notification = new class extends BaseHrmNotification
        {
            protected string $eventType = 'test_event';

            public function toMail(object $notifiable): MailMessage
            {
                return (new MailMessage)->subject('Test');
            }

            public function toArray(object $notifiable): array
            {
                return ['test' => true];
            }

            protected function getFcmTitle(): string
            {
                return 'Test Title';
            }

            protected function getFcmBody(): string
            {
                return 'Test Body';
            }
        };

        $this->assertContains(
            \Illuminate\Contracts\Queue\ShouldQueue::class,
            class_implements($notification)
        );
    }

    /**
     * Test that notification has retry configuration.
     */
    public function test_notification_has_retry_configuration(): void
    {
        $notification = new class extends BaseHrmNotification
        {
            protected string $eventType = 'test_event';

            public function toMail(object $notifiable): MailMessage
            {
                return (new MailMessage)->subject('Test');
            }

            public function toArray(object $notifiable): array
            {
                return ['test' => true];
            }

            protected function getFcmTitle(): string
            {
                return 'Test Title';
            }

            protected function getFcmBody(): string
            {
                return 'Test Body';
            }
        };

        $this->assertEquals(3, $notification->tries);
        $this->assertIsArray($notification->backoff());
        $this->assertEquals([30, 60, 120], $notification->backoff());
    }
}
