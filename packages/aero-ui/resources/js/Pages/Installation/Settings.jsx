import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UnifiedInstallationLayout from '@/Layouts/UnifiedInstallationLayout';
import { 
    Card, 
    CardHeader, 
    CardBody, 
    CardFooter, 
    Button, 
    Input,
    Select,
    SelectItem,
    Switch,
    Tabs,
    Tab,
    Divider,
    Spinner
} from '@heroui/react';
import { 
    Cog6ToothIcon, 
    ArrowRightIcon, 
    ArrowLeftIcon,
    EnvelopeIcon,
    GlobeAltIcon,
    BuildingOfficeIcon,
    ServerIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

/**
 * Settings Page (Mode-Aware)
 * 
 * SaaS Mode: Platform Settings (site name, legal, email, SMS, drivers)
 * Standalone Mode: System Settings (company info, email, basic config)
 */
export default function Settings() {
    const { 
        mode = 'standalone',
        savedSettings = null,
        timezones = [],
        locales = []
    } = usePage().props;

    // Current step depends on mode
    const currentStep = mode === 'saas' ? 4 : 5;

    const [themeRadius, setThemeRadius] = useState('lg');
    const [activeTab, setActiveTab] = useState('basic');
    const [testingEmail, setTestingEmail] = useState(false);
    const [emailTested, setEmailTested] = useState(false);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Form data differs by mode
    const [formData, setFormData] = useState(() => {
        if (mode === 'saas') {
            return {
                // Basic
                site_name: savedSettings?.site_name || '',
                legal_name: savedSettings?.legal_name || '',
                tagline: savedSettings?.tagline || '',
                app_url: savedSettings?.app_url || window.location.origin,
                timezone: savedSettings?.timezone || 'UTC',
                locale: savedSettings?.locale || 'en',
                debug_mode: savedSettings?.debug_mode || false,
                
                // Contact
                support_email: savedSettings?.support_email || '',
                support_phone: savedSettings?.support_phone || '',
                marketing_url: savedSettings?.marketing_url || '',
                status_page_url: savedSettings?.status_page_url || '',
                
                // Email (SMTP)
                mail_driver: savedSettings?.mail_driver || 'smtp',
                mail_host: savedSettings?.mail_host || '',
                mail_port: savedSettings?.mail_port || '587',
                mail_username: savedSettings?.mail_username || '',
                mail_password: savedSettings?.mail_password || '',
                mail_encryption: savedSettings?.mail_encryption || 'tls',
                mail_from_address: savedSettings?.mail_from_address || '',
                mail_from_name: savedSettings?.mail_from_name || '',
                
                // Drivers
                queue_driver: savedSettings?.queue_driver || 'sync',
                session_driver: savedSettings?.session_driver || 'database',
                cache_driver: savedSettings?.cache_driver || 'file',
            };
        } else {
            return {
                // Basic
                company_name: savedSettings?.company_name || '',
                legal_name: savedSettings?.legal_name || '',
                tagline: savedSettings?.tagline || '',
                app_url: savedSettings?.app_url || window.location.origin,
                timezone: savedSettings?.timezone || 'UTC',
                
                // Contact
                support_email: savedSettings?.support_email || '',
                support_phone: savedSettings?.support_phone || '',
                website_url: savedSettings?.website_url || '',
                contact_person: savedSettings?.contact_person || '',
                
                // Address
                address_line1: savedSettings?.address_line1 || '',
                address_line2: savedSettings?.address_line2 || '',
                city: savedSettings?.city || '',
                state: savedSettings?.state || '',
                postal_code: savedSettings?.postal_code || '',
                country: savedSettings?.country || '',
                
                // Email (SMTP)
                mail_driver: savedSettings?.mail_driver || 'smtp',
                mail_host: savedSettings?.mail_host || '',
                mail_port: savedSettings?.mail_port || '587',
                mail_username: savedSettings?.mail_username || '',
                mail_password: savedSettings?.mail_password || '',
                mail_encryption: savedSettings?.mail_encryption || 'tls',
                mail_from_address: savedSettings?.mail_from_address || '',
                mail_from_name: savedSettings?.mail_from_name || '',
            };
        }
    });

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

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: null }));
    };

    const testEmail = async () => {
        if (!formData.mail_host || !formData.mail_from_address) {
            showToast.warning('Please fill in email configuration first');
            return;
        }

        setTestingEmail(true);
        try {
            const response = await axios.post('/install/test-email', {
                mail_driver: formData.mail_driver,
                mail_host: formData.mail_host,
                mail_port: formData.mail_port,
                mail_username: formData.mail_username,
                mail_password: formData.mail_password,
                mail_encryption: formData.mail_encryption,
                mail_from_address: formData.mail_from_address,
                mail_from_name: formData.mail_from_name,
                test_email: formData.support_email || formData.mail_from_address,
            });

            if (response.data.success) {
                setEmailTested(true);
                showToast.success('Test email sent successfully!');
            } else {
                showToast.error(response.data.message || 'Failed to send test email');
            }
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Email test failed');
        } finally {
            setTestingEmail(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (mode === 'saas') {
            if (!formData.site_name?.trim()) newErrors.site_name = 'Site name is required';
            if (!formData.support_email?.trim()) newErrors.support_email = 'Support email is required';
        } else {
            if (!formData.company_name?.trim()) newErrors.company_name = 'Company name is required';
            if (!formData.support_email?.trim()) newErrors.support_email = 'Support email is required';
        }

        if (!formData.app_url?.trim()) newErrors.app_url = 'Application URL is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = async () => {
        if (!validateForm()) {
            showToast.warning('Please fill in all required fields');
            return;
        }

        setSaving(true);
        try {
            const endpoint = mode === 'saas' ? '/install/save-platform' : '/install/save-application';
            const response = await axios.post(endpoint, formData);

            if (response.data.success) {
                router.visit('/install/admin');
            } else {
                showToast.error(response.data.message || 'Failed to save settings');
            }
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        router.visit('/install/database');
    };

    // Common timezones if not provided
    const defaultTimezones = timezones.length > 0 ? timezones : [
        'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 
        'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo',
        'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dhaka', 'Australia/Sydney'
    ];

    const pageTitle = mode === 'saas' ? 'Platform Settings' : 'System Settings';
    const pageDescription = mode === 'saas' 
        ? 'Configure your multi-tenant platform settings'
        : 'Configure your system and organization settings';

    return (
        <UnifiedInstallationLayout currentStep={currentStep} mode={mode}>
            <Head title={`Installation - ${pageTitle}`} />
            
            <Card 
                className="transition-all duration-200"
                style={{
                    border: `var(--borderWidth, 2px) solid transparent`,
                    borderRadius: `var(--borderRadius, 12px)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                    background: `linear-gradient(135deg, 
                        var(--theme-content1, #FAFAFA) 20%, 
                        var(--theme-content2, #F4F4F5) 10%, 
                        var(--theme-content3, #F1F3F4) 20%)`,
                }}
            >
                <CardHeader className="flex flex-col items-center gap-4 pt-8 pb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <Cog6ToothIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            {pageTitle}
                        </h1>
                        <p className="text-default-600">
                            {pageDescription}
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 pb-6">
                    <Tabs 
                        selectedKey={activeTab} 
                        onSelectionChange={setActiveTab}
                        variant="underlined"
                        color="primary"
                        classNames={{
                            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                            cursor: "w-full bg-primary",
                            tab: "max-w-fit px-0 h-12",
                        }}
                    >
                        <Tab 
                            key="basic" 
                            title={
                                <div className="flex items-center gap-2">
                                    <GlobeAltIcon className="w-4 h-4" />
                                    <span>Basic</span>
                                </div>
                            }
                        >
                            <div className="pt-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label={mode === 'saas' ? 'Site Name' : 'Company Name'}
                                        placeholder={mode === 'saas' ? 'Aero Enterprise Platform' : 'Your Company Name'}
                                        value={mode === 'saas' ? formData.site_name : formData.company_name}
                                        onValueChange={(v) => handleChange(mode === 'saas' ? 'site_name' : 'company_name', v)}
                                        isInvalid={!!(mode === 'saas' ? errors.site_name : errors.company_name)}
                                        errorMessage={mode === 'saas' ? errors.site_name : errors.company_name}
                                        isRequired
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Input
                                        label="Legal Name"
                                        placeholder="Legal Business Name"
                                        value={formData.legal_name}
                                        onValueChange={(v) => handleChange('legal_name', v)}
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Input
                                        label="Tagline"
                                        placeholder="Your company tagline"
                                        value={formData.tagline}
                                        onValueChange={(v) => handleChange('tagline', v)}
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Input
                                        label="Application URL"
                                        placeholder="https://your-domain.com"
                                        value={formData.app_url}
                                        onValueChange={(v) => handleChange('app_url', v)}
                                        isInvalid={!!errors.app_url}
                                        errorMessage={errors.app_url}
                                        isRequired
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Select
                                        label="Timezone"
                                        selectedKeys={[formData.timezone]}
                                        onSelectionChange={(keys) => handleChange('timezone', Array.from(keys)[0])}
                                        radius={themeRadius}
                                        classNames={{ trigger: "bg-default-100" }}
                                    >
                                        {defaultTimezones.map(tz => (
                                            <SelectItem key={tz}>{tz}</SelectItem>
                                        ))}
                                    </Select>

                                    {mode === 'saas' && (
                                        <div className="flex items-center justify-between p-4 bg-default-100 rounded-lg">
                                            <div>
                                                <p className="font-medium">Debug Mode</p>
                                                <p className="text-xs text-default-500">Show detailed errors (disable in production)</p>
                                            </div>
                                            <Switch
                                                isSelected={formData.debug_mode}
                                                onValueChange={(v) => handleChange('debug_mode', v)}
                                                color="warning"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Tab>

                        <Tab 
                            key="contact" 
                            title={
                                <div className="flex items-center gap-2">
                                    <BuildingOfficeIcon className="w-4 h-4" />
                                    <span>Contact</span>
                                </div>
                            }
                        >
                            <div className="pt-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        type="email"
                                        label="Support Email"
                                        placeholder="support@example.com"
                                        value={formData.support_email}
                                        onValueChange={(v) => handleChange('support_email', v)}
                                        isInvalid={!!errors.support_email}
                                        errorMessage={errors.support_email}
                                        isRequired
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Input
                                        label="Support Phone"
                                        placeholder="+1 (555) 123-4567"
                                        value={formData.support_phone}
                                        onValueChange={(v) => handleChange('support_phone', v)}
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    {mode === 'standalone' && (
                                        <>
                                            <Input
                                                label="Contact Person"
                                                placeholder="John Doe"
                                                value={formData.contact_person}
                                                onValueChange={(v) => handleChange('contact_person', v)}
                                                radius={themeRadius}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />

                                            <Input
                                                label="Website URL"
                                                placeholder="https://yourcompany.com"
                                                value={formData.website_url}
                                                onValueChange={(v) => handleChange('website_url', v)}
                                                radius={themeRadius}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />
                                        </>
                                    )}

                                    {mode === 'saas' && (
                                        <>
                                            <Input
                                                label="Marketing Website"
                                                placeholder="https://yourplatform.com"
                                                value={formData.marketing_url}
                                                onValueChange={(v) => handleChange('marketing_url', v)}
                                                radius={themeRadius}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />

                                            <Input
                                                label="Status Page URL"
                                                placeholder="https://status.yourplatform.com"
                                                value={formData.status_page_url}
                                                onValueChange={(v) => handleChange('status_page_url', v)}
                                                radius={themeRadius}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Address (Standalone only) */}
                                {mode === 'standalone' && (
                                    <>
                                        <Divider className="my-4" />
                                        <h4 className="font-medium text-foreground">Business Address</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Address Line 1"
                                                placeholder="123 Main Street"
                                                value={formData.address_line1}
                                                onValueChange={(v) => handleChange('address_line1', v)}
                                                radius={themeRadius}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />
                                            <Input
                                                label="Address Line 2"
                                                placeholder="Suite 100"
                                                value={formData.address_line2}
                                                onValueChange={(v) => handleChange('address_line2', v)}
                                                radius={themeRadius}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />
                                            <Input
                                                label="City"
                                                placeholder="New York"
                                                value={formData.city}
                                                onValueChange={(v) => handleChange('city', v)}
                                                radius={themeRadius}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />
                                            <Input
                                                label="State/Province"
                                                placeholder="NY"
                                                value={formData.state}
                                                onValueChange={(v) => handleChange('state', v)}
                                                radius={themeRadius}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />
                                            <Input
                                                label="Postal Code"
                                                placeholder="10001"
                                                value={formData.postal_code}
                                                onValueChange={(v) => handleChange('postal_code', v)}
                                                radius={themeRadius}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />
                                            <Input
                                                label="Country"
                                                placeholder="United States"
                                                value={formData.country}
                                                onValueChange={(v) => handleChange('country', v)}
                                                radius={themeRadius}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </Tab>

                        <Tab 
                            key="email" 
                            title={
                                <div className="flex items-center gap-2">
                                    <EnvelopeIcon className="w-4 h-4" />
                                    <span>Email</span>
                                </div>
                            }
                        >
                            <div className="pt-6 space-y-4">
                                <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-default-600">
                                        Configure SMTP settings for sending emails (password resets, notifications, etc.)
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Mail Driver"
                                        selectedKeys={[formData.mail_driver]}
                                        onSelectionChange={(keys) => handleChange('mail_driver', Array.from(keys)[0])}
                                        radius={themeRadius}
                                        classNames={{ trigger: "bg-default-100" }}
                                    >
                                        <SelectItem key="smtp">SMTP</SelectItem>
                                        <SelectItem key="sendmail">Sendmail</SelectItem>
                                        <SelectItem key="log">Log (Testing)</SelectItem>
                                    </Select>

                                    <Input
                                        label="SMTP Host"
                                        placeholder="smtp.gmail.com"
                                        value={formData.mail_host}
                                        onValueChange={(v) => handleChange('mail_host', v)}
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Input
                                        label="SMTP Port"
                                        placeholder="587"
                                        value={formData.mail_port}
                                        onValueChange={(v) => handleChange('mail_port', v)}
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Select
                                        label="Encryption"
                                        selectedKeys={[formData.mail_encryption]}
                                        onSelectionChange={(keys) => handleChange('mail_encryption', Array.from(keys)[0])}
                                        radius={themeRadius}
                                        classNames={{ trigger: "bg-default-100" }}
                                    >
                                        <SelectItem key="tls">TLS</SelectItem>
                                        <SelectItem key="ssl">SSL</SelectItem>
                                        <SelectItem key="">None</SelectItem>
                                    </Select>

                                    <Input
                                        label="SMTP Username"
                                        placeholder="your@email.com"
                                        value={formData.mail_username}
                                        onValueChange={(v) => handleChange('mail_username', v)}
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Input
                                        type="password"
                                        label="SMTP Password"
                                        placeholder="••••••••"
                                        value={formData.mail_password}
                                        onValueChange={(v) => handleChange('mail_password', v)}
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Input
                                        label="From Address"
                                        placeholder="noreply@example.com"
                                        value={formData.mail_from_address}
                                        onValueChange={(v) => handleChange('mail_from_address', v)}
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Input
                                        label="From Name"
                                        placeholder="Your Company"
                                        value={formData.mail_from_name}
                                        onValueChange={(v) => handleChange('mail_from_name', v)}
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button
                                        color="secondary"
                                        variant="flat"
                                        onPress={testEmail}
                                        isLoading={testingEmail}
                                        startContent={!testingEmail && (
                                            emailTested 
                                                ? <CheckCircleIcon className="w-4 h-4" />
                                                : <EnvelopeIcon className="w-4 h-4" />
                                        )}
                                    >
                                        {testingEmail ? 'Sending...' : emailTested ? 'Email Sent!' : 'Send Test Email'}
                                    </Button>
                                    {emailTested && (
                                        <span className="text-sm text-success">
                                            Check your inbox for the test email
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Tab>

                        {/* Drivers Tab (SaaS only) */}
                        {mode === 'saas' && (
                            <Tab 
                                key="drivers" 
                                title={
                                    <div className="flex items-center gap-2">
                                        <ServerIcon className="w-4 h-4" />
                                        <span>Drivers</span>
                                    </div>
                                }
                            >
                                <div className="pt-6 space-y-4">
                                    <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-default-600">
                                            Configure backend drivers for queue processing, sessions, and caching.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Select
                                            label="Queue Driver"
                                            selectedKeys={[formData.queue_driver]}
                                            onSelectionChange={(keys) => handleChange('queue_driver', Array.from(keys)[0])}
                                            radius={themeRadius}
                                            classNames={{ trigger: "bg-default-100" }}
                                            description="How background jobs are processed"
                                        >
                                            <SelectItem key="sync">Sync (Immediate)</SelectItem>
                                            <SelectItem key="database">Database</SelectItem>
                                            <SelectItem key="redis">Redis</SelectItem>
                                        </Select>

                                        <Select
                                            label="Session Driver"
                                            selectedKeys={[formData.session_driver]}
                                            onSelectionChange={(keys) => handleChange('session_driver', Array.from(keys)[0])}
                                            radius={themeRadius}
                                            classNames={{ trigger: "bg-default-100" }}
                                            description="How user sessions are stored"
                                        >
                                            <SelectItem key="file">File</SelectItem>
                                            <SelectItem key="database">Database</SelectItem>
                                            <SelectItem key="redis">Redis</SelectItem>
                                        </Select>

                                        <Select
                                            label="Cache Driver"
                                            selectedKeys={[formData.cache_driver]}
                                            onSelectionChange={(keys) => handleChange('cache_driver', Array.from(keys)[0])}
                                            radius={themeRadius}
                                            classNames={{ trigger: "bg-default-100" }}
                                            description="How application cache is stored"
                                        >
                                            <SelectItem key="file">File</SelectItem>
                                            <SelectItem key="database">Database</SelectItem>
                                            <SelectItem key="redis">Redis</SelectItem>
                                        </Select>
                                    </div>
                                </div>
                            </Tab>
                        )}
                    </Tabs>
                </CardBody>

                <CardFooter className="px-8 pb-8 pt-4 border-t border-divider">
                    <div className="w-full flex justify-between">
                        <Button
                            variant="flat"
                            startContent={<ArrowLeftIcon className="w-4 h-4" />}
                            onPress={handleBack}
                        >
                            Back
                        </Button>
                        <Button
                            color="primary"
                            size="lg"
                            endContent={<ArrowRightIcon className="w-5 h-5" />}
                            onPress={handleNext}
                            isLoading={saving}
                        >
                            {saving ? 'Saving...' : 'Continue'}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </UnifiedInstallationLayout>
    );
}
