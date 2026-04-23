import { useForm } from '@inertiajs/react';

export default function StepDetails({ savedData, accountType, baseDomain }) {
    const form = useForm({
        name: savedData?.details?.name || '',
        email: savedData?.details?.email || '',
        phone: savedData?.details?.phone || '',
        subdomain: savedData?.details?.subdomain || '',
        owner_name: savedData?.details?.owner_name || '',
        owner_email: savedData?.details?.owner_email || '',
        owner_phone: savedData?.details?.owner_phone || '',
        industry: savedData?.details?.industry || '',
        team_size: savedData?.details?.team_size || '',
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('platform.register.details.store'));
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div>
                <h1 className="display-section text-3xl">Company Details</h1>
                <p className="mt-2 text-[var(--pub-text-muted)]">
                    Tell us about your {accountType === 'individual' ? 'workspace' : 'organization'} so we can provision it.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Field label="Company Name" value={form.data.name} onChange={(v) => form.setData('name', v)} error={form.errors.name} required />
                <Field label="Company Email" type="email" value={form.data.email} onChange={(v) => form.setData('email', v)} error={form.errors.email} required />
                <Field label="Company Phone" value={form.data.phone} onChange={(v) => form.setData('phone', v)} error={form.errors.phone} />
                <div>
                    <label className="mb-1 block text-sm text-[var(--pub-text-muted)]">Subdomain</label>
                    <div className="flex items-center overflow-hidden rounded-xl border border-white/15 bg-white/[0.03]">
                        <input
                            type="text"
                            value={form.data.subdomain}
                            onChange={(e) => form.setData('subdomain', e.target.value.toLowerCase())}
                            className="w-full bg-transparent px-3 py-2.5 outline-none"
                            placeholder="your-company"
                            required
                        />
                        <span className="border-l border-white/10 px-3 text-xs text-[var(--pub-text-muted)]">.{baseDomain}</span>
                    </div>
                    {form.errors.subdomain && <p className="mt-1 text-sm text-red-300">{form.errors.subdomain}</p>}
                </div>
                <Field label="Owner Name" value={form.data.owner_name} onChange={(v) => form.setData('owner_name', v)} error={form.errors.owner_name} />
                <Field label="Owner Email" type="email" value={form.data.owner_email} onChange={(v) => form.setData('owner_email', v)} error={form.errors.owner_email} />
                <Field label="Owner Phone" value={form.data.owner_phone} onChange={(v) => form.setData('owner_phone', v)} error={form.errors.owner_phone} />
                <Field label="Industry" value={form.data.industry} onChange={(v) => form.setData('industry', v)} error={form.errors.industry} />
                <Field label="Team Size" type="number" value={form.data.team_size} onChange={(v) => form.setData('team_size', v)} error={form.errors.team_size} />
            </div>

            <div className="flex justify-end">
                <button type="submit" className="btn-primary px-6 py-3" disabled={form.processing}>
                    Continue to Verification
                </button>
            </div>
        </form>
    );
}

function Field({ label, error, value, onChange, type = 'text', required = false }) {
    return (
        <div>
            <label className="mb-1 block text-sm text-[var(--pub-text-muted)]">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2.5 outline-none focus:border-cyan-400"
                required={required}
            />
            {error && <p className="mt-1 text-sm text-red-300">{error}</p>}
        </div>
    );
}
