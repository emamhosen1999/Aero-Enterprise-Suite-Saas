import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, CardBody, Chip } from '@heroui/react';
import AuthCard from '@/Components/AuthCard.jsx';
import RegisterLayout from '@/Layouts/RegisterLayout.jsx';
import { useTheme } from '@/Context/ThemeContext.jsx';
import { useBranding } from '@/Hooks/useBranding.js';
import ProgressSteps from './components/ProgressSteps.jsx';

export default function Success({ steps = [], currentStep, result = {}, baseDomain = 'platform.test' }) {
  const workspaceUrl = result.subdomain ? `https://${result.subdomain}.${baseDomain}` : null;
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';
  const { siteName } = useBranding();
  const palette = {
    heading: isDarkMode ? 'text-white' : 'text-slate-900',
    copy: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    badge: isDarkMode ? 'text-emerald-300' : 'text-emerald-600',
  };

  return (
    <RegisterLayout>
      <Head title={`Workspace ready - ${siteName || 'aeos365'}`} />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-6 sm:space-y-8 text-center">
        <div className="space-y-3 sm:space-y-4">
          <Chip color="success" variant="flat" size="lg" className={`${palette.badge} text-xs sm:text-sm`}>Workspace live</Chip>
          <h1 className={`text-2xl sm:text-4xl font-semibold ${palette.heading} px-2`}>Welcome to {siteName || 'Enterprise Suite'}.</h1>
          <p className={`${palette.copy} text-sm sm:text-base px-2`}>We are provisioning your tenant and sending first-login credentials. You can jump in using the link below.</p>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <AuthCard>
          <Card className="bg-transparent border-none shadow-none">
            <CardBody className="space-y-3 sm:space-y-4">
              <p className={`text-[10px] sm:text-sm uppercase tracking-[0.3em] ${palette.copy}`}>Workspace</p>
              <h2 className={`text-xl sm:text-3xl font-semibold ${palette.heading} break-words`}>{result.name}</h2>
              {workspaceUrl && (
                <p className={`font-mono text-sm sm:text-lg ${palette.heading} break-all px-2`}>{workspaceUrl}</p>
              )}
              {result.trial_ends_at && (
                <p className={`text-xs sm:text-sm ${palette.copy}`}>Trial active until {new Date(result.trial_ends_at).toLocaleDateString()}</p>
              )}
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-3 sm:pt-4">
                {workspaceUrl && (
                  <Button as="a" href={`${workspaceUrl}/login`} target="_blank" rel="noopener noreferrer" color="primary" className="bg-gradient-to-r from-blue-500 to-purple-600 w-full sm:w-auto">
                    Go to workspace
                  </Button>
                )}
                <Button as={Link} href={route('landing')} variant="bordered" className="w-full sm:w-auto">
                  Back to home
                </Button>
              </div>
            </CardBody>
          </Card>
        </AuthCard>
      </section>
    </RegisterLayout>
  );
}
