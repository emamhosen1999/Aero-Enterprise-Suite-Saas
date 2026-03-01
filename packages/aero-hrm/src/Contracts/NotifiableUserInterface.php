<?php

declare(strict_types=1);

namespace Aero\HRM\Contracts;

/**
 * Interface for users that can receive HRM notifications.
 *
 * This interface ensures HRM package has no dependency on Core User model.
 * Any user model implementing this interface can receive HRM notifications.
 */
interface NotifiableUserInterface
{
    /**
     * Get the user's unique identifier.
     */
    public function getKey(): int|string;

    /**
     * Get the user's name.
     */
    public function getName(): string;

    /**
     * Get the user's email address.
     */
    public function getEmail(): string;

    /**
     * Get the user's phone number for SMS notifications.
     */
    public function getPhoneNumber(): ?string;

    /**
     * Get the user's FCM device tokens for push notifications.
     *
     * @return array<string>
     */
    public function getFcmTokens(): array;

    /**
     * Get notification preferences for a specific channel and event.
     *
     * @param  string  $event  The notification event (e.g., 'leave_approved')
     * @param  string  $channel  The channel (email, push, sms, in_app)
     * @return bool Whether the user wants this notification via this channel
     */
    public function wantsNotificationVia(string $event, string $channel): bool;

    /**
     * Get the notification routing for email.
     */
    public function routeNotificationForMail(): string;
}
