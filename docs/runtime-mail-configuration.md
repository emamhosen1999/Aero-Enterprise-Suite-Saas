# Runtime Mail Configuration

## Overview

The application now supports **unified dynamic email configuration** that allows both platform administrators and tenant administrators to configure SMTP settings through the UI without modifying `.env` files. Email settings are stored in the database and applied at runtime when sending notifications.

## Architecture

### Unified System

The mail configuration system automatically detects the context (Platform Admin or Tenant) and applies the appropriate settings:

- **Platform Admin**: Uses `PlatformSetting` model (landlord database)
- **Tenants**: Uses `SystemSetting` model (tenant database)

Both use the same service and provider for consistency.

### Components

1. **RuntimeMailConfigService** (`app/Services/Mail/RuntimeMailConfigService.php`)
   - **Unified**: Automatically detects context (platform vs tenant)
   - `applyMailSettings()`: Auto-detects and applies appropriate settings
   - `applyPlatformMailSettings()`: Explicitly for platform admin
   - `applyTenantMailSettings()`: Explicitly for tenants
   - Loads email settings from database
   - Applies settings to Laravel's mail configuration at runtime
   - Provides test email functionality

2. **MailServiceProvider** (`app/Providers/MailServiceProvider.php`)
   - Registers the RuntimeMailConfigService as a singleton
   - Listens to `NotificationSending` event
   - Automatically applies appropriate settings before any mail notification is sent
   - Works for both platform and tenant contexts

3. **Platform Admin UI** (`resources/js/Platform/Pages/Admin/Settings/Platform.jsx`)
   - Email Infrastructure section for platform-wide SMTP settings
   - Test email button to verify configuration
   - Modal dialog for sending test emails

4. **Tenant UI** (`resources/js/Tenant/Pages/Settings/SystemSettings.jsx`)
   - Communications section for tenant-specific SMTP settings
   - Test email button to verify configuration
   - Modal dialog for sending test emails

## Features

### ✅ Implemented

- **Database Storage**: Email settings stored in `platform_settings.email_settings` JSON column
- **Password Encryption**: SMTP passwords encrypted using `Crypt::encryptString()`
- **Runtime Configuration**: Settings applied dynamically without server restart
- **Automatic Application**: Settings applied before every notification via event listener
- **Test Email Functionality**: Send test emails to verify configuration
- **Graceful Fallback**: Uses `.env` settings if no database settings configured

### Settings Supported

| Setting | Description | Example | Validation |
|---------|-------------|---------|------------|
| `driver` | Mail driver | smtp, ses, mailgun, postmark, sendmail, **log** | Required in list |
| `host` | SMTP server hostname | smtp.gmail.com, smtp.office365.com | String, max 255 |
| `port` | SMTP server port | 587 (TLS), 465 (SSL), 25 | Integer |
| `encryption` | Encryption method | tls, ssl, starttls | Required in list |
| `username` | SMTP username | your-email@domain.com | String, max 255 |
| `password` | SMTP password (encrypted) | your-password | String, max 255 |
| `from_address` | From email address | noreply@platform.com | Valid email |
| `from_name` | From display name | Platform Admin | String, max 255 |
| `reply_to` | Reply-to email address | support@platform.com | Valid email |
| `queue` | Queue emails (tenant only) | true/false | Boolean |

## Usage

### For Platform Admins

1. **Configure Email Settings**:
   - Login to admin dashboard at `admin.platform.com`
   - Navigate to Settings → Platform Settings
   - Scroll to "Email Infrastructure" section
   - Enter your SMTP credentials
   - Save settings

2. **Test Configuration**:
   - Click "Send Test Email" button
   - Enter recipient email address
   - Click "Send Test Email"
   - Check the recipient inbox or logs

3. **Verify in Production**:
   ```bash
   # Check logs for email sending
   tail -f storage/logs/laravel.log | grep "Platform mail settings"
   
   # Test via tinker
   php artisan tinker
   >>> use App\Services\Mail\RuntimeMailConfigService;
   >>> $service = app(RuntimeMailConfigService::class);
   >>> $service->sendTestEmail('your-email@example.com');
   ```

### For Developers

#### Manual Configuration Application

```php
use App\Services\Mail\RuntimeMailConfigService;

$mailService = app(RuntimeMailConfigService::class);

// Apply platform settings
$applied = $mailService->applyPlatformMailSettings();

if ($applied) {
    echo "Using database settings";
} else {
    echo "Using .env settings";
}
```

