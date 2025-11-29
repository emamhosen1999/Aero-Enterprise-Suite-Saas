import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import App from '@/Layouts/App.jsx';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Switch,
  Textarea,
} from '@heroui/react';
import { showToast } from '@/utils/toastUtils';

const fieldClass = 'grid grid-cols-1 md:grid-cols-2 gap-4';

const PlatformSettings = () => {
  const { title = 'Platform Settings', platformSettings = {} } = usePage().props;

  const site = platformSettings.site ?? {};
  const branding = platformSettings.branding ?? {};
  const metadata = platformSettings.metadata ?? {};
  const email = platformSettings.email_settings ?? {};
  const legal = platformSettings.legal ?? {};
  const integrations = platformSettings.integrations ?? {};
  const adminPreferences = platformSettings.admin_preferences ?? {};

  const initialKeywords = (metadata.meta_keywords ?? []).join(', ');
  const [keywordsInput, setKeywordsInput] = useState(initialKeywords);
  const [keywordDefaults, setKeywordDefaults] = useState(initialKeywords);

  const form = useForm({
    site_name: site.name ?? '',
    legal_name: site.legal_name ?? '',
    tagline: site.tagline ?? '',
    support_email: site.support_email ?? '',
    support_phone: site.support_phone ?? '',
    marketing_url: site.marketing_url ?? '',
    status_page_url: site.status_page_url ?? '',
    branding: {
      primary_color: branding.primary_color ?? '#0f172a',
      accent_color: branding.accent_color ?? '#6366f1',
    },
    metadata: {
      hero_title: metadata.hero_title ?? '',
      hero_subtitle: metadata.hero_subtitle ?? '',
      meta_title: metadata.meta_title ?? '',
      meta_description: metadata.meta_description ?? '',
      meta_keywords: metadata.meta_keywords ?? [],
    },
    email_settings: {
      driver: email.driver ?? 'smtp',
      host: email.host ?? '',
      port: email.port ?? '',
      encryption: email.encryption ?? 'tls',
      username: email.username ?? '',
      password: '',
      from_address: email.from_address ?? '',
      from_name: email.from_name ?? site.name ?? '',
      reply_to: email.reply_to ?? '',
    },
    legal: {
      terms_url: legal.terms_url ?? '',
      privacy_url: legal.privacy_url ?? '',
      cookies_url: legal.cookies_url ?? '',
    },
    integrations: {
      intercom_app_id: integrations.intercom_app_id ?? '',
      segment_key: integrations.segment_key ?? '',
      statuspage_id: integrations.statuspage_id ?? '',
    },
    admin_preferences: {
      show_beta_features: Boolean(adminPreferences.show_beta_features ?? false),
      enable_impersonation: Boolean(adminPreferences.enable_impersonation ?? false),
    },
    logo: null,
    favicon: null,
    social: null,
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

  const handleKeywordsChange = (value) => {
    setKeywordsInput(value);
    const keywords = value
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    updateNested('metadata', 'meta_keywords', keywords);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    form.post(route('admin.settings.platform.update'), {
      method: 'put',
      forceFormData: true,
      onSuccess: () => {
        showToast.success('Platform settings updated successfully.');
        const nextKeywordString = (data.metadata?.meta_keywords ?? []).join(', ');
        setKeywordDefaults(nextKeywordString);
        setKeywordsInput(nextKeywordString);
        setDefaults({ ...data, logo: null, favicon: null, social: null });
        reset('logo', 'favicon', 'social');
      },
    });
  };

  const handleReset = () => {
    reset();
    setKeywordsInput(keywordDefaults);
  };

  return (
    <>
      <Head title={title} />
      <div className="py-8 px-4 sm:px-6 lg:px-10 max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card shadow="sm">
            <CardHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">Platform identity</h2>
              <p className="text-sm text-default-500">
                Core details shown on admin login, marketing pages, and transactional mail.
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className={fieldClass}>
                <Input
                  label="Site name"
                  value={data.site_name}
                  onChange={(event) => setData('site_name', event.target.value)}
                  isRequired
                  isInvalid={Boolean(errors.site_name)}
                  errorMessage={errors.site_name}
                />
                <Input
                  label="Legal name"
                  value={data.legal_name}
                  onChange={(event) => setData('legal_name', event.target.value)}
                  isInvalid={Boolean(errors.legal_name)}
                  errorMessage={errors.legal_name}
                />
              </div>
              <div className={fieldClass}>
                <Input
                  label="Tagline"
                  value={data.tagline}
                  onChange={(event) => setData('tagline', event.target.value)}
                  isInvalid={Boolean(errors.tagline)}
                  errorMessage={errors.tagline}
                />
                <Input
                  label="Support email"
                  type="email"
                  value={data.support_email}
                  onChange={(event) => setData('support_email', event.target.value)}
                  isRequired
                  isInvalid={Boolean(errors.support_email)}
                  errorMessage={errors.support_email}
                />
              </div>
              <div className={fieldClass}>
                <Input
                  label="Support phone"
                  value={data.support_phone}
                  onChange={(event) => setData('support_phone', event.target.value)}
                  isInvalid={Boolean(errors.support_phone)}
                  errorMessage={errors.support_phone}
                />
                <Input
                  label="Marketing site URL"
                  type="url"
                  value={data.marketing_url}
                  onChange={(event) => setData('marketing_url', event.target.value)}
                  isInvalid={Boolean(errors.marketing_url)}
                  errorMessage={errors.marketing_url}
                />
              </div>
              <div className={fieldClass}>
                <Input
                  label="Status page URL"
                  type="url"
                  value={data.status_page_url}
                  onChange={(event) => setData('status_page_url', event.target.value)}
                  isInvalid={Boolean(errors.status_page_url)}
                  errorMessage={errors.status_page_url}
                />
              </div>
            </CardBody>
          </Card>

          <Card shadow="sm">
            <CardHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">Branding & assets</h2>
              <p className="text-sm text-default-500">Colors and uploadable assets reused across admin surfaces.</p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className={fieldClass}>
                <Input
                  label="Primary color"
                  type="color"
                  value={data.branding.primary_color}
                  onChange={(event) => updateNested('branding', 'primary_color', event.target.value)}
                  isInvalid={Boolean(errors['branding.primary_color'])}
                  errorMessage={errors['branding.primary_color']}
                />
                <Input
                  label="Accent color"
                  type="color"
                  value={data.branding.accent_color}
                  onChange={(event) => updateNested('branding', 'accent_color', event.target.value)}
                  isInvalid={Boolean(errors['branding.accent_color'])}
                  errorMessage={errors['branding.accent_color']}
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <FileInput
                  label="Logo"
                  description="SVG, PNG, or WebP up to 4MB"
                  error={errors.logo}
                  onChange={(event) => handleFileChange('logo', event)}
                />
                <FileInput
                  label="Favicon"
                  description="ICO, SVG, or PNG up to 2MB"
                  error={errors.favicon}
                  onChange={(event) => handleFileChange('favicon', event)}
                />
                <FileInput
                  label="Social preview"
                  description="PNG or JPG up to 4MB"
                  error={errors.social}
                  onChange={(event) => handleFileChange('social', event)}
                />
              </div>
            </CardBody>
          </Card>

          <Card shadow="sm">
            <CardHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">Marketing content & metadata</h2>
              <p className="text-sm text-default-500">Landing hero copy plus SEO metadata for public pages.</p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className={fieldClass}>
                <Textarea
                  label="Hero title"
                  minRows={2}
                  value={data.metadata.hero_title}
                  onChange={(event) => updateNested('metadata', 'hero_title', event.target.value)}
                  isInvalid={Boolean(errors['metadata.hero_title'])}
                  errorMessage={errors['metadata.hero_title']}
                />
                <Textarea
                  label="Hero subtitle"
                  minRows={2}
                  value={data.metadata.hero_subtitle}
                  onChange={(event) => updateNested('metadata', 'hero_subtitle', event.target.value)}
                  isInvalid={Boolean(errors['metadata.hero_subtitle'])}
                  errorMessage={errors['metadata.hero_subtitle']}
                />
              </div>
              <div className={fieldClass}>
                <Input
                  label="Meta title"
                  value={data.metadata.meta_title}
                  onChange={(event) => updateNested('metadata', 'meta_title', event.target.value)}
                  isInvalid={Boolean(errors['metadata.meta_title'])}
                  errorMessage={errors['metadata.meta_title']}
                />
                <Textarea
                  label="Meta description"
                  minRows={2}
                  value={data.metadata.meta_description}
                  onChange={(event) => updateNested('metadata', 'meta_description', event.target.value)}
                  isInvalid={Boolean(errors['metadata.meta_description'])}
                  errorMessage={errors['metadata.meta_description']}
                />
              </div>
              <Input
                label="Meta keywords"
                description="Comma separated (e.g. hrms, workforce platform)"
                value={keywordsInput}
                onChange={(event) => handleKeywordsChange(event.target.value)}
                isInvalid={Boolean(errors['metadata.meta_keywords'])}
                errorMessage={errors['metadata.meta_keywords']}
              />
            </CardBody>
          </Card>

          <Card shadow="sm">
            <CardHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">Email infrastructure</h2>
              <p className="text-sm text-default-500">Outbound email credentials for platform notifications.</p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className={fieldClass}>
                <Input
                  label="Driver"
                  value={data.email_settings.driver}
                  onChange={(event) => updateNested('email_settings', 'driver', event.target.value)}
                  isInvalid={Boolean(errors['email_settings.driver'])}
                  errorMessage={errors['email_settings.driver']}
                />
                <Input
                  label="Host"
                  value={data.email_settings.host}
                  onChange={(event) => updateNested('email_settings', 'host', event.target.value)}
                  isInvalid={Boolean(errors['email_settings.host'])}
                  errorMessage={errors['email_settings.host']}
                />
              </div>
              <div className={fieldClass}>
                <Input
                  label="Port"
                  type="number"
                  value={data.email_settings.port}
                  onChange={(event) => updateNested('email_settings', 'port', event.target.value)}
                  isInvalid={Boolean(errors['email_settings.port'])}
                  errorMessage={errors['email_settings.port']}
                />
                <Input
                  label="Encryption"
                  value={data.email_settings.encryption}
                  onChange={(event) => updateNested('email_settings', 'encryption', event.target.value)}
                  isInvalid={Boolean(errors['email_settings.encryption'])}
                  errorMessage={errors['email_settings.encryption']}
                />
              </div>
              <div className={fieldClass}>
                <Input
                  label="Username"
                  value={data.email_settings.username}
                  onChange={(event) => updateNested('email_settings', 'username', event.target.value)}
                  isInvalid={Boolean(errors['email_settings.username'])}
                  errorMessage={errors['email_settings.username']}
                />
                <Input
                  label="Password"
                  type="password"
                  value={data.email_settings.password}
                  onChange={(event) => updateNested('email_settings', 'password', event.target.value)}
                  description={email.password_set ? 'Credentials already stored. Leave blank to keep current password.' : undefined}
                  isInvalid={Boolean(errors['email_settings.password'])}
                  errorMessage={errors['email_settings.password']}
                />
              </div>
              <div className={fieldClass}>
                <Input
                  label="From address"
                  type="email"
                  value={data.email_settings.from_address}
                  onChange={(event) => updateNested('email_settings', 'from_address', event.target.value)}
                  isInvalid={Boolean(errors['email_settings.from_address'])}
                  errorMessage={errors['email_settings.from_address']}
                />
                <Input
                  label="From name"
                  value={data.email_settings.from_name}
                  onChange={(event) => updateNested('email_settings', 'from_name', event.target.value)}
                  isInvalid={Boolean(errors['email_settings.from_name'])}
                  errorMessage={errors['email_settings.from_name']}
                />
              </div>
              <Input
                label="Reply-to"
                type="email"
                value={data.email_settings.reply_to}
                onChange={(event) => updateNested('email_settings', 'reply_to', event.target.value)}
                isInvalid={Boolean(errors['email_settings.reply_to'])}
                errorMessage={errors['email_settings.reply_to']}
              />
            </CardBody>
          </Card>

          <Card shadow="sm">
            <CardHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">Legal & trust center</h2>
              <p className="text-sm text-default-500">Surface canonical policy links for tenants.</p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className={fieldClass}>
                <Input
                  label="Terms of service URL"
                  type="url"
                  value={data.legal.terms_url}
                  onChange={(event) => updateNested('legal', 'terms_url', event.target.value)}
                  isInvalid={Boolean(errors['legal.terms_url'])}
                  errorMessage={errors['legal.terms_url']}
                />
                <Input
                  label="Privacy policy URL"
                  type="url"
                  value={data.legal.privacy_url}
                  onChange={(event) => updateNested('legal', 'privacy_url', event.target.value)}
                  isInvalid={Boolean(errors['legal.privacy_url'])}
                  errorMessage={errors['legal.privacy_url']}
                />
              </div>
              <Input
                label="Cookie policy URL"
                type="url"
                value={data.legal.cookies_url}
                onChange={(event) => updateNested('legal', 'cookies_url', event.target.value)}
                isInvalid={Boolean(errors['legal.cookies_url'])}
                errorMessage={errors['legal.cookies_url']}
              />
            </CardBody>
          </Card>

          <Card shadow="sm">
            <CardHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">Integrations</h2>
              <p className="text-sm text-default-500">API keys and IDs for shared platform tooling.</p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className={fieldClass}>
                <Input
                  label="Intercom App ID"
                  value={data.integrations.intercom_app_id}
                  onChange={(event) => updateNested('integrations', 'intercom_app_id', event.target.value)}
                  isInvalid={Boolean(errors['integrations.intercom_app_id'])}
                  errorMessage={errors['integrations.intercom_app_id']}
                />
                <Input
                  label="Segment write key"
                  value={data.integrations.segment_key}
                  onChange={(event) => updateNested('integrations', 'segment_key', event.target.value)}
                  isInvalid={Boolean(errors['integrations.segment_key'])}
                  errorMessage={errors['integrations.segment_key']}
                />
              </div>
              <Input
                label="Statuspage ID"
                value={data.integrations.statuspage_id}
                onChange={(event) => updateNested('integrations', 'statuspage_id', event.target.value)}
                isInvalid={Boolean(errors['integrations.statuspage_id'])}
                errorMessage={errors['integrations.statuspage_id']}
              />
            </CardBody>
          </Card>

          <Card shadow="sm">
            <CardHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">Admin experience</h2>
              <p className="text-sm text-default-500">Optional controls that affect the admin workspace.</p>
            </CardHeader>
            <CardBody className="grid md:grid-cols-2 gap-4">
              <Switch
                isSelected={Boolean(data.admin_preferences.show_beta_features)}
                onValueChange={(value) => updateNested('admin_preferences', 'show_beta_features', value)}
              >
                Show beta banners and pre-release modules
              </Switch>
              <Switch
                isSelected={Boolean(data.admin_preferences.enable_impersonation)}
                onValueChange={(value) => updateNested('admin_preferences', 'enable_impersonation', value)}
              >
                Allow platform admins to impersonate tenants
              </Switch>
            </CardBody>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button type="button" variant="light" onPress={handleReset}>
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

PlatformSettings.layout = (page) => <App>{page}</App>;

export default PlatformSettings;
