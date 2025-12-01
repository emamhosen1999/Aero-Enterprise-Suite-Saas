import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, CardBody, Chip, Spinner, Progress } from '@heroui/react';
import AuthCard from '@/Components/AuthCard.jsx';
import RegisterLayout from '@/Layouts/RegisterLayout.jsx';
import { useTheme } from '@/Contexts/ThemeContext.jsx';
import ProgressSteps from './components/ProgressSteps.jsx';

/**
 * Human-readable step labels for provisioning process
 */
const PROVISIONING_STEPS = {
  creating_db: {
    label: 'Creating database',
    description: 'Setting up your isolated workspace database...',
    progress: 25,
  },
  migrating: {
    label: 'Configuring schema',
    description: 'Running database migrations and preparing tables...',
    progress: 50,
  },
  seeding: {
    label: 'Seeding data',
    description: 'Populating initial data and configurations...',
    progress: 75,
  },
  creating_admin: {
    label: 'Creating admin account',
    description: 'Setting up your administrator credentials...',
    progress: 90,
  },
};

/**
 * Status icons for different states
 */
const StatusIcon = ({ status }) => {
  if (status === 'active') {
    return (
      <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center">
        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }

  return <Spinner size="lg" color="primary" />;
};

export default function Provisioning({
  steps = [],
  currentStep,
  tenant = {},
  baseDomain = 'platform.test',
}) {
  const [status, setStatus] = useState(tenant.status || 'pending');
  const [provisioningStep, setProvisioningStep] = useState(tenant.provisioning_step);
  const [error, setError] = useState(null);
  const [loginUrl, setLoginUrl] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  const palette = {
    heading: isDarkMode ? 'text-white' : 'text-slate-900',
    copy: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    badge: isDarkMode ? 'text-slate-300' : 'text-slate-500',
    surface: isDarkMode
      ? 'bg-white/5 border border-white/10'
      : 'bg-white border border-slate-200 shadow-sm',
  };

  // Current step info
  const currentStepInfo = PROVISIONING_STEPS[provisioningStep] || {
    label: 'Preparing',
    description: 'Initializing your workspace...',
    progress: 10,
  };

  // Fetch status from API
  const fetchStatus = useCallback(async () => {
    if (status === 'active' || status === 'failed' || isRedirecting) {
      return;
    }

    try {
      const response = await fetch(
        route('platform.register.provisioning.status', { tenant: tenant.id }),
        {
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const data = await response.json();

      setStatus(data.status);
      setProvisioningStep(data.provisioning_step);

      if (data.is_ready && data.login_url) {
        setLoginUrl(data.login_url);
        setIsRedirecting(true);

        // Redirect after a brief delay to show success message
        setTimeout(() => {
          window.location.href = data.login_url;
        }, 2000);
      }

      if (data.has_failed) {
        setError(data.error || 'Provisioning failed. Please contact support.');
      }
    } catch (err) {
      console.error('Status fetch error:', err);
      // Don't set error state for fetch errors - keep polling
    }
  }, [tenant.id, status, isRedirecting]);

  // Poll for status updates
  useEffect(() => {
    // Initial fetch
    fetchStatus();

    // Set up polling interval (every 2 seconds)
    const interval = setInterval(fetchStatus, 2000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Render success state
  if (status === 'active') {
    return (
      <RegisterLayout>
        <Head title="Workspace Ready" />
        <section className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-center">
          <ProgressSteps steps={steps} currentStep={currentStep} />

          <AuthCard>
            <Card className="bg-transparent border-none shadow-none">
              <CardBody className="space-y-6 py-8">
                <div className="flex justify-center">
                  <StatusIcon status="active" />
                </div>
                <div className="space-y-2">
                  <Chip color="success" variant="flat" size="lg">
                    Workspace Ready
                  </Chip>
                  <h1 className={`text-3xl font-semibold ${palette.heading}`}>
                    {isRedirecting ? 'Redirecting to your workspace...' : 'Success!'}
                  </h1>
                  <p className={palette.copy}>
                    Your workspace <strong>{tenant.name}</strong> is now live and ready to use.
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${palette.surface}`}>
                  <p className={`text-sm ${palette.badge}`}>Your workspace URL</p>
                  <p className={`font-mono text-lg ${palette.heading}`}>
                    https://{tenant.subdomain}.{baseDomain}
                  </p>
                </div>

                {isRedirecting && (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    <span className={palette.copy}>Redirecting...</span>
                  </div>
                )}

                {loginUrl && !isRedirecting && (
                  <div className="flex flex-wrap justify-center gap-4">
                    <Button
                      as="a"
                      href={loginUrl}
                      color="primary"
                      className="bg-gradient-to-r from-blue-500 to-purple-600"
                    >
                      Go to workspace
                    </Button>
                    <Button as={Link} href={route('landing')} variant="bordered">
                      Back to home
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </AuthCard>
        </section>
      </RegisterLayout>
    );
  }

  // Render failed state
  if (status === 'failed') {
    return (
      <RegisterLayout>
        <Head title="Provisioning Failed" />
        <section className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-center">
          <ProgressSteps steps={steps} currentStep={currentStep} />

          <AuthCard>
            <Card className="bg-transparent border-none shadow-none">
              <CardBody className="space-y-6 py-8">
                <div className="flex justify-center">
                  <StatusIcon status="failed" />
                </div>
                <div className="space-y-2">
                  <Chip color="danger" variant="flat" size="lg">
                    Provisioning Failed
                  </Chip>
                  <h1 className={`text-3xl font-semibold ${palette.heading}`}>
                    Something went wrong
                  </h1>
                  <p className={palette.copy}>
                    We encountered an issue while setting up your workspace.
                  </p>
                </div>

                {error && (
                  <Card className="bg-red-500/10 border border-red-500/20">
                    <CardBody>
                      <p className="text-red-400 text-sm">{error}</p>
                    </CardBody>
                  </Card>
                )}

                <div className="flex flex-wrap justify-center gap-4">
                  <Button
                    as="a"
                    href="mailto:support@eos365.com"
                    color="primary"
                    className="bg-gradient-to-r from-blue-500 to-purple-600"
                  >
                    Contact Support
                  </Button>
                  <Button as={Link} href={route('platform.register.index')} variant="bordered">
                    Try Again
                  </Button>
                </div>
              </CardBody>
            </Card>
          </AuthCard>
        </section>
      </RegisterLayout>
    );
  }

  // Render provisioning state (default)
  return (
    <RegisterLayout>
      <Head title="Setting up your workspace" />
      <section className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-center">
        <div className="space-y-3">
          <p className={`text-sm uppercase tracking-[0.3em] ${palette.badge}`}>Almost there</p>
          <h1 className={`text-4xl font-semibold ${palette.heading}`}>
            Setting up your workspace
          </h1>
          <p className={palette.copy}>
            We're preparing everything for <strong>{tenant.name}</strong>. This usually takes less
            than a minute.
          </p>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <AuthCard>
          <Card className="bg-transparent border-none shadow-none">
            <CardBody className="space-y-8 py-8">
              {/* Spinner */}
              <div className="flex justify-center">
                <StatusIcon status="provisioning" />
              </div>

              {/* Current step info */}
              <div className="space-y-2">
                <Chip
                  color="primary"
                  variant="flat"
                  size="lg"
                  startContent={
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  }
                >
                  {currentStepInfo.label}
                </Chip>
                <p className={palette.copy}>{currentStepInfo.description}</p>
              </div>

              {/* Progress bar */}
              <div className="max-w-md mx-auto w-full">
                <Progress
                  aria-label="Provisioning progress"
                  value={currentStepInfo.progress}
                  color="primary"
                  showValueLabel
                  className="max-w-md"
                  classNames={{
                    indicator: 'bg-gradient-to-r from-blue-500 to-purple-600',
                    track: isDarkMode ? 'bg-white/10' : 'bg-slate-200',
                  }}
                />
              </div>

              {/* Step breakdown */}
              <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 text-sm ${palette.copy}`}>
                {Object.entries(PROVISIONING_STEPS).map(([key, step]) => {
                  const isComplete = step.progress < currentStepInfo.progress;
                  const isCurrent = key === provisioningStep;

                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-lg transition-colors ${
                        isCurrent
                          ? 'bg-blue-500/10 border border-blue-500/30'
                          : isComplete
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : `${palette.surface}`
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {isComplete && (
                          <svg
                            className="h-4 w-4 text-emerald-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                        {isCurrent && (
                          <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        )}
                        <span
                          className={`font-medium ${isCurrent ? 'text-blue-400' : isComplete ? 'text-emerald-400' : ''}`}
                        >
                          {step.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Workspace info */}
              <div className={`p-4 rounded-lg ${palette.surface}`}>
                <p className={`text-sm ${palette.badge}`}>Your workspace URL (coming soon)</p>
                <p className={`font-mono text-lg ${palette.heading}`}>
                  https://{tenant.subdomain}.{baseDomain}
                </p>
              </div>
            </CardBody>
          </Card>
        </AuthCard>

        {/* Help text */}
        <p className={`text-sm ${palette.copy}`}>
          Please don't close this page. You'll be redirected automatically when ready.
        </p>
      </section>
    </RegisterLayout>
  );
}
