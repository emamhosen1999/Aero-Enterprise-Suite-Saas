import React, { useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardBody } from '@heroui/react';
import { motion } from 'framer-motion';
import {
    CalendarIcon,
    ClockIcon,
    CurrencyDollarIcon,
    UserIcon,
    BriefcaseIcon,
    DocumentTextIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    HomeIcon,
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    FolderIcon,
    PencilSquareIcon,
    ClipboardDocumentListIcon,
    AcademicCapIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    GlobeAltIcon,
    HeartIcon,
    InboxIcon,
    KeyIcon,
    MegaphoneIcon,
    PresentationChartLineIcon,
    ShieldCheckIcon,
    StarIcon,
    UserGroupIcon,
    WrenchScrewdriverIcon,
    ArrowPathIcon,
    BanknotesIcon,
    BookOpenIcon,
    CreditCardIcon,
    IdentificationIcon,
    PaperAirplaneIcon,
    QueueListIcon,
    RocketLaunchIcon,
    SparklesIcon,
    TicketIcon,
    TrophyIcon,
    TruckIcon,
    VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const ICON_MAP = {
    CalendarIcon,
    ClockIcon,
    CurrencyDollarIcon,
    UserIcon,
    BriefcaseIcon,
    DocumentTextIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    HomeIcon,
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    FolderIcon,
    PencilSquareIcon,
    ClipboardDocumentListIcon,
    AcademicCapIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    GlobeAltIcon,
    HeartIcon,
    InboxIcon,
    KeyIcon,
    MegaphoneIcon,
    PresentationChartLineIcon,
    ShieldCheckIcon,
    StarIcon,
    UserGroupIcon,
    WrenchScrewdriverIcon,
    ArrowPathIcon,
    BanknotesIcon,
    BookOpenIcon,
    CreditCardIcon,
    IdentificationIcon,
    PaperAirplaneIcon,
    QueueListIcon,
    RocketLaunchIcon,
    SparklesIcon,
    TicketIcon,
    TrophyIcon,
    TruckIcon,
    VideoCameraIcon,
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const QuickActionsGrid = ({ quickActions = [], isMobile = false }) => {
    const themeRadius = useThemeRadius();

    const handlePress = useCallback((actionRoute) => {
        try {
            router.visit(route(actionRoute));
        } catch {
            // Route may not be registered — silently ignore
        }
    }, []);

    if (!quickActions.length) return null;

    const ResolvedIcon = ({ name, className, style }) => {
        const Icon = ICON_MAP[name];
        if (!Icon) return <BriefcaseIcon className={className} style={style} />;
        return <Icon className={className} style={style} />;
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`grid gap-3 ${
                isMobile
                    ? 'grid-cols-2'
                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
            }`}
        >
            {quickActions.map((action) => (
                <motion.div key={action.id} variants={itemVariants}>
                    <Card
                        isPressable
                        onPress={() => handlePress(action.route)}
                        radius={themeRadius}
                        className="aero-card group transition-all duration-200 hover:scale-[1.03]"
                    >
                        <CardBody className="flex flex-col items-center justify-center gap-2 p-3 h-20">
                            <div
                                className="p-2 rounded-lg transition-colors"
                                style={{
                                    background: `color-mix(in srgb, var(--theme-${action.color || 'primary'}, var(--theme-primary)) 15%, transparent)`,
                                    borderRadius: 'var(--borderRadius, 8px)',
                                }}
                            >
                                <ResolvedIcon
                                    name={action.icon}
                                    className="w-5 h-5"
                                    style={{ color: `var(--theme-${action.color || 'primary'}, var(--theme-primary))` }}
                                />
                            </div>
                            <span className="text-xs font-medium text-default-700 dark:text-default-400 text-center leading-tight line-clamp-1">
                                {action.label}
                            </span>
                            {action.badgeCount != null && action.badgeCount > 0 && (
                                <span
                                    className="absolute top-1.5 right-1.5 min-w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                                    style={{ background: `var(--theme-${action.color || 'primary'}, var(--theme-primary))` }}
                                >
                                    {action.badgeCount > 99 ? '99+' : action.badgeCount}
                                </span>
                            )}
                        </CardBody>
                    </Card>
                </motion.div>
            ))}
        </motion.div>
    );
};

export default QuickActionsGrid;
