import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import App from '@/Layouts/App';
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
} from '@heroui/react';
import { showToast } from '@/utils/toastUtils';

const fieldClass = 'grid grid-cols-1 md:grid-cols-2 gap-4';

const getInitial = (payload = {}) => payload ?? {};

const SystemSettings = () => {
    const { title = 'System Settings', systemSettings = {} } = usePage().props;
    const organization = getInitial(systemSettings.organization);
    const branding = getInitial(systemSettings.branding);
    const metadata = getInitial(systemSettings.metadata);
    const emailSettings = getInitial(systemSettings.email_settings);
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
