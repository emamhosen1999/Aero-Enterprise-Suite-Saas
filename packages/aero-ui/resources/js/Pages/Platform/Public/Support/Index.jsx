import React, { useMemo } from 'react';
import { Link, Head } from '@inertiajs/react';
import { useBranding } from '@/Hooks/useBranding';
import {
  Card,
  CardBody,
  Chip,
  Button,
  Input,
  Textarea,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { supportChannels, slaMatrix } from '@/constants/marketing';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Context/ThemeContext.jsx';

const Support = () => {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';
  const { siteName } = useBranding();

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur'
      : 'bg-white border border-slate-200 shadow-sm',
    gradientCard: isDarkMode
      ? 'bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-500/20 border border-white/10'
      : 'bg-gradient-to-br from-blue-100 via-purple-100 to-cyan-100 border border-slate-200 shadow-md',
    tint: isDarkMode ? 'bg-white/5' : 'bg-slate-50',
    deepTint: isDarkMode ? 'bg-white/5' : 'bg-slate-100',
    badge: isDarkMode ? 'border-white/30 text-white' : 'border-slate-300 text-slate-700',
    buttonPrimary: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold',
    buttonBorder: isDarkMode ? 'border-white/30 text-white' : 'border-slate-300 text-slate-700',
    inputWrapper: isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200',
    inputLabel: isDarkMode ? 'text-slate-200' : 'text-slate-600',
  }), [isDarkMode]);

  const fieldClasses = {
    inputWrapper: palette.inputWrapper,
    label: palette.inputLabel,
  };

  return (
    <PublicLayout mainClassName="pt-0">
      <Head title="Support" />
      <div className={palette.baseText}>
      <section className="relative overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className={`absolute inset-0 ${
              isDarkMode
                ? 'bg-gradient-to-br from-blue-600/25 via-purple-600/15 to-cyan-500/20'
                : 'bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-100/60'
            }`}
          />
          <div className="absolute -right-20 top-8 w-72 h-72 bg-blue-500/25 blur-[140px]" />
          <div className="absolute -left-16 bottom-0 w-72 h-72 bg-emerald-400/25 blur-[140px]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 md:px-6 pt-20 md:pt-28 pb-8 md:pb-16">
          <Chip color="primary" variant="flat" className="uppercase tracking-[0.3em] text-[10px] md:text-xs">Support</Chip>
          <h1 className="text-2xl md:text-5xl font-bold mt-3 md:mt-4 mb-4 md:mb-6">
            Support staffed by the engineers who ship the product.
          </h1>
          <p className={`${palette.mutedText} max-w-3xl mx-auto text-sm md:text-base`}>
            Coverage runs 24/7 with direct Slack channels, phone escalations, and public SLAs, so you always know who owns an issue and when it will be resolved.
          </p>
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-5 md:mt-8">
            <Button as={Link} href={route('contact')} className={palette.buttonPrimary}>
              Talk to support
            </Button>
            <Button as={Link} href={route('resources')} variant="bordered" className={`px-8 ${palette.buttonBorder}`}>
              Browse resources
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-8 md:pb-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-4 md:gap-6">
          {supportChannels.map((channel) => (
            <Card key={channel.label} className={palette.card}>
              <CardBody className="space-y-2 md:space-y-3">
                <div>
                  <p className={`text-xs md:text-sm ${palette.mutedText}`}>Channel</p>
                  <h3 className="text-base md:text-xl font-semibold">{channel.label}</h3>
                </div>
                <p className={`${palette.mutedText} text-xs md:text-sm`}>{channel.description}</p>
                <Chip color="success" size="sm" variant="flat">{channel.response}</Chip>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className={`px-4 md:px-6 pb-8 md:pb-16 ${palette.tint}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 md:mb-10">
            <Chip color="secondary" variant="flat" className="text-[10px] md:text-xs">Service Levels</Chip>
            <h2 className="text-xl md:text-3xl font-semibold mt-3">SLAs tailored to your plan.</h2>
            <p className={`${palette.mutedText} mt-2 text-sm md:text-base`}>Response times for Launch, Scale, and Enterprise plans.</p>
          </div>
          <div className="overflow-x-auto">
            <Table aria-label="SLA comparison" className="min-w-[700px]">
              <TableHeader>
                <TableColumn>Severity</TableColumn>
                <TableColumn>Launch</TableColumn>
                <TableColumn>Scale</TableColumn>
                <TableColumn>Enterprise</TableColumn>
              </TableHeader>
              <TableBody>
                {slaMatrix.map((row) => (
                  <TableRow key={row.severity}>
                    <TableCell>{row.severity}</TableCell>
                    <TableCell>{row.launch}</TableCell>
                    <TableCell>{row.scale}</TableCell>
                    <TableCell>{row.enterprise}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-8 md:pb-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-5 md:gap-8">
          <Card className={palette.card}>
            <CardBody className="space-y-3 md:space-y-4">
              <Chip color="primary" variant="flat" size="sm" className="text-[10px] md:text-xs">Submit a ticket</Chip>
              <Input label="Name" variant="bordered" classNames={fieldClasses} />
              <Input label="Work email" type="email" variant="bordered" classNames={fieldClasses} />
              <Input label="Company" variant="bordered" classNames={fieldClasses} />
              <Textarea label="How can we help?" minRows={4} variant="bordered" classNames={fieldClasses} />
              <Button className={palette.buttonPrimary}>Send ticket</Button>
            </CardBody>
          </Card>
          <Card className={palette.gradientCard}>
            <CardBody className="space-y-3 md:space-y-5">
              <Chip color="success" variant="flat" className="text-[10px] md:text-xs">Customer Academy</Chip>
              <h3 className="text-xl md:text-3xl font-semibold">Train every department.</h3>
              <p className={`text-sm md:text-base ${palette.mutedText}`}>
                On-demand courses for HR, PMO, Compliance, and IT admins. Live office hours twice a week plus certification paths.
              </p>
              <Button variant="bordered" className={palette.buttonBorder}>Explore courses</Button>
            </CardBody>
          </Card>
        </div>
      </section>

      <section className={`px-4 md:px-6 pb-10 md:pb-20 ${palette.deepTint}`}>
        <Card className={`max-w-5xl mx-auto text-center ${palette.card}`}>
          <CardBody className="space-y-3 md:space-y-4">
            <Chip color="warning" variant="flat" className="text-[10px] md:text-xs">Trust Center</Chip>
            <h3 className="text-xl md:text-3xl font-semibold">Status page, security posture, and incident history.</h3>
            <p className={`text-sm md:text-base ${palette.mutedText}`}>
              Check realtime uptime, scheduled maintenance, and compliance documents in the Trust Center.
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              <Button as={Link} href={route('status')} className={palette.buttonPrimary}>
                View status
              </Button>
              <Button as={Link} href={route('docs')} variant="bordered" className={palette.buttonBorder}>
                Security documentation
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>
      </div>
    </PublicLayout>
  );
};

export default Support;
