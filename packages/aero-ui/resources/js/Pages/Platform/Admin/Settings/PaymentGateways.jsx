import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import App from '@/Layouts/App';
import { paymentProfiles } from '@/Pages/Platform/Admin/data/mockData.js';
import { showToast } from '@/utils/toastUtils.jsx';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Chip,
  Divider,
  Input,
  Switch,
  Textarea,
} from '@heroui/react';
import { CreditCardIcon, ShieldCheckIcon, SignalIcon } from '@heroicons/react/24/outline';

const defaults = paymentProfiles.reduce((acc, profile) => {
  acc[profile.id] = {
    enabled: profile.status === 'active',
    mode: profile.mode ?? 'live',
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    autoPayouts: profile.settlementTime !== 'manual',
    notes: '',
  };
  return acc;
}, {});

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

const PaymentGateways = () => {
  const form = useForm(defaults);
  const { data, setData } = form;

  const handleSubmit = (event) => {
    event.preventDefault();
    console.table(data);
    showToast.success('Gateway preferences saved locally.');
  };

  return (
    <>
      <Head title="Payment Gateways - Admin" />
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
                  <CreditCardIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-foreground">Payment Rails</h4>
                  <p className="text-sm text-default-500">
                    Manage API keys, payout automation, and webhook security for each processor.
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardBody className="p-6 space-y-6">
            {/* Connected Providers */}
            <div>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Connected Providers</h5>
                <p className="text-xs text-default-500">Real-time status fetched from health checks.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {paymentProfiles.map((profile) => (
                  <div key={profile.id} className="p-4 space-y-2 text-sm text-default-600" style={statCardStyle}>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{profile.name}</p>
                      <Chip size="sm" variant="flat" color={profile.status === 'active' ? 'success' : 'warning'}>
                        {profile.status}
                      </Chip>
                    </div>
                    <p>Mode · {profile.mode}</p>
                    <p>Settlement · {profile.settlementTime}</p>
                    <p>Fee · {profile.fee}</p>
                    <p className="text-xs text-default-500">Currencies · {profile.managedCurrencies.join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {paymentProfiles.map((profile) => (
                <div key={`form-${profile.id}`} className="p-4 space-y-4" style={statCardStyle}>
                  <div className="mb-2">
                    <h5 className="text-base font-semibold text-foreground">{profile.name}</h5>
                    <p className="text-xs text-default-500">
                      Configure credentials and guardrails for {profile.name}.
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-dashed border-default-200 p-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Public catalog availability</p>
                      <p className="text-xs text-default-500">
                        Disable to hide this gateway from tenant billing flows.
                      </p>
                    </div>
                    <Switch
                      isSelected={data[profile.id].enabled}
                      onValueChange={(value) => setData(profile.id, { ...data[profile.id], enabled: value })}
                    >
                      {data[profile.id].enabled ? 'Enabled' : 'Disabled'}
                    </Switch>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Publishable key"
                      value={data[profile.id].publishableKey}
                      onChange={(event) =>
                        setData(profile.id, { ...data[profile.id], publishableKey: event.target.value })
                      }
                    />
                    <Input
                      label="Secret key"
                      type="password"
                      value={data[profile.id].secretKey}
                      onChange={(event) =>
                        setData(profile.id, { ...data[profile.id], secretKey: event.target.value })
                      }
                    />
                    <Input
                      label="Webhook secret"
                      value={data[profile.id].webhookSecret}
                      onChange={(event) =>
                        setData(profile.id, { ...data[profile.id], webhookSecret: event.target.value })
                      }
                    />
                    <Textarea
                      label="Notes"
                      minRows={2}
                      value={data[profile.id].notes}
                      onChange={(event) => setData(profile.id, { ...data[profile.id], notes: event.target.value })}
                    />
                  </div>

                  <Divider className="my-4" />

                  <div className="flex items-center justify-between rounded-2xl border border-default-200 p-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Auto payouts</p>
                      <p className="text-xs text-default-500">
                        Trigger payouts on settlement schedule instead of manual release.
                      </p>
                    </div>
                    <Switch
                      isSelected={data[profile.id].autoPayouts}
                      onValueChange={(value) => setData(profile.id, { ...data[profile.id], autoPayouts: value })}
                    >
                      {data[profile.id].autoPayouts ? 'Auto' : 'Manual'}
                    </Switch>
                  </div>
                </div>
              ))}

              {/* Webhook Verification */}
              <div className="p-4" style={statCardStyle}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="text-base font-semibold text-foreground">Webhook Verification</h5>
                    <p className="text-xs text-default-500">
                      Send signed test events to confirm automation is wired.
                    </p>
                  </div>
                  <ShieldCheckIcon className="h-5 w-5 text-default-400" />
                </div>
                <Button variant="flat" color="primary" startContent={<SignalIcon className="h-4 w-4" />}>
                  Send test event
                </Button>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="light" onPress={() => form.reset()}>
                  Reset
                </Button>
                <Button color="primary" type="submit">
                  Save gateways
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

PaymentGateways.layout = (page) => <App>{page}</App>;

export default PaymentGateways;
