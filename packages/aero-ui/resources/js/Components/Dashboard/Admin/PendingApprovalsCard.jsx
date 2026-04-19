import React, { useMemo } from 'react';
import { Card, CardBody, CardHeader, Chip, Skeleton, Tabs, Tab } from '@heroui/react';
import {
    ClipboardDocumentCheckIcon, CalendarDaysIcon, DocumentCheckIcon,
    BriefcaseIcon, TruckIcon, ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';

const moduleConfig = {
    hrm: { label: 'HRM', icon: CalendarDaysIcon, color: 'primary' },
    finance: { label: 'Finance', icon: BriefcaseIcon, color: 'success' },
    dms: { label: 'Documents', icon: DocumentCheckIcon, color: 'secondary' },
    project: { label: 'Projects', icon: ClipboardDocumentCheckIcon, color: 'warning' },
    quality: { label: 'Quality', icon: ShieldExclamationIcon, color: 'danger' },
    scm: { label: 'SCM', icon: TruckIcon, color: 'primary' },
};

const PendingApprovalsCard = ({ approvals, loading = false }) => {
    const modules = approvals?.modules || {};
    const total = approvals?.total || 0;

    const availableModules = useMemo(() =>
        Object.entries(modules).filter(([, items]) => Object.keys(items).length > 0),
    [modules]);

    return (
        <Card className="transition-all duration-200" style={getThemedCardStyle()}>
            <CardHeader className="border-b p-4 flex flex-row items-center justify-between"
                style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}
            >
                <div className="flex items-center gap-2">
                    <ClipboardDocumentCheckIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                    <h3 className="font-semibold">Pending Approvals</h3>
                </div>
                {total > 0 && <Chip size="sm" color="warning" variant="flat">{total}</Chip>}
            </CardHeader>
            <CardBody className="p-4">
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full rounded-lg" />
                        ))}
                    </div>
                ) : availableModules.length === 0 ? (
                    <p className="text-sm text-default-400 text-center py-4">No pending approvals</p>
                ) : (
                    <Tabs aria-label="Pending approvals by module" size="sm" variant="underlined">
                        {availableModules.map(([key, items]) => {
                            const config = moduleConfig[key] || { label: key, color: 'default' };
                            const Icon = config.icon || ClipboardDocumentCheckIcon;
                            const count = Object.values(items).reduce((a, b) => a + b, 0);

                            return (
                                <Tab
                                    key={key}
                                    title={
                                        <div className="flex items-center gap-1.5">
                                            <span>{config.label}</span>
                                            <Chip size="sm" variant="flat" color={config.color}>{count}</Chip>
                                        </div>
                                    }
                                >
                                    <div className="space-y-2 pt-2">
                                        {Object.entries(items).map(([itemKey, itemCount]) => (
                                            <div key={itemKey} className="flex items-center justify-between p-2 rounded-lg bg-default-50">
                                                <span className="text-sm capitalize">
                                                    {itemKey.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                                                </span>
                                                <Chip size="sm" variant="flat" color={config.color}>{itemCount}</Chip>
                                            </div>
                                        ))}
                                    </div>
                                </Tab>
                            );
                        })}
                    </Tabs>
                )}
            </CardBody>
        </Card>
    );
};

export default PendingApprovalsCard;
