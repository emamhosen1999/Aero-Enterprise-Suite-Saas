import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, CardBody, Chip } from '@heroui/react';
import AuthCard from '@/Components/AuthCard.jsx';
import RegisterLayout from '@/Layouts/RegisterLayout.jsx';
import { useTheme } from '@/Contexts/ThemeContext.jsx';
import ProgressSteps from './components/ProgressSteps.jsx';

export default function Success({ steps = [], currentStep, result = {}, baseDomain = 'platform.test' }) {
  const workspaceUrl = result.subdomain ? `https://${result.subdomain}.${baseDomain}` : null;
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';
  const palette = {
    heading: isDarkMode ? 'text-white' : 'text-slate-900',
    copy: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    badge: isDarkMode ? 'text-emerald-300' : 'text-emerald-600',
  };

  return (
    <RegisterLayout>
      <Head title="Workspace ready" />
      <section className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-center">
        <div className="space-y-4">
          <Chip color="success" variant="flat" size="lg" className={palette.badge}>Workspace live</Chip>
          <h1 className={`text-4xl font-semibold ${palette.heading}`}>Welcome to Aero Enterprise Suite.</h1>
          <p className={palette.copy}>We are provisioning your tenant and sending first-login credentials. You can jump in using the link below.</p>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <AuthCard>
          <Card className="bg-transparent border-none shadow-none">
            <CardBody className="space-y-4">
              <p className={`text-sm uppercase tracking-[0.3em] ${palette.copy}`}>Workspace</p>
              <h2 className={`text-3xl font-semibold ${palette.heading}`}>{result.name}</h2>
              {workspaceUrl && (
                <p className={`font-mono text-lg ${palette.heading}`}>{workspaceUrl}</p>
              )}
              {result.trial_ends_at && (
                <p className={`text-sm ${palette.copy}`}>Trial active until {new Date(result.trial_ends_at).toLocaleDateString()}</p>
              )}
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                {workspaceUrl && (
                  <a href={`${workspaceUrl}/login`} className="inline-flex" target="_blank" rel="noopener noreferrer">
                    <Button color="primary" className="bg-gradient-to-r from-blue-500 to-purple-600">
                      Go to workspace
                    </Button>
                  </a>
                )}
                <Link href="/">
                  <Button variant="bordered">
                    Back to home
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </AuthCard>
      </section>
    </RegisterLayout>
  );
}
