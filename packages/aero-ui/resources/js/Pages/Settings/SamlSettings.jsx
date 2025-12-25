import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import App from '@/Layouts/App';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Switch,
    Textarea,
    Chip,
    Link,
    Tooltip,
    Spinner,
    Divider,
} from '@heroui/react';
import { showToast } from '@/utils/toastUtils';
import {
    ShieldCheckIcon,
    KeyIcon,
    LinkIcon,
    DocumentDuplicateIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

const SamlSettings = () => {
    const {
        enabled = false,
        providers = {},
        currentConfig = null,
        spMetadataUrl = '',
        acsUrl = '',
        sloUrl = '',
    } = usePage().props;

    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const form = useForm({
        name: currentConfig?.name ?? 'enterprise',
        label: currentConfig?.label ?? 'Enterprise SSO',
        entityId: currentConfig?.entityId ?? '',
        ssoUrl: currentConfig?.singleSignOnService?.url ?? '',
        sloUrl: currentConfig?.singleLogoutService?.url ?? '',
        x509cert: currentConfig?.x509cert ?? '',
    });

    const { data, setData, post, processing, errors, reset } = form;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showToast.success('Copied to clipboard');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.saml.save'), {
            onSuccess: () => {
                showToast.success('SAML configuration saved successfully');
                setTestResult(null);
            },
            onError: () => {
                showToast.error('Failed to save configuration');
            },
        });
    };

    const testConnection = async () => {
        setTesting(true);
        setTestResult(null);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('settings.saml.test'));

                if (response.status === 200) {
                    setTestResult(response.data);
                    if (response.data.success) {
                        resolve(['Configuration is valid']);
                    } else {
                        reject([response.data.message || 'Configuration validation failed']);
                    }
                }
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Failed to test configuration';
                setTestResult({ success: false, message: errorMessage });
                reject([errorMessage]);
            } finally {
                setTesting(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Testing configuration...',
            success: (data) => data[0],
            error: (data) => Array.isArray(data) ? data[0] : data,
        });
    };

    return (
        <>
            <Head title="SAML SSO Settings" />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            SAML SSO Settings
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Configure enterprise Single Sign-On with your identity provider
                        </p>
                    </div>
                    <Chip
                        color={enabled ? 'success' : 'default'}
                        variant="flat"
                        startContent={enabled ? <CheckCircleIcon className="w-4 h-4" /> : null}
                    >
                        {enabled ? 'SAML Enabled' : 'SAML Disabled'}
                    </Chip>
                </div>

                {/* Service Provider Information */}
                <Card>
                    <CardHeader className="flex gap-3">
                        <ShieldCheckIcon className="w-6 h-6 text-primary" />
                        <div className="flex flex-col">
                            <p className="text-md font-semibold">Service Provider Details</p>
                            <p className="text-small text-default-500">
                                Use these values to configure your Identity Provider
                            </p>
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    ACS URL (Assertion Consumer Service)
                                </label>
                                <div className="flex mt-1">
                                    <Input
                                        value={acsUrl}
                                        isReadOnly
                                        className="flex-1"
                                        endContent={
                                            <Tooltip content="Copy to clipboard">
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(acsUrl)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <DocumentDuplicateIcon className="w-5 h-5" />
                                                </button>
                                            </Tooltip>
                                        }
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    SLO URL (Single Logout Service)
                                </label>
                                <div className="flex mt-1">
                                    <Input
                                        value={sloUrl}
                                        isReadOnly
                                        className="flex-1"
                                        endContent={
                                            <Tooltip content="Copy to clipboard">
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(sloUrl)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <DocumentDuplicateIcon className="w-5 h-5" />
                                                </button>
                                            </Tooltip>
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                SP Metadata URL
                            </label>
                            <div className="flex mt-1 gap-2">
                                <Input
                                    value={spMetadataUrl}
                                    isReadOnly
                                    className="flex-1"
                                    endContent={
                                        <Tooltip content="Copy to clipboard">
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(spMetadataUrl)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <DocumentDuplicateIcon className="w-5 h-5" />
                                            </button>
                                        </Tooltip>
                                    }
                                />
                                <Button
                                    as={Link}
                                    href={spMetadataUrl}
                                    target="_blank"
                                    color="primary"
                                    variant="flat"
                                    endContent={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                                >
                                    View
                                </Button>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Identity Provider Configuration */}
                <Card>
                    <CardHeader className="flex gap-3">
                        <KeyIcon className="w-6 h-6 text-primary" />
                        <div className="flex flex-col">
                            <p className="text-md font-semibold">Identity Provider Configuration</p>
                            <p className="text-small text-default-500">
                                Enter your IdP details (Azure AD, Okta, Google Workspace, etc.)
                            </p>
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Provider Name"
                                    placeholder="enterprise"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    description="Internal identifier (no spaces)"
                                    isInvalid={!!errors.name}
                                    errorMessage={errors.name}
                                    isRequired
                                />
                                <Input
                                    label="Display Label"
                                    placeholder="Sign in with Enterprise SSO"
                                    value={data.label}
                                    onChange={(e) => setData('label', e.target.value)}
                                    description="Shown on login page"
                                    isInvalid={!!errors.label}
                                    errorMessage={errors.label}
                                    isRequired
                                />
                            </div>

                            <Input
                                label="IdP Entity ID"
                                placeholder="https://sts.windows.net/your-tenant-id/"
                                value={data.entityId}
                                onChange={(e) => setData('entityId', e.target.value)}
                                description="Also called Issuer URI"
                                isInvalid={!!errors.entityId}
                                errorMessage={errors.entityId}
                                isRequired
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="SSO URL"
                                    placeholder="https://login.microsoftonline.com/.../saml2"
                                    value={data.ssoUrl}
                                    onChange={(e) => setData('ssoUrl', e.target.value)}
                                    description="Single Sign-On service URL"
                                    isInvalid={!!errors.ssoUrl}
                                    errorMessage={errors.ssoUrl}
                                    isRequired
                                />
                                <Input
                                    label="SLO URL (Optional)"
                                    placeholder="https://login.microsoftonline.com/.../saml2"
                                    value={data.sloUrl}
                                    onChange={(e) => setData('sloUrl', e.target.value)}
                                    description="Single Logout service URL"
                                    isInvalid={!!errors.sloUrl}
                                    errorMessage={errors.sloUrl}
                                />
                            </div>

                            <Textarea
                                label="X.509 Certificate"
                                placeholder="-----BEGIN CERTIFICATE-----&#10;MIICrjCCAZagAwIBAgI...&#10;-----END CERTIFICATE-----"
                                value={data.x509cert}
                                onChange={(e) => setData('x509cert', e.target.value)}
                                description="Public certificate from your IdP for signature verification"
                                minRows={4}
                                maxRows={8}
                                isInvalid={!!errors.x509cert}
                                errorMessage={errors.x509cert}
                                isRequired
                            />

                            {/* Test Result */}
                            {testResult && (
                                <div
                                    className={`p-4 rounded-lg flex items-start gap-3 ${
                                        testResult.success
                                            ? 'bg-success-50 dark:bg-success-900/20'
                                            : 'bg-danger-50 dark:bg-danger-900/20'
                                    }`}
                                >
                                    {testResult.success ? (
                                        <CheckCircleIcon className="w-5 h-5 text-success mt-0.5" />
                                    ) : (
                                        <ExclamationCircleIcon className="w-5 h-5 text-danger mt-0.5" />
                                    )}
                                    <div>
                                        <p
                                            className={`font-medium ${
                                                testResult.success ? 'text-success-700' : 'text-danger-700'
                                            }`}
                                        >
                                            {testResult.message}
                                        </p>
                                        {testResult.errors && (
                                            <ul className="mt-2 text-sm text-danger-600 list-disc list-inside">
                                                {testResult.errors.map((error, i) => (
                                                    <li key={i}>{error}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}

                            <Divider />

                            <div className="flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="flat"
                                    onClick={testConnection}
                                    isLoading={testing}
                                    isDisabled={!data.entityId || !data.ssoUrl || !data.x509cert}
                                >
                                    Test Configuration
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    isLoading={processing}
                                    isDisabled={processing}
                                >
                                    Save Configuration
                                </Button>
                            </div>
                        </form>
                    </CardBody>
                </Card>

                {/* Active Providers */}
                {Object.keys(providers).length > 0 && (
                    <Card>
                        <CardHeader className="flex gap-3">
                            <LinkIcon className="w-6 h-6 text-primary" />
                            <div className="flex flex-col">
                                <p className="text-md font-semibold">Active SSO Providers</p>
                                <p className="text-small text-default-500">
                                    Available identity providers for login
                                </p>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                            <div className="flex flex-wrap gap-3">
                                {Object.values(providers).map((provider) => (
                                    <Chip
                                        key={provider.name}
                                        color="primary"
                                        variant="flat"
                                        startContent={<KeyIcon className="w-4 h-4" />}
                                    >
                                        {provider.label}
                                    </Chip>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                )}
            </div>
        </>
    );
};

SamlSettings.layout = (page) => <App children={page} />;

export default SamlSettings;
