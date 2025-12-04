import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import InstallationLayout from '@/Layouts/InstallationLayout';
import { Card, CardHeader, CardBody, CardFooter, Button, Input, Select, SelectItem } from '@heroui/react';
import { Cog6ToothIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

export default function PlatformSettings({ platformConfig = {} }) {
    const [testingEmail, setTestingEmail] = useState(false);
    const [emailTestResult, setEmailTestResult] = useState(null);
    const [testingMail, setTestingMail] = useState('');
    const [testingSms, setTestingSms] = useState(false);
    const [smsTestResult, setSmsTestResult] = useState(null);
    const [testingSmsNumber, setTestingSmsNumber] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        app_name: platformConfig.app_name || 'Aero Enterprise Suite',
        app_url: platformConfig.app_url || window.location.origin,
        mail_mailer: platformConfig.mail_mailer || 'smtp',
        mail_host: platformConfig.mail_host || 'smtp.mailtrap.io',
        mail_port: platformConfig.mail_port || '2525',
        mail_username: platformConfig.mail_username || '',
        mail_password: platformConfig.mail_password || '',
        mail_encryption: platformConfig.mail_encryption || 'tls',
        mail_from_address: platformConfig.mail_from_address || 'noreply@aero-enterprise-suite.com',
        mail_from_name: platformConfig.mail_from_name || 'Aero Enterprise Suite',
        sms_provider: platformConfig.sms_provider || 'twilio',
        sms_twilio_sid: platformConfig.sms_twilio_sid || '',
        sms_twilio_token: platformConfig.sms_twilio_token || '',
        sms_twilio_from: platformConfig.sms_twilio_from || '',
        sms_nexmo_key: platformConfig.sms_nexmo_key || '',
        sms_nexmo_secret: platformConfig.sms_nexmo_secret || '',
        sms_nexmo_from: platformConfig.sms_nexmo_from || '',
    });

    const handleTestEmail = async () => {
        if (!testingMail) {
            showToast.warning('Please enter an email address to test');
            return;
        }

        setTestingEmail(true);
        setEmailTestResult(null);

        try {
            const response = await axios.post(route('installation.test-email'), {
                ...data,
                test_email: testingMail,
            });

            if (response.data.success) {
                setEmailTestResult({ success: true, message: response.data.message });
                showToast.success('Test email sent successfully!');
            } else {
                setEmailTestResult({ success: false, message: response.data.message });
                showToast.error('Failed to send test email');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Email test failed';
            setEmailTestResult({ success: false, message });
            showToast.error(message);
        } finally {
            setTestingEmail(false);
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
                    // Navigate to next step after short delay
                    setTimeout(() => {
                        router.visit(route('installation.admin'));
                    }, 500);
                },
                onError: (errors) => reject(Object.values(errors)),
                preserveState: true,
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
                                    <Input
                                        label="Application Name"
                                        placeholder="Aero Enterprise Suite"
                                        value={data.app_name}
                                        onValueChange={(value) => setData('app_name', value)}
                                        isInvalid={!!errors.app_name}
                                        errorMessage={errors.app_name}
                                        isRequired
                                        description="This name will be displayed throughout the platform"
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

                                    <Input
                                        type="email"
                                        label="From Email Address"
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
                                        description="Name displayed as the sender of emails"
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    {/* Email Test Section */}
                                    <div className="border border-divider rounded-lg p-4 bg-default-50/50">
                                        <h4 className="text-sm font-semibold text-foreground mb-3">Test Email Configuration</h4>
                                        <div className="flex flex-col gap-3">
                                            <Input
                                                type="email"
                                                placeholder="test@example.com"
                                                value={testingMail}
                                                onValueChange={setTestingMail}
                                                label="Test Email Address"
                                                classNames={{ inputWrapper: "bg-white dark:bg-default-100" }}
                                            />
                                            <Button
                                                type="button"
                                                color="secondary"
                                                variant="flat"
                                                onPress={handleTestEmail}
                                                isLoading={testingEmail}
                                                isDisabled={!testingMail || testingEmail}
                                            >
                                                Send Test Email
                                            </Button>
                                            
                                            {emailTestResult && (
                                                <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                                                    emailTestResult.success
                                                        ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                                                        : 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
                                                }`}>
                                                    {emailTestResult.success ? (
                                                        <CheckCircleIcon className="w-5 h-5 text-success-600 flex-shrink-0" />
                                                    ) : (
                                                        <XCircleIcon className="w-5 h-5 text-danger-600 flex-shrink-0" />
                                                    )}
                                                    <p className={`text-sm ${
                                                        emailTestResult.success 
                                                            ? 'text-success-800 dark:text-success-200' 
                                                            : 'text-danger-800 dark:text-danger-200'
                                                    }`}>
                                                        {emailTestResult.message}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
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

                           
                        </div>
                    </CardBody>

                    <CardFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-t border-divider px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                        <Button
                            as="a"
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
        </InstallationLayout>
    );
}
