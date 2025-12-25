import React, { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import App from '@/Layouts/App';
import { ticketQueues, supportTickets } from '@/Pages/Platform/Admin/data/mockData.js';
import {
  LifebuoyIcon,
  SignalIcon,
  ClockIcon,
  BoltIcon,
  ArrowUpRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Chip,
  Progress,
  Tooltip,
  User,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { showToast } from '@/utils/toastUtils.jsx';

const statusColorMap = {
  open: 'warning',
  escalated: 'danger',
  waiting_on_customer: 'secondary',
  resolved: 'success',
};

const priorityColorMap = {
  urgent: 'danger',
  high: 'warning',
  medium: 'primary',
  low: 'secondary',
};

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

const ticketColumns = [
  { key: 'ticket', label: 'TICKET' },
  { key: 'tenant', label: 'TENANT' },
  { key: 'priority', label: 'PRIORITY' },
  { key: 'owner', label: 'OWNER' },
  { key: 'status', label: 'STATUS' },
  { key: 'updated', label: 'UPDATED' },
  { key: 'sla', label: 'SLA' },
];

const SupportIndex = () => {
  const stats = useMemo(() => {
    const urgentTickets = supportTickets.filter((ticket) => ticket.priority === 'urgent').length;
    const breachedQueues = ticketQueues.filter((queue) => queue.slaBreaches > 0).length;
    const fastestQueue = ticketQueues.reduce(
      (prev, curr) => (curr.medianFirstResponse < prev.medianFirstResponse ? curr : prev),
      ticketQueues[0]
    );

    return [
      {
        label: 'Active tickets',
        value: supportTickets.length,
        change: `${urgentTickets} urgent in play`,
        icon: LifebuoyIcon,
        trend: urgentTickets > 0 ? 'down' : 'up',
      },
      {
        label: 'Queues breaching SLA',
        value: breachedQueues,
        change: 'Monitored live',
        icon: ExclamationTriangleIcon,
        trend: breachedQueues ? 'down' : 'up',
      },
      {
        label: 'Fastest queue',
        value: fastestQueue.name,
        change: `${fastestQueue.medianFirstResponse} median first reply`,
        icon: BoltIcon,
      },
      {
        label: 'CSAT (rolling 7d)',
        value: `${Math.round(ticketQueues.reduce((total, queue) => total + queue.satisfaction, 0) / ticketQueues.length)}%`,
        change: 'Post-resolution surveys',
        icon: SignalIcon,
      },
    ];
  }, []);

  const assignments = [
    { id: 'tg-1', name: 'Billing pod', avatar: 'https://i.pravatar.cc/150?u=billing', tickets: 6 },
    { id: 'tg-2', name: 'Platform ops', avatar: 'https://i.pravatar.cc/150?u=platform', tickets: 4 },
    { id: 'tg-3', name: 'Security pod', avatar: 'https://i.pravatar.cc/150?u=security', tickets: 3 },
  ];

  return (
    <>
      <Head title="Support - Admin" />
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
                    <h4 className="text-2xl font-bold text-foreground">Support Operations</h4>
                    <p className="text-sm text-default-500">
                      Stay ahead of escalations with queue health, SLA timers, and conversation context.
                    </p>
                  </div>
                </div>
                <Button
                  color="primary"
                  variant="solid"
                  startContent={<LifebuoyIcon className="h-4 w-4" />}
                  onPress={() =>
                    showToast.info('Escalation logged - Automation will open a pager thread once workflow hooks are connected.')
                  }
                >
                  Log escalation
                </Button>
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

            {/* Queue Health */}
            <div>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Queue Health</h5>
                <p className="text-xs text-default-500">Where crews should swarm to protect SLAs.</p>
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                {ticketQueues.map((queue) => (
                  <div key={queue.id} className="p-4 space-y-3" style={statCardStyle}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold text-foreground">{queue.name}</p>
                        <p className="text-xs uppercase tracking-wide text-default-500">{queue.open} open tickets</p>
                      </div>
                      <Chip size="sm" variant="flat" color={queue.slaBreaches ? 'danger' : 'success'}>
                        {queue.slaBreaches ? `${queue.slaBreaches} SLA` : 'Green'}
                      </Chip>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-default-500">Median first response</div>
                      <p className="text-lg font-semibold">{queue.medianFirstResponse}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-default-500">
                        <span>CSAT</span>
                        <span>{queue.satisfaction}%</span>
                      </div>
                      <Progress value={queue.satisfaction} color="secondary" size="sm" className="mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Ticket Feed Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h5 className="text-base font-semibold text-foreground">Live Ticket Feed</h5>
                  <p className="text-xs text-default-500">Triage by urgency, owner, or tenant impact.</p>
                </div>
                <Button size="sm" variant="flat" color="secondary" startContent={<ArrowUpRightIcon className="h-4 w-4" />}>
                  Export log
                </Button>
              </div>
              <Table
                aria-label="Support tickets"
                removeWrapper
                classNames={{
                  th: 'bg-transparent text-default-500 font-semibold text-xs uppercase',
                  td: 'py-3',
                }}
              >
                <TableHeader columns={ticketColumns}>
                  {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody items={supportTickets}>
                  {(ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-content2/40">
                      <TableCell>
                        <Link href={`/admin/support/${ticket.id}`} className="font-semibold hover:text-primary">
                          {ticket.id}
                        </Link>
                        <p className="text-xs text-default-500">{ticket.subject}</p>
                      </TableCell>
                      <TableCell>{ticket.tenant}</TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" color={priorityColorMap[ticket.priority]}>
                          {ticket.priority}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <User
                          name={ticket.owner}
                          description={ticket.queue}
                          avatarProps={{
                            size: 'sm',
                            src: `https://i.pravatar.cc/150?u=${ticket.owner}`,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" color={statusColorMap[ticket.status] ?? 'default'}>
                          {ticket.status.replaceAll('_', ' ')}
                        </Chip>
                      </TableCell>
                      <TableCell>{ticket.updatedAt}</TableCell>
                      <TableCell>
                        <Tooltip content={`Deadline ${new Date(ticket.slaDeadline).toLocaleString()}`}>
                          <span className="text-xs text-default-500">
                            {new Date(ticket.slaDeadline).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Crew Capacity */}
            <div>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Crew Capacity</h5>
                <p className="text-xs text-default-500">Ensure ownership is balanced before paging secondary pods.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="p-4" style={statCardStyle}>
                    <div className="flex items-center gap-3">
                      <User name={assignment.name} avatarProps={{ src: assignment.avatar }} />
                      <Chip size="sm" variant="flat" color={assignment.tickets > 5 ? 'warning' : 'success'}>
                        {assignment.tickets} active
                      </Chip>
                    </div>
                    <p className="mt-3 text-sm text-default-500">
                      {assignment.tickets > 5 ? 'Consider cross-pod assist.' : 'Capacity within guardrails.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Escalation Checklist */}
            <div>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Escalation Checklist</h5>
                <p className="text-xs text-default-500">Run before pinging engineering leadership.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    title: 'Platform impacting',
                    items: ['Status page updated', 'Incident commander assigned', 'Customer comms drafted'],
                  },
                  {
                    title: 'Tenant specific',
                    items: ['Screenshots or HAR attached', 'Last deployment reviewed', 'Runbook linked'],
                  },
                ].map((set) => (
                  <div
                    key={set.title}
                    className="p-4"
                    style={{
                      ...statCardStyle,
                      borderStyle: 'dashed',
                    }}
                  >
                    <p className="font-semibold text-foreground">{set.title}</p>
                    <ul className="mt-3 space-y-2 text-sm text-default-600">
                      {set.items.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" style={{ color: 'var(--theme-primary)' }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

SupportIndex.layout = (page) => <App>{page}</App>;

export default SupportIndex;
