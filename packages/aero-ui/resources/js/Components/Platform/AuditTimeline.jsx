import React, { useState } from 'react';
import { 
    Card,
    CardBody,
    Button,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Avatar,
    Tooltip,
    Spinner
} from '@heroui/react';
import { 
    ClockIcon,
    UserCircleIcon,
    ComputerDesktopIcon,
    GlobeAltIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    TrashIcon,
    PlusIcon,
    PencilIcon,
    EyeIcon,
    ChevronDownIcon,
    MagnifyingGlassIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Activity Icon Component
 * Returns appropriate icon based on activity type
 */
const ActivityIcon = ({ type, className = "w-4 h-4" }) => {
    const iconMap = {
        'created': <PlusIcon className={className} />,
        'updated': <PencilIcon className={className} />,
        'deleted': <TrashIcon className={className} />,
        'restored': <ArrowPathIcon className={className} />,
        'viewed': <EyeIcon className={className} />,
        'login': <UserCircleIcon className={className} />,
        'logout': <UserCircleIcon className={className} />,
        'default': <DocumentTextIcon className={className} />,
    };

    return iconMap[type] || iconMap['default'];
};

/**
 * Get color scheme based on activity type
 */
const getActivityColor = (type) => {
    const colorMap = {
        'created': { bg: 'bg-success-100', text: 'text-success-700', border: 'border-success-300' },
        'updated': { bg: 'bg-primary-100', text: 'text-primary-700', border: 'border-primary-300' },
        'deleted': { bg: 'bg-danger-100', text: 'text-danger-700', border: 'border-danger-300' },
        'restored': { bg: 'bg-warning-100', text: 'text-warning-700', border: 'border-warning-300' },
        'viewed': { bg: 'bg-secondary-100', text: 'text-secondary-700', border: 'border-secondary-300' },
        'login': { bg: 'bg-success-100', text: 'text-success-700', border: 'border-success-300' },
        'logout': { bg: 'bg-secondary-100', text: 'text-secondary-700', border: 'border-secondary-300' },
        'default': { bg: 'bg-default-100', text: 'text-default-700', border: 'border-default-300' },
    };

    return colorMap[type] || colorMap['default'];
};

/**
 * Format relative time
 */
const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
};

/**
 * Single Activity Item Component
 */
