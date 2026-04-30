import { useForm } from '@inertiajs/react';
import AuthLayout from './AuthLayout.jsx';
import { Button, Alert, Text } from '@aero/ui';

export default function VerifyEmail({ status }) {
  const { post: postResend, processing: resending } = useForm({});
  const { post: postLogout, processing: loggingOut } = useForm({});

  function resend(e) {
    e.preventDefault();
    postResend(route('core.verification.send'));
  }

  function logout(e) {
    e.preventDefault();
    postLogout(route('logout'));
  }

  return (
    <div className="al-form">
      {status === 'verification-link-sent' && (
        <Alert intent="success" title="Email sent">
          A fresh verification link has been sent to your email address.
        </Alert>
      )}

      <Text tone="secondary">
        Thanks for signing up! Before getting started, please verify your email address
        by clicking the link we sent you. Didn't receive the email?
      </Text>

      <form onSubmit={resend}>
        <Button intent="primary" fullWidth loading={resending} disabled={resending} type="submit" size="lg">
          Resend verification email
        </Button>
      </form>

      <div className="al-links">
        <form onSubmit={logout}>
          <Button intent="ghost" loading={loggingOut} disabled={loggingOut} type="submit">
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </form>
      </div>
    </div>
  );
}

VerifyEmail.layout = page => (
  <AuthLayout title="Verify your email" eyebrow="Email verification">
    {page}
  </AuthLayout>
);
