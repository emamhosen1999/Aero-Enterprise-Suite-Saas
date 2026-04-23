import { useForm } from '@inertiajs/react';

const OPTIONS = [
    {
        key: 'company',
        title: 'Company',
        description: 'Best for organizations, teams, and multi-user workspaces.',
    },
    {
        key: 'individual',
        title: 'Individual',
        description: 'For solo operators who need a focused workspace.',
    },
];

export default function StepAccountType({ savedData }) {
    const form = useForm({
        type: savedData?.account?.type || 'company',
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('platform.register.account-type.store'));
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div>
                <h1 className="display-section text-3xl">Choose Your Account Type</h1>
                <p className="mt-2 text-[var(--pub-text-muted)]">
                    Pick the setup that best matches how you want to run aeos365.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {OPTIONS.map((option) => (
                    <button
                        key={option.key}
                        type="button"
                        onClick={() => form.setData('type', option.key)}
                        className={`rounded-xl border p-4 text-left transition-all ${
                            form.data.type === option.key
                                ? 'border-cyan-300 bg-cyan-400/10'
                                : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                        }`}
                    >
                        <p className="text-lg font-semibold">{option.title}</p>
                        <p className="mt-2 text-sm text-[var(--pub-text-muted)]">{option.description}</p>
                    </button>
                ))}
            </div>

            {form.errors.type && <p className="text-sm text-red-300">{form.errors.type}</p>}

            <div className="flex justify-end">
                <button type="submit" className="btn-primary px-6 py-3" disabled={form.processing}>
                    Continue
                </button>
            </div>
        </form>
    );
}
