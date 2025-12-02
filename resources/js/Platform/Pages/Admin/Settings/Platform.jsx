import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import App from '@/Layouts/App.jsx';
import axios from 'axios';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Input,
  Switch,
  Textarea,
} from '@heroui/react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils.jsx';

const mainCardStyle = {
  border: `var(--borderWidth, 2px) solid transparent`,
  borderRadius: `var(--borderRadius, 12px)`,
  fontFamily: `var(--fontFamily, "Inter")`,
  background: `linear-gradient(135deg, 
    var(--theme-content1, #FAFAFA) 20%, 
    var(--theme-content2, #F4F4F5) 10%, 
    var(--theme-content3, #F1F3F4) 20%)`,
};

const headerStyle = {
  borderColor: `var(--theme-divider, #E4E4E7)`,
  background: `linear-gradient(135deg, 
    color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
    color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
};

const sectionCardStyle = {
  background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
  border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
  borderRadius: `var(--borderRadius, 12px)`,
};

const fieldClass = 'grid grid-cols-1 md:grid-cols-2 gap-4';

const FileInput = ({ label, description, error, onChange, currentUrl, accept }) => {
  const [preview, setPreview] = useState(currentUrl);

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
    onChange(event);
  };

  return (
    <div className="block border border-dashed border-default-200 rounded-lg p-4 hover:border-default-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <span className="text-sm font-medium text-default-700">{label}</span>
          {description && <p className="text-xs text-default-400 mt-1">{description}</p>}
        </div>
        {preview && (
          <div className="shrink-0">
            <img src={preview} alt={label} className="w-16 h-16 object-contain rounded border border-default-200" />
          </div>
        )}
      </div>
      <label className="mt-3 block">
        <input 
          type="file" 
          className="block w-full text-sm text-default-600
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-medium
            file:bg-primary-50 file:text-primary-700
            hover:file:bg-primary-100
            cursor-pointer"
          onChange={handleChange}
          accept={accept}
        />
      </label>
      {error && <p className="text-xs text-danger mt-2">{error}</p>}
      {currentUrl && !preview && (
        <p className="text-xs text-success mt-2">✓ Current file uploaded</p>
      )}
    </div>
  );
};

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
    square_logo: null,
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    setData('processing', true);
    
    const formData = new FormData();
    
    // Add all flat fields
    formData.append('site_name', data.site_name);
    formData.append('legal_name', data.legal_name || '');
    formData.append('tagline', data.tagline || '');
    formData.append('support_email', data.support_email);
    formData.append('support_phone', data.support_phone || '');
    formData.append('marketing_url', data.marketing_url || '');
    formData.append('status_page_url', data.status_page_url || '');
    
    // Add branding fields
    formData.append('branding[primary_color]', data.branding.primary_color);
    formData.append('branding[accent_color]', data.branding.accent_color);
    
    // Add metadata fields
    formData.append('metadata[hero_title]', data.metadata.hero_title || '');
    formData.append('metadata[hero_subtitle]', data.metadata.hero_subtitle || '');
    formData.append('metadata[meta_title]', data.metadata.meta_title || '');
    formData.append('metadata[meta_description]', data.metadata.meta_description || '');
    
    // Add meta keywords array
    data.metadata.meta_keywords.forEach((keyword, index) => {
      formData.append(`metadata[meta_keywords][${index}]`, keyword);
    });
    
    // Add email settings
    Object.keys(data.email_settings).forEach(key => {
      if (data.email_settings[key]) {
        formData.append(`email_settings[${key}]`, data.email_settings[key]);
      }
    });
    
    // Add legal URLs
    Object.keys(data.legal).forEach(key => {
      if (data.legal[key]) {
        formData.append(`legal[${key}]`, data.legal[key]);
      }
    });
    
    // Add integrations
    Object.keys(data.integrations).forEach(key => {
      if (data.integrations[key]) {
        formData.append(`integrations[${key}]`, data.integrations[key]);
      }
    });
    
    // Add admin preferences
    formData.append('admin_preferences[show_beta_features]', data.admin_preferences.show_beta_features ? '1' : '0');
    formData.append('admin_preferences[enable_impersonation]', data.admin_preferences.enable_impersonation ? '1' : '0');
    
    // Add file uploads
    if (data.logo) formData.append('logo', data.logo);
    if (data.square_logo) formData.append('square_logo', data.square_logo);
    if (data.favicon) formData.append('favicon', data.favicon);
    if (data.social) formData.append('social', data.social);

    try {
      const response = await axios.post(
        route('admin.settings.platform.store'),
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      
      if (response.data) {
        showToast.success('Platform settings updated successfully');
        const nextKeywordString = (data.metadata?.meta_keywords ?? []).join(', ');
        setKeywordDefaults(nextKeywordString);
        setKeywordsInput(nextKeywordString);
        
        // Reset file inputs
        setData({
          ...data,
          logo: null,
          square_logo: null,
          favicon: null,
          social: null,
        });
        
        // Reload the page to get fresh data
        router.reload({ only: ['platformSettings'] });
      }
    } catch (error) {
      console.error('Platform Settings - Error', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[Object.keys(error.response?.data?.errors || {})[0]]?.[0] ||
                          'Failed to update platform settings';
      showToast.error(errorMessage);
    } finally {
      setData('processing', false);
    }
  };

  const handleReset = () => {
    reset();
    setKeywordsInput(keywordDefaults);
  };

  return (
    <>
      <Head title={`${title} - Admin`} />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6">
        <Card className="transition-all duration-200" style={mainCardStyle}>
          <CardHeader className="border-b p-0" style={headerStyle}>
            <div className="p-6 w-full">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="p-3 rounded-xl flex items-center justify-center"
                    style={{
                      background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                      borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                      borderWidth: `var(--borderWidth, 2px)`,
                      borderRadius: `var(--borderRadius, 12px)`,
                    }}
                  >
                    <Cog6ToothIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-foreground">Platform Settings</h4>
                    <p className="text-sm text-default-500">
                      Configure core platform identity, branding, integrations, and admin experience.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="light" onPress={handleReset}>
                    Reset
                  </Button>
                  <Button color="primary" type="submit" form="platform-settings-form" isLoading={processing}>
                    Save changes
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardBody className="p-6">
            <form id="platform-settings-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Platform Identity */}
              <div className="p-4 space-y-4" style={sectionCardStyle}>
                <div>
                  <h5 className="text-base font-semibold text-foreground">Platform Identity</h5>
                  <p className="text-xs text-default-500">
                    Core details shown on admin login, marketing pages, and transactional mail.
                  </p>
                </div>
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
              </div>

              {/* Branding & Assets */}
              <div className="p-4 space-y-4" style={sectionCardStyle}>
                <div>
                  <h5 className="text-base font-semibold text-foreground">Branding & Visual Assets</h5>
                  <p className="text-xs text-default-500">Upload logos, icons, and define brand colors used across the platform and public pages.</p>
                </div>
                
                {/* Brand Colors */}
                <div className="space-y-3">
                  <h6 className="text-sm font-medium text-default-700">Brand Colors</h6>
                  <div className={fieldClass}>
                    <Input
                      label="Primary color"
                      type="color"
                      value={data.branding.primary_color}
                      onChange={(event) => updateNested('branding', 'primary_color', event.target.value)}
                      description="Main brand color used for buttons, links, and accents"
                      isInvalid={Boolean(errors['branding.primary_color'])}
                      errorMessage={errors['branding.primary_color']}
                    />
                    <Input
                      label="Accent color"
                      type="color"
                      value={data.branding.accent_color}
                      onChange={(event) => updateNested('branding', 'accent_color', event.target.value)}
                      description="Secondary color for highlights and emphasis"
                      isInvalid={Boolean(errors['branding.accent_color'])}
                      errorMessage={errors['branding.accent_color']}
                    />
                  </div>
                </div>

                {/* Logo Assets */}
                <div className="space-y-3">
                  <h6 className="text-sm font-medium text-default-700">Logo & Icon Assets</h6>
                  
                  {/* Theme-aware Logos */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-default-500 mb-3">Theme-Aware Logos (Automatically switches based on light/dark mode)</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FileInput
                          label="Logo (Light Mode)"
                          description="Logo for light backgrounds. SVG, PNG, or WebP (max 4MB). Recommended: 200x50px"
                          error={errors.logo_light}
                          onChange={(event) => handleFileChange('logo_light', event)}
                          currentUrl={branding.logo_light}
                          accept="image/svg+xml,image/png,image/webp"
                        />
                        <FileInput
                          label="Logo (Dark Mode)"
                          description="Logo for dark backgrounds. SVG, PNG, or WebP (max 4MB). Recommended: 200x50px"
                          error={errors.logo_dark}
                          onChange={(event) => handleFileChange('logo_dark', event)}
                          currentUrl={branding.logo_dark}
                          accept="image/svg+xml,image/png,image/webp"
                        />
                      </div>
                    </div>
                    
                    {/* Legacy Logo (Fallback) */}
                    <div>
                      <p className="text-xs text-default-500 mb-3">Legacy Logo (Used as fallback if theme-specific logos are not uploaded)</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FileInput
                          label="Horizontal Logo (Legacy)"
                          description="Wide logo for headers and navigation. SVG, PNG, or WebP (max 4MB). Recommended: 200x50px"
                          error={errors.logo}
                          onChange={(event) => handleFileChange('logo', event)}
                          currentUrl={branding.logo}
                          accept="image/svg+xml,image/png,image/webp"
                        />
                        <FileInput
                          label="Square Logo"
                          description="Compact logo for mobile menus and small spaces. SVG, PNG, or WebP (max 4MB). Recommended: 100x100px"
                          error={errors.square_logo}
                          onChange={(event) => handleFileChange('square_logo', event)}
                          currentUrl={branding.square_logo}
                          accept="image/svg+xml,image/png,image/webp"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Assets */}
                <div className="space-y-3">
                  <h6 className="text-sm font-medium text-default-700">Browser & Social Assets</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FileInput
                      label="Favicon"
                      description="Browser tab icon. ICO, SVG, or PNG (max 2MB). Recommended: 32x32px or 64x64px"
                      error={errors.favicon}
                      onChange={(event) => handleFileChange('favicon', event)}
                      currentUrl={branding.favicon}
                      accept="image/x-icon,image/svg+xml,image/png,image/webp"
                    />
                    <FileInput
                      label="Social Media Preview"
                      description="Image for social sharing (Open Graph). PNG or JPG (max 4MB). Recommended: 1200x630px"
                      error={errors.social}
                      onChange={(event) => handleFileChange('social', event)}
                      currentUrl={branding.social}
                      accept="image/png,image/jpeg,image/webp"
                    />
                  </div>
                </div>

                {/* Usage Guidelines */}
                <div className="p-3 bg-default-50 rounded-lg border border-default-200">
                  <h6 className="text-xs font-semibold text-default-700 mb-2">Asset Usage Guidelines</h6>
                  <ul className="text-xs text-default-600 space-y-1">
                    <li>• <strong>Light/Dark Mode Logos:</strong> Automatically switch based on user's theme preference. Upload both for optimal branding across all themes.</li>
                    <li>• <strong>Legacy Logo:</strong> Used as fallback when theme-specific logos are not available. Also used in contexts without theme support.</li>
                    <li>• <strong>Square Logo:</strong> Used in mobile navigation, app icons, and compact layouts</li>
                    <li>• <strong>Favicon:</strong> Appears in browser tabs and bookmarks</li>
                    <li>• <strong>Social Preview:</strong> Shown when sharing platform links on social media</li>
                    <li>• <strong>Format Tip:</strong> SVG files provide the best quality at any size and can adapt to both themes</li>
                  </ul>
                </div>
              </div>

              {/* Marketing Content & Metadata */}
              <div className="p-4 space-y-4" style={sectionCardStyle}>
                <div>
                  <h5 className="text-base font-semibold text-foreground">Marketing Content & Metadata</h5>
                  <p className="text-xs text-default-500">Landing hero copy plus SEO metadata for public pages.</p>
                </div>
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
              </div>

              {/* Email Infrastructure */}
              <div className="p-4 space-y-4" style={sectionCardStyle}>
                <div>
                  <h5 className="text-base font-semibold text-foreground">Email Infrastructure</h5>
                  <p className="text-xs text-default-500">Outbound email credentials for platform notifications.</p>
                </div>
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
                    description={
                      email.password_set ? 'Credentials already stored. Leave blank to keep current password.' : undefined
                    }
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
              </div>

              {/* Legal & Trust Center */}
              <div className="p-4 space-y-4" style={sectionCardStyle}>
                <div>
                  <h5 className="text-base font-semibold text-foreground">Legal & Trust Center</h5>
                  <p className="text-xs text-default-500">Surface canonical policy links for tenants.</p>
                </div>
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
              </div>

              {/* Integrations */}
              <div className="p-4 space-y-4" style={sectionCardStyle}>
                <div>
                  <h5 className="text-base font-semibold text-foreground">Integrations</h5>
                  <p className="text-xs text-default-500">API keys and IDs for shared platform tooling.</p>
                </div>
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
              </div>

              {/* Admin Experience */}
              <div className="p-4 space-y-4" style={sectionCardStyle}>
                <div>
                  <h5 className="text-base font-semibold text-foreground">Admin Experience</h5>
                  <p className="text-xs text-default-500">Optional controls that affect the admin workspace.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
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
                </div>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

PlatformSettings.layout = (page) => <App>{page}</App>;

export default PlatformSettings;
