import React from 'react';
import { Avatar, Chip, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { UserGroupIcon, CakeIcon } from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const LoadingSkeleton = () => (
    <ThemedCard>
        <ThemedCardHeader>
            <div className="p-4 w-full"><Skeleton className="h-5 w-24 rounded" /></div>
        </ThemedCardHeader>
        <ThemedCardBody className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-1"><Skeleton className="h-3 w-28 rounded" /><Skeleton className="h-2 w-20 rounded" /></div></div>
            <div className="flex gap-2 flex-wrap">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-8 rounded-full" />)}</div>
        </ThemedCardBody>
    </ThemedCard>
);

const TeamCard = ({ teamData }) => {
    const themeRadius = useThemeRadius();
    if (teamData === undefined) return <LoadingSkeleton />;

    const { teamInfo } = teamData || {};
    const info = teamInfo || {};
    const members = (info.team_members || []).slice(0, 8);
    const birthdays = (info.team_birthdays || []).slice(0, 5);

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <ThemedCard className="h-full">
                <ThemedCardHeader>
                    <div className="p-4 sm:p-5 w-full">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', borderRadius: 'var(--borderRadius, 8px)' }}>
                                <UserGroupIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-foreground">My Team</h3>
                                {info.department_name && <p className="text-[10px] text-default-400">{info.department_name} · {info.team_size ?? members.length} members</p>}
                            </div>
                        </div>
                    </div>
                </ThemedCardHeader>

                <ThemedCardBody className="p-4 sm:p-5 space-y-5">
                    {/* Manager */}
                    {info.manager && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-default-500 uppercase tracking-wider">Manager</p>
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-content2">
                                <Avatar src={info.manager.avatar || info.manager.profile_photo_url} name={info.manager.name} size="sm" radius="full" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{info.manager.name}</p>
                                    {info.manager.designation && <p className="text-[10px] text-default-400">{info.manager.designation}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Team Members */}
                    {members.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-default-500 uppercase tracking-wider">Team Members</p>
                            <div className="flex flex-wrap gap-2">
                                {members.map((m, i) => (
                                    <div key={m.id || i} className="flex items-center gap-2 p-1.5 rounded-lg bg-content2">
                                        <Avatar src={m.avatar || m.profile_photo_url} name={m.name} size="sm" radius="full" className="w-7 h-7" />
                                        <span className="text-xs text-foreground truncate max-w-[80px]">{m.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Birthdays This Month */}
                    {birthdays.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-default-500 uppercase tracking-wider flex items-center gap-1">
                                <CakeIcon className="w-3.5 h-3.5" /> Birthdays This Month
                            </p>
                            {birthdays.map((b, i) => (
                                <div key={b.id || i} className="flex items-center justify-between text-xs">
                                    <span className="text-default-600 dark:text-default-400">{b.name}</span>
                                    <Chip size="sm" variant="flat" color="secondary" radius={themeRadius}>{b.date || b.birthday}</Chip>
                                </div>
                            ))}
                        </div>
                    )}

                    {!info.manager && members.length === 0 && (
                        <p className="text-sm text-default-400 text-center py-2">No team data available</p>
                    )}
                </ThemedCardBody>
            </ThemedCard>
        </motion.div>
    );
};

export default TeamCard;
