import React from 'react';
import { Head, Link } from '@inertiajs/react';
import App from '@/Layouts/App';
import { billingSummary, transactionHistory, invoiceCollection, analyticsTimeSeries } from '@/Pages/Platform/Admin/data/mockData.js';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ReceiptPercentIcon,
  ShieldCheckIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const trendData = analyticsTimeSeries.mrr.map((entry) => ({
  month: entry.month,
  value: entry.value / 1000,
}));

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

const transactionColumns = [
  { key: 'id', label: 'ID' },
  { key: 'tenant', label: 'TENANT' },
  { key: 'type', label: 'TYPE' },
  { key: 'amount', label: 'AMOUNT' },
  { key: 'method', label: 'METHOD' },
  { key: 'status', label: 'STATUS' },
  { key: 'date', label: 'TIMESTAMP' },
];

const BillingIndex = () => {
  const stats = [
    {
      label: 'Monthly recurring revenue',
      value: `$${(billingSummary.mrr / 1000).toFixed(1)}k`,
      change: '+2.1% MoM',
      icon: CurrencyDollarIcon,
    },
    {
      label: 'Annual run rate',
      value: `$${(billingSummary.arr / 1000000).toFixed(1)}M`,
      change: 'Forecasted',
      icon: ArrowTrendingUpIcon,
    },
    {
      label: 'Net revenue retention',
      value: `${billingSummary.netRevenueRetention}%`,
      change: 'Rolling 12 months',
      icon: ReceiptPercentIcon,
    },
    {
      label: 'Gross margin',
      value: `${billingSummary.grossMargin}%`,
      change: 'After infra',
      icon: ShieldCheckIcon,
    },
  ];

  const riskInvoices = invoiceCollection.filter((invoice) => invoice.status !== 'paid');

  return (
    <>
      <Head title="Billing - Admin" />
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
                    <CurrencyDollarIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-foreground">Billing Operations</h4>
                    <p className="text-sm text-default-500">
                      Monitor cash collections, true-ups, and payment failures across tenants.
                    </p>
                  </div>
                </div>
                <Button as={Link} href={route('admin.billing.invoices')} variant="flat" color="primary">
                  View invoices
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

            {/* Revenue Trend Chart */}
            <div className="p-4" style={statCardStyle}>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Revenue Trend</h5>
                <p className="text-xs text-default-500">
                  Net of discounts and credits. Pulls directly from finance data warehouse nightly.
                </p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="billingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--theme-primary)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--theme-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="var(--theme-default-400)" />
                    <YAxis stroke="var(--theme-default-400)" tickFormatter={(value) => `$${value}k`} width={60} />
                    <Tooltip
                      formatter={(value) => [`$${value.toFixed(1)}k`, 'MRR']}
                      contentStyle={{
                        background: 'var(--theme-content1)',
                        borderRadius: '12px',
                        border: '1px solid var(--theme-divider)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--theme-primary)"
                      fillOpacity={1}
                      fill="url(#billingGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Transactions Table */}
            <div>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Recent Transactions</h5>
                <p className="text-xs text-default-500">
                  Includes true-ups, add-ons, and usage charges captured in the last 72 hours.
                </p>
              </div>
              <Table
                aria-label="Recent transactions"
                removeWrapper
                classNames={{
                  th: 'bg-transparent text-default-500 font-semibold text-xs uppercase',
                  td: 'py-3',
                }}
              >
                <TableHeader columns={transactionColumns}>
                  {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody items={transactionHistory}>
                  {(transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-semibold">{transaction.id}</TableCell>
                      <TableCell>{transaction.tenant}</TableCell>
                      <TableCell>{transaction.type}</TableCell>
                      <TableCell className="font-medium">${transaction.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-default-600">{transaction.method}</TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={
                            transaction.status === 'settled'
                              ? 'success'
                              : transaction.status === 'pending'
                                ? 'warning'
                                : 'danger'
                          }
                        >
                          {transaction.status}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-default-500">
                        {new Date(transaction.date).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Collections Watchlist */}
            <div>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Collections Watchlist</h5>
                <p className="text-xs text-default-500">
                  Invoices requiring attention based on payment status or manual channels.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {riskInvoices.map((invoice) => (
                  <div key={invoice.number} className="p-4" style={statCardStyle}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{invoice.tenant}</p>
                        <p className="text-xs text-default-500">{invoice.number}</p>
                      </div>
                      <Chip size="sm" color={invoice.status === 'overdue' ? 'danger' : 'warning'} variant="flat">
                        {invoice.status}
                      </Chip>
                    </div>
                    <p className="mt-4 text-2xl font-bold text-foreground">${invoice.amount.toLocaleString()}</p>
                    <p className="text-xs text-default-500">Due {invoice.dueDate}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-default-500">
                      <span>Channel · {invoice.channel}</span>
                      <span>Owner · {invoice.owner}</span>
                    </div>
                    <Button
                      className="mt-4"
                      size="sm"
                      variant="flat"
                      color="primary"
                      startContent={<ClipboardDocumentCheckIcon className="h-4 w-4" />}
                    >
                      Trigger reminder
                    </Button>
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

BillingIndex.layout = (page) => <App>{page}</App>;

export default BillingIndex;
