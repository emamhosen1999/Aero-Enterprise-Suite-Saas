import React, { useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Input } from '@heroui/react';
import AuthCard from '@/Components/AuthCard.jsx';
import RegisterLayout from '@/Layouts/RegisterLayout.jsx';
import { useTheme } from '@/Context/ThemeContext.jsx';
import { useBranding } from '@/Hooks/useBranding.js';
import ProgressSteps from './components/ProgressSteps.jsx';

export default function AdminDetails({ steps = [], currentStep, savedData = {}, companyName = '', subdomain = '', baseDomain = 'platform.test' }) {
  const admin = savedData?.admin ?? {};
  const { data, setData, post, processing, errors } = useForm({
    name: admin.name ?? '',
    username: admin.username ?? '',
    email: admin.email ?? '',
    password: admin.password ?? '',
    password_confirmation: admin.password_confirmation ?? '',
  });

  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';
  const { siteName } = useBranding();
  
  const palette = {
    heading: isDarkMode ? 'text-white' : 'text-slate-900',
    copy: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    badge: isDarkMode ? 'text-slate-300' : 'text-slate-500',
    link: isDarkMode ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-slate-900',
  };

  // Auto-generate username from email
  useEffect(() => {
    if (data.email && !data.username) {
      const generatedUsername = data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
      setData('username', generatedUsername);
    }
  }, [data.email]);

  const handleSubmit = (event) => {
    event.preventDefault();
    post(route('platform.register.admin.store'));
  };

  return (
    <RegisterLayout>
      <Head title={`Admin details - ${siteName || 'aeos365'}`} />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-4 text-center">
          <p className={`text-[10px] sm:text-sm uppercase tracking-[0.3em] ${palette.badge}`}>Step 3</p>
          <h1 className={`text-2xl sm:text-4xl font-semibold ${palette.heading} px-2`}>Set up your admin account.</h1>
          <p className={`${palette.copy} text-sm sm:text-base px-2`}>This will be your super administrator login for {companyName}.</p>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <AuthCard>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className={`text-sm font-semibold ${palette.heading} mb-1`}>Admin Information</p>
                <p className={`text-xs ${palette.copy}`}>Your login credentials for https://{subdomain}.{baseDomain}</p>
              </div>

              <Input
                type="text"
                label="Full Name"
                placeholder="John Doe"
                value={data.name}
                onChange={(event) => setData('name', event.target.value)}
                isInvalid={Boolean(errors.name)}
                errorMessage={errors.name}
                isRequired
                classNames={{
                  label: 'text-xs sm:text-sm',
                  input: 'text-sm sm:text-base'
                }}
              />

              <Input
                type="email"
                label="Email Address"
                placeholder="admin@company.com"
                value={data.email}
                onChange={(event) => setData('email', event.target.value)}
                isInvalid={Boolean(errors.email)}
                errorMessage={errors.email}
                description="This will be your login email"
                isRequired
                classNames={{
                  label: 'text-xs sm:text-sm',
                  input: 'text-sm sm:text-base'
                }}
              />

              <Input
                type="text"
                label="Username"
                placeholder="johndoe"
                value={data.username}
                onChange={(event) => setData('username', event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                isInvalid={Boolean(errors.username)}
                errorMessage={errors.username}
                description="Used for internal identification (auto-generated from email)"
                isRequired
                classNames={{
                  label: 'text-xs sm:text-sm',
                  input: 'text-sm sm:text-base font-mono'
                }}
              />

              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                <Input
                  type="password"
                  label="Password"
                  placeholder="Create a secure password"
                  value={data.password}
                  onChange={(event) => setData('password', event.target.value)}
                  isInvalid={Boolean(errors.password)}
                  errorMessage={errors.password}
                  isRequired
                  classNames={{
                    label: 'text-xs sm:text-sm',
                    input: 'text-sm sm:text-base'
                  }}
                />
                <Input
                  type="password"
                  label="Confirm Password"
                  placeholder="Repeat your password"
                  value={data.password_confirmation}
                  onChange={(event) => setData('password_confirmation', event.target.value)}
                  isInvalid={Boolean(errors.password_confirmation)}
                  errorMessage={errors.password_confirmation}
                  isRequired
                  classNames={{
                    label: 'text-xs sm:text-sm',
                    input: 'text-sm sm:text-base'
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-2">
              <Link href={route('platform.register.details')} className={`text-xs sm:text-sm transition-colors text-center sm:text-left ${palette.link}`}>
                ← Back to company details
              </Link>
              <Button 
                type="submit" 
                color="primary" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 w-full sm:w-auto" 
                isLoading={processing}
              >
                Continue to plan selection
              </Button>
            </div>
          </form>
        </AuthCard>
      </section>
    </RegisterLayout>
  );
}
