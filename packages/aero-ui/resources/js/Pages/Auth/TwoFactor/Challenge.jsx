import { useState, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import AuthLayout from '../AuthLayout.jsx';
import { Field, Input, Button, Text } from '@aero/ui';

export default function TwoFactorChallenge() {
  const [useRecovery, setUseRecovery] = useState(false);
  const inputRef = useRef(null);

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    code:          '',
    recovery_code: '',
  });

  function submit(e) {
    e.preventDefault();
    post(route('auth.two-factor.verify'), {
      onFinish: () => reset(useRecovery ? 'recovery_code' : 'code'),
    });
  }

  function toggleMode() {
    clearErrors();
    reset('code', 'recovery_code');
    setUseRecovery(v => !v);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <form className="al-form" onSubmit={submit} noValidate>
      <Text tone="secondary">
        {useRecovery
          ? 'Enter one of your emergency recovery codes to access your account.'
          : 'Enter the 6-digit code from your authenticator app.'}
      </Text>

      {useRecovery ? (
        <Field label="Recovery code" htmlFor="recovery_code" error={errors.recovery_code} required>
          <Input
            ref={inputRef}
            id="recovery_code"
            type="text"
            value={data.recovery_code}
            onChange={e => setData('recovery_code', e.target.value)}
            leftIcon="document"
            placeholder="xxxx-xxxx-xxxx-xxxx"
            autoComplete="one-time-code"
            autoFocus
            error={!!errors.recovery_code}
          />
        </Field>
      ) : (
        <Field label="Authentication code" htmlFor="code" error={errors.code} required>
          <Input
            ref={inputRef}
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={data.code}
            onChange={e => setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
            leftIcon="sparkles"
            placeholder="000000"
            autoComplete="one-time-code"
            autoFocus
            error={!!errors.code}
            className="al-otp-input"
          />
        </Field>
      )}

      <Button intent="primary" fullWidth loading={processing} disabled={processing} type="submit" size="lg">
        {useRecovery ? 'Verify recovery code' : 'Verify'}
      </Button>

      <div className="al-links">
        <Button intent="ghost" type="button" onClick={toggleMode}>
          {useRecovery
            ? 'Use authenticator app instead'
            : "Can't access your app? Use a recovery code"}
        </Button>
      </div>
    </form>
  );
}

TwoFactorChallenge.layout = page => (
  <AuthLayout title="Two-factor authentication" eyebrow="Security verification">
    {page}
  </AuthLayout>
);
