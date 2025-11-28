import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
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
import { supportChannels, slaMatrix } from '../../constants/marketing';
import PublicLayout from '../../Layouts/PublicLayout';
import { useTheme } from '@/Contexts/ThemeContext.jsx';

const Support = () => {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur'
      : 'bg-white border border-slate-200 shadow-sm',
    gradientCard: isDarkMode
      ? 'bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-500/20 border border-white/10'
      : 'bg-gradient-to-br from-blue-100 via-purple-100 to-cyan-100 border border-slate-200 shadow-md',
    tint: isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50',
    deepTint: isDarkMode ? 'bg-slate-950/60' : 'bg-slate-100',
    badge: isDarkMode ? 'border-white/30 text-white' : 'border-slate-300 text-slate-700',
    buttonBorder: isDarkMode ? 'border-white/30 text-white' : 'border-slate-300 text-slate-700',
  }), [isDarkMode]);

  return (
    <PublicLayout>
      <div className={palette.baseText}>
      <section className="max-w-5xl mx-auto px-6 pt-28 pb-16 text-center">
        <Chip color="primary" variant="flat" className="uppercase tracking-[0.3em] text-xs">Support</Chip>
        <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
          Support staffed by the engineers who ship the product.
        </h1>
        <p className={`${palette.mutedText} max-w-3xl mx-auto`}>
          Coverage runs 24/7 with direct Slack channels, phone escalations, and public SLAs, so you always know who owns an issue and when it will be resolved.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Link href="/contact">
            <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-8">Talk to Support</Button>
          </Link>
          <Link href="/resources">
            <Button variant="bordered" className={`px-8 ${palette.buttonBorder}`}>Browse Resources</Button>
          </Link>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-6">
          {supportChannels.map((channel) => (
            <Card key={channel.label} className={palette.card}>
              <CardBody className="space-y-3">
                <div>
                  <p className={`text-sm ${palette.mutedText}`}>Channel</p>
                  <h3 className="text-xl font-semibold">{channel.label}</h3>
                </div>
                <p className={`${palette.mutedText} text-sm`}>{channel.description}</p>
                <Chip color="success" size="sm" variant="flat">{channel.response}</Chip>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className={`px-6 pb-16 ${palette.tint}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Chip color="secondary" variant="flat">Service Levels</Chip>
            <h2 className="text-3xl font-semibold mt-3">SLAs tailored to your plan.</h2>
            <p className={`${palette.mutedText} mt-2`}>Response times for Launch, Scale, and Enterprise plans.</p>
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

      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <Card className={palette.card}>
            <CardBody className="space-y-4">
              <Chip color="primary" variant="flat" size="sm">Submit a ticket</Chip>
              <Input
                label="Name"
                variant="faded"
                classNames={{ inputWrapper: isDarkMode ? 'bg-white/5' : 'bg-slate-100', label: palette.mutedText }}
              />
              <Input
                label="Work email"
                variant="faded"
                classNames={{ inputWrapper: isDarkMode ? 'bg-white/5' : 'bg-slate-100', label: palette.mutedText }}
              />
              <Input
                label="Company"
                variant="faded"
                classNames={{ inputWrapper: isDarkMode ? 'bg-white/5' : 'bg-slate-100', label: palette.mutedText }}
              />
              <Textarea
                label="How can we help?"
                minRows={4}
                variant="faded"
                classNames={{ inputWrapper: isDarkMode ? 'bg-white/5' : 'bg-slate-100', label: palette.mutedText }}
              />
              <Button className={isDarkMode ? 'bg-white text-slate-900 font-semibold' : 'bg-slate-900 text-white font-semibold'}>
                Send ticket
              </Button>
            </CardBody>
          </Card>
          <Card className={palette.gradientCard}>
            <CardBody className="space-y-5">
              <Chip color="success" variant="flat">Customer Academy</Chip>
              <h3 className="text-3xl font-semibold">Train every department.</h3>
              <p className={palette.mutedText}>
                On-demand courses for HR, PMO, Compliance, and IT admins. Live office hours twice a week plus certification paths.
              </p>
              <Button variant="bordered" className={palette.buttonBorder}>Explore courses</Button>
            </CardBody>
          </Card>
        </div>
      </section>

      <section className={`px-6 pb-20 ${palette.deepTint}`}>
        <Card className={`max-w-5xl mx-auto text-center ${palette.card}`}>
          <CardBody className="space-y-4">
            <Chip color="warning" variant="flat">Trust Center</Chip>
            <h3 className="text-3xl font-semibold">Status page, security posture, and incident history.</h3>
            <p className={palette.mutedText}>
              Check realtime uptime, scheduled maintenance, and compliance documents in the Trust Center.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/status">
                <Button className={isDarkMode ? 'bg-white text-slate-900 font-semibold' : 'bg-slate-900 text-white font-semibold'}>
                  View status
                </Button>
              </Link>
              <Link href="/docs/security">
                <Button variant="bordered" className={palette.buttonBorder}>Security documentation</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </section>
      </div>
    </PublicLayout>
  );
};

export default Support;
