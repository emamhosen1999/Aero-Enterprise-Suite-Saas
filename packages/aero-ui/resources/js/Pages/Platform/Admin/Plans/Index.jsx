import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import App from '@/Layouts/App';
import { addOnCatalog, planMetrics } from '@/Pages/Platform/Admin/data/mockData.js';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';
import {
  ArrowTrendingUpIcon,
  SparklesIcon,
  Squares2X2Icon,
  PresentationChartLineIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { 
  Button, 
  Card, 
  CardBody, 
  CardHeader, 
  Chip, 
  Divider, 
  Progress, 
  Tooltip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';

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

const addOnColumns = [
  { uid: 'name', name: 'Name' },
  { uid: 'description', name: 'Description' },
  { uid: 'price', name: 'Price' },
  { uid: 'attachmentRate', name: 'Attachment Rate' },
  { uid: 'popularWith', name: 'Popular With' },
];

const PlansIndex = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/plans')
      .then(response => {
        if (response.data.success) {
          // Transform database plans to display format
          const transformedPlans = response.data.plans.map(plan => {
            const limits = plan.limits || {};
            return {
              id: plan.id,
              name: plan.name,
              headline: plan.description || 'Complete enterprise solution',
              price: plan.monthly_price || 0,
              cadence: 'month',
              seatsIncluded: limits.seats_included || 100,
              storage: limits.storage || '1 TB',
              apiCalls: limits.api || '1M',
              activeTenants: 0, // TODO: Should come from subscriptions count
              avgSeatUtilization: 0.75, // TODO: Calculate from actual data
              badge: limits.badge || (plan.is_featured ? 'Featured' : null),
              features: plan.features || plan.modules?.map(m => m.name) || [],
            };
          });
          setPlans(transformedPlans);
        }
      })
      .catch(error => {
        console.error('Failed to load plans:', error);
        showToast.error('Failed to load plans');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const catalog = plans;

  const stats = [
    { label: 'Catalog plans', value: catalog.length, change: '+1 planned', icon: Squares2X2Icon, trend: 'up' },
    { label: 'Avg contract value', value: `$${planMetrics.averageContractValue.toLocaleString()}`, change: 'Net 38% YoY', icon: PresentationChartLineIcon, trend: 'up' },
    { label: 'Expansion rate', value: `${(planMetrics.expansionRate * 100).toFixed(0)}%`, change: 'Rolling 90d', icon: ArrowTrendingUpIcon, trend: 'up' },
    { label: 'Trial conversion', value: `${(planMetrics.trialConversion * 100).toFixed(0)}%`, change: 'Median per cohort', icon: SparklesIcon, trend: 'up' },
  ];

  if (loading) {
    return (
      <>
        <Head title="Plans - Admin" />
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            <p className="mt-2 text-default-500">Loading plans...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head title="Plans - Admin" />
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
                      <Squares2X2Icon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">Subscription catalog</h1>
                      <p className="text-sm text-default-500">
                        Package, price, and position the experiences delivered across every tenant.
                      </p>
                    </div>
                  </div>
                  <Button 
                    as={Link} 
                    color="primary" 
                    href={route('admin.plans.create')}
                    startContent={<PlusCircleIcon className="h-4 w-4" />}
                    className="text-white font-medium"
                    style={{
                      background: 'linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 80%, var(--theme-secondary)))',
                    }}
                  >
                    Draft plan
                  </Button>
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

              {/* Live Plans Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-semibold text-foreground">Live plans</p>
                    <p className="text-sm text-default-500">Each card mirrors what provisioning automation enforces during tenant creation.</p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-default-400">{catalog.length} plans</p>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
            {catalog.map((plan) => (
              <Card
                key={plan.id}
                className="border border-white/30 bg-white/80 shadow-lg backdrop-blur dark:border-default-100/30 dark:bg-content2/70"
              >
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                        {plan.badge && (
                          <Chip color="primary" variant="flat" size="sm">
                            {plan.badge}
                          </Chip>
                        )}
                      </div>
                      <p className="text-sm text-default-500">{plan.headline}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        ${plan.price.toLocaleString()}
                        <span className="text-sm text-default-500">/{plan.cadence}</span>
                      </p>
                      <p className="text-xs text-default-400">{plan.seatsIncluded} seats included</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-default-600">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-default-400">Storage</p>
                      <p>{plan.storage}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-default-400">API</p>
                      <p>{plan.apiCalls}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-default-400">Active tenants</p>
                      <p>{plan.activeTenants}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-default-400">Seat utilisation</p>
                      <div className="flex items-center gap-2">
                        <Progress className="flex-1" value={plan.avgSeatUtilization * 100} color="primary" size="sm" />
                        <span className="text-xs text-default-500">{(plan.avgSeatUtilization * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  <Divider />

                  <div className="grid gap-2">
                    {plan.features.map((feature) => (
                      <div key={`${plan.id}-${feature}`} className="flex items-center gap-2 text-sm text-default-600">
                        <ShieldCheckIcon className="h-4 w-4 text-success" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
                </div>
              </div>

              {/* Add-ons Section */}
              <div className="mb-6">
                <div className="mb-4">
                  <p className="text-lg font-semibold text-foreground">Add-ons</p>
                  <p className="text-sm text-default-500">Layer capabilities without forking the core plans. Track attachment rates per cohort.</p>
                </div>
                <div className="overflow-auto">
                  <Table
                    aria-label="Add-ons table"
                    removeWrapper
                    classNames={{
                      base: "bg-transparent min-w-[800px]",
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
                    <TableHeader columns={addOnColumns}>
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
                    <TableBody items={addOnCatalog}>
                      {(addon) => (
                        <TableRow 
                          key={addon.id}
                          className="transition-all duration-200"
                          style={{
                            color: 'var(--theme-foreground)',
                            borderBottom: '1px solid color-mix(in srgb, var(--theme-content3) 30%, transparent)',
                          }}
                        >
                          <TableCell className="font-semibold">{addon.name}</TableCell>
                          <TableCell className="text-default-600">{addon.description}</TableCell>
                          <TableCell className="font-semibold">${addon.price}/{addon.cadence}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={addon.attachmentRate * 100} color="secondary" size="sm" className="max-w-[100px]" />
                              <span className="text-xs text-default-500">{(addon.attachmentRate * 100).toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {addon.popularWith.map((plan) => (
                                <Chip key={plan} size="sm" variant="flat" color="default">
                                  {plan}
                                </Chip>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pricing Experiments Section */}
              <div>
                <div className="mb-4">
                  <p className="text-lg font-semibold text-foreground">Pricing experiments</p>
                  <p className="text-sm text-default-500">Document hypothesis, guardrails, and exit criteria per experiment.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {[{
                    name: 'Seat overage relax',
                    hypothesis: 'Allow 10% soft overage to increase net expansions.',
                    metric: 'Net revenue retention',
                    window: 'Nov 10 - Dec 15',
                    owner: 'Monetisation lab'
                  }, {
                    name: 'AI coach packaging',
                    hypothesis: 'Bundling AI coach with Growth increases attach 22%.',
                    metric: 'Attach rate',
                    window: 'Nov 22 - Jan 05',
                    owner: 'Product marketing'
                  }].map((experiment) => (
                    <Card key={experiment.name} style={statCardStyle}>
                      <CardBody className="space-y-2 text-sm text-default-600">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-default-900 dark:text-white">{experiment.name}</p>
                          <Tooltip content={`Owner: ${experiment.owner}`}>
                            <SparklesIcon className="h-4 w-4 text-primary" />
                          </Tooltip>
                        </div>
                        <p>{experiment.hypothesis}</p>
                        <Divider />
                        <p className="text-xs uppercase tracking-wide text-default-400">Success metric</p>
                        <p>{experiment.metric}</p>
                        <p className="text-xs uppercase tracking-wide text-default-400">Window</p>
                        <p>{experiment.window}</p>
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

PlansIndex.layout = (page) => <App>{page}</App>;

export default PlansIndex;
