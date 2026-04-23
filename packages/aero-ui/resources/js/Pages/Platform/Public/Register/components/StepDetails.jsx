import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useForm } from '@inertiajs/react';
import { Button, Chip, Input, Select, SelectItem, Spinner } from '@heroui/react';

const DRAFT_KEY = 'aeos365_registration_pre_identity_draft_v1';

const INDUSTRIES = [
    'Technology',
    'Manufacturing',
    'Healthcare',
    'Education',
    'Construction',
    'Retail',
    'Finance',
    'Logistics',
    'Hospitality',
    'Other',
];

const TEAM_SIZES = [
    { key: '1', label: '1 (Solo)' },
    { key: '2-10', label: '2 - 10' },
    { key: '11-25', label: '11 - 25' },
    { key: '26-50', label: '26 - 50' },
    { key: '51-150', label: '51 - 150' },
    { key: '151-500', label: '151 - 500' },
    { key: '501-1000', label: '501 - 1000' },
    { key: '1001+', label: '1001+' },
];

const COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Germany', 'United Arab Emirates', 'Singapore', 'Bangladesh', 'India', 'Australia'];
const TIMEZONES = ['UTC', 'Asia/Dhaka', 'Asia/Singapore', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles'];

const defaultIdentityStatus = { status: null, available: null, resumable: null, message: '' };

function readDraft() {
    if (typeof window === 'undefined') {
        return {};
    }

    try {
        return JSON.parse(window.localStorage.getItem(DRAFT_KEY) || '{}');
    } catch (error) {
        return {};
    }
}

function pickInitial(savedData) {
    const details = savedData?.details || {};
    const draft = readDraft();

    return {
        name: details.name || draft.name || '',
        email: details.email || draft.email || '',
        phone: details.phone || draft.phone || '',
        subdomain: details.subdomain || draft.subdomain || '',
        owner_name: details.owner_name || draft.owner_name || '',
        owner_email: details.owner_email || draft.owner_email || '',
        owner_phone: details.owner_phone || draft.owner_phone || '',
        industry: details.industry || draft.industry || INDUSTRIES[0],
        team_size: details.team_size || draft.team_size || TEAM_SIZES[1].key,
        country: details.country || draft.country || COUNTRIES[0],
        timezone: details.timezone || draft.timezone || 'UTC',
    };
}

function mapTeamSizeToNumber(value) {
    if (!value || typeof value !== 'string') {
        return '';
    }

    if (value.includes('-')) {
        return value.split('-')[1];
    }

    if (value.endsWith('+')) {
        return value.replace('+', '');
    }

    return value;
}

function statusColor(status) {
    if (status === 'available') {
        return 'success';
    }

    if (status === 'available_to_resume') {
        return 'warning';
    }

    if (status === 'unavailable') {
        return 'danger';
    }

    return 'default';
}

export default function StepDetails({ savedData, accountType, baseDomain }) {
    const type = accountType || savedData?.account?.type || 'company';
    const form = useForm(pickInitial(savedData));

    const [subdomainStatus, setSubdomainStatus] = useState(defaultIdentityStatus);
    const [emailStatus, setEmailStatus] = useState(defaultIdentityStatus);
    const [checkingSubdomain, setCheckingSubdomain] = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [saveState, setSaveState] = useState('idle');
    const [saveMessage, setSaveMessage] = useState('');

    const emailLooksValid = useMemo(() => /.+@.+\..+/.test(form.data.email || ''), [form.data.email]);
    const subdomainLooksValid = useMemo(() => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.data.subdomain || ''), [form.data.subdomain]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({
            ...form.data,
            account_type: type,
        }));
    }, [form.data, type]);

    useEffect(() => {
        if (!subdomainLooksValid || form.data.subdomain.length < 3) {
            setSubdomainStatus(defaultIdentityStatus);
            return undefined;
        }

        const timer = window.setTimeout(async () => {
            setCheckingSubdomain(true);
            try {
                const response = await axios.post('/api/platform/v1/registration/check-subdomain', {
                    subdomain: form.data.subdomain,
                });
                setSubdomainStatus(response.data || defaultIdentityStatus);
            } catch (error) {
                setSubdomainStatus({
                    status: 'unavailable',
                    available: false,
                    resumable: false,
                    message: 'Unable to validate subdomain right now.',
                });
            } finally {
                setCheckingSubdomain(false);
            }
        }, 450);

        return () => window.clearTimeout(timer);
    }, [form.data.subdomain, subdomainLooksValid]);

    useEffect(() => {
        if (!emailLooksValid) {
            setEmailStatus(defaultIdentityStatus);
            return undefined;
        }

        const timer = window.setTimeout(async () => {
            setCheckingEmail(true);
            try {
                const response = await axios.post('/api/platform/v1/registration/check-email', {
                    email: form.data.email,
                });
                setEmailStatus(response.data || defaultIdentityStatus);
            } catch (error) {
                setEmailStatus({
                    status: 'unavailable',
                    available: false,
                    resumable: false,
                    message: 'Unable to validate email right now.',
                });
            } finally {
                setCheckingEmail(false);
            }
        }, 450);

        return () => window.clearTimeout(timer);
    }, [form.data.email, emailLooksValid]);

    useEffect(() => {
        const subdomainOk = subdomainStatus.status === 'available' || subdomainStatus.status === 'available_to_resume';
        const emailOk = emailStatus.status === 'available' || emailStatus.status === 'available_to_resume';

        if (!emailLooksValid || !subdomainLooksValid || !subdomainOk || !emailOk) {
            setSaveState('idle');
            setSaveMessage('');
            return undefined;
        }

        const timer = window.setTimeout(async () => {
            setSaveState('saving');
            setSaveMessage('Saving draft...');

            try {
                await axios.post('/api/platform/v1/registration/save-progress', {
                    email: form.data.email,
                    step: 'details',
                    data: {
                        account: { type },
                        details: {
                            ...form.data,
                            team_size: mapTeamSizeToNumber(form.data.team_size),
                        },
                    },
                });

                setSaveState('saved');
                setSaveMessage('Draft saved');
            } catch (error) {
                setSaveState('error');
                setSaveMessage('Draft save failed');
            }
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [
        emailLooksValid,
        subdomainLooksValid,
        subdomainStatus.status,
        emailStatus.status,
        form.data,
        type,
    ]);

    const submit = (e) => {
        e.preventDefault();

        form.transform((data) => ({
            ...data,
            team_size: mapTeamSizeToNumber(data.team_size),
        })).post(route('platform.register.details.store'), {
            onSuccess: () => {
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem(DRAFT_KEY);
                }
            },
        });
    };

    const heading = type === 'individual' ? 'Your Workspace Details' : 'Company Details';
    const nameLabel = type === 'individual' ? 'Full Name' : 'Company Name';
    const emailLabel = type === 'individual' ? 'Work Email' : 'Company Email';
    const phoneLabel = type === 'individual' ? 'Phone' : 'Company Phone';

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="display-section text-3xl">{heading}</h1>
                    <p className="mt-2 text-[var(--pub-text-muted)]">
                        Tell us about your {type === 'individual' ? 'workspace' : 'organization'} so we can provision it.
                    </p>
                </div>
                {saveMessage && (
                    <Chip color={saveState === 'saved' ? 'success' : saveState === 'error' ? 'danger' : 'primary'} variant="flat">
                        {saveState === 'saving' ? 'Saving draft...' : saveMessage}
                    </Chip>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Input
                    label={nameLabel}
                    value={form.data.name}
                    onValueChange={(value) => form.setData('name', value)}
                    isInvalid={Boolean(form.errors.name)}
                    errorMessage={form.errors.name}
                    isRequired
                    classNames={{ inputWrapper: 'bg-content2/40' }}
                />

                <div className="space-y-2">
                    <Input
                        type="email"
                        label={emailLabel}
                        value={form.data.email}
                        onValueChange={(value) => form.setData('email', value)}
                        isInvalid={Boolean(form.errors.email)}
                        errorMessage={form.errors.email}
                        isRequired
                        classNames={{ inputWrapper: 'bg-content2/40' }}
                    />
                    <IdentityStatus status={emailStatus} loading={checkingEmail} label="Email" />
                </div>

                <Input
                    label={phoneLabel}
                    value={form.data.phone}
                    onValueChange={(value) => form.setData('phone', value)}
                    isInvalid={Boolean(form.errors.phone)}
                    errorMessage={form.errors.phone}
                    placeholder="+123456789"
                    classNames={{ inputWrapper: 'bg-content2/40' }}
                />

                <div className="space-y-2">
                    <Input
                        label="Subdomain"
                        value={form.data.subdomain}
                        onValueChange={(value) => form.setData('subdomain', value.toLowerCase().trim())}
                        isInvalid={Boolean(form.errors.subdomain)}
                        errorMessage={form.errors.subdomain}
                        description={`Your workspace URL will be ${form.data.subdomain || 'workspace'}.${baseDomain}`}
                        isRequired
                        endContent={<span className="text-xs text-default-500">.{baseDomain}</span>}
                        classNames={{ inputWrapper: 'bg-content2/40' }}
                    />
                    <IdentityStatus status={subdomainStatus} loading={checkingSubdomain} label="Subdomain" />
                </div>

                {type !== 'individual' && (
                    <>
                        <Input
                            label="Owner Name"
                            value={form.data.owner_name}
                            onValueChange={(value) => form.setData('owner_name', value)}
                            isInvalid={Boolean(form.errors.owner_name)}
                            errorMessage={form.errors.owner_name}
                            classNames={{ inputWrapper: 'bg-content2/40' }}
                        />
                        <Input
                            type="email"
                            label="Owner Email"
                            value={form.data.owner_email}
                            onValueChange={(value) => form.setData('owner_email', value)}
                            isInvalid={Boolean(form.errors.owner_email)}
                            errorMessage={form.errors.owner_email}
                            classNames={{ inputWrapper: 'bg-content2/40' }}
                        />
                        <Input
                            label="Owner Phone"
                            value={form.data.owner_phone}
                            onValueChange={(value) => form.setData('owner_phone', value)}
                            isInvalid={Boolean(form.errors.owner_phone)}
                            errorMessage={form.errors.owner_phone}
                            classNames={{ inputWrapper: 'bg-content2/40' }}
                        />
                    </>
                )}

                <Select
                    label="Industry"
                    selectedKeys={form.data.industry ? [form.data.industry] : []}
                    onSelectionChange={(keys) => form.setData('industry', Array.from(keys)[0] || '')}
                    classNames={{ trigger: 'bg-content2/40' }}
                >
                    {INDUSTRIES.map((item) => (
                        <SelectItem key={item}>{item}</SelectItem>
                    ))}
                </Select>

                <Select
                    label="Team Size"
                    selectedKeys={form.data.team_size ? [String(form.data.team_size)] : []}
                    onSelectionChange={(keys) => form.setData('team_size', Array.from(keys)[0] || '')}
                    isInvalid={Boolean(form.errors.team_size)}
                    errorMessage={form.errors.team_size}
                    classNames={{ trigger: 'bg-content2/40' }}
                >
                    {TEAM_SIZES.map((item) => (
                        <SelectItem key={item.key}>{item.label}</SelectItem>
                    ))}
                </Select>

                <Select
                    label="Country"
                    selectedKeys={form.data.country ? [form.data.country] : []}
                    onSelectionChange={(keys) => form.setData('country', Array.from(keys)[0] || '')}
                    classNames={{ trigger: 'bg-content2/40' }}
                >
                    {COUNTRIES.map((item) => (
                        <SelectItem key={item}>{item}</SelectItem>
                    ))}
                </Select>

                <Select
                    label="Timezone"
                    selectedKeys={form.data.timezone ? [form.data.timezone] : []}
                    onSelectionChange={(keys) => form.setData('timezone', Array.from(keys)[0] || '')}
                    classNames={{ trigger: 'bg-content2/40' }}
                >
                    {TIMEZONES.map((item) => (
                        <SelectItem key={item}>{item}</SelectItem>
                    ))}
                </Select>
            </div>

            <div className="flex justify-end">
                <Button type="submit" color="primary" className="px-6" isLoading={form.processing}>
                    Continue to Verification
                </Button>
            </div>
        </form>
    );
}

function IdentityStatus({ status, loading, label }) {
    if (loading) {
        return (
            <div className="flex items-center gap-2 text-xs text-default-500">
                <Spinner size="sm" />
                <span>Checking {label.toLowerCase()}...</span>
            </div>
        );
    }

    if (!status?.status) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <Chip size="sm" color={statusColor(status.status)} variant="flat">
                {status.status === 'available_to_resume' ? 'Available To Resume' : status.status.replace(/_/g, ' ')}
            </Chip>
            {status.message && <p className="text-xs text-default-500">{status.message}</p>}
        </div>
    );
}
