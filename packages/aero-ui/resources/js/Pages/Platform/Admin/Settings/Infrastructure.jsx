import React, { useCallback, useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Input,
    Spinner,
} from '@heroui/react';
import {
    ServerIcon,
    CircleStackIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    LockClosedIcon,
    ArrowPathIcon,
    InformationCircleIcon,
    WifiIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

// ---------------------------------------------------------------------------
// Shared style helpers (same pattern as Platform.jsx / Settings pages)
// ---------------------------------------------------------------------------
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

const sectionCardStyle = {
    background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
    border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
    borderRadius: `var(--borderRadius, 12px)`,
};

// ---------------------------------------------------------------------------
// HostingModeCard — visual mode selector tile
// ---------------------------------------------------------------------------
const HostingModeCard = ({ id, title, subtitle, icon: Icon, details, isActive, onSelect }) => (
    <button
        type="button"
        onClick={() => onSelect(id)}
        className={[
            'flex flex-col gap-3 rounded-xl p-5 text-left transition-all duration-200 w-full border-2 cursor-pointer',
            isActive
                ? 'border-primary shadow-lg shadow-primary/10 bg-primary/5'
                : 'border-divider hover:border-primary/40 hover:bg-content2',
        ].join(' ')}
        style={{ borderRadius: `var(--borderRadius, 12px)` }}
    >
        <div className="flex items-center justify-between">
            <div
                className="p-2 rounded-lg"
                style={{
                    background: isActive
                        ? `color-mix(in srgb, var(--theme-primary) 20%, transparent)`
                        : `color-mix(in srgb, var(--theme-content3) 80%, transparent)`,
                }}
            >
                <Icon
                    className="w-6 h-6"
                    style={{ color: isActive ? 'var(--theme-primary)' : 'var(--theme-default-500)' }}
                />
            </div>
            {isActive && (
                <Chip color="primary" variant="flat" size="sm">
                    Active
                </Chip>
            )}
        </div>
        <div>
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-default-500 mt-0.5">{subtitle}</p>
        </div>
        <ul className="space-y-1">
            {details.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-default-500">
                    <CheckCircleIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-success" />
                    {d}
                </li>
            ))}
        </ul>
    </button>
);

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const Infrastructure = ({ title, platformSettings }) => {
    const { auth } = usePage().props;

    // -----------------------------------------------------------------------
    // Theme helpers
    // -----------------------------------------------------------------------
    const themeRadius = useThemeRadius();

    // -----------------------------------------------------------------------
    // Responsive
    // -----------------------------------------------------------------------
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // -----------------------------------------------------------------------
    // Form state — seed from prop
    // -----------------------------------------------------------------------
    const hs = platformSettings?.hosting_settings ?? {};

    const [mode, setMode] = useState(hs.mode ?? 'dedicated');
    const [cpanelHost, setCpanelHost]       = useState(hs.cpanel_host     ?? '');
    const [cpanelPort, setCpanelPort]       = useState(String(hs.cpanel_port ?? 2083));
    const [cpanelUsername, setCpanelUsername] = useState(hs.cpanel_username ?? '');
    const [cpanelToken, setCpanelToken]     = useState(''); // never pre-fill — security
    const [cpanelDbUser, setCpanelDbUser]   = useState(hs.cpanel_db_user ?? '');
    const [tokenAlreadySet]                 = useState(!!hs.cpanel_api_token_set);

    const [saving, setSaving]               = useState(false);
    const [testing, setTesting]             = useState(false);
    const [testResult, setTestResult]       = useState(null); // null | { success, message }

    const resolvedMode = hs.resolved_mode ?? mode;
    const envOverride  = hs.env_override  ?? false;

    // -----------------------------------------------------------------------
    // Save
    // -----------------------------------------------------------------------
    const handleSave = useCallback(async () => {
        setSaving(true);

        const payload = {
            // Required top-level fields (server validates)
            site_name:     platformSettings?.site?.name     ?? '',
            support_email: platformSettings?.site?.support_email ?? '',

            hosting_settings: {
                mode:             mode,
                cpanel_host:      cpanelHost      || null,
                cpanel_port:      cpanelPort ? parseInt(cpanelPort) : 2083,
                cpanel_username:  cpanelUsername  || null,
                cpanel_api_token: cpanelToken     || null, // empty = keep existing
                cpanel_db_user:   cpanelDbUser    || null,
            },
        };

        const promise = new Promise(async (resolve, reject) => {
            try {
                const res = await axios.put(route('admin.settings.platform.update'), payload);
                resolve(res.data?.message ?? 'Infrastructure settings saved.');
            } catch (err) {
                reject(err.response?.data?.message ?? 'Failed to save settings.');
            }
        });

        showToast.promise(promise, {
            loading: 'Saving infrastructure settings…',
            success: (msg) => msg,
            error:   (msg) => msg,
        });

        promise.finally(() => setSaving(false));
    }, [mode, cpanelHost, cpanelPort, cpanelUsername, cpanelToken, cpanelDbUser, platformSettings]);

    // -----------------------------------------------------------------------
    // Test cPanel connection
    // -----------------------------------------------------------------------
    const handleTestCpanel = useCallback(async () => {
        setTesting(true);
        setTestResult(null);

        try {
            const res = await axios.post(route('admin.settings.infrastructure.test-cpanel'), {
                cpanel_host:      cpanelHost      || undefined,
                cpanel_port:      cpanelPort ? parseInt(cpanelPort) : undefined,
                cpanel_username:  cpanelUsername  || undefined,
                cpanel_api_token: cpanelToken     || undefined,
            });

            setTestResult({ success: true, message: res.data.message });
            showToast.success(res.data.message);
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Connection test failed.';
            setTestResult({ success: false, message: msg });
            showToast.error(msg);
        } finally {
            setTesting(false);
        }
    }, [cpanelHost, cpanelPort, cpanelUsername, cpanelToken]);

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <>
            <Head title={title ?? 'Infrastructure & Hosting'} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Infrastructure Settings">
                <div className="space-y-4 max-w-5xl mx-auto w-full">

                    {/* ── ENV override warning banner ───────────────────── */}
                    {envOverride && (
                        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
                            <ExclamationTriangleIcon className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-warning">
                                    .env override detected
                                </p>
                                <p className="text-xs text-default-500 mt-0.5">
                                    <code className="bg-default-100 px-1 rounded text-xs">TENANCY_DATABASE_MANAGER</code> is
                                    set in your <code className="bg-default-100 px-1 rounded text-xs">.env</code> file.&nbsp;
                                    This DB setting takes full effect once you remove that variable from .env.
                                    Currently resolved mode:{' '}
                                    <span className="font-semibold">{resolvedMode}</span>.
                                </p>
                            </div>
                        </div>
                    )}

                    <motion.div
                        initial={{ scale: 0.97, opacity: 0 }}
                        animate={{ scale: 1,    opacity: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Card className="transition-all duration-200" style={mainCardStyle}>

                            {/* ── Card header ──────────────────────────── */}
                            <CardHeader className="border-b p-0" style={headerStyle}>
                                <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <div
                                                className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                style={{
                                                    background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}
                                            >
                                                <ServerIcon
                                                    className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                    style={{ color: 'var(--theme-primary)' }}
                                                />
                                            </div>
                                            <div>
                                                <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                    Infrastructure &amp; Hosting
                                                </h4>
                                                <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                    Choose how tenant databases are provisioned when a new tenant registers.
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            color="primary"
                                            variant="shadow"
                                            isLoading={saving}
                                            onPress={handleSave}
                                            size={isMobile ? 'sm' : 'md'}
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className={`${!isMobile ? 'p-6' : 'p-4'} space-y-6`}>

                                {/* ── Section 1: Mode selector ─────────── */}
                                <div>
                                    <h5 className="text-base font-semibold mb-1">Hosting Mode</h5>
                                    <p className="text-xs text-default-500 mb-4">
                                        Select the infrastructure type where this platform is deployed.
                                        This controls how MySQL databases are created for each new tenant.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <HostingModeCard
                                            id="dedicated"
                                            isActive={mode === 'dedicated'}
                                            onSelect={setMode}
                                            icon={CircleStackIcon}
                                            title="Dedicated Server / VPS / Cloud"
                                            subtitle="Direct MySQL access — CREATE DATABASE via SQL"
                                            details={[
                                                'Full MySQL root or privileged user',
                                                'VPS, cloud VM, Docker, local dev',
                                                'No cPanel credentials needed',
                                                'Unlimited databases per server',
                                            ]}
                                        />
                                        <HostingModeCard
                                            id="shared"
                                            isActive={mode === 'shared'}
                                            onSelect={setMode}
                                            icon={ServerIcon}
                                            title="Shared Hosting (Namecheap / cPanel)"
                                            subtitle="Databases created via cPanel UAPI — no CREATE DATABASE SQL"
                                            details={[
                                                'Namecheap, Bluehost, HostGator, etc.',
                                                'cPanel API Token authentication',
                                                'DB name auto-prefixed: username_tn_xyz',
                                                'API Token: cPanel → Security → Manage API Tokens',
                                            ]}
                                        />
                                    </div>
                                </div>

                                {/* ── Section 2: cPanel credentials (shared only) ── */}
                                {mode === 'shared' && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <LockClosedIcon className="w-5 h-5 text-warning" />
                                            <h5 className="text-base font-semibold">cPanel Credentials</h5>
                                            <Chip color="warning" variant="flat" size="sm">Required for shared mode</Chip>
                                        </div>

                                        <div className="rounded-xl p-5 space-y-4" style={sectionCardStyle}>
                                            {/* How-to note */}
                                            <div className="flex items-start gap-2 text-xs text-default-500 bg-default-100 rounded-lg p-3">
                                                <InformationCircleIcon className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                                                <span>
                                                    To get your API token: log in to cPanel → <strong>Security</strong> → <strong>Manage API Tokens</strong> → Create Token.
                                                    The cPanel host is the hostname in your cPanel URL (e.g.{' '}
                                                    <code className="bg-default-200 px-1 rounded">server123.web-hosting.com</code>).
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Input
                                                    label="cPanel Host"
                                                    placeholder="server123.web-hosting.com"
                                                    value={cpanelHost}
                                                    onValueChange={setCpanelHost}
                                                    radius={themeRadius}
                                                    variant="bordered"
                                                    description="Hostname from your cPanel URL — not your site domain"
                                                />
                                                <Input
                                                    label="cPanel Port"
                                                    placeholder="2083"
                                                    type="number"
                                                    value={cpanelPort}
                                                    onValueChange={setCpanelPort}
                                                    radius={themeRadius}
                                                    variant="bordered"
                                                    description="Default 2083 (HTTPS). Use 2082 for HTTP (not recommended)"
                                                />
                                                <Input
                                                    label="cPanel Username"
                                                    placeholder="yourusername"
                                                    value={cpanelUsername}
                                                    onValueChange={setCpanelUsername}
                                                    radius={themeRadius}
                                                    variant="bordered"
                                                    description="Your cPanel login username. DB names will be prefixed with this."
                                                />
                                                <Input
                                                    label="Database User (optional)"
                                                    placeholder="Leave blank to use username"
                                                    value={cpanelDbUser}
                                                    onValueChange={setCpanelDbUser}
                                                    radius={themeRadius}
                                                    variant="bordered"
                                                    description="The MySQL user granted access to tenant databases. Defaults to cPanel username."
                                                />
                                            </div>

                                            {/* API Token — full width, password input */}
                                            <Input
                                                label={tokenAlreadySet ? 'cPanel API Token (stored — enter new to replace)' : 'cPanel API Token'}
                                                placeholder={tokenAlreadySet ? '••••••••  (leave blank to keep current)' : 'Paste API token here'}
                                                type="password"
                                                value={cpanelToken}
                                                onValueChange={setCpanelToken}
                                                radius={themeRadius}
                                                variant="bordered"
                                                description="Generated in cPanel → Security → Manage API Tokens. Stored encrypted."
                                                startContent={<LockClosedIcon className="w-4 h-4 text-default-400" />}
                                                endContent={
                                                    tokenAlreadySet && !cpanelToken && (
                                                        <Chip color="success" variant="flat" size="sm">Token saved</Chip>
                                                    )
                                                }
                                            />

                                            {/* Test connection button + result */}
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                                                <Button
                                                    color="secondary"
                                                    variant="bordered"
                                                    isLoading={testing}
                                                    onPress={handleTestCpanel}
                                                    startContent={!testing && <WifiIcon className="w-4 h-4" />}
                                                    isDisabled={!cpanelHost || !cpanelUsername || (!cpanelToken && !tokenAlreadySet)}
                                                    size="sm"
                                                >
                                                    Test cPanel Connection
                                                </Button>

                                                {testResult !== null && (
                                                    <div className={[
                                                        'flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg',
                                                        testResult.success
                                                            ? 'bg-success/10 text-success border border-success/20'
                                                            : 'bg-danger/10 text-danger border border-danger/20',
                                                    ].join(' ')}>
                                                        {testResult.success
                                                            ? <CheckCircleIcon className="w-4 h-4 shrink-0" />
                                                            : <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />}
                                                        <span>{testResult.message}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── Section 3: How it works ───────────── */}
                                <div>
                                    <h5 className="text-base font-semibold mb-3">How Tenant Database Provisioning Works</h5>
                                    <div
                                        className="rounded-xl p-5 space-y-3 text-sm text-default-600"
                                        style={sectionCardStyle}
                                    >
                                        {mode === 'dedicated' ? (
                                            <>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-primary font-bold shrink-0">1.</span>
                                                    Tenant registers → <code className="bg-default-100 px-1 rounded text-xs">ProvisionTenant</code> job is queued.
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-primary font-bold shrink-0">2.</span>
                                                    Job sends <code className="bg-default-100 px-1 rounded text-xs">CREATE DATABASE tenant{'{id}'}</code> via the MySQL connection configured in <code className="bg-default-100 px-1 rounded text-xs">.env</code>.
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-primary font-bold shrink-0">3.</span>
                                                    Migrations run inside the new database. Tenant goes live.
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-primary font-bold shrink-0">1.</span>
                                                    Tenant registers → <code className="bg-default-100 px-1 rounded text-xs">ProvisionTenant</code> job is queued.
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-primary font-bold shrink-0">2.</span>
                                                    Job calls <strong>Namecheap cPanel UAPI</strong>:{' '}
                                                    <code className="bg-default-100 px-1 rounded text-xs text-wrap break-all">
                                                        https://host:2083/execute/Mysql/create_database?name=tn_{'{subdomain}'}
                                                    </code>.
                                                    cPanel creates <code className="bg-default-100 px-1 rounded text-xs">username_tn_{'{subdomain}'}</code>.
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-primary font-bold shrink-0">3.</span>
                                                    Privileges granted to your DB user via UAPI — no root SQL needed.
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-primary font-bold shrink-0">4.</span>
                                                    Laravel connects to the new database via normal <code className="bg-default-100 px-1 rounded text-xs">DB_HOST=127.0.0.1</code> — standard MySQL from this point on.
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-primary font-bold shrink-0">5.</span>
                                                    Migrations run. Tenant goes live.
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* ── Section 4: Current status summary ─── */}
                                <div className="flex flex-wrap gap-3 pt-1">
                                    <div className="flex items-center gap-2 text-xs text-default-500">
                                        <ArrowPathIcon className="w-4 h-4" />
                                        <span>
                                            Resolved active mode:{' '}
                                            <Chip
                                                color={resolvedMode === 'shared' ? 'warning' : 'primary'}
                                                variant="flat"
                                                size="sm"
                                            >
                                                {resolvedMode === 'shared' ? '🏢 Shared (cPanel)' : '🖥️ Dedicated (VPS)'}
                                            </Chip>
                                        </span>
                                    </div>
                                </div>

                            </CardBody>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

Infrastructure.layout = (page) => <App children={page} />;
export default Infrastructure;