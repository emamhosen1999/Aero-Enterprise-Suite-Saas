import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import App from '@/Layouts/App';
import { emailTransports, emailTemplates } from '@/Pages/Platform/Admin/data/mockData.js';
import { showToast } from '@/utils/toastUtils.jsx';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Chip,
  Input,
  Radio,
  RadioGroup,
  Switch,
  Textarea,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { EnvelopeIcon, BoltIcon } from '@heroicons/react/24/outline';

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

const templateColumns = [
  { key: 'name', label: 'TEMPLATE' },
  { key: 'category', label: 'CATEGORY' },
  { key: 'status', label: 'STATUS' },
  { key: 'updatedAt', label: 'LAST UPDATED' },
];

const EmailSettings = () => {
  const form = useForm({
    defaultTransport: emailTransports.find((transport) => transport.status === 'connected')?.id ?? emailTransports[0].id,
    fromName: 'Aeos Platform',
    fromAddress: 'notifications@aeos365.com',
    replyTo: 'support@aeos365.com',
    complianceBcc: 'compliance@aeos365.com',
    digestsEnabled: true,
    templateFooter: 'You are receiving this because your workspace uses the Aeos platform.',
  });

  const { data, setData, reset } = form;

  const handleSubmit = (event) => {
    event.preventDefault();
    console.table(data);
    showToast.success('Email routing saved.');
  };

  return (
    <>
      <Head title="Email Settings - Admin" />
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
                  <EnvelopeIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-foreground">Email Infrastructure</h4>
                  <p className="text-sm text-default-500">
                    Route transactional and lifecycle email from resilient transports.
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardBody className="p-6 space-y-6">
            {/* Transports */}
            <div>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Transports</h5>
                <p className="text-xs text-default-500">Monitor throughput and connectivity of each provider.</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {emailTransports.map((transport) => (
                  <div key={transport.id} className="p-4 space-y-2 text-sm text-default-600" style={statCardStyle}>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{transport.name}</p>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={
                          transport.status === 'connected'
                            ? 'success'
                            : transport.status === 'disconnected'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {transport.status}
                      </Chip>
                    </div>
                    <p>Throughput · {transport.throughput}</p>
                    <p>IP pool · {transport.ipPool}</p>
                    <p className="text-xs text-default-500">Authenticated domains · {transport.authenticatedDomains}</p>
                    <p className="text-xs text-default-500">Last health check · {transport.lastHealthCheck}</p>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Routing Defaults */}
              <div className="p-4" style={statCardStyle}>
                <div className="mb-4">
                  <h5 className="text-base font-semibold text-foreground">Routing Defaults</h5>
                  <p className="text-xs text-default-500">
                    Select the transport used for all outbound notifications.
                  </p>
                </div>
                <RadioGroup value={data.defaultTransport} onValueChange={(value) => setData('defaultTransport', value)}>
                  {emailTransports.map((transport) => (
                    <Radio
                      key={transport.id}
                      value={transport.id}
                      description={`${transport.throughput} · ${transport.status}`}
                    >
                      {transport.name}
                    </Radio>
                  ))}
                </RadioGroup>
              </div>

              {/* Sender Identity */}
              <div className="p-4 space-y-4" style={statCardStyle}>
                <div className="mb-4">
                  <h5 className="text-base font-semibold text-foreground">Sender Identity</h5>
                  <p className="text-xs text-default-500">Update global reply-to and compliance BCC recipients.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="From name"
                    value={data.fromName}
                    onChange={(event) => setData('fromName', event.target.value)}
                  />
                  <Input
                    label="From address"
                    type="email"
                    value={data.fromAddress}
                    onChange={(event) => setData('fromAddress', event.target.value)}
                  />
                  <Input
                    label="Reply-to"
                    type="email"
                    value={data.replyTo}
                    onChange={(event) => setData('replyTo', event.target.value)}
                  />
                  <Input
                    label="Compliance BCC"
                    type="email"
                    value={data.complianceBcc}
                    onChange={(event) => setData('complianceBcc', event.target.value)}
                  />
                </div>
                <Textarea
                  label="Footer"
                  minRows={3}
                  value={data.templateFooter}
                  onChange={(event) => setData('templateFooter', event.target.value)}
                />
                <div className="flex items-center justify-between rounded-2xl border border-default-200 p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Digest emails</p>
                    <p className="text-xs text-default-500">Send weekly workspace health recaps to tenant admins.</p>
                  </div>
                  <Switch isSelected={data.digestsEnabled} onValueChange={(value) => setData('digestsEnabled', value)}>
                    {data.digestsEnabled ? 'Enabled' : 'Disabled'}
                  </Switch>
                </div>
              </div>

              {/* Templates Table */}
              <div>
                <div className="mb-4">
                  <h5 className="text-base font-semibold text-foreground">Templates</h5>
                  <p className="text-xs text-default-500">Track freshness of core lifecycle emails.</p>
                </div>
                <Table
                  aria-label="Email templates"
                  removeWrapper
                  classNames={{
                    th: 'bg-transparent text-default-500 font-semibold text-xs uppercase',
                    td: 'py-3',
                  }}
                >
                  <TableHeader columns={templateColumns}>
                    {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                  </TableHeader>
                  <TableBody items={emailTemplates}>
                    {(template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-semibold">{template.name}</TableCell>
                        <TableCell>{template.category}</TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={
                              template.status === 'active'
                                ? 'success'
                                : template.status === 'draft'
                                  ? 'warning'
                                  : 'default'
                            }
                          >
                            {template.status}
                          </Chip>
                        </TableCell>
                        <TableCell className="text-default-500">{template.updatedAt}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Deliverability Toolkit */}
              <div className="p-4" style={statCardStyle}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="text-base font-semibold text-foreground">Deliverability Toolkit</h5>
                    <p className="text-xs text-default-500">
                      Use the sandbox environment before deploying template changes.
                    </p>
                  </div>
                  <BoltIcon className="h-5 w-5 text-default-400" />
                </div>
                <Button variant="flat" color="primary" startContent={<EnvelopeIcon className="h-4 w-4" />}>
                  Send test email
                </Button>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="light" onPress={() => reset()}>
                  Reset
                </Button>
                <Button color="primary" type="submit">
                  Save email settings
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

EmailSettings.layout = (page) => <App>{page}</App>;

export default EmailSettings;
