import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import InstallLayout from './InstallLayout.jsx';
import { IR } from './installRoutes.js';
import { VStack, Box, Button, Alert } from '@aero/ui';

const STEPS_STANDALONE = ['License', 'Requirements', 'Database', 'Settings', 'Admin', 'Review', 'Install', 'Complete'];
const STEPS_SAAS       = ['Requirements', 'Database', 'Settings', 'Admin', 'Review', 'Install', 'Complete'];

function ReviewSection({ title, rows = [] }) {
  return (
    <div className="il-review-section">
      <p className="il-review-label">{title}</p>
      {rows.filter(([, v]) => v).map(([key, val]) => (
        <div key={key} className="il-review-row">
          <span className="il-review-key">{key}</span>
          <span className="il-review-val">{val}</span>
        </div>
      ))}
    </div>
  );
}

export default function Review({ mode, summary }) {
  const { errors } = usePage().props;
  const [starting, setStarting] = useState(false);

  function startInstall() {
    setStarting(true);
    router.post(IR.execute, {}, {
      onError: () => setStarting(false),
      // Inertia follows the redirect to /install/processing on success
    });
  }

  const db       = summary?.database ?? {};
  const settings = summary?.settings ?? {};
  const admin    = summary?.admin    ?? {};
  const license  = summary?.license  ?? {};
  const nameKey  = mode === 'saas' ? 'site_name' : 'company_name';

  return (
    <VStack gap={5}>
      <div>
        <h1 className="il-title">Review Configuration</h1>
        <p className="il-desc">Review your settings before starting the installation. You can go back to change anything.</p>
      </div>

      {errors.message && <Alert intent="danger">{errors.message}</Alert>}

      <Box style={{ background: 'rgba(0,0,0,.02)', border: '1px solid var(--aeos-divider)', borderRadius: 'var(--aeos-r-xl)', padding: '1.5rem' }}>
        {mode === 'standalone' && license.key && (
          <ReviewSection title="License" rows={[
            ['Key',        license.key ? `${license.key.slice(0, 8)}••••••••` : '—'],
            ['Type',       license.type],
            ['Valid Until', license.valid_until],
          ]} />
        )}
        <ReviewSection title="Database" rows={[
          ['Driver',   db.connection?.toUpperCase()],
          ['Host',     db.host && db.port ? `${db.host}:${db.port}` : db.host],
          ['Database', db.database],
          ['Username', db.username],
        ]} />
        <ReviewSection title={mode === 'saas' ? 'Platform' : 'System'} rows={[
          [mode === 'saas' ? 'Platform Name' : 'Company', settings[nameKey]],
          ['Support Email', settings.support_email],
          ['App URL',       settings.app_url],
          ['Timezone',      settings.timezone],
        ]} />
        <ReviewSection title="Administrator" rows={[
          ['Name',  `${admin.first_name ?? ''} ${admin.last_name ?? ''}`.trim() || '—'],
          ['Email', admin.email],
        ]} />
      </Box>

      <Alert intent="warning" title="This action cannot be undone">
        Clicking "Install Now" will run database migrations, seed initial data, and write the installation lock file.
      </Alert>

      <div className="il-nav">
        <Button intent="ghost" leftIcon="arrowLeft" onClick={() => router.get(IR.admin)}>Back</Button>
        <Button intent="primary" size="lg" loading={starting} rightIcon="arrowRight" onClick={startInstall}>
          Install Now
        </Button>
      </div>
    </VStack>
  );
}

Review.layout = page => (
  <InstallLayout
    title="Review"
    step={page.props.mode === 'saas' ? 5 : 6}
    steps={page.props.mode === 'saas' ? STEPS_SAAS : STEPS_STANDALONE}
    mode={page.props.mode}
  >
    {page}
  </InstallLayout>
);
