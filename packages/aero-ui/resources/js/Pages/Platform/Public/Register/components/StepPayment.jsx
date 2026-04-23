import { useForm } from '@inertiajs/react';
import { Button, Checkbox, Chip } from '@heroui/react';
import { formatQuotaValue, normalizePlanFeatures, normalizePlanModules, normalizePlanQuotas } from '../../utils/planCanonical';

export default function StepPayment({ savedData = {}, plans = [], trialDays = 14, baseDomain }) {
    const selectedPlanId = savedData?.plan?.plan_id;
    const selectedPlan = plans.find((plan) => String(plan.id) === String(selectedPlanId));
    const accountType = savedData?.account?.type || 'company';
    const planQuotas = normalizePlanQuotas(selectedPlan || {});
    const planFeatures = normalizePlanFeatures(selectedPlan || {});
    const planModules = normalizePlanModules(selectedPlan || {});

    const form = useForm({
        accept_terms: savedData?.trial?.accept_terms || false,
        notify_updates: savedData?.trial?.notify_updates || false,
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('platform.register.trial.activate'));
    };

    const selectedModules = savedData?.plan?.modules || [];

    return (
        <form onSubmit={submit} className="space-y-6">
            <div>
                <h1 className="display-section text-3xl">Review & Activate Trial</h1>
                <p className="mt-2 text-[var(--pub-text-muted)]">
                    Your workspace will be created at <span className="text-white">{savedData?.details?.subdomain}.{baseDomain}</span>.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <SummaryCard title={accountType === 'individual' ? 'Full Name' : 'Company'} value={savedData?.details?.name || '-'} />
                <SummaryCard title={accountType === 'individual' ? 'Work Email' : 'Company Email'} value={savedData?.details?.email || '-'} />
                <SummaryCard title="Plan" value={selectedPlan?.name || 'Custom Modules'} />
                <SummaryCard title="Billing Cycle" value={savedData?.plan?.billing_cycle || 'monthly'} />
            </div>

            {planQuotas.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="font-medium">Plan Quotas</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {planQuotas.map((quota) => (
                            <div key={quota.key} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                                <p className="text-xs uppercase tracking-wide text-[var(--pub-text-muted)]">{quota.label}</p>
                                <p className="text-sm text-white">{formatQuotaValue(quota)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="font-medium">Selected Modules</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {(selectedModules.length > 0 ? selectedModules : planModules).length > 0 ? (
                        (selectedModules.length > 0 ? selectedModules : planModules).map((code) => (
                            <span key={code} className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-200">
                                {code}
                            </span>
                        ))
                    ) : (
                        <span className="text-sm text-[var(--pub-text-muted)]">No modules selected.</span>
                    )}
                </div>
            </div>

            {planFeatures.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="font-medium">Included Features</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {planFeatures.map((feature) => (
                            <Chip key={feature} size="sm" variant="flat" color="primary">
                                {feature}
                            </Chip>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <Checkbox
                    isSelected={form.data.accept_terms}
                    onValueChange={(value) => form.setData('accept_terms', value)}
                >
                    I accept the Terms of Service and Privacy Policy.
                </Checkbox>

                <Checkbox
                    isSelected={form.data.notify_updates}
                    onValueChange={(value) => form.setData('notify_updates', value)}
                    className="text-[var(--pub-text-muted)]"
                >
                    Send me product updates and release notes.
                </Checkbox>

                {form.errors.accept_terms && <p className="text-sm text-red-300">{form.errors.accept_terms}</p>}
            </div>

            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-[var(--pub-text-muted)]">Trial includes {trialDays} days with full feature access.</p>
                <Button type="submit" color="primary" className="px-6" isLoading={form.processing}>
                    Start Free Trial
                </Button>
            </div>
        </form>
    );
}

function SummaryCard({ title, value }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--pub-text-muted)]">{title}</p>
            <p className="mt-1 text-sm">{value}</p>
        </div>
    );
}
