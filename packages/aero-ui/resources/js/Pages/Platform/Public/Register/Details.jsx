import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button, Input, Chip, Spinner } from '@heroui/react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { hasRoute, safeRoute } from '@/utils/routeUtils';
import SafeLink from '@/Components/Common/SafeLink';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';
import AuthCard from '@/Components/UI/AuthCard.jsx';
import RegisterLayout from '@/Layouts/RegisterLayout.jsx';
import { useTheme } from '@/Context/ThemeContext.jsx';
import { useBranding } from '@/Hooks/useBranding.js';
import ProgressSteps from './components/ProgressSteps.jsx';

export default function Details({ steps = [], currentStep, savedData = {}, accountType = 'company', baseDomain = 'platform.test', existingSubdomain = null }) {
  const details = savedData?.details ?? {};
  const { data, setData, post, processing, errors, setError, clearErrors } = useForm({
    name: details.name ?? '',
    email: details.email ?? '',
    phone: details.phone ?? '',
    subdomain: details.subdomain ?? '',
    team_size: details.team_size ?? '',
  });

  // Track whether the user has manually edited the subdomain field
  const [subdomainManuallyEdited, setSubdomainManuallyEdited] = useState(
    Boolean(details.subdomain)
  );

  // Auto-fill subdomain from company name unless user has already typed one manually
  useEffect(() => {
    if (subdomainManuallyEdited) return;
    const slug = slugify(data.name);
    if (slug) {
      setData('subdomain', slug);
    }
  }, [data.name]);

  // Subdomain availability check state
  const [subdomainStatus, setSubdomainStatus] = useState({ checking: false, available: null, message: '' });
  const [subdomainCheckTimer, setSubdomainCheckTimer] = useState(null);

  const { isDark: isDarkMode } = useTheme();
  const { siteName } = useBranding();

  // Slugify helper: lowercases, replaces spaces/special chars with hyphens, strips leading/trailing hyphens
  const slugify = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '');
  const palette = {
    heading: isDarkMode ? 'text-white' : 'text-slate-900',
    copy: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    badge: isDarkMode ? 'text-slate-300' : 'text-slate-500',
    link: isDarkMode ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-slate-900',
  };

  const inputClasses = {
    inputWrapper: 'bg-white/90 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 hover:border-primary/60 focus:border-primary data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-primary/30 shadow-sm transition-colors',
    label: 'text-sm sm:text-base text-slate-700 dark:text-slate-200',
    input: 'text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
    description: 'text-xs sm:text-sm text-slate-500 dark:text-slate-400'
  };

  // Check subdomain availability with debounce
  useEffect(() => {
    if (subdomainCheckTimer) {
      clearTimeout(subdomainCheckTimer);
    }

    const subdomain = data.subdomain.trim().toLowerCase();
    
    // Reset status if empty or invalid format
    if (!subdomain || subdomain.length < 3 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subdomain)) {
      setSubdomainStatus({ checking: false, available: null, message: '' });
      return;
    }

    // Skip check if this is the user's existing subdomain (from their session)
    if (existingSubdomain && subdomain === existingSubdomain.toLowerCase()) {
      setSubdomainStatus({
        checking: false,
        available: true,
        message: 'Reserved for your registration'
      });
      return;
    }

    // Debounce the API call
    const timer = setTimeout(async () => {
      setSubdomainStatus({ checking: true, available: null, message: '' });
      
      try {
        const response = await axios.post('/api/platform/v1/check-subdomain', { subdomain });
        setSubdomainStatus({
          checking: false,
          available: response.data.available,
          message: response.data.message || (response.data.available ? 'Subdomain is available' : 'Subdomain is taken')
        });
      } catch (error) {
        // If endpoint doesn't exist yet, silently fail
        setSubdomainStatus({ checking: false, available: null, message: '' });
      }
    }, 500);

    setSubdomainCheckTimer(timer);

    return () => clearTimeout(timer);
  }, [data.subdomain, existingSubdomain]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!hasRoute('platform.register.details.store')) {
      showToast.error('Registration route not available');
      return;
    }

    clearErrors();
    post(route('platform.register.details.store'));
  };

  const personaLabel = accountType === 'individual' ? 'Your name' : 'Organization name';

  // Helper to format phone number
  const formatPhoneNumber = (value) => {
    // Remove all non-numeric characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    return cleaned;
  };

  return (
    <RegisterLayout>
      <Head title={`Workspace Details — Step 2 - ${siteName || 'aeos365'}`} />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-4 text-center">
          <p className={`text-[10px] sm:text-sm uppercase tracking-[0.3em] ${palette.badge}`}>Step 2</p>
          <h1 className={`text-2xl sm:text-4xl font-semibold ${palette.heading} px-2`}>{accountType === 'individual' ? 'Your Professional Profile' : 'Your Organisation Details'}</h1>
          <p className={`${palette.copy} text-sm sm:text-base px-2`}>This information is used to pre-configure your workspace branding, subdomain, and trial communications.</p>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <AuthCard>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <Input
              label={personaLabel}
              placeholder="Acme Manufacturing"
              value={data.name}
              onChange={(event) => setData('name', event.target.value)}
              isInvalid={Boolean(errors.name)}
              errorMessage={errors.name}
              isRequired
              variant="bordered"
              radius="md"
              classNames={inputClasses}
            />
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <Input
                type="email"
                label="Work email"
                placeholder="ops@acme.com"
                value={data.email}
                onChange={(event) => setData('email', event.target.value)}
                isInvalid={Boolean(errors.email)}
                errorMessage={errors.email}
                isRequired
                variant="bordered"
                radius="md"
                classNames={inputClasses}
              />
              <Input
                label="Phone (optional)"
                placeholder="+1 415 555 0110"
                value={data.phone}
                onChange={(event) => setData('phone', formatPhoneNumber(event.target.value))}
                isInvalid={Boolean(errors.phone)}
                errorMessage={errors.phone}
                description="International format recommended (e.g., +1 234 567 8900)"
                variant="bordered"
                radius="md"
                classNames={inputClasses}
              />
            </div>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-[2fr,1fr]">
              <Input
                label="Preferred subdomain"
                placeholder="acme"
                value={data.subdomain}
                onChange={(event) => {
                setSubdomainManuallyEdited(true);
                setData('subdomain', event.target.value.toLowerCase());
              }}
                isInvalid={Boolean(errors.subdomain) || subdomainStatus.available === false}
                errorMessage={errors.subdomain || (subdomainStatus.available === false ? subdomainStatus.message : '')}
                description={`Your workspace URL will be https://${data.subdomain || 'team'}.${baseDomain}`}
                isRequired
                endContent={
                  subdomainStatus.checking ? (
                    <Spinner size="sm" />
                  ) : subdomainStatus.available === true ? (
                    <CheckCircleIcon className="w-5 h-5 text-success" />
                  ) : subdomainStatus.available === false ? (
                    <XCircleIcon className="w-5 h-5 text-danger" />
                  ) : null
                }
                variant="bordered"
                radius="md"
                classNames={inputClasses}
              />
              <Input
                type="number"
                label="Team size"
                placeholder="120"
                value={data.team_size}
                onChange={(event) => setData('team_size', event.target.value)}
                isInvalid={Boolean(errors.team_size)}
                errorMessage={errors.team_size}
                min={1}
                variant="bordered"
                radius="md"
                classNames={inputClasses}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <SafeLink 
                route="platform.register.index" 
                className={`text-xs sm:text-sm transition-colors text-center sm:text-left ${palette.link}`}
              >
                ← Back to Account Type
              </SafeLink>
              <Button color="primary" className="bg-gradient-to-r from-blue-500 to-purple-600 w-full sm:w-auto" type="submit" isLoading={processing}>
                Continue to Module Selection
              </Button>
            </div>
          </form>
        </AuthCard>
      </section>
    </RegisterLayout>
  );
}
