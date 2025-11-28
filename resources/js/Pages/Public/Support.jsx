import React from 'react';
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

const Support = () => {
  return (
    <PublicLayout>
      <div className="text-white">
      <section className="max-w-5xl mx-auto px-6 pt-28 pb-16 text-center">
        <Chip color="primary" variant="flat" className="uppercase tracking-[0.3em] text-xs">Support</Chip>
        <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
          Human-first support around the clock.
        </h1>
        <p className="text-slate-300 max-w-3xl mx-auto">
          24/7 coverage with operational experts, dedicated Slack channels, and transparent SLAs. We co-own your outcomes.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Link href="/contact">
            <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-8">Talk to Support</Button>
          </Link>
          <Link href="/resources">
            <Button variant="bordered" className="border-white/30 text-white px-8">Browse Resources</Button>
          </Link>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-6">
          {supportChannels.map((channel) => (
            <Card key={channel.label} className="bg-white/5 border border-white/10">
              <CardBody className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400">Channel</p>
                  <h3 className="text-xl font-semibold">{channel.label}</h3>
                </div>
                <p className="text-slate-300 text-sm">{channel.description}</p>
                <Chip color="success" size="sm" variant="flat">{channel.response}</Chip>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-6 pb-16 bg-slate-900/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Chip color="secondary" variant="flat">Service Levels</Chip>
            <h2 className="text-3xl font-semibold mt-3">SLAs tailored to your plan.</h2>
            <p className="text-slate-300 mt-2">Response times for Launch, Scale, and Enterprise plans.</p>
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
          <Card className="bg-white/5 border border-white/10">
            <CardBody className="space-y-4">
              <Chip color="primary" variant="flat" size="sm">Submit a ticket</Chip>
              <Input label="Name" variant="faded" classNames={{ inputWrapper: 'bg-white/5', label: 'text-slate-300' }} />
              <Input label="Work email" variant="faded" classNames={{ inputWrapper: 'bg-white/5', label: 'text-slate-300' }} />
              <Input label="Company" variant="faded" classNames={{ inputWrapper: 'bg-white/5', label: 'text-slate-300' }} />
              <Textarea label="How can we help?" minRows={4} variant="faded" classNames={{ inputWrapper: 'bg-white/5', label: 'text-slate-300' }} />
              <Button className="bg-white text-slate-900 font-semibold">Send ticket</Button>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-500/20 border border-white/10">
            <CardBody className="space-y-5">
              <Chip color="success" variant="flat">Customer Academy</Chip>
              <h3 className="text-3xl font-semibold">Train every department.</h3>
              <p className="text-slate-100">
                On-demand courses for HR, PMO, Compliance, and IT admins. Live office hours twice a week plus certification paths.
              </p>
              <Button variant="bordered" className="border-white/40 text-white">Explore courses</Button>
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="px-6 pb-20 bg-slate-900/60">
        <Card className="max-w-5xl mx-auto text-center bg-white/5 border border-white/10">
          <CardBody className="space-y-4">
            <Chip color="warning" variant="flat">Trust Center</Chip>
            <h3 className="text-3xl font-semibold">Status page, security posture, and incident history.</h3>
            <p className="text-slate-300">
              Check realtime uptime, scheduled maintenance, and compliance documents in the Trust Center.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/status">
                <Button className="bg-white text-slate-900 font-semibold">View status</Button>
              </Link>
              <Link href="/docs/security">
                <Button variant="bordered" className="border-white/40 text-white">Security documentation</Button>
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
