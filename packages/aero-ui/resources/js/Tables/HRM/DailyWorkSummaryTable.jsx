import React from 'react';
import { useTheme } from '@/Context/ThemeContext.jsx';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import { usePage } from "@inertiajs/react";

import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Card,
    CardBody,
    Divider,
    ScrollShadow,
    Progress,
    Button,
    Skeleton
} from "@heroui/react";
import {
    CalendarDaysIcon,
    ChartBarIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ClockIcon,
    ArrowPathIcon,
    BuildingOfficeIcon,
    DocumentIcon,
    MapPinIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
    CheckCircleIcon as CheckCircleSolid,
    ClockIcon as ClockSolid,
    ArrowPathIcon as ArrowPathSolid
} from '@heroicons/react/24/solid';


const DailyWorkSummaryTable = ({ filteredData, onRefresh, loading = false }) => {
    const { theme } = useTheme();
    const isMobile = useMediaQuery('(max-width: 1024px)');
    
    // Theme radius helper function (same as DailyWorksTable)
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        
        const radiusValue = parseInt(getComputedStyle(document.documentElement)
            .getPropertyValue('--borderRadius')?.trim() || '12');
        
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

    // Desktop Table Loading Skeleton (matching DailyWorksTable)
    const DesktopLoadingSkeleton = () => {
        return (
            <div className="max-h-[84vh] overflow-y-auto">
                {/* Header skeleton */}
                <div className="flex items-center justify-between mb-4 px-2">
                    <Skeleton className="w-32 h-6 rounded" />
                    <Skeleton className="w-20 h-8 rounded" />
                </div>
                
                <ScrollShadow className="max-h-[70vh]">
                    <div className="border border-divider rounded-lg overflow-hidden">
                        {/* Table header skeleton */}
                        <div className="bg-default-100/80 backdrop-blur-md border-b border-divider">
                            <div className="flex">
                                {columns.map((column, index) => (
                                    <div key={index} className="flex-1 p-3">
                                        <Skeleton className="w-20 h-4 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Table body skeleton */}
                        <div className="divide-y divide-divider">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={index} className="flex hover:bg-default-50/50 transition-colors">
                                    {columns.map((column, colIndex) => (
                                        <div key={colIndex} className="flex-1 p-3">
                                            <Skeleton className="w-full h-4 rounded" />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollShadow>
            </div>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const getPercentageColor = (percentage) => {
        if (percentage >= 100) return 'success';
        if (percentage >= 75) return 'warning';
        if (percentage >= 50) return 'primary';
        return 'danger';
    };

    const getPercentageIcon = (percentage) => {
        if (percentage >= 100) return <CheckCircleSolid className="w-3 h-3" />;
        if (percentage >= 50) return <ClockSolid className="w-3 h-3" />;
        return <ExclamationTriangleIcon className="w-3 h-3" />;
    };

    const getWorkTypeIcon = (type, count) => {
        const iconProps = "w-3 h-3";
        const baseColor = count > 0 ? "" : "text-gray-400";
        
        switch (type?.toLowerCase()) {
            case "embankment":
                return <BuildingOfficeIcon className={`${iconProps} text-amber-500 ${baseColor}`} />;
            case "structure":
                return <DocumentIcon className={`${iconProps} text-blue-500 ${baseColor}`} />;
            case "pavement":
                return <MapPinIcon className={`${iconProps} text-gray-500 ${baseColor}`} />;
            default:
                return <DocumentTextIcon className={`${iconProps} text-primary ${baseColor}`} />;
        }
    };

    // Mobile card component - matching the pattern from other tables
    const MobileSummaryCard = ({ summary }) => {
        const completionPercentage = summary.totalDailyWorks > 0
            ? (summary.completed / summary.totalDailyWorks * 100).toFixed(1)
            : 0;
        const rfiSubmissionPercentage = summary.rfiSubmissions > 0 && summary.completed > 0
            ? (summary.rfiSubmissions / summary.completed * 100).toFixed(1)
            : 0;
        const pending = summary.totalDailyWorks - summary.completed;

        return (
            <Card 
                className="mb-2" 
                shadow="sm"
                radius={getThemeRadius()}
                style={{
                    border: `var(--borderWidth, 1px) solid var(--theme-divider, #E4E4E7)`,
                    borderRadius: `var(--borderRadius, 12px)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}
            >
                <CardBody className="p-3" style={{
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}>
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-primary" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    {formatDate(summary.date)}
                                </span>
                                <span className="text-xs text-default-500" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    {summary.totalDailyWorks} total works
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Chip
                                size="sm"
                                variant="flat"
                                color={getPercentageColor(parseFloat(completionPercentage))}
                                startContent={getPercentageIcon(parseFloat(completionPercentage))}
                                radius={getThemeRadius()}
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                {completionPercentage}%
                            </Chip>
                        </div>
                    </div>

                    <Divider className="my-3" />

                    {/* Progress bars */}
                    <div className="space-y-3 mb-3">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    Completion Progress
                                </span>
                                <span className="text-xs font-medium" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    {summary.completed}/{summary.totalDailyWorks}
                                </span>
                            </div>
                            <Progress
                                value={parseFloat(completionPercentage)}
                                color={getPercentageColor(parseFloat(completionPercentage))}
                                size="sm"
                                radius={getThemeRadius()}
                                className="w-full"
                                aria-label={`Completion progress: ${completionPercentage}%`}
                            />
                        </div>

                        {summary.rfiSubmissions > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-default-600" style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        RFI Submission
                                    </span>
                                    <span className="text-xs font-medium" style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        {summary.rfiSubmissions}/{summary.completed}
                                    </span>
                                </div>
                                <Progress
                                    value={parseFloat(rfiSubmissionPercentage)}
                                    color={getPercentageColor(parseFloat(rfiSubmissionPercentage))}
                                    size="sm"
                                    radius={getThemeRadius()}
                                    className="w-full"
                                    aria-label={`RFI submission progress: ${rfiSubmissionPercentage}%`}
                                />
                            </div>
                        )}
                    </div>

                    {/* Work type breakdown */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg" style={{
                            borderRadius: `var(--borderRadius, 8px)`,
                        }}>
                            {getWorkTypeIcon("embankment", summary.embankment)}
                            <span className="text-xs mt-1 text-default-600" style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                Embankment
                            </span>
                            <span className="text-xs font-medium" style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                {summary.embankment}
                            </span>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg" style={{
                            borderRadius: `var(--borderRadius, 8px)`,
                        }}>
                            {getWorkTypeIcon("structure", summary.structure)}
                            <span className="text-xs mt-1 text-default-600" style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                Structure
                            </span>
                            <span className="text-xs font-medium" style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                {summary.structure}
                            </span>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg" style={{
                            borderRadius: `var(--borderRadius, 8px)`,
                        }}>
                            {getWorkTypeIcon("pavement", summary.pavement)}
                            <span className="text-xs mt-1 text-default-600" style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                Pavement
                            </span>
                            <span className="text-xs font-medium" style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                {summary.pavement}
                            </span>
                        </div>
                    </div>

                    {/* Additional metrics */}
                    <Divider className="my-3" />
                    <div className="flex justify-between text-xs">
                        <div className="flex items-center gap-1">
                            <ArrowPathSolid className="w-3 h-3 text-warning" />
                            <span style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>Resubmissions: {summary.resubmissions}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <ClockSolid className="w-3 h-3 text-danger" />
                            <span style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>Pending: {pending}</span>
                        </div>
                    </div>
                </CardBody>
            </Card>
        );
    };

    const renderCell = React.useCallback((summary, columnKey) => {
        const completionPercentage = summary.totalDailyWorks > 0
            ? (summary.completed / summary.totalDailyWorks * 100).toFixed(1)
            : 0;
        const rfiSubmissionPercentage = summary.rfiSubmissions > 0 && summary.completed > 0
            ? (summary.rfiSubmissions / summary.completed * 100).toFixed(1)
            : 0;
        const pending = summary.totalDailyWorks - summary.completed;

        switch (columnKey) {
            case "date":
                return (
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-3 h-3 text-default-500" />
                            <span className="text-sm font-medium">
                                {formatDate(summary.date)}
                            </span>
                        </div>
                    </TableCell>
                );

            case "totalDailyWorks":
                return (
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <DocumentTextIcon className="w-3 h-3 text-primary" />
                            <span className="text-sm font-bold">
                                {summary.totalDailyWorks}
                            </span>
                        </div>
                    </TableCell>
                );

            case "resubmissions":
                return (
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <ArrowPathSolid className="w-3 h-3 text-warning" />
                            <span className="text-sm">
                                {summary.resubmissions}
                            </span>
                        </div>
                    </TableCell>
                );

            case "embankment":
            case "structure":
            case "pavement":
                return (
                    <TableCell>
                        <div className="flex items-center gap-1">
                            {getWorkTypeIcon(columnKey, summary[columnKey])}
                            <span className="text-sm">
                                {summary[columnKey]}
                            </span>
                        </div>
                    </TableCell>
                );

            case "completed":
                return (
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <CheckCircleSolid className="w-3 h-3 text-success" />
                            <span className="text-sm font-medium text-success">
                                {summary.completed}
                            </span>
                        </div>
                    </TableCell>
                );

            case "pending":
                return (
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <ClockSolid className="w-3 h-3 text-danger" />
                            <span className="text-sm font-medium text-danger">
                                {pending}
                            </span>
                        </div>
                    </TableCell>
                );

            case "completionPercentage":
                return (
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <Progress
                                value={parseFloat(completionPercentage)}
                                color={getPercentageColor(parseFloat(completionPercentage))}
                                size="sm"
                                className="flex-1 min-w-[80px]"
                                aria-label={`Daily work completion: ${completionPercentage}%`}
                            />
                            <Chip
                                size="sm"
                                variant="flat"
                                color={getPercentageColor(parseFloat(completionPercentage))}
                                startContent={getPercentageIcon(parseFloat(completionPercentage))}
                            >
                                {completionPercentage}%
                            </Chip>
                        </div>
                    </TableCell>
                );

            case "rfiSubmissions":
                return (
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <DocumentIcon className="w-3 h-3 text-info" />
                            <span className="text-sm">
                                {summary.rfiSubmissions}
                            </span>
                        </div>
                    </TableCell>
                );

            case "rfiSubmissionPercentage":
                return (
                    <TableCell>
                        <div className="flex items-center gap-2">
                            {summary.rfiSubmissions > 0 ? (
                                <>
                                    <Progress
                                        value={parseFloat(rfiSubmissionPercentage)}
                                        color={getPercentageColor(parseFloat(rfiSubmissionPercentage))}
                                        size="sm"
                                        className="flex-1 min-w-[80px]"
                                        aria-label={`RFI submission percentage: ${rfiSubmissionPercentage}%`}
                                    />
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color={getPercentageColor(parseFloat(rfiSubmissionPercentage))}
                                        startContent={getPercentageIcon(parseFloat(rfiSubmissionPercentage))}
                                    >
                                        {rfiSubmissionPercentage}%
                                    </Chip>
                                </>
                            ) : (
                                <span className="text-sm text-default-400">
                                    -
                                </span>
                            )}
                        </div>
                    </TableCell>
                );

            default:
                return <TableCell>{summary[columnKey]}</TableCell>;
        }
    }, []);

    const columns = [
        { name: "Date", uid: "date", icon: CalendarDaysIcon },
        { name: "Total Daily Works", uid: "totalDailyWorks", icon: DocumentTextIcon },
        { name: "Resubmissions", uid: "resubmissions", icon: ArrowPathIcon },
        { name: "Embankment", uid: "embankment", icon: BuildingOfficeIcon },
        { name: "Structure", uid: "structure", icon: DocumentIcon },
        { name: "Pavement", uid: "pavement", icon: MapPinIcon },
        { name: "Completed", uid: "completed", icon: CheckCircleIcon },
        { name: "Pending", uid: "pending", icon: ClockIcon },
        { name: "Completion %", uid: "completionPercentage", icon: ChartBarIcon },
        { name: "RFI Submissions", uid: "rfiSubmissions", icon: DocumentIcon },
        { name: "RFI Submission %", uid: "rfiSubmissionPercentage", icon: ChartBarIcon }
    ];

    if (isMobile) {
        return (
            <div className="space-y-4" style={{
                fontFamily: `var(--fontFamily, "Inter")`,
            }}>
                {onRefresh && (
                    <div className="flex justify-end mb-4">
                        <Button
                            size="sm"
                            variant="bordered"
                            color="primary"
                            radius={getThemeRadius()}
                            startContent={<ArrowPathIcon className="w-4 h-4" />}
                            onPress={onRefresh}
                            aria-label="Refresh daily work summary table"
                            style={{
                                borderRadius: `var(--borderRadius, 8px)`,
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                        >
                            Refresh Summary
                        </Button>
                    </div>
                )}
                <ScrollShadow className="max-h-[70vh]">
                    {filteredData?.length > 0 ? (
                        filteredData.map((summary, index) => (
                            <MobileSummaryCard key={index} summary={summary} />
                        ))
                    ) : (
                        <Card
                            className="text-center py-8"
                            radius={getThemeRadius()}
                            style={{
                                border: `var(--borderWidth, 1px) solid var(--theme-divider, #E4E4E7)`,
                                borderRadius: `var(--borderRadius, 12px)`,
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                        >
                            <CardBody>
                                <ChartBarIcon className="w-12 h-12 text-default-300 mb-4 mx-auto" />
                                <h6 className="text-lg font-semibold text-default-600 mb-2" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    No summary data found
                                </h6>
                                <p className="text-sm text-default-500" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    No work summary available for the selected period
                                </p>
                            </CardBody>
                        </Card>
                    )}
                </ScrollShadow>
            </div>
        );
    }

    // Show loading skeleton when loading  
    if (loading) {
        return <DesktopLoadingSkeleton />;
    }

    return (
        <div className="max-h-[84vh] overflow-y-auto">
            
            <ScrollShadow className="max-h-[70vh]">
                <Table
                    selectionMode="none"
                    isCompact
                    removeWrapper
                    isStriped
                    aria-label="Daily Work Summary Table"
                    isHeaderSticky
                    radius={getThemeRadius()}
                    classNames={{
                        base: "max-h-[520px] overflow-auto",
                        table: "min-h-[200px] w-full",
                        thead: "z-10",
                        tbody: "overflow-y-auto",
                        th: "bg-default-100 text-default-700 font-semibold",
                        td: "text-default-600",
                    }}
                    style={{
                        borderRadius: `var(--borderRadius, 12px)`,
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn 
                                key={column.uid} 
                                align={column.uid === "date" ? "start" : "center"}
                                className={`bg-default-100/80 backdrop-blur-md ${column.width || ''}`}
                                style={{
                                    minWidth: column.uid === "date" ? "128px" : 
                                            column.uid === "incharge" ? "192px" :
                                            "auto"
                                }}
                            >
                                <div className={`flex items-center gap-1 ${column.uid === "date" ? "justify-start" : "justify-center"}`}>
                                    {column.icon && <column.icon className="w-3 h-3" />}
                                    <span className="text-xs font-semibold">{column.name}</span>
                                </div>
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody 
                        items={filteredData || []}
                        emptyContent={
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <ChartBarIcon className="w-12 h-12 text-default-300 mb-4" />
                                <h6 className="text-lg font-medium text-default-600">
                                    No summary data found
                                </h6>
                                <span className="text-sm text-default-500">
                                    No work summary available for the selected period
                                </span>
                            </div>
                        }
                    >
                        {(summary) => (
                            <TableRow 
                                key={summary.date} 
                            >
                                {(columnKey) => renderCell(summary, columnKey)}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollShadow>
        </div>
    );
};

export default DailyWorkSummaryTable;