#### Send Test Email

```php
use App\Services\Mail\RuntimeMailConfigService;

$mailService = app(RuntimeMailConfigService::class);

$result = $mailService->sendTestEmail('recipient@example.com', 'Test Subject');

if ($result['success']) {
    echo $result['message'];
} else {
    echo "Error: " . $result['message'];
}
```

#### Check Current Configuration

```php
// After applying platform settings
echo "Driver: " . config('mail.default');
echo "Host: " . config('mail.mailers.smtp.host');
echo "From: " . config('mail.from.address');
```

## How It Works

### 1. Settings Storage

When platform admin saves email settings:

```php
// PlatformSettingService.php
$setting->email_settings = [
    'driver' => 'smtp',
    'host' => 'smtp.gmail.com',
    'port' => 587,
    'encryption' => 'tls',
    'username' => 'user@gmail.com',
    'password' => Crypt::encryptString('password'), // Encrypted
    'from_address' => 'noreply@platform.com',
    'from_name' => 'Platform Admin',
    'reply_to' => 'support@platform.com'
];
$setting->save();
```

### 2. Runtime Application

When any notification is about to be sent:

```php
// MailServiceProvider.php
Event::listen(NotificationSending::class, function (NotificationSending $event) {
    if ($event->channel === 'mail') {
        $mailService = app(RuntimeMailConfigService::class);
        $mailService->applyPlatformMailSettings();
    }
});
```

### 3. Configuration Override

```php
// RuntimeMailConfigService.php
Config::set('mail.default', $emailSettings['driver']);
Config::set('mail.mailers.smtp', [
    'transport' => 'smtp',
    'host' => $emailSettings['host'],
    'port' => $emailSettings['port'],
    'encryption' => $emailSettings['encryption'],
    'username' => $emailSettings['username'],
    'password' => $decryptedPassword,
]);
Config::set('mail.from.address', $emailSettings['from_address']);
Config::set('mail.from.name', $emailSettings['from_name']);
```

### 4. Notification Sent

The notification (WelcomeToTenant, TenantProvisioningFailed, etc.) is sent using the applied configuration.

## Testing

### Unit Test Example

```php
use App\Services\Mail\RuntimeMailConfigService;
use App\Models\PlatformSetting;
use Tests\TestCase;

class RuntimeMailConfigTest extends TestCase
{
    public function test_applies_platform_mail_settings()
    {
        // Arrange
        $setting = PlatformSetting::current();
        $setting->email_settings = [
            'driver' => 'smtp',
            'host' => 'smtp.test.com',
            'from_address' => 'test@platform.com'
        ];
        $setting->save();

        // Act
        $service = app(RuntimeMailConfigService::class);
        $applied = $service->applyPlatformMailSettings();

        // Assert
        $this->assertTrue($applied);
        $this->assertEquals('smtp', config('mail.default'));
        $this->assertEquals('smtp.test.com', config('mail.mailers.smtp.host'));
        $this->assertEquals('test@platform.com', config('mail.from.address'));
    }
}
```

### Manual Testing

1. **Test with Log Driver**:
   ```php
   // Set driver to 'log' in settings
   $setting = PlatformSetting::current();
   $setting->email_settings = ['driver' => 'log', 'from_address' => 'test@platform.com'];
   $setting->save();
   
   // Send test email
   $service = app(RuntimeMailConfigService::class);
   $service->sendTestEmail('recipient@example.com');
   
   // Check storage/logs/laravel.log
   ```

2. **Test with SMTP**:
   - Use Mailtrap.io or similar testing service
   - Configure SMTP settings in platform admin UI
   - Send test email via UI button
   - Verify email received in Mailtrap inbox

## Security

### Password Encryption

SMTP passwords are **encrypted** before storage using Laravel's `Crypt` facade:

```php
// Encryption (on save)
$password = Crypt::encryptString($plaintextPassword);

// Decryption (on use)
$password = Crypt::decryptString($encryptedPassword);
```

### Password Handling in API

When returning settings via API, password is **removed** and replaced with `password_set` flag:

```php
// PlatformSetting.php
public function getSanitizedEmailSettings(): array
{
    $email = $this->email_settings ?? [];
    
    if (!empty($email['password'])) {
        $email['password_set'] = true;
        unset($email['password']);
    }
    
    return $email;
}
```

### Permissions

