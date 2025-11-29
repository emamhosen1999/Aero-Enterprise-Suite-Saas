import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { Button, Card, CardBody, Chip, Input, Select, SelectItem, Textarea } from '@heroui/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Contexts/ThemeContext.jsx';
import { supportChannels } from '@/constants/marketing';

const contactReasons = [
  { value: 'sales', label: 'Sales / Procurement' },
  { value: 'support', label: 'Customer Support' },
  { value: 'partnerships', label: 'Partnerships' },
  { value: 'press', label: 'Press / Media' },
];

const infoCards = [
  {
    heading: 'Sales',
    detail: 'global@aeos365.com',
    extra: 'Mon - Fri, 7am to 8pm GMT',
  },
  {
    heading: 'Support',
    detail: 'support@aeos365.com',
    extra: '24/7 with dedicated pods',
  },
  {
    heading: 'Phone',
    detail: '+1 (415) 555-1604',
    extra: 'Regional numbers listed in the Trust Center',
  },
];

export default function Contact() {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur-xl'
      : 'bg-white border border-slate-200 shadow-sm',
    tint: isDarkMode ? 'bg-white/5' : 'bg-slate-50',
    badge: isDarkMode
      ? 'bg-white/10 border border-white/20 text-white'
      : 'bg-white border border-slate-200 text-slate-700',
    inputWrapper: isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200',
    inputLabel: isDarkMode ? 'text-slate-200' : 'text-slate-600',
    buttonPrimary: isDarkMode ? 'bg-white text-slate-900 font-semibold' : 'bg-slate-900 text-white font-semibold',
  }), [isDarkMode]);

  const fieldClasses = {
    inputWrapper: palette.inputWrapper,
    label: palette.inputLabel,
  };

  return (
    <PublicLayout mainClassName="pt-0">
      <div className={`relative ${palette.baseText}`}>
        <section className="relative px-6 pt-28 pb-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div
              className={`absolute inset-0 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-cyan-500/15'
                  : 'bg-gradient-to-br from-sky-100/70 via-indigo-100/40 to-cyan-100/40'
              }`}
            />
            <div className="absolute -right-24 top-6 w-72 h-72 bg-blue-500/20 blur-[140px]" />
            <div className="absolute -left-16 bottom-0 w-72 h-72 bg-emerald-400/20 blur-[140px]" />
          </div>
          <div className="relative max-w-5xl mx-auto text-center space-y-6">
            <Chip color="secondary" variant="flat" className="uppercase tracking-[0.35em] text-xs">Contact</Chip>
            <h1 className="text-4xl md:text-5xl font-bold">Talk to the team that builds and supports Aero.</h1>
            <p className={`text-lg ${palette.mutedText}`}>
              We answer sales, procurement, partnership, and support requests around the clock. Pick the path that fits what you need today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/demo">
                <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold px-10">
                  Book a product tour
                </Button>
              </Link>
              <Link href="/support">
                <Button variant="bordered" className="border-current px-10">
                  Visit support center
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3">
            {infoCards.map((card) => (
              <Card key={card.heading} className={palette.card}>
                <CardBody className="space-y-2">
                  <p className={`text-sm ${palette.mutedText}`}>{card.heading}</p>
                  <h3 className="text-xl font-semibold">{card.detail}</h3>
                  <p className={`text-sm ${palette.mutedText}`}>{card.extra}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-[3fr,2fr]">
            <Card className={palette.card}>
              <CardBody className="space-y-5">
                <Chip color="primary" variant="flat" size="sm">Send a message</Chip>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Full name" variant="bordered" classNames={fieldClasses} />
                  <Input label="Work email" type="email" variant="bordered" classNames={fieldClasses} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Company" variant="bordered" classNames={fieldClasses} />
                  <Select label="Topic" variant="bordered" classNames={fieldClasses}>
                    {contactReasons.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <Textarea label="How can we help?" minRows={4} variant="bordered" classNames={fieldClasses} />
                <Button className={`${palette.buttonPrimary} px-6`}>Send request</Button>
                <p className={`text-xs ${palette.mutedText}`}>
                  By submitting, you agree to our Privacy Policy and allow us to contact you about this request.
                </p>
              </CardBody>
            </Card>
            <Card className={palette.card}>
              <CardBody className="space-y-4">
                <Chip color="success" variant="flat" size="sm">Other ways to connect</Chip>
                <div className="space-y-4">
                  {supportChannels.slice(0, 3).map((channel) => (
                    <div
                      key={channel.label}
                      className={`pb-4 last:border-b-0 last:pb-0 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}
                    >
                      <p className="text-lg font-semibold">{channel.label}</p>
                      <p className={`text-sm ${palette.mutedText}`}>{channel.description}</p>
                      <Chip color="secondary" variant="flat" size="sm" className="mt-2 w-fit">{channel.response}</Chip>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/resources">
                    <Button variant="bordered" className="border-current">
                      Documentation
                    </Button>
                  </Link>
                  <Link href="/legal">
                    <Button variant="light" className="text-current">
                      Trust center
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          </div>
        </section>

        <section className={`px-6 pb-24 ${palette.tint}`}>
          <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2">
            <Card className={palette.card}>
              <CardBody className="space-y-3">
                <Chip color="warning" variant="flat" size="sm">Offices & hours</Chip>
                <p className={`text-sm ${palette.mutedText}`}>
                  Distributed HQ in Singapore, Bengaluru, and Toronto with rollout pods in Dubai, London, and Austin.
                </p>
                <p className={`text-sm ${palette.mutedText}`}>
                  Field teams operate on customer time zones. We run follow-the-sun response for incidents.
                </p>
              </CardBody>
            </Card>
            <Card className={palette.card}>
              <CardBody className="space-y-3">
                <Chip color="secondary" variant="flat" size="sm">Need help fast?</Chip>
                <p className={palette.mutedText}>
                  Visit the Support page for live chat, Slack Connect invites, and status updates before filing a ticket.
                </p>
                <Link href="/support">
                  <Button className={`${palette.buttonPrimary} w-full`}>Open support center</Button>
                </Link>
              </CardBody>
            </Card>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
