import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, CardBody, Chip } from '@heroui/react';
import AuthCard from '@/Components/AuthCard.jsx';
import PublicLayout from '@/Layouts/PublicLayout.jsx';
import ProgressSteps from './components/ProgressSteps.jsx';

export default function Success({ steps = [], currentStep, result = {}, baseDomain = 'platform.test' }) {
  const workspaceUrl = result.subdomain ? `https://${result.subdomain}.${baseDomain}` : null;

  return (
    <PublicLayout mainClassName="pt-28 pb-20">
      <Head title="Workspace ready" />
      <section className="max-w-3xl mx-auto px-6 space-y-8 text-center">
        <div className="space-y-4">
          <Chip color="success" variant="flat" size="lg">Workspace live</Chip>
          <h1 className="text-4xl font-semibold text-white">Welcome to Aero Enterprise Suite.</h1>
          <p className="text-white/70">We are provisioning your tenant and sending first-login credentials. You can jump in using the link below.</p>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <AuthCard>
          <Card className="bg-transparent border-none shadow-none text-white">
            <CardBody className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Workspace</p>
              <h2 className="text-3xl font-semibold">{result.name}</h2>
              {workspaceUrl && (
                <p className="font-mono text-lg">{workspaceUrl}</p>
              )}
              {result.trial_ends_at && (
                <p className="text-sm text-white/70">Trial active until {new Date(result.trial_ends_at).toLocaleDateString()}</p>
              )}
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                {workspaceUrl && (
                  <a href={`${workspaceUrl}/login`} className="inline-flex" target="_blank" rel="noopener noreferrer">
                    <Button color="primary" className="bg-gradient-to-r from-blue-500 to-purple-600">
                      Go to workspace
                    </Button>
                  </a>
                )}
                <Link href={route('login')}>
                  <Button variant="bordered" className="border-white/30 text-white">
                    Back to main login
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </AuthCard>
      </section>
    </PublicLayout>
  );
}
