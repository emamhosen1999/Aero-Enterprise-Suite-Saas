import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import App from '@/Layouts/App';
import axios from 'axios';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Switch,
    Tab,
    Tabs,
    Textarea,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
} from '@heroui/react';
import { EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';

const fieldClass = 'grid grid-cols-1 md:grid-cols-2 gap-4';

const TestEmailButton = ({ emailSettings }) => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [testEmail, setTestEmail] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSendTest = async () => {
        if (!testEmail || !testEmail.includes('@')) {
            showToast.error('Please enter a valid email address');
            return;
        }

        setIsSending(true);
        try {
            const response = await axios.post(route('settings.system.test-email'), {
                email: testEmail,
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
                
                // Extract and format specific error types for better clarity
                if (message.includes('Connection could not be established')) {
                    const host = emailSettings?.host || 'mail server';
                    const port = emailSettings?.port || 'configured port';
                    message = `Cannot connect to ${host}:${port}. Please check:\n\n• Mail server hostname (try mail.${host})\n• Port number and encryption settings\n• Firewall/network access\n• Mail server credentials`;
                } else if (message.includes('Authentication') || message.includes('Credentials')) {
                    message = 'Authentication failed. Please verify your username and password are correct.';
                } else if (message.includes('timed out') || message.includes('timeout')) {
                    message = 'Connection timed out. The mail server may be unreachable or blocking connections.';
                } else if (message.includes('SSL') || message.includes('TLS')) {
                    message = `Encryption error. Please verify:\n\n• Port 465 requires SSL encryption\n• Port 587 requires TLS or STARTTLS encryption\n• Port 25 usually has no encryption`;
                }
            }
            
            showToast.error(message, { duration: 8000 });
        } finally {
            setIsSending(false);
        }
    };

    const hasSettings = emailSettings?.driver && emailSettings?.from_address;

    return (
        <>
            <Button
                color="primary"
                variant="flat"
                startContent={<EnvelopeIcon className="w-4 h-4" />}
                onPress={onOpen}
                isDisabled={!hasSettings}
            >
                Send Test Email
            </Button>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Send Test Email
                            </ModalHeader>
                            <ModalBody>
                                <p className="text-sm text-default-500 mb-4">
                                    This will send a test email using the current email settings to verify your configuration.
                                </p>
                                <Input
                                    autoFocus
                                    label="Recipient Email"
                                    placeholder="admin@example.com"
                                    type="email"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    description="Enter the email address where you want to receive the test email"
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handleSendTest}
                                    isLoading={isSending}
                                    isDisabled={!testEmail}
                                >
                                    {isSending ? 'Sending...' : 'Send Test Email'}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
};

const TestSmsButton = ({ smsSettings }) => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [testPhone, setTestPhone] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSendTest = async () => {
        if (!testPhone) {
            showToast.error('Please enter a phone number');
            return;
        }

        setIsSending(true);
        try {
            const response = await axios.post(route('settings.system.test-sms'), {
                phone: testPhone,
            });

            if (response.data.success) {
                showToast.success(response.data.message);
                onOpenChange(false);
                setTestPhone('');
            }
        } catch (error) {
            let message = 'Failed to send test SMS';
            
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                if (errors?.phone) {
                    message = errors.phone[0];
                } else if (error.response.data.message) {
                    message = error.response.data.message;
                }
            } else if (error.response?.data?.message) {
                message = error.response.data.message;
            }
            
            showToast.error(message);
        } finally {
            setIsSending(false);
        }
    };

    const hasSettings = smsSettings?.provider && smsSettings?.provider !== 'log';

    return (
        <>
            <Button
                color="primary"
                variant="flat"
                startContent={<DevicePhoneMobileIcon className="w-4 h-4" />}
                onPress={onOpen}
                isDisabled={!hasSettings}
            >
                Send Test SMS
            </Button>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Send Test SMS
                            </ModalHeader>
                            <ModalBody>
                                <p className="text-sm text-default-500 mb-4">
                                    This will send a test SMS using the current SMS settings to verify your configuration.
                                </p>
                                <Input
                                    autoFocus
                                    label="Phone Number"
                                    placeholder="+1234567890"
                                    type="tel"
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                    description="Enter the phone number (with country code)"
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handleSendTest}
                                    isLoading={isSending}
                                    isDisabled={!testPhone}
                                >
                                    {isSending ? 'Sending...' : 'Send Test SMS'}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
};

