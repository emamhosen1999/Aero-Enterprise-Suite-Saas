import React from 'react';
import { Chip, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const LoadingSkeleton = () => (
    <ThemedCard>
        <ThemedCardHeader>
            <div className="p-4 w-full"><Skeleton className="h-5 w-28 rounded" /></div>
        </ThemedCardHeader>
        <ThemedCardBody className="p-4 sm:p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-lg" /><div className="flex-1 space-y-1"><Skeleton className="h-3 w-28 rounded" /><Skeleton className="h-2 w-20 rounded" /></div></div>
            ))}
        </ThemedCardBody>
    </ThemedCard>
);

const expiryColor = (date) => {
    if (!date) return null;
    const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'danger';
    if (diff < 30) return 'warning';
    return null;
};

const DocumentsCard = ({ documentData }) => {
    const themeRadius = useThemeRadius();
    if (documentData === undefined) return <LoadingSkeleton />;

    const { myDocuments, documentAlerts } = documentData || {};
    const docs = (myDocuments || []).slice(0, 6);
    const alerts = documentAlerts || [];

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <ThemedCard className="h-full">
                <ThemedCardHeader>
                    <div className="p-4 sm:p-5 w-full">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', borderRadius: 'var(--borderRadius, 8px)' }}>
                                <DocumentTextIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">My Documents</h3>
                            {alerts.length > 0 && (
                                <Chip size="sm" variant="flat" color="danger" radius={themeRadius}>{alerts.length} alert{alerts.length > 1 ? 's' : ''}</Chip>
                            )}
                        </div>
                    </div>
                </ThemedCardHeader>

                <ThemedCardBody className="p-4 sm:p-5 space-y-3">
                    {/* Document Alerts */}
                    {alerts.length > 0 && (
                        <div className="space-y-1.5">
                            {alerts.map((a, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-danger/10">
                                    <ExclamationTriangleIcon className="w-4 h-4 text-danger shrink-0" />
                                    <span className="text-xs text-danger font-medium truncate">{a.message || a.title || 'Document expiring'}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Documents List */}
                    {docs.length > 0 ? docs.map((d, i) => {
                        const color = expiryColor(d.expiry_date);
                        return (
                            <div key={d.id || i} className="flex items-center justify-between p-2 rounded-lg bg-content2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <DocumentTextIcon className="w-4 h-4 text-default-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-foreground truncate">{d.name || d.title}</p>
                                        {d.type && <p className="text-[10px] text-default-400">{d.type}</p>}
                                    </div>
                                </div>
                                {color && (
                                    <Chip size="sm" variant="flat" color={color} radius={themeRadius}>
                                        {color === 'danger' ? 'Expired' : 'Expiring'}
                                    </Chip>
                                )}
                            </div>
                        );
                    }) : (
                        <p className="text-sm text-default-400 text-center py-2">No documents found</p>
                    )}
                </ThemedCardBody>
            </ThemedCard>
        </motion.div>
    );
};

export default DocumentsCard;
