import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Button, Input, Select, SelectItem, Tabs, Tab } from '@heroui/react';
import { 
    Cog6ToothIcon, 
    CheckCircleIcon,
    EnvelopeIcon,
    BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

export default function Application({ title, timezones, licenseEmail }) {
    const [themeRadius, setThemeRadius] = useState('lg');
    const [activeTab, setActiveTab] = useState('general');
    const [formData, setFormData] = useState({
        app_name: 'Aero Enterprise Suite',
        app_url: window.location.origin,
        timezone: 'UTC',
        company_name: '',
        company_email: '',
        company_phone: '',
        mail_mailer: 'smtp',
        mail_host: '',
        mail_port: '587',
        mail_username: '',
        mail_password: '',
        mail_encryption: 'tls',
        mail_from_address: licenseEmail || '',
        mail_from_name: 'Aero Enterprise Suite',
    });
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isTestingEmail, setIsTestingEmail] = useState(false);
    const [testEmail, setTestEmail] = useState(licenseEmail || '');

    useEffect(() => {
        const getThemeRadius = () => {
            const rootStyles = getComputedStyle(document.documentElement);
            const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
            const radiusValue = parseInt(borderRadius);
            if (radiusValue === 0) return 'none';
            if (radiusValue <= 4) return 'sm';
            if (radiusValue <= 8) return 'md';
            if (radiusValue <= 12) return 'lg';
            return 'xl';
        };
        setThemeRadius(getThemeRadius());
    }, []);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleTestEmail = async () => {
        if (!testEmail) {
            showToast.error('Please enter a test email address');
            return;
        }

        const promise = new Promise(async (resolve, reject) => {
            try {
                setIsTestingEmail(true);
                const response = await axios.post(route('install.test-email'), {
                    test_email: testEmail,
                    ...formData,
                });
                
                if (response.data.success) {
                    resolve([response.data.message]);
                } else {
                    reject([response.data.message]);
                }
            } catch (error) {
                reject(error.response?.data?.message ? [error.response.data.message] : ['Email test failed']);
            } finally {
                setIsTestingEmail(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Sending test email...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleSaveAndContinue = async () => {
        setErrors({});

        const promise = new Promise(async (resolve, reject) => {
            try {
                setIsSaving(true);
                const response = await axios.post(route('install.save-application'), formData);
                
                if (response.data.success) {
                    resolve([response.data.message]);
                    setTimeout(() => {
                        router.visit(route('install.admin'));
                    }, 1000);
                } else {
                    reject([response.data.message]);
                }
            } catch (error) {
                if (error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                }
                reject(error.response?.data?.message ? [error.response.data.message] : ['Failed to save settings']);
            } finally {
                setIsSaving(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Saving settings...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    return (
        <>
            <Head title={title} />
            
            <div className="min-h-screen bg-gradient-to-br from-background via-content1 to-background flex items-center justify-center p-4">
                <div className="w-full max-w-5xl">
                    {/* Progress Indicator */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-primary font-semibold">Step 4 of 6</span>
                            <span className="text-default-500">Application Settings</span>
                        </div>
                        <div className="mt-2 h-2 bg-default-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '66.66%' }}></div>
                        </div>
                    </div>

                    {/* Main Card */}
                    <ThemedCard>
                        <ThemedCardHeader>
                            <div className="flex items-center gap-3">
                                <Cog6ToothIcon className="w-8 h-8 text-primary" />
                                <div>
                                    <h2 className="text-2xl font-semibold">Application Settings</h2>
                                    <p className="text-sm text-default-600 mt-1">
                                        Configure your application and email settings
                                    </p>
                                </div>
                            </div>
                        </ThemedCardHeader>
                        <ThemedCardBody>
                            <Tabs 
                                selectedKey={activeTab} 
                                onSelectionChange={setActiveTab}
                                radius={themeRadius}
                                classNames={{
                                    tabList: "bg-default-100",
                                    cursor: "bg-primary",
                                    tab: "data-[selected=true]:text-primary-foreground"
                                }}
                            >
                                <Tab key="general" title={
                                    <div className="flex items-center gap-2">
                                        <BuildingOfficeIcon className="w-4 h-4" />
                                        <span>General</span>
                                    </div>
                                }>
                                    <div className="space-y-4 mt-6">
                                        <Input
                                            label="Application Name"
                                            placeholder="Aero Enterprise Suite"
                                            value={formData.app_name}
                                            onValueChange={(value) => handleInputChange('app_name', value)}
                                            isInvalid={!!errors.app_name}
                                            errorMessage={errors.app_name}
                                            isRequired
                                            radius={themeRadius}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />

                                        <Input
                                            label="Application URL"
                                            placeholder="https://yourdomain.com"
                                            value={formData.app_url}
                                            onValueChange={(value) => handleInputChange('app_url', value)}
                                            isInvalid={!!errors.app_url}
                                            errorMessage={errors.app_url}
                                            isRequired
                                            radius={themeRadius}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />

                                        <Select
                                            label="Timezone"
                                            placeholder="Select timezone"
                                            selectedKeys={[formData.timezone]}
                                            onSelectionChange={(keys) => handleInputChange('timezone', Array.from(keys)[0])}
                                            isInvalid={!!errors.timezone}
                                            errorMessage={errors.timezone}
                                            isRequired
                                            radius={themeRadius}
                                        >
                                            {timezones?.map((tz) => (
                                                <SelectItem key={tz} value={tz}>
                                                    {tz}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <div className="pt-4">
                                            <h3 className="text-lg font-semibold mb-4">Company Information (Optional)</h3>
                                            
                                            <div className="space-y-4">
                                                <Input
                                                    label="Company Name"
                                                    placeholder="Your Company Name"
                                                    value={formData.company_name}
                                                    onValueChange={(value) => handleInputChange('company_name', value)}
                                                    radius={themeRadius}
                                                    classNames={{ inputWrapper: "bg-default-100" }}
                                                />

                                                <Input
                                                    type="email"
                                                    label="Company Email"
                                                    placeholder="info@company.com"
                                                    value={formData.company_email}
                                                    onValueChange={(value) => handleInputChange('company_email', value)}
                                                    radius={themeRadius}
                                                    classNames={{ inputWrapper: "bg-default-100" }}
                                                />

                                                <Input
                                                    type="tel"
                                                    label="Company Phone"
                                                    placeholder="+1 234 567 8900"
                                                    value={formData.company_phone}
                                                    onValueChange={(value) => handleInputChange('company_phone', value)}
                                                    radius={themeRadius}
                                                    classNames={{ inputWrapper: "bg-default-100" }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="email" title={
                                    <div className="flex items-center gap-2">
                                        <EnvelopeIcon className="w-4 h-4" />
                                        <span>Email (Required)</span>
                                    </div>
                                }>
                                    <div className="space-y-4 mt-6">
                                        <Select
                                            label="Mail Driver"
                                            placeholder="Select mail driver"
                                            selectedKeys={[formData.mail_mailer]}
                                            onSelectionChange={(keys) => handleInputChange('mail_mailer', Array.from(keys)[0])}
                                            isRequired
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="smtp" value="smtp">SMTP</SelectItem>
                                            <SelectItem key="sendmail" value="sendmail">Sendmail</SelectItem>
                                            <SelectItem key="mailgun" value="mailgun">Mailgun</SelectItem>
                                            <SelectItem key="ses" value="ses">Amazon SES</SelectItem>
                                            <SelectItem key="postmark" value="postmark">Postmark</SelectItem>
                                            <SelectItem key="log" value="log">Log (Testing Only)</SelectItem>
                                        </Select>

                                        {formData.mail_mailer === 'smtp' && (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="md:col-span-2">
                                                        <Input
                                                            label="SMTP Host"
                                                            placeholder="smtp.gmail.com"
                                                            value={formData.mail_host}
                                                            onValueChange={(value) => handleInputChange('mail_host', value)}
                                                            isInvalid={!!errors.mail_host}
                                                            errorMessage={errors.mail_host}
                                                            isRequired
                                                            radius={themeRadius}
                                                            classNames={{ inputWrapper: "bg-default-100" }}
                                                        />
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        label="Port"
                                                        placeholder="587"
                                                        value={formData.mail_port}
                                                        onValueChange={(value) => handleInputChange('mail_port', value)}
                                                        isRequired
                                                        radius={themeRadius}
                                                        classNames={{ inputWrapper: "bg-default-100" }}
                                                    />
                                                </div>

                                                <Select
                                                    label="Encryption"
                                                    selectedKeys={[formData.mail_encryption]}
                                                    onSelectionChange={(keys) => handleInputChange('mail_encryption', Array.from(keys)[0])}
                                                    radius={themeRadius}
                                                >
                                                    <SelectItem key="tls" value="tls">TLS</SelectItem>
                                                    <SelectItem key="ssl" value="ssl">SSL</SelectItem>
                                                </Select>

                                                <Input
                                                    label="SMTP Username"
                                                    placeholder="your-email@gmail.com"
                                                    value={formData.mail_username}
                                                    onValueChange={(value) => handleInputChange('mail_username', value)}
                                                    isInvalid={!!errors.mail_username}
                                                    errorMessage={errors.mail_username}
                                                    isRequired
                                                    radius={themeRadius}
                                                    classNames={{ inputWrapper: "bg-default-100" }}
                                                />

                                                <Input
                                                    type="password"
                                                    label="SMTP Password"
                                                    placeholder="Enter password"
                                                    value={formData.mail_password}
                                                    onValueChange={(value) => handleInputChange('mail_password', value)}
                                                    isInvalid={!!errors.mail_password}
                                                    errorMessage={errors.mail_password}
                                                    isRequired
                                                    radius={themeRadius}
                                                    classNames={{ inputWrapper: "bg-default-100" }}
                                                />
                                            </>
                                        )}

                                        <Input
                                            type="email"
                                            label="From Email Address"
                                            placeholder="noreply@yourdomain.com"
                                            value={formData.mail_from_address}
                                            onValueChange={(value) => handleInputChange('mail_from_address', value)}
                                            isInvalid={!!errors.mail_from_address}
                                            errorMessage={errors.mail_from_address}
                                            isRequired
                                            radius={themeRadius}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />

                                        <Input
                                            label="From Name"
                                            placeholder="Aero Enterprise Suite"
                                            value={formData.mail_from_name}
                                            onValueChange={(value) => handleInputChange('mail_from_name', value)}
                                            isInvalid={!!errors.mail_from_name}
                                            errorMessage={errors.mail_from_name}
                                            isRequired
                                            radius={themeRadius}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />

                                        {/* Test Email */}
                                        <div className="pt-4 border-t border-divider">
                                            <h3 className="text-sm font-semibold mb-3">Test Email Configuration</h3>
                                            <div className="flex gap-3">
                                                <Input
                                                    type="email"
                                                    placeholder="test@example.com"
                                                    value={testEmail}
                                                    onValueChange={setTestEmail}
                                                    radius={themeRadius}
                                                    classNames={{ inputWrapper: "bg-default-100" }}
                                                />
                                                <Button
                                                    color="secondary"
                                                    variant="flat"
                                                    radius={themeRadius}
                                                    onPress={handleTestEmail}
                                                    isLoading={isTestingEmail}
                                                >
                                                    Send Test
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Tab>
                            </Tabs>

                            {/* Actions */}
                            <div className="flex justify-between pt-6 mt-6 border-t border-divider">
                                <Button
                                    variant="flat"
                                    radius={themeRadius}
                                    onPress={() => router.visit(route('install.database'))}
                                    isDisabled={isSaving}
                                >
                                    Back
                                </Button>
                                <Button
                                    color="primary"
                                    radius={themeRadius}
                                    onPress={handleSaveAndContinue}
                                    isLoading={isSaving}
                                    endContent={!isSaving && <CheckCircleIcon className="w-5 h-5" />}
                                >
                                    {isSaving ? 'Saving...' : 'Save & Continue'}
                                </Button>
                            </div>
                        </ThemedCardBody>
                    </ThemedCard>
                </div>
            </div>
        </>
    );
}