Only users with `platform.settings.update` permission can:
- View email settings
- Update email settings
- Send test emails

## Troubleshooting

### Issue: Emails still using .env settings

**Solution**: Check if platform settings are saved:
```bash
php artisan tinker
>>> use App\Models\PlatformSetting;
>>> $s = PlatformSetting::current();
>>> $s->email_settings;
```

### Issue: Authentication failed error

**Symptoms**: "Failed to authenticate on SMTP server"

**Causes**:
- Incorrect username/password
- Wrong encryption method (should be 'tls' for most)
- Firewall blocking SMTP port
- 2FA enabled (need app-specific password)

**Solution**:
1. Verify credentials with email provider
2. Use port 587 with TLS encryption
3. For Gmail: Enable "Less secure apps" or use App Password

### Issue: Test email button disabled

**Cause**: Required fields missing (host, from_address)

**Solution**: Fill in at minimum:
- Host
- From address

### Issue: Logs show .env settings instead of database

**Cause**: MailServiceProvider not registered

**Solution**: Check `bootstrap/providers.php` includes:
```php
App\Providers\MailServiceProvider::class,
```

## Production Deployment

### Checklist

- [ ] Configure email settings via admin UI
- [ ] Send test email to verify configuration
- [ ] Check logs for "Platform mail settings applied" message
- [ ] Test actual notification (e.g., tenant registration)
- [ ] Verify email received with correct from address
- [ ] Monitor failed_jobs table for email failures
- [ ] Set up email monitoring/alerting

### Recommended Settings by Provider

#### Gmail
```
Driver: smtp
Host: smtp.gmail.com
Port: 587
Encryption: tls
Username: your-email@gmail.com
Password: App-specific password (not Gmail password)
```

#### Office 365
```
Driver: smtp
Host: smtp.office365.com
Port: 587
Encryption: tls
Username: your-email@domain.com
Password: Your Office 365 password
```

#### SendGrid
```
Driver: smtp
Host: smtp.sendgrid.net
Port: 587
Encryption: tls
Username: apikey
Password: Your SendGrid API key
```

#### Mailgun
```
Driver: mailgun
(Configure via config/services.php or use SMTP)
```

## Related Files

| File | Purpose |
|------|---------|
| `app/Services/Mail/RuntimeMailConfigService.php` | Core service for mail configuration |
| `app/Providers/MailServiceProvider.php` | Service provider registration |
| `app/Models/PlatformSetting.php` | Email settings storage and encryption |
| `app/Http/Controllers/Admin/PlatformSettingController.php` | Test email endpoint |
| `resources/js/Platform/Pages/Admin/Settings/Platform.jsx` | UI for configuration |
| `routes/admin.php` | Test email route |
| `bootstrap/providers.php` | Provider registration |

## Monitoring

### Check Email Configuration

```bash
# View current mail config
php artisan tinker
>>> config('mail.default')
>>> config('mail.mailers.smtp')
>>> config('mail.from')
```

### Monitor Email Logs

```bash
# View email-related logs
tail -f storage/logs/laravel.log | grep -E "mail|email|smtp"

# View platform mail settings application
tail -f storage/logs/laravel.log | grep "Platform mail settings"
```

### Failed Jobs

```bash
# Check for failed email jobs
php artisan queue:failed

# View details of specific failed job
php artisan queue:failed --id=<job-id>

# Retry failed jobs
php artisan queue:retry all
```

## Future Enhancements

### Potential Features

1. **Multiple SMTP Configurations**
   - Support multiple email providers
   - Failover between providers
   - Round-robin load balancing

2. **Email Templates**
   - Customizable email templates per notification type
   - Rich text editor for email content
   - Preview before sending

3. **Email Tracking**
   - Track email opens
   - Track link clicks
   - Delivery status webhooks

4. **Rate Limiting**
   - Per-hour sending limits
   - Per-day sending limits
   - Provider-specific rate limiting

5. **Email Analytics**
   - Dashboard showing sent emails
   - Delivery success rate
   - Bounce rate tracking
   - Open rate tracking

## Support

For issues related to runtime mail configuration:

1. Check logs: `storage/logs/laravel.log`
2. Verify settings: `php artisan tinker` → Check `PlatformSetting::current()->email_settings`
3. Test manually: Use `RuntimeMailConfigService::sendTestEmail()`
4. Review documentation: This file
5. Contact support: support@platform.com

---

**Last Updated**: December 3, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
