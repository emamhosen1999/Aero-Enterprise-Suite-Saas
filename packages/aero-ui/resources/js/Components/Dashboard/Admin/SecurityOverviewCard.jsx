import React from 'react';
import { Card, CardBody, CardHeader, Chip, Progress, Skeleton, Tooltip } from '@heroui/react';
import { ShieldCheckIcon, ExclamationTriangleIcon, KeyIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';

const SecurityOverviewCard = ({ security = {}, loading = false }) => {
    const failedLogins = security.failedLoginsLast24h ?? 0;
    const mfaAdoption = security.mfaAdoptionPercent ?? 0;
    const recentDevices = security.recentNewDevices ?? 0;
    const activeTokens = security.activeSanctumTokens ?? 0;

    const securityScore = Math.round(
        (mfaAdoption * 0.5) +
        (failedLogins === 0 ? 30 : failedLogins < 5 ? 20 : failedLogins < 20 ? 10 : 0) +
        (activeTokens > 0 ? 20 : 0)
    );
    const scoreColor = securityScore >= 80 ? 'success' : securityScore >= 50 ? 'warning' : 'danger';

    if (loading) {
        return (
            <Card style={getThemedCardStyle()}>
                <CardBody className="p-4 space-y-3">
                    <Skeleton className="h-5 w-32 rounded" />
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="transition-all duration-200 h-full" style={getThemedCardStyle()}>
            <CardHeader className="border-b p-4" style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}>
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)' }}>
                            <ShieldCheckIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <h3 className="font-semibold">Security</h3>
                    </div>
                    <Chip size="sm" color={scoreColor} variant="solid" className="font-bold">
                        {securityScore}% score
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="p-4 space-y-4">
                {/* MFA Adoption — most important */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">MFA Adoption</span>
                        <span className="text-sm font-bold" style={{ color: mfaAdoption > 70 ? 'var(--heroui-success)' : 'var(--heroui-warning)' }}>
                            {mfaAdoption}%
                        </span>
                    </div>
                    <Progress
                        value={mfaAdoption}
                        size="md"
                        color={mfaAdoption > 70 ? 'success' : 'warning'}
                        aria-label="MFA adoption rate"
                        className="h-2"
                    />
                    <p className="text-xs text-default-400">
                        {mfaAdoption < 50 ? '⚠️ Low MFA adoption — encourage users to enable 2FA' : '✅ Good MFA coverage'}
                    </p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-1 gap-2">
                    <Tooltip content="Failed login attempts in the past 24 hours" placement="left">
                        <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                            failedLogins > 10 ? 'border-danger/30 bg-danger/5' : 'border-default-200 bg-default-50'
                        }`}>
                            <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className={`w-4 h-4 ${failedLogins > 10 ? 'text-danger' : 'text-default-400'}`} />
                                <span className="text-sm">Failed Logins (24h)</span>
                            </div>
                            <Chip size="sm" color={failedLogins > 10 ? 'danger' : failedLogins > 0 ? 'warning' : 'success'} variant="flat" className="font-bold">
                                {failedLogins}
                            </Chip>
                        </div>
                    </Tooltip>

                    <Tooltip content="New device sign-ins recently detected" placement="left">
                        <div className="flex items-center justify-between p-3 rounded-xl border border-default-200 bg-default-50">
                            <div className="flex items-center gap-2">
                                <DevicePhoneMobileIcon className="w-4 h-4 text-default-400" />
                                <span className="text-sm">New Devices</span>
                            </div>
                            <Chip size="sm" color={recentDevices > 5 ? 'warning' : 'default'} variant="flat">{recentDevices}</Chip>
                        </div>
                    </Tooltip>

                    <Tooltip content="Active API / Sanctum tokens" placement="left">
                        <div className="flex items-center justify-between p-3 rounded-xl border border-default-200 bg-default-50">
                            <div className="flex items-center gap-2">
                                <KeyIcon className="w-4 h-4 text-default-400" />
                                <span className="text-sm">Active Tokens</span>
                            </div>
                            <Chip size="sm" variant="flat">{activeTokens}</Chip>
                        </div>
                    </Tooltip>
                </div>
            </CardBody>
        </Card>
    );
};

export default SecurityOverviewCard;
