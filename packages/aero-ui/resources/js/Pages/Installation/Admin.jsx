import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import InstallLayout from './InstallLayout.jsx';
import { IR } from './installRoutes.js';
import { VStack, HStack, Box, Field, Input, Button, Badge } from '@aero/ui';

const STEPS_STANDALONE = ['License', 'Requirements', 'Database', 'Settings', 'Admin', 'Review', 'Install', 'Complete'];
const STEPS_SAAS       = ['Requirements', 'Database', 'Settings', 'Admin', 'Review', 'Install', 'Complete'];

export default function Admin({ mode, savedAdmin }) {
  const { errors } = usePage().props;

  const [form, setForm] = useState({
    first_name:            savedAdmin?.first_name ?? '',
    last_name:             savedAdmin?.last_name  ?? '',
    email:                 savedAdmin?.email       ?? '',
    password:              '',
    password_confirmation: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(!!savedAdmin);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); setSaved(false); }

  function save() {
    setSaving(true);
    router.post(IR.saveAdmin, form, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => setSaved(true),
      onFinish:  () => setSaving(false),
    });
  }

  return (
    <VStack gap={5}>
      <div>
        <h1 className="il-title">Administrator Account</h1>
        <p className="il-desc">Create the super-administrator account with full access to all system settings.</p>
      </div>

      <HStack gap={3}>
        <Box grow style={{ flex: 1 }}>
          <Field label="First Name" htmlFor="first_name" error={errors.first_name} required>
            <Input id="first_name" value={form.first_name} onChange={e => set('first_name', e.target.value)} leftIcon="user" autoFocus error={!!errors.first_name} />
          </Field>
        </Box>
        <Box grow style={{ flex: 1 }}>
          <Field label="Last Name" htmlFor="last_name" error={errors.last_name} required>
            <Input id="last_name" value={form.last_name} onChange={e => set('last_name', e.target.value)} leftIcon="user" error={!!errors.last_name} />
          </Field>
        </Box>
      </HStack>

      <Field label="Email Address" htmlFor="admin_email" error={errors.email} required>
        <Input id="admin_email" type="email" value={form.email} onChange={e => set('email', e.target.value)} leftIcon="mail" placeholder="admin@company.com" error={!!errors.email} />
      </Field>

      <Field label="Password" htmlFor="admin_pass" error={errors.password} hint="Min. 8 characters, mixed case, numbers, and symbols." required>
        <Input id="admin_pass" type="password" value={form.password} onChange={e => set('password', e.target.value)} leftIcon="settings" autoComplete="new-password" error={!!errors.password} />
      </Field>

      <Field label="Confirm Password" htmlFor="admin_pass2" error={errors.password_confirmation} required>
        <Input id="admin_pass2" type="password" value={form.password_confirmation} onChange={e => set('password_confirmation', e.target.value)} leftIcon="settings" autoComplete="new-password" error={!!errors.password_confirmation} />
      </Field>

      <HStack gap={2}>
        <Button intent="soft" loading={saving} onClick={save}>Save Account</Button>
        {saved && <Badge intent="success">Saved</Badge>}
      </HStack>

      <div className="il-nav">
        <Button intent="ghost" leftIcon="arrowLeft" onClick={() => router.get(IR.settings)}>Back</Button>
        <Button intent="primary" rightIcon="arrowRight" disabled={!saved} onClick={() => router.get(IR.review)}>Continue</Button>
      </div>
    </VStack>
  );
}

Admin.layout = page => (
  <InstallLayout
    title="Admin Account"
    step={page.props.mode === 'saas' ? 4 : 5}
    steps={page.props.mode === 'saas' ? STEPS_SAAS : STEPS_STANDALONE}
    mode={page.props.mode}
  >
    {page}
  </InstallLayout>
);
