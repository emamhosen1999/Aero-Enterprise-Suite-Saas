import { Link } from '@inertiajs/react';

export default function StepSuccess({ result, baseDomain }) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="display-section text-3xl">Workspace Created</h1>
                <p className="mt-2 text-[var(--pub-text-muted)]">
                    Your workspace is ready for access.
                </p>
            </div>

            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                <p className="font-semibold">{result?.name}</p>
                <p className="mt-1 text-sm text-emerald-100">{result?.subdomain}.{baseDomain}</p>
            </div>

            <div className="flex flex-wrap gap-3">
                <a
                    href={`http://${result?.subdomain}.${baseDomain}/admin-setup`}
                    className="btn-primary px-6 py-3"
                >
                    Continue to Admin Setup
                </a>
                <Link href="/" className="btn-ghost px-6 py-3">
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
