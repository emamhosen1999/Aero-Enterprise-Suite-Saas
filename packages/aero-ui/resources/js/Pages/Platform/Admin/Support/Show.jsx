import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import App from '@/Layouts/App';
import { supportTickets, ticketThreads } from '@/Pages/Platform/Admin/data/mockData.js';
import {
  LifebuoyIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ClockIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Chip,
  Divider,
  Textarea,
  User,
} from '@heroui/react';
import { showToast } from '@/utils/toastUtils.jsx';

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

const SupportShow = () => {
  const { ticket, ticketId } = usePage().props;
  const hydratedTicket = ticket ?? supportTickets.find((item) => item.id === ticketId) ?? supportTickets[0];
  const thread = ticketThreads[hydratedTicket.id] ?? [];

  const stats = [
    {
      label: 'Priority',
      value: hydratedTicket.priority,
      change: hydratedTicket.channel,
      icon: LifebuoyIcon,
    },
    {
      label: 'Queue',
      value: hydratedTicket.queue,
      change: `Owner · ${hydratedTicket.owner}`,
      icon: ShieldCheckIcon,
    },
    {
      label: 'SLA deadline',
      value: new Date(hydratedTicket.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      change: new Date(hydratedTicket.slaDeadline).toLocaleDateString(),
      icon: ClockIcon,
    },
    {
      label: 'Status',
      value: hydratedTicket.status.replaceAll('_', ' '),
      change: hydratedTicket.updatedAt,
      icon: ArrowPathIcon,
    },
  ];

  const tagColor = (tag) => {
    if (tag.includes('security')) {
      return 'danger';
    }
    if (tag.includes('billing')) {
      return 'warning';
    }
    return 'primary';
  };

  const handleReply = () => {
    showToast.info('Reply queued - Conversation update will dispatch via preferred channel.');
  };

  return (
    <>
      <Head title={`${hydratedTicket.subject} - Admin`} />
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <Card className="transition-all duration-200" style={mainCardStyle}>
          <CardHeader className="border-b p-0" style={headerStyle}>
            <div className="p-6 w-full">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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
                    <LifebuoyIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-foreground">{hydratedTicket.subject}</h4>
                    <p className="text-sm text-default-500">Tenant · {hydratedTicket.tenant}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button as={Link} href="/admin/support" variant="flat">
                    Back to queue
                  </Button>
                  <Button color="primary" startContent={<PaperAirplaneIcon className="h-4 w-4" />} onPress={handleReply}>
                    Send update
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardBody className="p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="p-4" style={statCardStyle}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-default-500">{stat.label}</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-default-400">{stat.change}</p>
                    </div>
                    <div
                      className="p-2 rounded-lg"
                      style={{ background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)` }}
                    >
                      <stat.icon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Context */}
            <div className="p-4 space-y-4 text-sm text-default-600" style={statCardStyle}>
              <div className="mb-2">
                <h5 className="text-base font-semibold text-foreground">Context</h5>
                <p className="text-xs text-default-500">Operational data pulled from ticket metadata.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Chip color="primary" variant="flat">
                  Impact · {hydratedTicket.impact}
                </Chip>
                <Chip color="secondary" variant="flat">
                  Channel · {hydratedTicket.channel}
                </Chip>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-default-500">Tags</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {hydratedTicket.tags?.map((tag) => (
                    <Chip key={tag} color={tagColor(tag)} variant="flat" size="sm">
                      {tag}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-dashed border-default-200 p-4">
                <p className="font-semibold text-foreground">Playbooks attached</p>
                <ul className="mt-3 space-y-2">
                  <li>• Finance export webhooks</li>
                  <li>• Incident comms template</li>
                  <li>• Rollback checklist</li>
                </ul>
              </div>
            </div>

            {/* Conversation Thread */}
            <div>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Conversation Thread</h5>
                <p className="text-xs text-default-500">Latest replies synced from shared inbox.</p>
              </div>
              <div className="space-y-4">
                {thread.map((message) => (
                  <div key={message.id} className="p-4 space-y-3" style={statCardStyle}>
                    <div className="flex items-center justify-between">
                      <User
                        name={message.author}
                        description={message.role}
                        avatarProps={{ src: `https://i.pravatar.cc/150?u=${message.author}` }}
                      />
                      <span className="text-xs text-default-500">{new Date(message.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-default-700 dark:text-default-200">{message.body}</p>
                  </div>
                ))}
                {!thread.length && (
                  <p className="text-sm text-default-500">No conversation history yet. Start by logging a summary.</p>
                )}
                <div className="p-4" style={statCardStyle}>
                  <Textarea minRows={3} placeholder="Draft response..." variant="bordered" />
                  <div className="mt-3 flex justify-end">
                    <Button color="primary" startContent={<PaperAirplaneIcon className="h-4 w-4" />} onPress={handleReply}>
                      Reply via channel
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* SLA Timeline */}
            <div>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">SLA Timeline</h5>
                <p className="text-xs text-default-500">
                  Confidence view combining first-response and resolution clocks.
                </p>
              </div>
              <div className="space-y-4 text-sm text-default-600">
                {[
                  {
                    title: 'First response',
                    status: 'Met',
                    detail: 'Reply sent within 7 minutes using finance template.',
                  },
                  {
                    title: 'Investigation',
                    status: 'In progress',
                    detail: 'Billing worker logs pulled, correlating with webhook retries.',
                  },
                  {
                    title: 'Resolution',
                    status: 'Due',
                    detail: `Resolve before ${new Date(hydratedTicket.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC to stay green.`,
                  },
                ].map((step) => (
                  <div key={step.title} className="p-4" style={{ ...statCardStyle, borderStyle: 'dashed' }}>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{step.title}</p>
                      <Chip
                        color={step.status === 'Met' ? 'success' : step.status === 'In progress' ? 'warning' : 'danger'}
                        variant="flat"
                        size="sm"
                      >
                        {step.status}
                      </Chip>
                    </div>
                    <p className="mt-2 text-default-600">{step.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Handover */}
            <div className="p-4 space-y-3 text-sm text-default-600" style={statCardStyle}>
              <div className="mb-2">
                <h5 className="text-base font-semibold text-foreground">Handover</h5>
                <p className="text-xs text-default-500">Document next steps before paging engineering.</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-default-500">Next update</span>
                <span>Every 30m in shared Slack channel #ops-finance.</span>
              </div>
              <Divider />
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-default-500">Fallback owner</span>
                <span>Finance pod lead · Dana Kingsley</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

SupportShow.layout = (page) => <App>{page}</App>;

export default SupportShow;
