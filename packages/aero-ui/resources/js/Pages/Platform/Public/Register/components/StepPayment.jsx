import { useForm } from '@inertiajs/react';

export default function StepPayment({ savedData = {}, plans = [], trialDays = 14, baseDomain }) {
    const selectedPlanId = savedData?.plan?.plan_id;
    const selectedPlan = plans.find((plan) => String(plan.id) === String(selectedPlanId));

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
                <SummaryCard title="Company" value={savedData?.details?.name || '-'} />
                <SummaryCard title="Email" value={savedData?.details?.email || '-'} />
                <SummaryCard title="Plan" value={selectedPlan?.name || 'Custom Modules'} />
                <SummaryCard title="Billing Cycle" value={savedData?.plan?.billing_cycle || 'monthly'} />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="font-medium">Selected Modules</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {selectedModules.length > 0 ? (
                        selectedModules.map((code) => (
                            <span key={code} className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-200">
                                {code}
                            </span>
                        ))
                    ) : (
                        <span className="text-sm text-[var(--pub-text-muted)]">No modules selected.</span>
                    )}
                </div>
            </div>

            <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <label className="flex items-start gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={form.data.accept_terms}
                        onChange={(e) => form.setData('accept_terms', e.target.checked)}
                    />
                    <span>I accept the Terms of Service and Privacy Policy.</span>
                </label>

                <label className="flex items-start gap-2 text-sm text-[var(--pub-text-muted)]">
                    <input
                        type="checkbox"
                        checked={form.data.notify_updates}
                        onChange={(e) => form.setData('notify_updates', e.target.checked)}
                    />
                    <span>Send me product updates and release notes.</span>
                </label>

                {form.errors.accept_terms && <p className="text-sm text-red-300">{form.errors.accept_terms}</p>}
            </div>

            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-[var(--pub-text-muted)]">Trial includes {trialDays} days with full feature access.</p>
                <button type="submit" className="btn-primary px-6 py-3" disabled={form.processing}>
                    Start Free Trial
                </button>
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
