import React, { useMemo } from 'react';
import { Head } from '@inertiajs/react';
import App from '@/Layouts/App';
import { moduleCatalog } from '@/Pages/Platform/Admin/data/mockData.js';
import {
  PuzzlePieceIcon,
  RocketLaunchIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  CubeIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ChartBarSquareIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { 
  Button, 
  Card, 
  CardBody, 
  CardHeader, 
  Chip, 
  Progress, 
  Switch,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';

const iconMap = {
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ChartBarSquareIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
};

const mainCardStyle = {
  border: 'var(--borderWidth, 2px) solid transparent',
  borderRadius: 'var(--borderRadius, 12px)',
  background: `linear-gradient(135deg, 
    var(--theme-content1, #FAFAFA) 20%, 
    var(--theme-content2, #F4F4F5) 10%, 
    var(--theme-content3, #F1F3F4) 20%)`,
};

const statCardStyle = {
  background: 'var(--theme-content1, #FAFAFA)',
  borderColor: 'var(--theme-divider, #E4E4E7)',
  borderWidth: 'var(--borderWidth, 2px)',
  borderRadius: 'var(--borderRadius, 12px)',
};

const releaseColumns = [
  { uid: 'id', name: 'Release' },
  { uid: 'module', name: 'Module' },
  { uid: 'focus', name: 'Focus' },
  { uid: 'window', name: 'Window' },
  { uid: 'owner', name: 'Owner' },
];

const ModulesIndex = () => {
  const stats = useMemo(() => ([
    { label: 'Catalog modules', value: moduleCatalog.length, change: 'Across 4 categories', icon: PuzzlePieceIcon, trend: 'up' },
    { label: 'Active tenants', value: moduleCatalog.reduce((total, module) => total + module.activeTenants, 0), change: 'Includes add-on tenants', icon: RocketLaunchIcon, trend: 'up' },
    { label: 'Avg adoption', value: `${Math.round(moduleCatalog.reduce((total, module) => total + module.adoption, 0) / moduleCatalog.length)}%`, change: 'Weighted by tenants', icon: ShieldCheckIcon, trend: 'up' },
    { label: 'Upcoming releases', value: 6, change: 'Next 30 days', icon: WrenchScrewdriverIcon, trend: 'up' },
  ]), []);

  const releases = [
    { id: 'REL-229', module: 'People OS', focus: 'Skill graph v3', window: 'Dec 05', owner: 'People Cloud' },
    { id: 'REL-231', module: 'Compliance Control Center', focus: 'Zero-copy attestation share', window: 'Dec 12', owner: 'GRC Guild' },
    { id: 'REL-233', module: 'Finance & Billing', focus: 'Usage arbitrage alerts', window: 'Dec 18', owner: 'Monetisation Lab' },
  ];

  return (
    <>
      <Head title="Modules - Admin" />
      <div className="flex flex-col w-full h-full p-4">
        <div className="space-y-4">
          {/* Single Parent Card - matching tenant Employee page structure */}
          <Card style={mainCardStyle} shadow="none" className="transition-all duration-200">
            <CardHeader 
              className="border-b p-0"
              style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}
            >
              <div className="p-6 w-full">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className="p-3 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--theme-primary) 25%, transparent)',
                        borderWidth: 'var(--borderWidth, 2px)',
                        borderRadius: 'var(--borderRadius, 12px)',
                      }}
                    >
                      <PuzzlePieceIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">Module catalog</h1>
                      <p className="text-sm text-default-500">
                        Curate which product surfaces are provisioned per tenant and monitor adoption health.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardBody className="p-6">
              {/* Stats Grid - icons on RIGHT like tenant Employee page */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((stat, index) => (
                  <Card key={index} style={statCardStyle} className="transition-all duration-200 min-h-[120px]">
                    <CardBody className="p-4 flex flex-row items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wider text-default-400">
                          {stat.label}
                        </span>
                        <span className="text-2xl font-bold text-foreground mt-1">
                          {stat.value}
                        </span>
                        <span className={`text-sm mt-1 ${stat.trend === 'down' ? 'text-danger' : 'text-success'}`}>
                          {stat.change}
                        </span>
                      </div>
                      <div 
                        className="p-3 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, transparent)',
                        }}
                      >
                        <stat.icon className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>

              {/* Active Modules Section */}
              <div className="mb-6">
                <div className="mb-4">
                  <p className="text-lg font-semibold text-foreground">Active modules</p>
                  <p className="text-sm text-default-500">Toggle discovery availability and review adoption telemetry before shipping to tenants.</p>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  {moduleCatalog.map((module) => {
                    const Icon = iconMap[module.icon] ?? CubeIcon;
                    return (
                      <Card key={module.id} style={statCardStyle}>
                        <CardBody className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="rounded-2xl bg-primary/10 p-2">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-default-900 dark:text-white">{module.name}</p>
                                <p className="text-xs uppercase tracking-wide text-default-400">{module.category}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Switch defaultSelected color="primary">
                                Listed
                              </Switch>
                              <Chip size="sm" variant="flat" color={module.status === 'beta' ? 'warning' : 'success'}>
                                {module.status}
                              </Chip>
                            </div>
                          </div>

                          <p className="text-sm text-default-600">{module.description}</p>

                          <div className="grid gap-3 text-sm text-default-600">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-default-400">Adoption</p>
                              <div className="flex items-center gap-2">
                                <Progress value={module.adoption} color="secondary" size="sm" className="flex-1" />
                                <span className="text-xs text-default-500">{module.adoption}%</span>
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-default-500">
                              <span>{module.activeTenants} tenants live</span>
                              <span>Owner · {module.owner}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {module.roadmap.map((item) => (
                                <Chip key={`${module.id}-${item}`} size="sm" variant="flat">
                                  {item}
                                </Chip>
                              ))}
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Release Calendar Section */}
              <div className="mb-6">
                <div className="mb-4">
                  <p className="text-lg font-semibold text-foreground">Release calendar</p>
                  <p className="text-sm text-default-500">Sequence changes so provisioning, billing, and documentation stay in sync.</p>
                </div>
                <div className="overflow-auto">
                  <Table
                    aria-label="Release calendar table"
                    removeWrapper
                    classNames={{
                      base: "bg-transparent min-w-[600px]",
                      th: "backdrop-blur-md font-medium text-xs sticky top-0 z-10 whitespace-nowrap",
                      td: "py-3 whitespace-nowrap",
                      table: "border-collapse table-auto",
                      tr: "hover:opacity-80 transition-all duration-200"
                    }}
                    style={{
                      '--table-header-bg': 'color-mix(in srgb, var(--theme-content2) 60%, transparent)',
                      '--table-row-hover': 'color-mix(in srgb, var(--theme-content2) 30%, transparent)',
                      '--table-border': 'color-mix(in srgb, var(--theme-content3) 30%, transparent)',
                    }}
                    isHeaderSticky
                  >
                    <TableHeader columns={releaseColumns}>
                      {(column) => (
                        <TableColumn 
                          key={column.uid} 
                          className="backdrop-blur-md"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--theme-content2) 60%, transparent)',
                            color: 'var(--theme-foreground)',
                            borderBottom: '1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)',
                          }}
                        >
                          {column.name}
                        </TableColumn>
                      )}
                    </TableHeader>
                    <TableBody items={releases}>
                      {(release) => (
                        <TableRow 
                          key={release.id}
                          className="transition-all duration-200"
                          style={{
                            color: 'var(--theme-foreground)',
                            borderBottom: '1px solid color-mix(in srgb, var(--theme-content3) 30%, transparent)',
                          }}
                        >
                          <TableCell className="font-semibold">{release.id}</TableCell>
                          <TableCell>{release.module}</TableCell>
                          <TableCell className="text-default-600">{release.focus}</TableCell>
                          <TableCell>{release.window}</TableCell>
                          <TableCell className="text-default-600">{release.owner}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Rollout Checklist Section */}
              <div className="mb-6">
                <div className="mb-4">
                  <p className="text-lg font-semibold text-foreground">Rollout checklist</p>
                  <p className="text-sm text-default-500">Confirm every launch artifact before exposing a module to tenants.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {[{
                    title: 'Provisioning automation',
                    items: ['Terraform plan applied', 'Observability hook configured', 'Rollback runbook attached'],
                  }, {
                    title: 'Go-to-market',
                    items: ['Docs approved', 'Demo environment refreshed', 'Enablement session scheduled'],
                  }].map((group) => (
                    <Card key={group.title} style={statCardStyle}>
                      <CardBody>
                        <p className="font-semibold text-default-900 dark:text-white">{group.title}</p>
                        <ul className="mt-3 space-y-2 text-sm text-default-600">
                          {group.items.map((item) => (
                            <li key={item} className="flex items-center gap-2">
                              <CubeIcon className="h-4 w-4 text-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Operational Guardrails Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-semibold text-foreground">Operational guardrails</p>
                    <p className="text-sm text-default-500">Use automation to disable modules if telemetry drifts.</p>
                  </div>
                  <Button size="sm" variant="flat" color="primary">
                    Manage policies
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {[{
                    name: 'Adoption floor',
                    detail: 'Auto-hide beta modules when adoption < 20% for 2 weeks.'
                  }, {
                    name: 'Incident pause',
                    detail: 'Pause provisioning if module has Critical incident open > 2h.'
                  }].map((policy) => (
                    <Card key={policy.name} style={statCardStyle}>
                      <CardBody>
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-default-900 dark:text-white">{policy.name}</p>
                          <Switch defaultSelected size="sm" color="secondary" />
                        </div>
                        <p className="mt-2 text-sm text-default-600">{policy.detail}</p>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
};

ModulesIndex.layout = (page) => <App>{page}</App>;

export default ModulesIndex;
