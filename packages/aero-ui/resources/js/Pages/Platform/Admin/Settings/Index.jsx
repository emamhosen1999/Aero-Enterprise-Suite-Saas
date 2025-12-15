import React from 'react';
import { Head, Link } from '@inertiajs/react';
import App from '@/Layouts/App';
import { paymentProfiles, emailTransports } from '@/Pages/Platform/Admin/data/mockData.js';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Chip,
} from '@heroui/react';
import {
  Cog6ToothIcon,
  CreditCardIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

const shortcuts = [
  {
    title: 'Platform identity',
    description: 'Branding, metadata, and trust center links.',
    icon: Cog6ToothIcon,
    href: route('admin.settings.platform.index'),
  },
  {
    title: 'Payment gateways',
    description: 'API keys, webhooks, and payout automation.',
    icon: CreditCardIcon,
    href: route('admin.settings.payment-gateways'),
  },
  {
    title: 'Email infrastructure',
    description: 'Transports, templates, and routing defaults.',
    icon: EnvelopeIcon,
    href: route('admin.settings.email'),
  },
  {
    title: 'System maintenance',
    description: 'Control maintenance mode, bypass rules, and downtime messaging.',
    icon: WrenchScrewdriverIcon,
    href: route('admin.settings.maintenance.index'),
  },
];

const mainCardStyle = {
  border: `var(--borderWidth, 2px) solid transparent`,
  borderRadius: `var(--borderRadius, 12px)`,
  fontFamily: `var(--fontFamily, "Inter")`,
  background: `linear-gradient(135deg, 
    var(--theme-content1, #FAFAFA) 20%, 
    var(--theme-content2, #F4F4F5) 10%, 
    var(--theme-content3, #F1F3F4) 20%)`,
};

const headerStyle = {
  borderColor: `var(--theme-divider, #E4E4E7)`,
  background: `linear-gradient(135deg, 
    color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
    color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
};

const statCardStyle = {
  background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
  border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
  borderRadius: `var(--borderRadius, 12px)`,
};

const SettingsIndex = () => (
  <>
    <Head title="Settings - Admin" />
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6">
      <Card className="transition-all duration-200" style={mainCardStyle}>
        <CardHeader className="border-b p-0" style={headerStyle}>
          <div className="p-6 w-full">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-xl flex items-center justify-center"
                style={{
                  background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                  borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                  borderWidth: `var(--borderWidth, 2px)`,
                  borderRadius: `var(--borderRadius, 12px)`,
                }}
              >
                <Cog6ToothIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-foreground">Admin Settings Hub</h4>
                <p className="text-sm text-default-500">
                  Surface fast paths into the most edited configuration areas.
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardBody className="p-6 space-y-6">
          {/* Shortcuts */}
          <div>
            <div className="mb-4">
              <h5 className="text-base font-semibold text-foreground">Shortcuts</h5>
              <p className="text-xs text-default-500">
                Everything is permissioned, so operators only see pages they can edit.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.title} className="p-4 flex flex-col gap-4" style={statCardStyle}>
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-xl"
                      style={{ background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)` }}
                    >
                      <shortcut.icon className="h-5 w-5" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">{shortcut.title}</p>
                      <p className="text-sm text-default-500">{shortcut.description}</p>
                    </div>
                  </div>
                  <Button as={Link} href={shortcut.href} variant="flat" color="primary">
                    Configure
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Infra Health */}
          <div>
            <div className="mb-4">
              <h5 className="text-base font-semibold text-foreground">Infra Health</h5>
              <p className="text-xs text-default-500">
                Snapshot of the most critical integrations powering billing and communication.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 space-y-2" style={statCardStyle}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Payment gateways</p>
                    <p className="text-xs text-default-500">{paymentProfiles.length} providers connected</p>
                  </div>
                  <Chip size="sm" variant="flat" color="success">
                    Stable
                  </Chip>
                </div>
                <ul className="text-sm text-default-600">
                  {paymentProfiles.map((profile) => (
                    <li
                      key={profile.id}
                      className="flex items-center justify-between border-b border-dashed border-default-100 py-2 last:border-0"
                    >
                      <span>{profile.name}</span>
                      <span className="text-xs text-default-500">
                        {profile.mode} · {profile.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 space-y-2" style={statCardStyle}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Email transports</p>
                    <p className="text-xs text-default-500">{emailTransports.length} providers available</p>
                  </div>
                  <Chip size="sm" variant="flat" color="success">
                    Healthy
                  </Chip>
                </div>
                <ul className="text-sm text-default-600">
                  {emailTransports.map((transport) => (
                    <li
                      key={transport.id}
                      className="flex items-center justify-between border-b border-dashed border-default-100 py-2 last:border-0"
                    >
                      <span>{transport.name}</span>
                      <span className="text-xs text-default-500">{transport.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Audit Log Reminder */}
          <div className="p-4" style={statCardStyle}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-base font-semibold text-foreground">Audit Log Reminder</h5>
              <ShieldCheckIcon className="h-5 w-5 text-default-400" />
            </div>
            <p className="text-xs text-default-500 mb-3">
              Platform settings changes replicate to every tenant, so capture intent in an audit entry.
            </p>
            <p className="text-sm text-default-600">
              Every save action records the admin user, diff summary, and the originating IP. Export logs from the
              security center when auditors request change evidence.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  </>
);

SettingsIndex.layout = (page) => <App>{page}</App>;

export default SettingsIndex;
