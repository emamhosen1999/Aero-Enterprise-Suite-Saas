import React from 'react';
import { Card, CardBody, CardHeader, Chip, Progress, Skeleton } from '@heroui/react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';

const SecurityOverviewCard = ({ security = {}, loading = false }) => {
    const failedLogins = security.failedLoginsLast24h ?? 0;
    const mfaAdoption = security.mfaAdoptionPercent ?? 0;
    const recentDevices = security.recentNewDevices ?? 0;
    const activeTokens = security.activeSanctumTokens ?? 0;

    if (loading) {
        return (
            <Card style={getThemedCardStyle()}>
                <CardBody className="p-4 space-y-3">
                    <Skeleton className="h-5 w-32 rounded" />
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 rounded" />)}
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="transition-all duration-200" style={getThemedCardStyle()}>
            <CardHeader className="border-b p-4" style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}>
                <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                    <h3 className="font-semibold">Security</h3>
                </div>
            </CardHeader>
            <CardBody className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-default-500">Failed Logins (24h)</span>
                    <Chip size="sm" color={failedLogins > 10 ? 'danger' : 'success'} variant="flat">{failedLogins}</Chip>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-default-500">MFA Adoption</span>
                        <span className="text-xs font-medium">{mfaAdoption}%</span>
                    </div>
                    <Progress value={mfaAdoption} size="sm" color={mfaAdoption > 70 ? 'success' : 'warning'} />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-default-500">New Devices</span>
                    <Chip size="sm" variant="flat">{recentDevices}</Chip>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-default-500">Active Tokens</span>
                    <Chip size="sm" variant="flat">{activeTokens}</Chip>
                </div>
            </CardBody>
        </Card>
    );
};

export default SecurityOverviewCard;
