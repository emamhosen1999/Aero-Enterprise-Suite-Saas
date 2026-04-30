import { useForm } from '@inertiajs/react';
import { VStack, Field, Input, Button, Text } from '@aero/ui';
import { SR } from '../signupRoutes.js';

/**
 * StepDetails — company/personal details form.
 *
 * Collects: company name, work email, phone (optional), subdomain.
 * Shows a live subdomain preview below the subdomain field.
 */
export default function StepDetails({ baseDomain = '', existingSubdomain = '', savedData = {} }) {
  const saved = savedData?.details ?? {};

  const { data, setData, post, processing, errors } = useForm({
    name:      saved.name      ?? '',
    email:     saved.email     ?? '',
    phone:     saved.phone     ?? '',
    subdomain: saved.subdomain ?? existingSubdomain ?? '',
  });

  function submit(e) {
    e.preventDefault();
    post(SR.storeDetails);
  }

  // Strip everything except lowercase letters, numbers, hyphens for the preview
  const previewSubdomain = data.subdomain
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

  return (
    <form onSubmit={submit} noValidate>
      <VStack gap={4}>
        <Field label="Company Name" htmlFor="name" error={errors.name} required>
          <Input
            id="name"
            type="text"
            leftIcon="home"
            placeholder="Acme Corp"
            value={data.name}
            onChange={e => setData('name', e.target.value)}
            error={!!errors.name}
          />
        </Field>

        <Field label="Work Email" htmlFor="email" error={errors.email} required>
          <Input
            id="email"
            type="email"
            leftIcon="mail"
            placeholder="you@company.com"
            value={data.email}
            onChange={e => setData('email', e.target.value)}
            error={!!errors.email}
          />
        </Field>

        <Field
          label="Phone"
          htmlFor="phone"
          error={errors.phone}
          hint="Optional, used for SMS verification"
        >
          <Input
            id="phone"
            type="tel"
            leftIcon="phone"
            placeholder="+1 555 000 0000"
            value={data.phone}
            onChange={e => setData('phone', e.target.value)}
            error={!!errors.phone}
          />
        </Field>

        <Field label="Subdomain" htmlFor="subdomain" error={errors.subdomain} required>
          <Input
            id="subdomain"
            type="text"
            leftIcon="link"
            placeholder="acme"
            value={data.subdomain}
            onChange={e => setData('subdomain', e.target.value)}
            error={!!errors.subdomain}
          />
          {data.subdomain && (
            <div className="rl-subdomain-preview">
              {previewSubdomain || data.subdomain}.{baseDomain}
            </div>
          )}
        </Field>

        <Button
          type="submit"
          intent="primary"
          fullWidth
          size="lg"
          loading={processing}
          rightIcon="arrowRight"
        >
          Continue
        </Button>
      </VStack>

      <style>{`
        .rl-subdomain-preview {
          margin-top: 6px;
          font-family: var(--aeos-font-mono);
          font-size: .82rem;
          color: var(--aeos-primary);
          letter-spacing: .01em;
          padding: 0 2px;
        }
      `}</style>
    </form>
  );
}