const getInitial = (payload = {}) => payload ?? {};

const SystemSettings = () => {
    const { title = 'System Settings', systemSettings = {} } = usePage().props;
    const organization = getInitial(systemSettings.organization);
    const branding = getInitial(systemSettings.branding);
    const metadata = getInitial(systemSettings.metadata);
    const emailSettings = getInitial(systemSettings.email_settings);
    const smsSettings = getInitial(systemSettings.sms_settings);
    const notificationChannels = getInitial(systemSettings.notification_channels);
    const integrations = getInitial(systemSettings.integrations);
    const advanced = getInitial(systemSettings.advanced);

    const form = useForm({
        company_name: organization.company_name ?? '',
        legal_name: organization.legal_name ?? '',
        tagline: organization.tagline ?? '',
        contact_person: organization.contact_person ?? '',
        support_email: organization.support_email ?? '',
        support_phone: organization.support_phone ?? '',
        website_url: organization.website_url ?? '',
        timezone: organization.timezone ?? '',
        address_line1: organization.address_line1 ?? '',
        address_line2: organization.address_line2 ?? '',
        city: organization.city ?? '',
        state: organization.state ?? '',
        postal_code: organization.postal_code ?? '',
        country: organization.country ?? '',
        branding: {
            primary_color: branding.primary_color ?? '#0f172a',
            accent_color: branding.accent_color ?? '#6366f1',
            login_background: branding.login_background ?? '',
        },
        metadata: {
            seo_title: metadata.seo_title ?? '',
            seo_description: metadata.seo_description ?? '',
            default_locale: metadata.default_locale ?? 'en',
            show_help_center: metadata.show_help_center ?? false,
            enable_public_pages: metadata.enable_public_pages ?? false,
        },
        email_settings: {
            driver: emailSettings.driver ?? 'smtp',
            host: emailSettings.host ?? '',
            port: emailSettings.port ?? '',
            encryption: emailSettings.encryption ?? 'tls',
            username: emailSettings.username ?? '',
            password: '',
            from_address: emailSettings.from_address ?? '',
            from_name: emailSettings.from_name ?? organization.company_name ?? '',
            reply_to: emailSettings.reply_to ?? '',
            queue: emailSettings.queue ?? false,
        },
        sms_settings: {
            provider: smsSettings.provider ?? 'log',
            twilio_sid: smsSettings.twilio_sid ?? '',
            twilio_token: '',
            twilio_from: smsSettings.twilio_from ?? '',
            bulksmsbd_api_key: '',
            bulksmsbd_sender_id: smsSettings.bulksmsbd_sender_id ?? '',
            elitbuzz_username: smsSettings.elitbuzz_username ?? '',
            elitbuzz_password: '',
            elitbuzz_sender_id: smsSettings.elitbuzz_sender_id ?? '',
            sslwireless_api_token: '',
            sslwireless_sid: smsSettings.sslwireless_sid ?? '',
            sslwireless_sender_id: smsSettings.sslwireless_sender_id ?? '',
        },
        notification_channels: {
            email: notificationChannels.email ?? true,
            sms: notificationChannels.sms ?? false,
            slack: notificationChannels.slack ?? false,
        },
        integrations: {
            slack_webhook: integrations.slack_webhook ?? '',
            teams_webhook: integrations.teams_webhook ?? '',
            statuspage_url: integrations.statuspage_url ?? '',
        },
        advanced: {
            maintenance_mode: advanced.maintenance_mode ?? false,
            session_timeout: advanced.session_timeout ?? 60,
        },
        logo_light: null,
        logo_dark: null,
        favicon: null,
        login_background: null,
    });

    const { data, setData, processing, errors, reset, setDefaults } = form;

    const updateNested = (group, key, value) => {
        setData(group, {
            ...data[group],
            [key]: value,
        });
    };

    const handleFileChange = (key, event) => {
        const file = event.target.files?.[0] ?? null;
        setData(key, file);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        form.post(route('settings.system.update'), {
            method: 'put',
            forceFormData: true,
            onSuccess: () => {
                showToast.success('System settings updated successfully.');
                setDefaults(data);
                reset('logo_light', 'logo_dark', 'favicon', 'login_background');
            },
        });
    };

    return (
        <>
            <Head title={title} />
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card shadow="sm">
                        <CardHeader className="flex flex-col items-start gap-1">
                            <h2 className="text-xl font-semibold">Organization</h2>
                            <p className="text-sm text-default-500">Company identity, contact channels, and regional defaults.</p>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <div className={fieldClass}>
                                <Input
                                    label="Company name"
                                    value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    isRequired
                                    isInvalid={Boolean(errors.company_name)}
                                    errorMessage={errors.company_name}
                                />
                                <Input
                                    label="Legal name"
                                    value={data.legal_name}
                                    onChange={(e) => setData('legal_name', e.target.value)}
                                    isInvalid={Boolean(errors.legal_name)}
                                    errorMessage={errors.legal_name}
                                />
                            </div>
                            <div className={fieldClass}>
                                <Input
                                    label="Tagline"
                                    value={data.tagline}
                                    onChange={(e) => setData('tagline', e.target.value)}
                                    isInvalid={Boolean(errors.tagline)}
                                    errorMessage={errors.tagline}
                                />
                                <Input
                                    label="Primary contact"
                                    value={data.contact_person}
                                    onChange={(e) => setData('contact_person', e.target.value)}
                                    isInvalid={Boolean(errors.contact_person)}
                                    errorMessage={errors.contact_person}
                                />
                            </div>
                            <div className={fieldClass}>
                                <Input
                                    label="Support email"
                                    type="email"
                                    value={data.support_email}
                                    onChange={(e) => setData('support_email', e.target.value)}
                                    isRequired
                                    isInvalid={Boolean(errors.support_email)}
                                    errorMessage={errors.support_email}
                                />
                                <Input
                                    label="Support phone"
                                    value={data.support_phone}
                                    onChange={(e) => setData('support_phone', e.target.value)}
                                    isInvalid={Boolean(errors.support_phone)}
                                    errorMessage={errors.support_phone}
                                />
                            </div>
                            <div className={fieldClass}>
                                <Input
                                    label="Website"
                                    type="url"
                                    value={data.website_url}
                                    onChange={(e) => setData('website_url', e.target.value)}
                                    isInvalid={Boolean(errors.website_url)}
                                    errorMessage={errors.website_url}
                                />
                                <Input
                                    label="Timezone"
                                    value={data.timezone}
                                    onChange={(e) => setData('timezone', e.target.value)}
                                    isInvalid={Boolean(errors.timezone)}
                                    errorMessage={errors.timezone}
                                />
                            </div>
                            <div className={fieldClass}>
                                <Input
                                    label="Address line 1"
                                    value={data.address_line1}
                                    onChange={(e) => setData('address_line1', e.target.value)}
                                    isInvalid={Boolean(errors.address_line1)}
                                    errorMessage={errors.address_line1}
                                />
                                <Input
                                    label="Address line 2"
                                    value={data.address_line2}
                                    onChange={(e) => setData('address_line2', e.target.value)}
                                    isInvalid={Boolean(errors.address_line2)}
                                    errorMessage={errors.address_line2}
                                />
                            </div>
                            <div className={fieldClass}>
                                <Input
                                    label="City"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                    isInvalid={Boolean(errors.city)}
                                    errorMessage={errors.city}
                                />
                                <Input
                                    label="State / Province"
                                    value={data.state}
                                    onChange={(e) => setData('state', e.target.value)}
                                    isInvalid={Boolean(errors.state)}
                                    errorMessage={errors.state}
                                />
                            </div>
                            <div className={fieldClass}>
                                <Input
                                    label="Postal code"
                                    value={data.postal_code}
                                    onChange={(e) => setData('postal_code', e.target.value)}
                                    isInvalid={Boolean(errors.postal_code)}
                                    errorMessage={errors.postal_code}
                                />
                                <Input
                                    label="Country"
                                    value={data.country}
                                    onChange={(e) => setData('country', e.target.value)}
                                    isInvalid={Boolean(errors.country)}
                                    errorMessage={errors.country}
                                />
                            </div>
                        </CardBody>
                    </Card>

                    <Card shadow="sm">
                        <CardHeader className="flex flex-col items-start gap-1">
                            <h2 className="text-xl font-semibold">Branding & assets</h2>
                            <p className="text-sm text-default-500">Control theme colors and upload logos, favicons, and background art.</p>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <div className={fieldClass}>
                                <Input
                                    label="Primary color"
                                    type="color"
                                    value={data.branding.primary_color}
                                    onChange={(e) => updateNested('branding', 'primary_color', e.target.value)}
                                    isInvalid={Boolean(errors['branding.primary_color'])}
                                    errorMessage={errors['branding.primary_color']}
                                />
                                <Input
                                    label="Accent color"
                                    type="color"
                                    value={data.branding.accent_color}
                                    onChange={(e) => updateNested('branding', 'accent_color', e.target.value)}
                                    isInvalid={Boolean(errors['branding.accent_color'])}
                                    errorMessage={errors['branding.accent_color']}
                                />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <FileInput
                                    label="Light logo"
                                    description="PNG, SVG, or WebP up to 4MB"
                                    error={errors.logo_light}
                                    onChange={(event) => handleFileChange('logo_light', event)}
                                />
                                <FileInput
                                    label="Dark logo"
                                    description="PNG, SVG, or WebP up to 4MB"
                                    error={errors.logo_dark}
                                    onChange={(event) => handleFileChange('logo_dark', event)}
                                />
                                <FileInput
                                    label="Favicon"
                                    description="ICO, PNG, or SVG up to 2MB"
                                    error={errors.favicon}
                                    onChange={(event) => handleFileChange('favicon', event)}
                                />
                                <FileInput
                                    label="Login background"
                                    description="PNG or JPG up to 8MB"
                                    error={errors.login_background}
                                    onChange={(event) => handleFileChange('login_background', event)}
                                />
                            </div>
                        </CardBody>
                    </Card>

                    <Card shadow="sm">
                        <CardHeader className="flex flex-col items-start gap-1">
                            <h2 className="text-xl font-semibold">Communications</h2>
                            <p className="text-sm text-default-500">Email infrastructure, notifications, and integrations.</p>
                        </CardHeader>
                        <CardBody className="space-y-6">
                            <Tabs aria-label="Messaging settings" color="secondary">
                                <Tab key="email" title="Email server">
                                    <div className="space-y-4">
                                        <div className={fieldClass}>
                                            <Input
                                                label="Driver"
                                                value={data.email_settings.driver}
                                                onChange={(e) => updateNested('email_settings', 'driver', e.target.value)}
                                                isInvalid={Boolean(errors['email_settings.driver'])}
                                                errorMessage={errors['email_settings.driver']}
                                            />
                                            <Input
                                                label="Host"
                                                value={data.email_settings.host}
                                                onChange={(e) => updateNested('email_settings', 'host', e.target.value)}
                                                isInvalid={Boolean(errors['email_settings.host'])}
                                                errorMessage={errors['email_settings.host']}
                                            />
                                        </div>
                                        <div className={fieldClass}>
                                            <Input
                                                label="Port"
                                                type="number"
                                                value={data.email_settings.port}
                                                onChange={(e) => updateNested('email_settings', 'port', e.target.value)}
                                                isInvalid={Boolean(errors['email_settings.port'])}
                                                errorMessage={errors['email_settings.port']}
                                            />
                                            <Input
                                                label="Encryption"
                                                value={data.email_settings.encryption}
                                                onChange={(e) => updateNested('email_settings', 'encryption', e.target.value)}
                                                isInvalid={Boolean(errors['email_settings.encryption'])}
                                                errorMessage={errors['email_settings.encryption']}
                                            />
                                        </div>
                                        <div className={fieldClass}>
                                            <Input
                                                label="Username"
                                                value={data.email_settings.username}
                                                onChange={(e) => updateNested('email_settings', 'username', e.target.value)}
                                                isInvalid={Boolean(errors['email_settings.username'])}
                                                errorMessage={errors['email_settings.username']}
                                            />
                                            <Input
                                                label="Password"
                                                type="password"
                                                value={data.email_settings.password}
                                                onChange={(e) => updateNested('email_settings', 'password', e.target.value)}
                                                description={emailSettings.password_set ? 'Password already configured. Leave blank to keep existing credentials.' : undefined}
                                                isInvalid={Boolean(errors['email_settings.password'])}
                                                errorMessage={errors['email_settings.password']}
                                            />
                                        </div>
                                        <div className={fieldClass}>
                                            <Input
                                                label="From address"
                                                type="email"
                                                value={data.email_settings.from_address}
                                                onChange={(e) => updateNested('email_settings', 'from_address', e.target.value)}
                                                isInvalid={Boolean(errors['email_settings.from_address'])}
                                                errorMessage={errors['email_settings.from_address']}
                                            />
                                            <Input
                                                label="From name"
                                                value={data.email_settings.from_name}
                                                onChange={(e) => updateNested('email_settings', 'from_name', e.target.value)}
                                                isInvalid={Boolean(errors['email_settings.from_name'])}
                                                errorMessage={errors['email_settings.from_name']}
                                            />
                                        </div>
                                        <div className={fieldClass}>
                                            <Input
                                                label="Reply-to"
                                                type="email"
                                                value={data.email_settings.reply_to}
                                                onChange={(e) => updateNested('email_settings', 'reply_to', e.target.value)}
                                                isInvalid={Boolean(errors['email_settings.reply_to'])}
                                                errorMessage={errors['email_settings.reply_to']}
                                            />
                                            <div className="flex items-center gap-3">
                                                <Switch
                                                    isSelected={Boolean(data.email_settings.queue)}
                                                    onValueChange={(value) => updateNested('email_settings', 'queue', value)}
                                                >
                                                    Queue emails for background delivery
                                                </Switch>
                                            </div>
                                        </div>
                                        <TestEmailButton emailSettings={data.email_settings} />
                                    </div>
                                </Tab>
                                <Tab key="sms" title="SMS Gateway">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-default-700 mb-2 block">Provider</label>
                                            <select
                                                className="w-full px-3 py-2 text-sm border border-default-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                value={data.sms_settings.provider}
                                                onChange={(e) => updateNested('sms_settings', 'provider', e.target.value)}
                                            >
                                                <option value="log">Log (Development Only)</option>
                                                <option value="twilio">Twilio</option>
                                                <option value="bulksmsbd">BulkSMS BD</option>
                                                <option value="elitbuzz">ElitBuzz</option>
                                                <option value="ssl_wireless">SSL Wireless</option>
                                            </select>
                                        </div>

                                        {/* Twilio Settings */}
                                        {data.sms_settings.provider === 'twilio' && (
                                            <>
                                                <div className={fieldClass}>
                                                    <Input
                                                        label="Twilio Account SID"
                                                        value={data.sms_settings.twilio_sid}
                                                        onChange={(e) => updateNested('sms_settings', 'twilio_sid', e.target.value)}
                                                        description="Your Twilio Account SID"
                                                        isInvalid={Boolean(errors['sms_settings.twilio_sid'])}
                                                        errorMessage={errors['sms_settings.twilio_sid']}
                                                    />
                                                    <Input
                                                        label="Twilio Auth Token"
                                                        type="password"
                                                        value={data.sms_settings.twilio_token}
                                                        onChange={(e) => updateNested('sms_settings', 'twilio_token', e.target.value)}
                                                        description={smsSettings.twilio_token_set ? 'Token stored. Leave blank to keep current.' : 'Your Twilio Auth Token'}
                                                        isInvalid={Boolean(errors['sms_settings.twilio_token'])}
                                                        errorMessage={errors['sms_settings.twilio_token']}
                                                    />
                                                </div>
                                                <Input
                                                    label="From Phone Number"
                                                    value={data.sms_settings.twilio_from}
                                                    onChange={(e) => updateNested('sms_settings', 'twilio_from', e.target.value)}
                                                    description="Your Twilio phone number (e.g., +1234567890)"
                                                    placeholder="+1234567890"
                                                    isInvalid={Boolean(errors['sms_settings.twilio_from'])}
                                                    errorMessage={errors['sms_settings.twilio_from']}
                                                />
                                            </>
                                        )}

                                        {/* BulkSMS BD Settings */}
                                        {data.sms_settings.provider === 'bulksmsbd' && (
                                            <div className={fieldClass}>
                                                <Input
                                                    label="API Key"
                                                    type="password"
                                                    value={data.sms_settings.bulksmsbd_api_key}
                                                    onChange={(e) => updateNested('sms_settings', 'bulksmsbd_api_key', e.target.value)}
                                                    description={smsSettings.bulksmsbd_api_key_set ? 'API Key stored. Leave blank to keep current.' : 'Your BulkSMS BD API Key'}
                                                    isInvalid={Boolean(errors['sms_settings.bulksmsbd_api_key'])}
                                                    errorMessage={errors['sms_settings.bulksmsbd_api_key']}
                                                />
                                                <Input
                                                    label="Sender ID"
                                                    value={data.sms_settings.bulksmsbd_sender_id}
                                                    onChange={(e) => updateNested('sms_settings', 'bulksmsbd_sender_id', e.target.value)}
                                                    description="Your registered sender ID"
                                                    isInvalid={Boolean(errors['sms_settings.bulksmsbd_sender_id'])}
                                                    errorMessage={errors['sms_settings.bulksmsbd_sender_id']}
                                                />
                                            </div>
                                        )}

                                        {/* ElitBuzz Settings */}
                                        {data.sms_settings.provider === 'elitbuzz' && (
                                            <>
                                                <div className={fieldClass}>
                                                    <Input
                                                        label="Username"
                                                        value={data.sms_settings.elitbuzz_username}
                                                        onChange={(e) => updateNested('sms_settings', 'elitbuzz_username', e.target.value)}
                                                        description="Your ElitBuzz username"
                                                        isInvalid={Boolean(errors['sms_settings.elitbuzz_username'])}
                                                        errorMessage={errors['sms_settings.elitbuzz_username']}
                                                    />
                                                    <Input
                                                        label="Password/API Key"
                                                        type="password"
                                                        value={data.sms_settings.elitbuzz_password}
                                                        onChange={(e) => updateNested('sms_settings', 'elitbuzz_password', e.target.value)}
                                                        description={smsSettings.elitbuzz_password_set ? 'Password stored. Leave blank to keep current.' : 'Your ElitBuzz password or API key'}
                                                        isInvalid={Boolean(errors['sms_settings.elitbuzz_password'])}
                                                        errorMessage={errors['sms_settings.elitbuzz_password']}
                                                    />
                                                </div>
                                                <Input
                                                    label="Sender ID"
                                                    value={data.sms_settings.elitbuzz_sender_id}
                                                    onChange={(e) => updateNested('sms_settings', 'elitbuzz_sender_id', e.target.value)}
                                                    description="Your registered sender ID"
                                                    isInvalid={Boolean(errors['sms_settings.elitbuzz_sender_id'])}
                                                    errorMessage={errors['sms_settings.elitbuzz_sender_id']}
                                                />
                                            </>
                                        )}

                                        {/* SSL Wireless Settings */}
                                        {data.sms_settings.provider === 'ssl_wireless' && (
                                            <>
                                                <div className={fieldClass}>
                                                    <Input
                                                        label="API Token"
                                                        type="password"
                                                        value={data.sms_settings.sslwireless_api_token}
                                                        onChange={(e) => updateNested('sms_settings', 'sslwireless_api_token', e.target.value)}
                                                        description={smsSettings.sslwireless_api_token_set ? 'Token stored. Leave blank to keep current.' : 'Your SSL Wireless API Token'}
                                                        isInvalid={Boolean(errors['sms_settings.sslwireless_api_token'])}
                                                        errorMessage={errors['sms_settings.sslwireless_api_token']}
                                                    />
                                                    <Input
                                                        label="SID"
                                                        value={data.sms_settings.sslwireless_sid}
                                                        onChange={(e) => updateNested('sms_settings', 'sslwireless_sid', e.target.value)}
                                                        description="Your SSL Wireless SID"
                                                        isInvalid={Boolean(errors['sms_settings.sslwireless_sid'])}
                                                        errorMessage={errors['sms_settings.sslwireless_sid']}
                                                    />
                                                </div>
                                                <Input
                                                    label="Sender ID"
                                                    value={data.sms_settings.sslwireless_sender_id}
                                                    onChange={(e) => updateNested('sms_settings', 'sslwireless_sender_id', e.target.value)}
                                                    description="Your registered sender ID"
                                                    isInvalid={Boolean(errors['sms_settings.sslwireless_sender_id'])}
                                                    errorMessage={errors['sms_settings.sslwireless_sender_id']}
                                                />
                                            </>
                                        )}

                                        {data.sms_settings.provider !== 'log' && (
                                            <TestSmsButton smsSettings={data.sms_settings} />
                                        )}

                                        {data.sms_settings.provider === 'log' && (
                                            <p className="text-xs text-warning">
                                                ⚠️ Log provider is for development only. SMS messages will be written to the log file instead of being sent.
                                            </p>
                                        )}
                                    </div>
                                </Tab>
                                <Tab key="notifications" title="Notifications">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <Switch
                                            isSelected={Boolean(data.notification_channels.email)}
                                            onValueChange={(value) => updateNested('notification_channels', 'email', value)}
                                        >
                                            Email alerts
                                        </Switch>
                                        <Switch
                                            isSelected={Boolean(data.notification_channels.sms)}
                                            onValueChange={(value) => updateNested('notification_channels', 'sms', value)}
                                        >
                                            SMS notifications
                                        </Switch>
                                        <Switch
                                            isSelected={Boolean(data.notification_channels.slack)}
                                            onValueChange={(value) => updateNested('notification_channels', 'slack', value)}
                                        >
                                            Slack broadcasts
                                        </Switch>
                                    </div>
                                    <div className="mt-6 space-y-4">
                                        <Input
                                            label="Slack webhook"
                                            value={data.integrations.slack_webhook}
                                            onChange={(e) => updateNested('integrations', 'slack_webhook', e.target.value)}
                                            isInvalid={Boolean(errors['integrations.slack_webhook'])}
                                            errorMessage={errors['integrations.slack_webhook']}
                                        />
                                        <Input
                                            label="Microsoft Teams webhook"
                                            value={data.integrations.teams_webhook}
                                            onChange={(e) => updateNested('integrations', 'teams_webhook', e.target.value)}
                                            isInvalid={Boolean(errors['integrations.teams_webhook'])}
                                            errorMessage={errors['integrations.teams_webhook']}
                                        />
                                        <Input
                                            label="Statuspage URL"
                                            value={data.integrations.statuspage_url}
                                            onChange={(e) => updateNested('integrations', 'statuspage_url', e.target.value)}
                                            isInvalid={Boolean(errors['integrations.statuspage_url'])}
                                            errorMessage={errors['integrations.statuspage_url']}
                                        />
                                    </div>
                                </Tab>
                            </Tabs>
                        </CardBody>
                    </Card>

                    <Card shadow="sm">
                        <CardHeader className="flex flex-col items-start gap-1">
                            <h2 className="text-xl font-semibold">Metadata & advanced</h2>
                            <p className="text-sm text-default-500">Search optimization, locale defaults, and runtime controls.</p>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <Input
                                label="SEO title"
                                value={data.metadata.seo_title}
                                onChange={(e) => updateNested('metadata', 'seo_title', e.target.value)}
                                isInvalid={Boolean(errors['metadata.seo_title'])}
                                errorMessage={errors['metadata.seo_title']}
                            />
                            <Textarea
                                label="SEO description"
                                minRows={3}
                                value={data.metadata.seo_description}
                                onChange={(e) => updateNested('metadata', 'seo_description', e.target.value)}
                                isInvalid={Boolean(errors['metadata.seo_description'])}
                                errorMessage={errors['metadata.seo_description']}
                            />
                            <div className={fieldClass}>
                                <Input
                                    label="Default locale"
                                    value={data.metadata.default_locale}
                                    onChange={(e) => updateNested('metadata', 'default_locale', e.target.value)}
                                    isInvalid={Boolean(errors['metadata.default_locale'])}
                                    errorMessage={errors['metadata.default_locale']}
                                />
                                <Input
                                    label="Session timeout (minutes)"
                                    type="number"
                                    value={data.advanced.session_timeout}
                                    onChange={(e) => updateNested('advanced', 'session_timeout', e.target.value)}
                                    isInvalid={Boolean(errors['advanced.session_timeout'])}
                                    errorMessage={errors['advanced.session_timeout']}
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <Switch
                                    isSelected={Boolean(data.metadata.show_help_center)}
                                    onValueChange={(value) => updateNested('metadata', 'show_help_center', value)}
                                >
                                    Show help center links inside the app
                                </Switch>
                                <Switch
                                    isSelected={Boolean(data.metadata.enable_public_pages)}
                                    onValueChange={(value) => updateNested('metadata', 'enable_public_pages', value)}
                                >
                                    Enable public landing pages
                                </Switch>
                                <Switch
                                    isSelected={Boolean(data.advanced.maintenance_mode)}
                                    onValueChange={(value) => updateNested('advanced', 'maintenance_mode', value)}
                                >
                                    Maintenance mode (tenant only)
                                </Switch>
                            </div>
                        </CardBody>
                    </Card>

                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                        <Button type="button" variant="light" onPress={() => reset()}>
                            Reset
                        </Button>
                        <Button color="primary" type="submit" isLoading={processing}>
                            Save changes
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
};

const FileInput = ({ label, description, error, onChange }) => (
    <label className="block border border-dashed border-default-200 rounded-lg p-4">
        <span className="text-sm font-medium text-default-600">{label}</span>
        <input type="file" className="mt-2 block w-full text-sm" onChange={onChange} />
        {description && <p className="text-xs text-default-400 mt-1">{description}</p>}
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </label>
);

SystemSettings.layout = (page) => <App>{page}</App>;

export default SystemSettings;
