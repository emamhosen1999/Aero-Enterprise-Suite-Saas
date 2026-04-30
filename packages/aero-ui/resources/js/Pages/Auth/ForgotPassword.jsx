import { useForm, Link } from '@inertiajs/react';
import AuthLayout from './AuthLayout.jsx';
import { Field, Input, Button, Alert, Text } from '@aero/ui';

export default function ForgotPassword({ status }) {
  const { data, setData, post, processing, errors } = useForm({ email: '' });

  function submit(e) {
    e.preventDefault();
    post(route('password.email'));
  }

  return (
    <form className="al-form" onSubmit={submit} noValidate>
      {status && <Alert intent="success">{status}</Alert>}

      <Text tone="secondary">
        Enter your email and we'll send you a secure link to reset your password.
      </Text>

      <Field label="Email address" htmlFor="email" error={errors.email} required>
        <Input
          id="email"
          type="email"
          value={data.email}
          onChange={e => setData('email', e.target.value)}
          leftIcon="mail"
          placeholder="you@company.com"
          autoComplete="email"
          autoFocus
          error={!!errors.email}
        />
      </Field>

      <Button intent="primary" fullWidth loading={processing} disabled={processing} type="submit" size="lg">
        Send reset link
      </Button>

      <div className="al-links">
        <Text tone="secondary">
          Remember your password?{' '}
          <Link href={route('login')} className="al-link">Sign in</Link>
        </Text>
      </div>
    </form>
  );
}

ForgotPassword.layout = page => (
  <AuthLayout title="Reset your password" eyebrow="Password recovery">
    {page}
  </AuthLayout>
);
