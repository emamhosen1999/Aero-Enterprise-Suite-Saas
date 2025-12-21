import React, { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import App from '@/Layouts/App';
import { invoiceCollection } from '@/Pages/Platform/Admin/data/mockData.js';
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Chip,
  Button,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { DocumentArrowDownIcon, MagnifyingGlassIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const statusColors = {
  paid: 'success',
  open: 'warning',
  overdue: 'danger',
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

const invoiceColumns = [
  { key: 'number', label: 'INVOICE' },
  { key: 'tenant', label: 'TENANT' },
  { key: 'issueDate', label: 'ISSUE DATE' },
  { key: 'dueDate', label: 'DUE DATE' },
  { key: 'amount', label: 'AMOUNT' },
  { key: 'channel', label: 'CHANNEL' },
  { key: 'owner', label: 'OWNER' },
  { key: 'status', label: 'STATUS' },
];

const Invoices = () => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredInvoices = useMemo(() => {
    return invoiceCollection.filter((invoice) => {
      const matchesQuery =
        invoice.tenant.toLowerCase().includes(query.toLowerCase()) ||
        invoice.number.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : invoice.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  const summary = useMemo(
    () => ({
      paid: invoiceCollection.filter((invoice) => invoice.status === 'paid').length,
      open: invoiceCollection.filter((invoice) => invoice.status === 'open').length,
      overdue: invoiceCollection.filter((invoice) => invoice.status === 'overdue').length,
    }),
    []
  );

  return (
    <>
      <Head title="Invoices - Admin" />
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
                    <DocumentTextIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-foreground">Invoice Register</h4>
                    <p className="text-sm text-default-500">
                      Track lifecycle from issuance to reconciliation across every tenant.
                    </p>
                  </div>
                </div>
                <Button variant="flat" color="primary" startContent={<DocumentArrowDownIcon className="h-4 w-4" />}>
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardBody className="p-6 space-y-6">
            {/* Filters */}
            <div className="p-4" style={statCardStyle}>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Filters</h5>
                <p className="text-xs text-default-500">
                  Combine search, status, and owner filters to locate invoices quickly.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Input
                  className="max-w-sm"
                  placeholder="Search by tenant or invoice #"
                  startContent={<MagnifyingGlassIcon className="h-4 w-4 text-default-400" />}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <Select
                  label="Status"
                  className="max-w-[200px]"
                  selectedKeys={[statusFilter]}
                  onSelectionChange={(keys) => {
                    const [value] = Array.from(keys);
                    setStatusFilter(value);
                  }}
                >
                  <SelectItem key="all">All</SelectItem>
                  <SelectItem key="paid">Paid</SelectItem>
                  <SelectItem key="open">Open</SelectItem>
                  <SelectItem key="overdue">Overdue</SelectItem>
                </Select>
              </div>
            </div>

            {/* Status Overview */}
            <div>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Status Overview</h5>
                <p className="text-xs text-default-500">Counts update in real-time as filters change.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {['paid', 'open', 'overdue'].map((status) => (
                  <div key={status} className="p-4" style={statCardStyle}>
                    <p className="text-xs uppercase tracking-wide text-default-400">{status}</p>
                    <p className="mt-2 text-3xl font-bold text-foreground">{summary[status]}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Invoice List Table */}
            <div>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Invoice List</h5>
                <p className="text-xs text-default-500">
                  Includes channel, owner, and issue window for audit readiness.
                </p>
              </div>
              <Table
                aria-label="Invoice list"
                removeWrapper
                classNames={{
                  th: 'bg-transparent text-default-500 font-semibold text-xs uppercase',
                  td: 'py-3',
                }}
              >
                <TableHeader columns={invoiceColumns}>
                  {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody items={filteredInvoices} emptyContent="No invoices match the filter.">
                  {(invoice) => (
                    <TableRow key={invoice.number}>
                      <TableCell className="font-semibold">{invoice.number}</TableCell>
                      <TableCell>{invoice.tenant}</TableCell>
                      <TableCell>{invoice.issueDate}</TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell className="font-medium">
                        ${invoice.amount.toLocaleString()} {invoice.currency}
                      </TableCell>
                      <TableCell className="text-default-600">{invoice.channel}</TableCell>
                      <TableCell className="text-default-600">{invoice.owner}</TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" color={statusColors[invoice.status] ?? 'default'}>
                          {invoice.status}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

Invoices.layout = (page) => <App>{page}</App>;

export default Invoices;
