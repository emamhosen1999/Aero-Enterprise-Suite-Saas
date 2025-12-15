import React, { useState, useEffect } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import InstallationLayout from '@/Layouts/InstallationLayout';
import { 
    Card, CardHeader, CardBody, CardFooter, 
    Button, Input, Select, SelectItem, Switch,
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    useDisclosure
} from '@heroui/react';
import { Cog6ToothIcon, CheckCircleIcon, XCircleIcon, EnvelopeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

// Test Email Modal Component
const TestEmailModal = ({ isOpen, onOpenChange, emailSettings }) => {
    const [testEmail, setTestEmail] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSendTest = async () => {
        if (!testEmail || !testEmail.includes('@')) {
            showToast.error('Please enter a valid email address');
            return;
        }

        setIsSending(true);
        try {
            const response = await axios.post(route('installation.test-email'), {
                test_email: testEmail,
                ...emailSettings
            });

            if (response.data.success) {
                showToast.success(response.data.message);
                onOpenChange(false);
                setTestEmail('');
            }
        } catch (error) {
            let message = 'Failed to send test email';
            
            if (error.response?.data?.message) {
                message = error.response.data.message;
                
                // Format error messages for better clarity
                if (message.includes('Connection could not be established')) {
                    const host = emailSettings?.mail_host || 'mail server';
                    const port = emailSettings?.mail_port || 'configured port';
                    message = `Cannot connect to ${host}:${port}. Please check:\n\n• Mail server hostname\n• Port number and encryption\n• Firewall/network access\n• Server credentials`;
                } else if (message.includes('Authentication')) {
                    message = 'Authentication failed. Verify username and password.';
                } else if (message.includes('timed out')) {
                    message = 'Connection timed out. Server may be unreachable.';
                } else if (message.includes('SSL') || message.includes('TLS')) {
                    message = 'Encryption error. Verify port and encryption settings match.';
                }
            }
            
            showToast.error(message, { duration: 8000 });
        } finally {
            setIsSending(false);
        }
    };

    const hasSettings = emailSettings?.mail_host && emailSettings?.mail_from_address;

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <EnvelopeIcon className="w-5 h-5 text-primary" />
                                <span>Send Test Email</span>
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            <p className="text-sm text-default-500 mb-4">
                                This will send a test email using the current configuration to verify your settings.
                            </p>
                            <Input
                                autoFocus
                                label="Recipient Email"
                                placeholder="admin@example.com"
                                type="email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                description="Enter the email address to receive the test"
                                isDisabled={!hasSettings}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            {!hasSettings && (
                                <p className="text-xs text-warning-600 mt-2">
                                    ⚠️ Please configure mail host and from address first
                                </p>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleSendTest}
                                isLoading={isSending}
                                isDisabled={!testEmail || !hasSettings}
                            >
                                {isSending ? 'Sending...' : 'Send Test Email'}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default function PlatformSettings({ platformConfig = {} }) {
    const { isOpen: isEmailModalOpen, onOpen: onEmailModalOpen, onOpenChange: onEmailModalChange } = useDisclosure();
    const [testingSms, setTestingSms] = useState(false);
    const [smsTestResult, setSmsTestResult] = useState(null);
    const [testingSmsNumber, setTestingSmsNumber] = useState('');
    const [driverWarning, setDriverWarning] = useState(null);
    const { data, setData, post, processing, errors } = useForm({
        // Basic Platform Info
        app_name: platformConfig.app_name || 'Aero Enterprise Suite',
        legal_name: platformConfig.legal_name || '',
        tagline: platformConfig.tagline || '',
        app_url: platformConfig.app_url || window.location.origin,
        app_timezone: platformConfig.app_timezone || 'UTC',
        app_locale: platformConfig.app_locale || 'en',
        app_debug: platformConfig.app_debug || false,
        // Contact Info
        support_email: platformConfig.support_email || '',
        support_phone: platformConfig.support_phone || '',
        marketing_url: platformConfig.marketing_url || '',
        status_page_url: platformConfig.status_page_url || '',
        // Email Settings
        mail_mailer: platformConfig.mail_mailer || 'smtp',
        mail_host: platformConfig.mail_host || 'smtp.mailtrap.io',
        mail_port: platformConfig.mail_port || '2525',
        mail_username: platformConfig.mail_username || '',
        mail_password: platformConfig.mail_password || '',
        mail_encryption: platformConfig.mail_encryption || 'tls',
        mail_from_address: platformConfig.mail_from_address || 'noreply@aero-enterprise-suite.com',
        mail_from_name: platformConfig.mail_from_name || 'Aero Enterprise Suite',
        mail_verify_ssl: platformConfig.mail_verify_ssl !== undefined ? platformConfig.mail_verify_ssl : true,
        mail_verify_ssl_name: platformConfig.mail_verify_ssl_name !== undefined ? platformConfig.mail_verify_ssl_name : true,
        mail_allow_self_signed: platformConfig.mail_allow_self_signed || false,
        // SMS Settings
        sms_provider: platformConfig.sms_provider || 'twilio',
        sms_twilio_sid: platformConfig.sms_twilio_sid || '',
        sms_twilio_token: platformConfig.sms_twilio_token || '',
        sms_twilio_from: platformConfig.sms_twilio_from || '',
        sms_nexmo_key: platformConfig.sms_nexmo_key || '',
        sms_nexmo_secret: platformConfig.sms_nexmo_secret || '',
        sms_nexmo_from: platformConfig.sms_nexmo_from || '',
        // Backend Drivers
        queue_connection: platformConfig.queue_connection || 'sync',
        session_driver: platformConfig.session_driver || 'database',
        cache_driver: platformConfig.cache_driver || 'database',
        filesystem_disk: platformConfig.filesystem_disk || 'local',
    });

    // Check for driver warnings on initial load and when drivers change
    useEffect(() => {
        checkDriverWarnings(data.session_driver, data.cache_driver);
    }, []);

    const checkDriverWarnings = (sessionDriver, cacheDriver) => {
        const warnings = [];
        
        if (sessionDriver === 'database') {
            warnings.push('Session driver "database" requires database tables that won\'t exist until after installation completes.');
        }
        if (cacheDriver === 'database') {
            warnings.push('Cache driver "database" requires database tables that won\'t exist until after installation completes.');
        }
        
        if (warnings.length > 0) {
            setDriverWarning({
                message: warnings.join(' '),
                recommendation: 'Consider using "file" for initial setup. You can switch to "database" after installation completes.'
            });
        } else {
            setDriverWarning(null);
        }
    };

    const handleSessionDriverChange = (value) => {
        setData('session_driver', value);
        checkDriverWarnings(value, data.cache_driver);
        
        if (value === 'database') {
            showToast.info('Note: Database sessions require tables that are created during installation. The system will use file sessions until then.', { duration: 5000 });
        }
    };

    const handleCacheDriverChange = (value) => {
        setData('cache_driver', value);
        checkDriverWarnings(data.session_driver, value);
        
        if (value === 'database') {
            showToast.info('Note: Database cache requires tables that are created during installation. The system will use file cache until then.', { duration: 5000 });
        }
    };

    const handleTestSms = async () => {
        if (!testingSmsNumber) {
            showToast.warning('Please enter a phone number to test');
            return;
        }

        setTestingSms(true);
        setSmsTestResult(null);

        try {
            const response = await axios.post(route('installation.test-sms'), {
                ...data,
                test_phone: testingSmsNumber,
            });

            if (response.data.success) {
                setSmsTestResult({ success: true, message: response.data.message });
                showToast.success('Test SMS sent successfully!');
            } else {
                setSmsTestResult({ success: false, message: response.data.message });
                showToast.error('Failed to send test SMS');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'SMS test failed';
            setSmsTestResult({ success: false, message });
            showToast.error(message);
        } finally {
            setTestingSms(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const promise = new Promise(async (resolve, reject) => {
            post(route('installation.save-platform'), {
                onSuccess: () => {
                    resolve(['Platform settings saved successfully']);
                    // Inertia will automatically handle redirect from backend
                },
                onError: (errors) => reject(Object.values(errors)),
                preserveState: false, // Allow redirect to proceed
            });
        });

        showToast.promise(promise, {
            loading: 'Saving platform settings...',
            success: (data) => data.join(', '),
            error: (err) => Array.isArray(err) ? err.join(', ') : 'Failed to save settings',
        });
    };

    return (
        <InstallationLayout currentStep={5}>
            <Head title="Installation - Platform Settings" />
            
            <Card 
                className="transition-all duration-200"
                style={{
                    border: `var(--borderWidth, 2px) solid transparent`,
                    borderRadius: `var(--borderRadius, 12px)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                    transform: `scale(var(--scale, 1))`,
                    background: `linear-gradient(135deg, 
                        var(--theme-content1, #FAFAFA) 20%, 
                        var(--theme-content2, #F4F4F5) 10%, 
                        var(--theme-content3, #F1F3F4) 20%)`,
                }}
            >
                <CardHeader className="flex flex-col items-center gap-3 sm:gap-4 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-divider">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center">
                        <Cog6ToothIcon className="w-8 h-8 sm:w-10 sm:h-10 text-secondary-600" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">
                            Platform Settings
                        </h2>
                        <p className="text-sm sm:text-base text-default-600">
                            Configure your platform's basic information
                        </p>
                    </div>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardBody className="px-4 sm:px-6 md:px-8 py-6 sm:py-8">
                        <div className="space-y-5 sm:space-y-6">
                            {/* Application settings */}
                            <div>
                                <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Application Settings</h3>
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <Input
                                            label="Application Name"
                                            placeholder="Aero Enterprise Suite"
                                            value={data.app_name}
                                            onValueChange={(value) => setData('app_name', value)}
                                            isInvalid={!!errors.app_name}
                                            errorMessage={errors.app_name}
                                            isRequired
                                            description="Display name throughout the platform"
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />

                                        <Input
                                            label="Legal Name"
                                            placeholder="Company Legal Name Inc."
                                            value={data.legal_name}
                                            onValueChange={(value) => setData('legal_name', value)}
                                            isInvalid={!!errors.legal_name}
                                            errorMessage={errors.legal_name}
                                            description="Official company name for invoices"
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />
                                    </div>

                                    <Input
                                        label="Tagline"
                                        placeholder="Your Enterprise Solution for Success"
                                        value={data.tagline}
                                        onValueChange={(value) => setData('tagline', value)}
                                        isInvalid={!!errors.tagline}
                                        errorMessage={errors.tagline}
                                        description="A short description or slogan for your platform"
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Input
                                        label="Application URL"
                                        placeholder="https://your-domain.com"
                                        value={data.app_url}
                                        onValueChange={(value) => setData('app_url', value)}
                                        isInvalid={!!errors.app_url}
                                        errorMessage={errors.app_url}
                                        isRequired
                                        description="The base URL where your platform is hosted"
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div>
                                <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Contact Information</h3>
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <Input
                                            label="Support Email"
                                            placeholder="support@your-domain.com"
                                            type="email"
                                            value={data.support_email}
                                            onValueChange={(value) => setData('support_email', value)}
                                            isInvalid={!!errors.support_email}
                                            errorMessage={errors.support_email}
                                            description="Email for customer support inquiries"
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />

                                        <Input
                                            label="Support Phone"
                                            placeholder="+1 (555) 123-4567"
                                            value={data.support_phone}
                                            onValueChange={(value) => setData('support_phone', value)}
                                            isInvalid={!!errors.support_phone}
                                            errorMessage={errors.support_phone}
                                            description="Phone number for support"
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <Input
                                            label="Marketing Website"
                                            placeholder="https://www.your-domain.com"
                                            value={data.marketing_url}
                                            onValueChange={(value) => setData('marketing_url', value)}
                                            isInvalid={!!errors.marketing_url}
                                            errorMessage={errors.marketing_url}
                                            description="Link to your marketing website"
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />

                                        <Input
                                            label="Status Page URL"
                                            placeholder="https://status.your-domain.com"
                                            value={data.status_page_url}
                                            onValueChange={(value) => setData('status_page_url', value)}
                                            isInvalid={!!errors.status_page_url}
                                            errorMessage={errors.status_page_url}
                                            description="Link to service status page"
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Platform Details */}
                            <div>
                                <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Platform Details</h3>
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <Select
                                            label="Timezone"
                                            placeholder="Select timezone"
                                            selectedKeys={[data.app_timezone]}
                                            onSelectionChange={(keys) => setData('app_timezone', Array.from(keys)[0])}
                                            isInvalid={!!errors.app_timezone}
                                            errorMessage={errors.app_timezone}
                                            isRequired
                                            description="Platform default timezone"
                                            classNames={{ trigger: "bg-default-100" }}
                                        >
                                            <SelectItem key="UTC">UTC (Coordinated Universal Time)</SelectItem>
                                            <SelectItem key="America/New_York">America/New York (EST/EDT)</SelectItem>
                                            <SelectItem key="America/Chicago">America/Chicago (CST/CDT)</SelectItem>
                                            <SelectItem key="America/Denver">America/Denver (MST/MDT)</SelectItem>
                                            <SelectItem key="America/Los_Angeles">America/Los Angeles (PST/PDT)</SelectItem>
                                            <SelectItem key="Europe/London">Europe/London (GMT/BST)</SelectItem>
                                            <SelectItem key="Europe/Paris">Europe/Paris (CET/CEST)</SelectItem>
                                            <SelectItem key="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                                            <SelectItem key="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                                            <SelectItem key="Asia/Dhaka">Asia/Dhaka (BST)</SelectItem>
                                            <SelectItem key="Asia/Shanghai">Asia/Shanghai (CST)</SelectItem>
                                            <SelectItem key="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                                            <SelectItem key="Australia/Sydney">Australia/Sydney (AEDT/AEST)</SelectItem>
                                        </Select>

                                        <Select
                                            label="Default Language"
                                            placeholder="Select language"
                                            selectedKeys={[data.app_locale]}
                                            onSelectionChange={(keys) => setData('app_locale', Array.from(keys)[0])}
                                            isInvalid={!!errors.app_locale}
                                            errorMessage={errors.app_locale}
                                            isRequired
                                            description="Platform default language"
                                            classNames={{ trigger: "bg-default-100" }}
                                        >
                                            <SelectItem key="en">English</SelectItem>
                                            <SelectItem key="bn">বাংলা (Bengali)</SelectItem>
                                            <SelectItem key="zh-CN">简体中文 (Simplified Chinese)</SelectItem>
                                            <SelectItem key="zh-TW">繁體中文 (Traditional Chinese)</SelectItem>
                                        </Select>
                                    </div>

                                    <div className="border border-warning-200 dark:border-warning-800 rounded-lg p-3 sm:p-4 bg-warning-50/50 dark:bg-warning-900/10">
                                        <Switch
                                            isSelected={data.app_debug}
                                            onValueChange={(value) => setData('app_debug', value)}
                                            size="sm"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-foreground">Debug Mode</span>
                                                <span className="text-xs text-warning-600 dark:text-warning-400">
                                                    ⚠️ Enable only for development. Disable in production for security.
                                                </span>
                                            </div>
                                        </Switch>
                                    </div>
                                </div>
                            </div>

                            {/* Email settings */}
                            <div>
                                <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Email Settings</h3>
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <Select
                                            label="Mail Mailer"
                                            placeholder="Select mailer"
                                            selectedKeys={[data.mail_mailer]}
                                            onSelectionChange={(keys) => setData('mail_mailer', Array.from(keys)[0])}
                                            isInvalid={!!errors.mail_mailer}
                                            errorMessage={errors.mail_mailer}
                                            isRequired
                                            classNames={{ trigger: "bg-default-100" }}
                                        >
                                            <SelectItem key="smtp">SMTP</SelectItem>
                                            <SelectItem key="sendmail">Sendmail</SelectItem>
                                            <SelectItem key="mailgun">Mailgun</SelectItem>
                                            <SelectItem key="ses">Amazon SES</SelectItem>
                                            <SelectItem key="postmark">Postmark</SelectItem>
                                            <SelectItem key="log">Log (Testing)</SelectItem>
                                        </Select>

                                        <Select
                                            label="Encryption"
                                            placeholder="Select encryption"
                                            selectedKeys={[data.mail_encryption]}
                                            onSelectionChange={(keys) => setData('mail_encryption', Array.from(keys)[0])}
                                            isInvalid={!!errors.mail_encryption}
                                            errorMessage={errors.mail_encryption}
                                            isRequired
                                            classNames={{ trigger: "bg-default-100" }}
                                        >
                                            <SelectItem key="tls">TLS</SelectItem>
                                            <SelectItem key="ssl">SSL</SelectItem>
                                            <SelectItem key="null">None</SelectItem>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <Input
                                            label="SMTP Host"
                                            placeholder="smtp.mailtrap.io"
                                            value={data.mail_host}
                                            onValueChange={(value) => setData('mail_host', value)}
                                            isInvalid={!!errors.mail_host}
                                            errorMessage={errors.mail_host}
                                            isRequired
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />

                                        <Input
                                            label="SMTP Port"
                                            placeholder="2525"
                                            value={data.mail_port}
                                            onValueChange={(value) => setData('mail_port', value)}
                                            isInvalid={!!errors.mail_port}
                                            errorMessage={errors.mail_port}
                                            isRequired
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <Input
                                            label="SMTP Username"
                                            placeholder="your-username"
                                            value={data.mail_username}
                                            onValueChange={(value) => setData('mail_username', value)}
                                            isInvalid={!!errors.mail_username}
                                            errorMessage={errors.mail_username}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />

                                        <Input
                                            type="password"
                                            label="SMTP Password"
                                            placeholder="your-password"
                                            value={data.mail_password}
                                            onValueChange={(value) => setData('mail_password', value)}
                                            isInvalid={!!errors.mail_password}
                                            errorMessage={errors.mail_password}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <Input
                                            label="From Email Address"
                                            type="email"
                                            placeholder="noreply@your-domain.com"
                                            value={data.mail_from_address}
                                            onValueChange={(value) => setData('mail_from_address', value)}
                                            isInvalid={!!errors.mail_from_address}
                                            errorMessage={errors.mail_from_address}
                                            isRequired
                                            description="Email address used for outgoing emails"
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />

                                        <Input
                                            label="From Name"
                                            placeholder="Aero Enterprise Suite"
                                            value={data.mail_from_name}
                                            onValueChange={(value) => setData('mail_from_name', value)}
                                            isInvalid={!!errors.mail_from_name}
                                            errorMessage={errors.mail_from_name}
                                            isRequired
                                            description="Name displayed as sender"
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />
                                    </div>

                                    {/* SSL Verification Settings */}
                                    <div className="p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-700">
                                        <Switch
                                            isSelected={!data.mail_verify_ssl || data.mail_allow_self_signed}
                                            onValueChange={(checked) => {
                                                setData('mail_verify_ssl', !checked);
                                                setData('mail_allow_self_signed', checked);
                                            }}
                                            size="sm"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">Skip SSL Certificate Verification</span>
                                                <span className="text-xs text-warning-600 dark:text-warning-400">
                                                    Enable for shared hosting with mismatched SSL certificates (e.g., cPanel)
                                                </span>
                                            </div>
                                        </Switch>
                                    </div>

                                    {/* Test Email Button */}
                                    <Button
                                        type="button"
                                        color="primary"
                                        variant="flat"
                                        startContent={<EnvelopeIcon className="w-4 h-4" />}
                                        onPress={onEmailModalOpen}
                                        isDisabled={!data.mail_host || !data.mail_from_address}
                                    >
                                        Send Test Email
                                    </Button>
                                </div>
                            </div>

                            {/* SMS Gateway Settings */}
                            <div>
                                <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">SMS Gateway Settings</h3>
                                <div className="space-y-3 sm:space-y-4">
                                    <Select
                                        label="SMS Provider"
                                        placeholder="Select SMS provider"
                                        selectedKeys={[data.sms_provider]}
                                        onSelectionChange={(keys) => setData('sms_provider', Array.from(keys)[0])}
                                        isInvalid={!!errors.sms_provider}
                                        errorMessage={errors.sms_provider}
                                        classNames={{ trigger: "bg-default-100" }}
                                    >
                                        <SelectItem key="twilio">Twilio</SelectItem>
                                        <SelectItem key="nexmo">Nexmo (Vonage)</SelectItem>
                                        <SelectItem key="messagebird">MessageBird</SelectItem>
                                        <SelectItem key="sns">Amazon SNS</SelectItem>
                                    </Select>

                                    {/* Twilio Configuration */}
                                    {data.sms_provider === 'twilio' && (
                                        <>
                                            <Input
                                                label="Twilio Account SID"
                                                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                                value={data.sms_twilio_sid}
                                                onValueChange={(value) => setData('sms_twilio_sid', value)}
                                                isInvalid={!!errors.sms_twilio_sid}
                                                errorMessage={errors.sms_twilio_sid}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />

                                            <Input
                                                type="password"
                                                label="Twilio Auth Token"
                                                placeholder="Your Twilio auth token"
                                                value={data.sms_twilio_token}
                                                onValueChange={(value) => setData('sms_twilio_token', value)}
                                                isInvalid={!!errors.sms_twilio_token}
                                                errorMessage={errors.sms_twilio_token}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />

                                            <Input
                                                label="Twilio Phone Number"
                                                placeholder="+1234567890"
                                                value={data.sms_twilio_from}
                                                onValueChange={(value) => setData('sms_twilio_from', value)}
                                                isInvalid={!!errors.sms_twilio_from}
                                                errorMessage={errors.sms_twilio_from}
                                                description="Your Twilio phone number with country code"
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />
                                        </>
                                    )}

                                    {/* Nexmo Configuration */}
                                    {data.sms_provider === 'nexmo' && (
                                        <>
                                            <Input
                                                label="Nexmo API Key"
                                                placeholder="Your Nexmo API key"
                                                value={data.sms_nexmo_key}
                                                onValueChange={(value) => setData('sms_nexmo_key', value)}
                                                isInvalid={!!errors.sms_nexmo_key}
                                                errorMessage={errors.sms_nexmo_key}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />

                                            <Input
                                                type="password"
                                                label="Nexmo API Secret"
                                                placeholder="Your Nexmo API secret"
                                                value={data.sms_nexmo_secret}
                                                onValueChange={(value) => setData('sms_nexmo_secret', value)}
                                                isInvalid={!!errors.sms_nexmo_secret}
                                                errorMessage={errors.sms_nexmo_secret}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />

                                            <Input
                                                label="Nexmo From Name"
                                                placeholder="YourCompany"
                                                value={data.sms_nexmo_from}
                                                onValueChange={(value) => setData('sms_nexmo_from', value)}
                                                isInvalid={!!errors.sms_nexmo_from}
                                                errorMessage={errors.sms_nexmo_from}
                                                description="Sender name (alphanumeric, 11 chars max)"
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />
                                        </>
                                    )}

                                    {/* SMS Test Section */}
                                    <div className="border border-divider rounded-lg p-4 bg-default-50/50">
                                        <h4 className="text-sm font-semibold text-foreground mb-3">Test SMS Configuration</h4>
                                        <div className="flex flex-col gap-3">
                                            <Input
                                                type="tel"
                                                placeholder="+1234567890"
                                                value={testingSmsNumber}
                                                onValueChange={setTestingSmsNumber}
                                                label="Test Phone Number"
                                                description="Include country code (e.g., +1 for US)"
                                                classNames={{ inputWrapper: "bg-white dark:bg-default-100" }}
                                            />
                                            <Button
                                                type="button"
                                                color="secondary"
                                                variant="flat"
                                                onPress={handleTestSms}
                                                isLoading={testingSms}
                                                isDisabled={!testingSmsNumber || testingSms}
                                            >
                                                Send Test SMS
                                            </Button>
                                            
                                            {smsTestResult && (
                                                <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                                                    smsTestResult.success
                                                        ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                                                        : 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
                                                }`}>
                                                    {smsTestResult.success ? (
                                                        <CheckCircleIcon className="w-5 h-5 text-success-600 flex-shrink-0" />
                                                    ) : (
                                                        <XCircleIcon className="w-5 h-5 text-danger-600 flex-shrink-0" />
                                                    )}
                                                    <p className={`text-sm ${
                                                        smsTestResult.success 
                                                            ? 'text-success-800 dark:text-success-200' 
                                                            : 'text-danger-800 dark:text-danger-200'
                                                    }`}>
                                                        {smsTestResult.message}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Backend Configuration */}
                            <div>
                                <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Backend Configuration</h3>
                                
                                {/* Driver warning */}
                                {driverWarning && (
                                    <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-3 sm:p-4 border border-warning-200 dark:border-warning-800 mb-4">
                                        <div className="flex items-start gap-2">
                                            <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-warning-800 dark:text-warning-200 mb-1">
                                                    {driverWarning.message}
                                                </p>
                                                <p className="text-xs text-warning-600 dark:text-warning-300">
                                                    💡 {driverWarning.recommendation}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <Select
                                            label="Queue Driver"
                                            placeholder="Select queue driver"
                                            selectedKeys={[data.queue_connection]}
                                            onSelectionChange={(keys) => setData('queue_connection', Array.from(keys)[0])}
                                            isInvalid={!!errors.queue_connection}
                                            errorMessage={errors.queue_connection}
                                            isRequired
                                            description="Job queue system for background tasks"
                                            classNames={{ trigger: "bg-default-100" }}
                                        >
                                            <SelectItem key="sync">Sync (No Queue - Development)</SelectItem>
                                            <SelectItem key="database">Database (Recommended)</SelectItem>
                                            <SelectItem key="redis">Redis (High Performance)</SelectItem>
                                            <SelectItem key="beanstalkd">Beanstalkd</SelectItem>
                                            <SelectItem key="sqs">Amazon SQS</SelectItem>
                                        </Select>

                                        <Select
                                            label="Session Driver"
                                            placeholder="Select session driver"
                                            selectedKeys={[data.session_driver]}
                                            onSelectionChange={(keys) => handleSessionDriverChange(Array.from(keys)[0])}
                                            isInvalid={!!errors.session_driver}
                                            errorMessage={errors.session_driver}
                                            isRequired
                                            description="User session storage mechanism"
                                            classNames={{ trigger: "bg-default-100" }}
                                        >
                                            <SelectItem key="file">File (Recommended for Install)</SelectItem>
                                            <SelectItem key="cookie">Cookie</SelectItem>
                                            <SelectItem key="database">Database (After Install)</SelectItem>
                                            <SelectItem key="apc">APC</SelectItem>
                                            <SelectItem key="memcached">Memcached</SelectItem>
                                            <SelectItem key="redis">Redis</SelectItem>
                                            <SelectItem key="array">Array (Testing)</SelectItem>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <Select
                                            label="Cache Driver"
                                            placeholder="Select cache driver"
                                            selectedKeys={[data.cache_driver]}
                                            onSelectionChange={(keys) => handleCacheDriverChange(Array.from(keys)[0])}
                                            isInvalid={!!errors.cache_driver}
                                            errorMessage={errors.cache_driver}
                                            isRequired
                                            description="Application caching system"
                                            classNames={{ trigger: "bg-default-100" }}
                                        >
                                            <SelectItem key="file">File (Recommended for Install)</SelectItem>
                                            <SelectItem key="database">Database (After Install)</SelectItem>
                                            <SelectItem key="apc">APC</SelectItem>
                                            <SelectItem key="memcached">Memcached</SelectItem>
                                            <SelectItem key="redis">Redis (High Performance)</SelectItem>
                                            <SelectItem key="array">Array (Testing)</SelectItem>
                                        </Select>

                                        <Select
                                            label="Filesystem Disk"
                                            placeholder="Select filesystem"
                                            selectedKeys={[data.filesystem_disk]}
                                            onSelectionChange={(keys) => setData('filesystem_disk', Array.from(keys)[0])}
                                            isInvalid={!!errors.filesystem_disk}
                                            errorMessage={errors.filesystem_disk}
                                            isRequired
                                            description="File storage system"
                                            classNames={{ trigger: "bg-default-100" }}
                                        >
                                            <SelectItem key="local">Local Storage (Default)</SelectItem>
                                            <SelectItem key="public">Public Storage</SelectItem>
                                            <SelectItem key="s3">Amazon S3</SelectItem>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                           
                        </div>
                    </CardBody>

                    <CardFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-t border-divider px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                        <Button
                            as={Link}
                            href={route('installation.database')}
                            variant="flat"
                            color="default"
                            isDisabled={processing}
                            className="w-full sm:w-auto order-2 sm:order-1"
                        >
                            Back
                        </Button>
                        <Button
                            type="submit"
                            color="primary"
                            isLoading={processing}
                            isDisabled={processing}
                            className="w-full sm:w-auto order-1 sm:order-2"
                        >
                            Continue
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Test Email Modal */}
            <TestEmailModal 
                isOpen={isEmailModalOpen} 
                onOpenChange={onEmailModalChange}
                emailSettings={data}
            />
        </InstallationLayout>
    );
}
