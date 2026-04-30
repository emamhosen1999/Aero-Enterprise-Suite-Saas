import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { VStack, HStack, Field, Input, Button, Alert, Text } from '@aero/ui';
import { SR } from '../signupRoutes.js';

/**
 * StepVerifyEmail — 6-digit OTP verification for work email.
 *
 * Auto-sends code on mount. Verifies via axios (JSON).
 * On success navigates to verify-phone step via router.get().
 */
export default function StepVerifyEmail({ email = '', companyName = '' }) {
  const [code,         setCode]         = useState('');
  const [loading,      setLoading]      = useState(false);
  const [resending,    setResending]    = useState(false);
  const [verified,     setVerified]     = useState(false);
  const [error,        setError]        = useState(null);
  const [resendStatus, setResendStatus] = useState(null); // 'sent' | 'error'

  // Auto-send code when component mounts
  useEffect(() => {
    axios.post(SR.sendEmailCode).catch(() => {
      setError('Failed to send verification code. Please click Resend.');
    });
  }, []);

  function handleCodeChange(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    setError(null);
  }

  async function verify(e) {
    e.preventDefault();
    if (code.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await axios.post(SR.verifyEmailCode, { code });
      setVerified(true);
      router.get(SR.verifyPhone);
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Invalid or expired code. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    setResendStatus(null);
    setError(null);
    try {
      await axios.post(SR.sendEmailCode);
      setResendStatus('sent');
      setCode('');
    } catch {
      setResendStatus('error');
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={verify} noValidate>
      <VStack gap={4}>
        <Text tone="secondary">
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify your email address.
        </Text>

        {error && (
          <Alert intent="danger">{error}</Alert>
        )}

        {resendStatus === 'sent' && (
          <Alert intent="success">A new code has been sent to {email}.</Alert>
        )}
        {resendStatus === 'error' && (
          <Alert intent="danger">Failed to resend code. Please try again.</Alert>
        )}

        <Field label="Verification Code" htmlFor="otp-email">
          <Input
            id="otp-email"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={handleCodeChange}
            className="rl-otp-input"
            error={!!error}
          />
        </Field>

        <Button
          type="submit"
          intent="primary"
          fullWidth
          size="lg"
          loading={loading || verified}
          disabled={code.length < 6}
        >
          {verified ? 'Verified!' : 'Verify Email'}
        </Button>

        <HStack gap={2} align="center">
          <Text tone="secondary">Didn&apos;t receive it?</Text>
          <Button
            type="button"
            intent="ghost"
            size="sm"
            loading={resending}
            onClick={resend}
          >
            Resend code
          </Button>
        </HStack>
      </VStack>

      <style>{`
        .rl-otp-input {
          letter-spacing: 0.3em;
          font-family: var(--aeos-font-mono);
          font-size: 1.2rem;
          text-align: center;
        }
      `}</style>
    </form>
  );
}
