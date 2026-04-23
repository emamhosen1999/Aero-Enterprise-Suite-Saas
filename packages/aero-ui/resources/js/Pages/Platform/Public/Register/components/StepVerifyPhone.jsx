import { useState } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';

export default function StepVerifyPhone({ phone, companyName }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const sendCode = async () => {
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await axios.post(route('platform.register.verify-phone.send'));
            setMessage(response.data?.message || 'Verification code sent.');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to send verification code.');
        } finally {
            setLoading(false);
        }
    };

    const verify = async () => {
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await axios.post(route('platform.register.verify-phone.verify'), { code });
            router.visit(route('platform.register.plan'));
        } catch (err) {
            setError(err?.response?.data?.message || 'Invalid verification code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="display-section text-3xl">Verify Company Phone</h1>
                <p className="mt-2 text-[var(--pub-text-muted)]">
                    We will send a 6-digit code to <span className="text-white">{phone || 'your registered phone'}</span> for {companyName}.
                </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={sendCode} className="btn-ghost px-4 py-2" disabled={loading}>
                        Send Code
                    </button>
                    <input
                        type="text"
                        value={code}
                        maxLength={6}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        className="w-44 rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2.5 tracking-[0.35em] outline-none"
                        placeholder="000000"
                    />
                    <button type="button" onClick={verify} className="btn-primary px-4 py-2" disabled={loading || code.length !== 6}>
                        Verify Phone
                    </button>
                </div>
                {message && <p className="mt-3 text-sm text-emerald-300">{message}</p>}
                {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
            </div>
        </div>
    );
}