const ActivityItem = ({ activity, showDetails = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const colors = getActivityColor(activity.event || activity.description?.split(' ')[0]?.toLowerCase());
    
    const causer = activity.causer || {};
    const properties = activity.properties || {};
    const hasChanges = properties.old || properties.attributes;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative pl-8 pb-6 last:pb-0"
        >
            {/* Timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-default-200 dark:bg-default-700" />
            
            {/* Timeline dot */}
            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full ${colors.bg} ${colors.border} border-2 flex items-center justify-center`}>
                <ActivityIcon 
                    type={activity.event || activity.description?.split(' ')[0]?.toLowerCase()} 
                    className={`w-3 h-3 ${colors.text}`}
                />
            </div>

            {/* Content */}
            <div className="ml-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        {/* Description */}
                        <p className="text-sm font-medium text-foreground">
                            {activity.description}
                        </p>
                        
                        {/* Subject info */}
                        {activity.subject_type && (
                            <p className="text-xs text-default-500 mt-0.5">
                                {activity.subject_type.split('\\').pop()} #{activity.subject_id}
                            </p>
                        )}

                        {/* Causer info */}
                        <div className="flex items-center gap-2 mt-2">
                            <Avatar
                                src={causer.avatar_url}
                                name={causer.name || 'System'}
                                size="sm"
                                className="w-5 h-5"
                            />
                            <span className="text-xs text-default-600">
                                {causer.name || causer.email || 'System'}
                            </span>
                            <span className="text-xs text-default-400">•</span>
                            <Tooltip content={new Date(activity.created_at).toLocaleString()}>
                                <span className="text-xs text-default-400 cursor-help">
                                    {formatRelativeTime(activity.created_at)}
                                </span>
                            </Tooltip>
                        </div>

                        {/* Metadata chips */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {properties.ip_address && (
                                <Chip 
                                    size="sm" 
                                    variant="flat"
                                    startContent={<GlobeAltIcon className="w-3 h-3" />}
                                >
                                    {properties.ip_address}
                                </Chip>
                            )}
                            {activity.log_name && activity.log_name !== 'default' && (
                                <Chip size="sm" variant="flat" color="primary">
                                    {activity.log_name}
                                </Chip>
                            )}
                        </div>
                    </div>

                    {/* Expand button for changes */}
                    {hasChanges && showDetails && (
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => setIsExpanded(!isExpanded)}
                        >
                            <ChevronDownIcon 
                                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                        </Button>
                    )}
                </div>

                {/* Expandable changes section */}
                <AnimatePresence>
                    {isExpanded && hasChanges && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-3"
                        >
                            <div className="p-3 bg-default-50 dark:bg-default-100 rounded-lg text-xs">
                                {properties.attributes && (
                                    <div className="mb-2">
                                        <span className="font-semibold text-success-600">New values:</span>
                                        <pre className="mt-1 text-default-600 whitespace-pre-wrap">
                                            {JSON.stringify(properties.attributes, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                {properties.old && (
                                    <div>
                                        <span className="font-semibold text-danger-600">Old values:</span>
                                        <pre className="mt-1 text-default-600 whitespace-pre-wrap">
                                            {JSON.stringify(properties.old, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

/**
 * Audit Timeline Component
 * 
 * Displays activity logs in a timeline format with filtering capabilities.
 * 
 * @param {Array} activities - Array of activity log entries
 * @param {boolean} isLoading - Loading state
 * @param {Function} onLoadMore - Callback to load more activities
 * @param {boolean} hasMore - Whether more activities can be loaded
 * @param {Function} onFilter - Callback when filter changes
 * @param {Array} logNames - Available log names for filtering
 * @param {boolean} showDetails - Whether to show expandable details
 */
export default function AuditTimeline({ 
    activities = [], 
    isLoading = false,
    onLoadMore,
    hasMore = false,
    onFilter,
    logNames = [],
    showDetails = true,
    title = "Activity Timeline",
    emptyMessage = "No activity to display"
}) {
    const [selectedLogName, setSelectedLogName] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const handleFilterChange = (logName) => {
        setSelectedLogName(logName);
        onFilter?.({ logName: logName === 'all' ? null : logName });
    };

    // Group activities by date
    const groupedActivities = activities.reduce((groups, activity) => {
        const date = new Date(activity.created_at).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(activity);
        return groups;
    }, {});

    return (
        <Card className="w-full">
            <CardBody className="p-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-divider">
                    <div className="flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">{title}</h3>
                        {activities.length > 0 && (
                            <Chip size="sm" variant="flat">
                                {activities.length} items
                            </Chip>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Log name filter */}
                        {logNames.length > 0 && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button 
                                        variant="flat" 
                                        size="sm"
                                        startContent={<FunnelIcon className="w-4 h-4" />}
                                        endContent={<ChevronDownIcon className="w-3 h-3" />}
                                    >
                                        {selectedLogName === 'all' ? 'All Logs' : selectedLogName}
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    aria-label="Filter by log name"
                                    selectedKeys={[selectedLogName]}
                                    selectionMode="single"
                                    onSelectionChange={(keys) => handleFilterChange(Array.from(keys)[0])}
                                >
                                    <DropdownItem key="all">All Logs</DropdownItem>
                                    {logNames.map(name => (
                                        <DropdownItem key={name}>{name}</DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        )}

                        {/* Refresh button */}
                        <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => onFilter?.({})}
                            isLoading={isLoading}
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Timeline content */}
                <div className="p-4 max-h-[600px] overflow-y-auto">
                    {isLoading && activities.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <Spinner size="lg" />
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-default-400">
                            <DocumentTextIcon className="w-12 h-12 mb-4" />
                            <p>{emptyMessage}</p>
                        </div>
                    ) : (
                        <>
                            {Object.entries(groupedActivities).map(([date, dateActivities]) => (
                                <div key={date} className="mb-6 last:mb-0">
                                    {/* Date header */}
                                    <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-2 mb-4 z-10">
                                        <h4 className="text-xs font-semibold text-default-500 uppercase tracking-wider">
                                            {date}
                                        </h4>
                                    </div>

                                    {/* Activities for this date */}
                                    <AnimatePresence>
                                        {dateActivities.map((activity) => (
                                            <ActivityItem 
                                                key={activity.id} 
                                                activity={activity}
                                                showDetails={showDetails}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            ))}

                            {/* Load more button */}
                            {hasMore && (
                                <div className="flex justify-center pt-4">
                                    <Button
                                        variant="flat"
                                        size="sm"
                                        onPress={onLoadMore}
                                        isLoading={isLoading}
                                    >
                                        Load More
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </CardBody>
        </Card>
    );
}
