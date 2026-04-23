import { useEffect, useState } from 'react';
import axios from 'axios';

export default function StepProvisioning({ tenant }) {
    const [status, setStatus] = useState(tenant?.status || 'pending');
    const [step, setStep] = useState(tenant?.provisioning_step || 'queued');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!tenant?.id) {
            return;
        }

        const interval = setInterval(async () => {
            try {
                const response = await axios.get(route('platform.register.provisioning.status', { tenant: tenant.id }));
                const payload = response.data || {};

                setStatus(payload.status || 'pending');
                setStep(payload.step || payload.provisioning_step || 'queued');

                if (payload.has_failed) {
                    setError(payload.error || 'Provisioning failed.');
                    return;
                }

                if (payload.is_ready && payload.login_url) {
                    window.location.href = payload.login_url;
                }
            } catch (e) {
                setError('Unable to fetch provisioning status.');
            }
        }, 3500);

        return () => clearInterval(interval);
    }, [tenant?.id]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="display-section text-3xl">Setting Up Your Workspace</h1>
                <p className="mt-2 text-[var(--pub-text-muted)]">
                    Tenant <span className="text-white">{tenant?.name}</span> is being provisioned. This page refreshes automatically.
                </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <p className="text-sm text-[var(--pub-text-muted)]">Current Status</p>
                <p className="mt-1 text-lg font-semibold capitalize">{status}</p>
                <p className="mt-3 text-sm text-[var(--pub-text-muted)]">Current Step: {step || 'queued'}</p>

                {error && (
                    <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
