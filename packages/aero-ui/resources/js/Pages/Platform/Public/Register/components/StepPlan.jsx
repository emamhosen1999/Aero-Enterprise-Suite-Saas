import { useMemo } from 'react';
import { useForm } from '@inertiajs/react';

export default function StepPlan({ plans = [], modules = [], savedData = {} }) {
    const selectedPlan = savedData?.plan?.plan_id || '';
    const selectedModules = savedData?.plan?.modules || [];
    const selectedCycle = savedData?.plan?.billing_cycle || 'monthly';

    const form = useForm({
        plan_id: selectedPlan,
        billing_cycle: selectedCycle,
        modules: selectedModules,
        notes: savedData?.plan?.notes || '',
    });

    const activePlan = useMemo(() => {
        return plans.find((plan) => String(plan.id) === String(form.data.plan_id));
    }, [plans, form.data.plan_id]);

    const availableModules = activePlan?.modules?.length ? activePlan.modules : modules;

    const toggleModule = (moduleCode) => {
        const exists = form.data.modules.includes(moduleCode);
        if (exists) {
            form.setData('modules', form.data.modules.filter((item) => item !== moduleCode));
            return;
        }

        form.setData('modules', [...form.data.modules, moduleCode]);
    };

    const submit = (e) => {
        e.preventDefault();
        form.post(route('platform.register.plan.store'));
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div>
                <h1 className="display-section text-3xl">Choose Plan & Modules</h1>
                <p className="mt-2 text-[var(--pub-text-muted)]">Pick a plan, billing cycle, and module set for your workspace.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {plans.map((plan) => {
                    const isActive = String(form.data.plan_id) === String(plan.id);

                    return (
                        <button
                            key={plan.id}
                            type="button"
                            onClick={() => {
                                form.setData('plan_id', String(plan.id));
                                form.setData(
                                    'modules',
                                    (plan.modules || []).map((module) => module.code || module.id),
                                );
                            }}
                            className={`rounded-xl border p-4 text-left ${
                                isActive ? 'border-cyan-300 bg-cyan-400/10' : 'border-white/10 bg-white/[0.02]'
                            }`}
                        >
                            <p className="text-lg font-semibold">{plan.name}</p>
                            <p className="mt-1 text-sm text-[var(--pub-text-muted)]">{plan.description || 'Flexible plan for your team.'}</p>
                            <p className="mt-3 text-sm">
                                {form.data.billing_cycle === 'yearly'
                                    ? `$${Number(plan.yearly_price || 0)}/yr`
                                    : `$${Number(plan.monthly_price || 0)}/mo`}
                            </p>
                        </button>
                    );
                })}
            </div>

            <div className="flex gap-2">
                {['monthly', 'yearly'].map((cycle) => (
                    <button
                        key={cycle}
                        type="button"
                        onClick={() => form.setData('billing_cycle', cycle)}
                        className={`rounded-lg px-4 py-2 text-sm capitalize ${
                            form.data.billing_cycle === cycle ? 'bg-cyan-500/20 text-cyan-200' : 'bg-white/5 text-white/70'
                        }`}
                    >
                        {cycle}
                    </button>
                ))}
            </div>

            <div>
                <p className="mb-2 text-sm text-[var(--pub-text-muted)]">Modules</p>
                <div className="grid gap-2 md:grid-cols-2">
                    {availableModules.map((module) => {
                        const code = module.code || module.id;
                        const checked = form.data.modules.includes(code);

                        return (
                            <label key={code} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                                <input type="checkbox" checked={checked} onChange={() => toggleModule(code)} />
                                <span>{module.name || code}</span>
                            </label>
                        );
                    })}
                </div>
                {form.errors.selection && <p className="mt-1 text-sm text-red-300">{form.errors.selection}</p>}
                {form.errors.modules && <p className="mt-1 text-sm text-red-300">{form.errors.modules}</p>}
            </div>

            <div>
                <label className="mb-1 block text-sm text-[var(--pub-text-muted)]">Notes (Optional)</label>
                <textarea
                    value={form.data.notes}
                    onChange={(e) => form.setData('notes', e.target.value)}
                    className="h-24 w-full rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2.5 outline-none"
                />
            </div>

            <div className="flex justify-end">
                <button type="submit" className="btn-primary px-6 py-3" disabled={form.processing}>
                    Continue to Review
                </button>
            </div>
        </form>
    );
}
