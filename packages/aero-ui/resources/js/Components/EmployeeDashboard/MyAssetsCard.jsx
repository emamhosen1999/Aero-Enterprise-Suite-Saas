import React from 'react';
import { Chip, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { ComputerDesktopIcon, DevicePhoneMobileIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const LoadingSkeleton = () => (
    <ThemedCard>
        <ThemedCardHeader>
            <div className="p-4 w-full"><Skeleton className="h-5 w-24 rounded" /></div>
        </ThemedCardHeader>
        <ThemedCardBody className="p-4 sm:p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-lg" /><div className="flex-1 space-y-1"><Skeleton className="h-3 w-32 rounded" /><Skeleton className="h-2 w-20 rounded" /></div></div>
            ))}
        </ThemedCardBody>
    </ThemedCard>
);

const CATEGORY_ICON = {
    laptop: ComputerDesktopIcon,
    computer: ComputerDesktopIcon,
    desktop: ComputerDesktopIcon,
    phone: DevicePhoneMobileIcon,
    mobile: DevicePhoneMobileIcon,
};

const MyAssetsCard = ({ assetData }) => {
    const themeRadius = useThemeRadius();
    if (assetData === undefined) return <LoadingSkeleton />;

    const assets = (assetData?.myAssets || []);

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <ThemedCard className="h-full">
                <ThemedCardHeader>
                    <div className="p-4 sm:p-5 w-full">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', borderRadius: 'var(--borderRadius, 8px)' }}>
                                <ComputerDesktopIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">My Assets</h3>
                        </div>
                    </div>
                </ThemedCardHeader>

                <ThemedCardBody className="p-4 sm:p-5 space-y-3">
                    {assets.length > 0 ? assets.map((a, i) => {
                        const cat = (a.category || '').toLowerCase();
                        const Icon = CATEGORY_ICON[cat] || WrenchScrewdriverIcon;

                        return (
                            <div key={a.id || i} className="flex items-center gap-3 p-2 rounded-lg bg-content2">
                                <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                                    <Icon className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-foreground truncate">{a.name}</p>
                                    <p className="text-[10px] text-default-400">
                                        {a.serial_number && <span>SN: {a.serial_number} · </span>}
                                        {a.category}
                                    </p>
                                </div>
                                {a.expected_return_date && (
                                    <Chip size="sm" variant="flat" color="warning" radius={themeRadius}>
                                        Return: {a.expected_return_date}
                                    </Chip>
                                )}
                            </div>
                        );
                    }) : (
                        <p className="text-sm text-default-400 text-center py-2">No assets allocated</p>
                    )}
                </ThemedCardBody>
            </ThemedCard>
        </motion.div>
    );
};

export default MyAssetsCard;
