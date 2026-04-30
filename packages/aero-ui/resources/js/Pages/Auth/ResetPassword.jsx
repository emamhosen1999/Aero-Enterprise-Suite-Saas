import { useForm } from '@inertiajs/react';
import AuthLayout from './AuthLayout.jsx';
import { Field, Input, Button, Alert } from '@aero/ui';

export default function ResetPassword({ email, token, status }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    token,
    email,
    password:              '',
    password_confirmation: '',
  });

  function submit(e) {
    e.preventDefault();
    post(route('password.store'), {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  }

  return (
    <form className="al-form" onSubmit={submit} noValidate>
      {status && <Alert intent="info">{status}</Alert>}

      <Field label="Email address" htmlFor="email" error={errors.email} required>
        <Input
          id="email"
          type="email"
          value={data.email}
          onChange={e => setData('email', e.target.value)}
          leftIcon="mail"
          autoComplete="email"
          error={!!errors.email}
        />
      </Field>

      <Field label="New password" htmlFor="password" error={errors.password} required>
        <Input
          id="password"
          type="password"
          value={data.password}
          onChange={e => setData('password', e.target.value)}
          leftIcon="settings"
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          autoFocus
          error={!!errors.password}
        />
      </Field>

      <Field
        label="Confirm new password"
        htmlFor="password_confirmation"
        error={errors.password_confirmation}
        required
      >
        <Input
          id="password_confirmation"
          type="password"
          value={data.password_confirmation}
          onChange={e => setData('password_confirmation', e.target.value)}
          leftIcon="settings"
          placeholder="Repeat password"
          autoComplete="new-password"
          error={!!errors.password_confirmation}
        />
      </Field>

      {/* Hidden token field */}
      <input type="hidden" name="token" value={data.token} />

      <Button
        intent="primary"
        fullWidth
        loading={processing}
        disabled={processing}
        type="submit"
        size="lg"
      >
        Set new password
      </Button>
    </form>
  );
}

ResetPassword.layout = page => (
  <AuthLayout title="Set new password" eyebrow="Password reset">
    {page}
  </AuthLayout>
);
