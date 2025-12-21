import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import App from '@/Layouts/App';
import axios from 'axios';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Input,
  Switch,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';
import { Cog6ToothIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
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
      const response = await axios.post(route('admin.settings.platform.test-email'), {
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

  const hasSettings = emailSettings?.host && emailSettings?.from_address;

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
      const response = await axios.post(route('admin.settings.platform.test-sms'), {
        phone: testPhone,
      });

      if (response.data.success) {
        showToast.success(response.data.message);
        onOpenChange(false);
        setTestPhone('');
      }
    } catch (error) {
      let message = 'Failed to send test SMS';
      
      if (error.response?.data?.message) {
        message = error.response.data.message;
        
        if (message.includes('credentials') || message.includes('Credentials')) {
          message = 'SMS credentials not configured or invalid. Please check your provider settings.';
        } else if (message.includes('provider') || message.includes('Provider')) {
          message = 'SMS provider configuration error. Please verify your provider is correctly configured.';
        }
      }
      
      showToast.error(message, { duration: 8000 });
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
                  label="Recipient Phone"
                  placeholder="+1234567890"
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  description="Enter the phone number with country code (e.g., +1234567890)"
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
  const sms = platformSettings.sms_settings ?? {};
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
      verify_peer: email.verify_peer ?? true,
    },
    sms_settings: {
      provider: sms.provider ?? 'log',
      twilio_sid: sms.twilio_sid ?? '',
      twilio_token: '',
      twilio_from: sms.twilio_from ?? '',
      bulksmsbd_api_key: '',
      bulksmsbd_sender_id: sms.bulksmsbd_sender_id ?? '',
      elitbuzz_username: sms.elitbuzz_username ?? '',
      elitbuzz_password: '',
      elitbuzz_sender_id: sms.elitbuzz_sender_id ?? '',
      sslwireless_api_token: '',
      sslwireless_sid: sms.sslwireless_sid ?? '',
      sslwireless_sender_id: sms.sslwireless_sender_id ?? '',
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
      const value = data.email_settings[key];
      // Handle boolean values explicitly (verify_peer can be false)
      if (typeof value === 'boolean') {
        formData.append(`email_settings[${key}]`, value ? '1' : '0');
      } else if (value) {
        formData.append(`email_settings[${key}]`, value);
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
                <div className="p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-700">
                  <Switch
                    isSelected={!data.email_settings.verify_peer}
                    onValueChange={(checked) => updateNested('email_settings', 'verify_peer', !checked)}
                  >
                    <span className="text-sm">Skip SSL Certificate Verification</span>
                  </Switch>
                  <p className="text-xs text-warning-600 dark:text-warning-400 mt-1">
                    Enable this if your mail server uses a shared hosting certificate (e.g., *.web-hosting.com). 
                    This is common on cPanel/shared hosts where the SSL cert doesn't match your domain.
                  </p>
                </div>
                <TestEmailButton emailSettings={data.email_settings} />
              </div>

              {/* SMS Infrastructure */}
              <div className="p-4 space-y-4" style={sectionCardStyle}>
                <div>
                  <h5 className="text-base font-semibold text-foreground">SMS Infrastructure</h5>
                  <p className="text-xs text-default-500">SMS gateway credentials for phone notifications and verification.</p>
                </div>
                <div className={fieldClass}>
                  <div>
                    <label className="text-sm font-medium text-default-700 mb-2 block">Provider</label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-default-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={data.sms_settings.provider}
                      onChange={(event) => updateNested('sms_settings', 'provider', event.target.value)}
                    >
                      <option value="log">Log (Development Only)</option>
                      <option value="twilio">Twilio</option>
                      <option value="bulksmsbd">BulkSMS BD</option>
                      <option value="elitbuzz">ElitBuzz</option>
                      <option value="ssl_wireless">SSL Wireless</option>
                    </select>
                  </div>
                </div>

                {/* Twilio Settings */}
                {data.sms_settings.provider === 'twilio' && (
                  <>
                    <div className={fieldClass}>
                      <Input
                        label="Twilio Account SID"
                        value={data.sms_settings.twilio_sid}
                        onChange={(event) => updateNested('sms_settings', 'twilio_sid', event.target.value)}
                        description="Your Twilio Account SID"
                      />
                      <Input
                        label="Twilio Auth Token"
                        type="password"
                        value={data.sms_settings.twilio_token}
                        onChange={(event) => updateNested('sms_settings', 'twilio_token', event.target.value)}
                        description={sms.twilio_token_set ? 'Token stored. Leave blank to keep current.' : 'Your Twilio Auth Token'}
                      />
                    </div>
                    <Input
                      label="From Phone Number"
                      value={data.sms_settings.twilio_from}
                      onChange={(event) => updateNested('sms_settings', 'twilio_from', event.target.value)}
                      description="Your Twilio phone number (e.g., +1234567890)"
                      placeholder="+1234567890"
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
                      onChange={(event) => updateNested('sms_settings', 'bulksmsbd_api_key', event.target.value)}
                      description={sms.bulksmsbd_api_key_set ? 'API Key stored. Leave blank to keep current.' : 'Your BulkSMS BD API Key'}
                    />
                    <Input
                      label="Sender ID"
                      value={data.sms_settings.bulksmsbd_sender_id}
                      onChange={(event) => updateNested('sms_settings', 'bulksmsbd_sender_id', event.target.value)}
                      description="Your registered sender ID"
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
                        onChange={(event) => updateNested('sms_settings', 'elitbuzz_username', event.target.value)}
                        description="Your ElitBuzz username"
                      />
                      <Input
                        label="Password/API Key"
                        type="password"
                        value={data.sms_settings.elitbuzz_password}
                        onChange={(event) => updateNested('sms_settings', 'elitbuzz_password', event.target.value)}
                        description={sms.elitbuzz_password_set ? 'Password stored. Leave blank to keep current.' : 'Your ElitBuzz password or API key'}
                      />
                    </div>
                    <Input
                      label="Sender ID"
                      value={data.sms_settings.elitbuzz_sender_id}
                      onChange={(event) => updateNested('sms_settings', 'elitbuzz_sender_id', event.target.value)}
                      description="Your registered sender ID"
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
                        onChange={(event) => updateNested('sms_settings', 'sslwireless_api_token', event.target.value)}
                        description={sms.sslwireless_api_token_set ? 'Token stored. Leave blank to keep current.' : 'Your SSL Wireless API Token'}
                      />
                      <Input
                        label="SID"
                        value={data.sms_settings.sslwireless_sid}
                        onChange={(event) => updateNested('sms_settings', 'sslwireless_sid', event.target.value)}
                        description="Your SSL Wireless SID"
                      />
                    </div>
                    <Input
                      label="Sender ID"
                      value={data.sms_settings.sslwireless_sender_id}
                      onChange={(event) => updateNested('sms_settings', 'sslwireless_sender_id', event.target.value)}
                      description="Your registered sender ID"
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
