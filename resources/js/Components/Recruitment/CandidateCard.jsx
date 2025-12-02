import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardBody, Avatar, Chip, Tooltip } from '@heroui/react';
import {
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    BriefcaseIcon,
    CurrencyDollarIcon,
    ClockIcon,
    StarIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

/**
 * CandidateCard Component
 * 
 * Draggable card representing a job application candidate
 */
const CandidateCard = ({ application, onView, isDragging = false, themeRadius }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging: isBeingDragged } = useDraggable({
        id: application.id,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isBeingDragged ? 0.5 : 1,
    };

    const formatDate = (dateString) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return dateString;
        }
    };

    const formatCurrency = (amount, currency = 'USD') => {
        if (!amount) return 'Not specified';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getSourceColor = (source) => {
        const colors = {
            referral: 'success',
            linkedin: 'primary',
            indeed: 'secondary',
            website: 'warning',
            internal: 'default',
        };
        return colors[source] || 'default';
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            isPressable={!isDragging}
            onPress={onView}
            className={`transition-all duration-200 cursor-grab active:cursor-grabbing ${
                isBeingDragged ? 'shadow-2xl z-50' : 'hover:shadow-md'
            }`}
            radius={themeRadius}
        >
            <CardBody className="p-4">
                {/* Header: Avatar + Name */}
                <div className="flex items-start gap-3 mb-3">
                    <Avatar
                        name={application.applicant_name}
                        size="md"
                        src={application.applicant?.avatar}
                        showFallback
                        fallback={<UserIcon className="w-5 h-5 text-default-400" />}
                    />
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground truncate mb-1">
                            {application.applicant_name}
                        </h4>
                        <div className="flex items-center gap-2">
                            {application.source && (
                                <Chip size="sm" color={getSourceColor(application.source)} variant="flat">
                                    {application.source}
                                </Chip>
                            )}
                            {application.rating && (
                                <div className="flex items-center gap-1">
                                    <StarIcon className="w-3 h-3 text-warning fill-warning" />
                                    <span className="text-xs text-default-600">{application.rating}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-3">
                    {application.email && (
                        <div className="flex items-center gap-2 text-xs text-default-600">
                            <EnvelopeIcon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{application.email}</span>
                        </div>
                    )}
                    {application.phone && (
                        <div className="flex items-center gap-2 text-xs text-default-600">
                            <PhoneIcon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{application.phone}</span>
                        </div>
                    )}
                </div>

                {/* Experience & Salary */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    {application.experience_years !== null && (
                        <div
                            className="flex items-center gap-2 p-2 rounded-lg"
                            style={{
                                background: `color-mix(in srgb, var(--theme-primary) 10%, transparent)`,
                            }}
                        >
                            <BriefcaseIcon
                                className="w-3.5 h-3.5 flex-shrink-0"
                                style={{ color: 'var(--theme-primary)' }}
                            />
                            <div>
                                <div className="text-xs font-medium text-foreground">
                                    {application.experience_years} yrs
                                </div>
                                <div className="text-[10px] text-default-500">Experience</div>
                            </div>
                        </div>
                    )}
                    {application.expected_salary && (
                        <div
                            className="flex items-center gap-2 p-2 rounded-lg"
                            style={{
                                background: `color-mix(in srgb, var(--theme-success) 10%, transparent)`,
                            }}
                        >
                            <CurrencyDollarIcon
                                className="w-3.5 h-3.5 flex-shrink-0"
                                style={{ color: 'var(--theme-success)' }}
                            />
                            <div>
                                <div className="text-xs font-medium text-foreground truncate">
                                    {formatCurrency(application.expected_salary, application.salary_currency)}
                                </div>
                                <div className="text-[10px] text-default-500">Expected</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Skills */}
                {application.skills && application.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {application.skills.slice(0, 3).map((skill, index) => (
                            <Chip key={index} size="sm" variant="flat" color="primary" className="text-[10px]">
                                {skill}
                            </Chip>
                        ))}
                        {application.skills.length > 3 && (
                            <Chip size="sm" variant="flat" color="default" className="text-[10px]">
                                +{application.skills.length - 3}
                            </Chip>
                        )}
                    </div>
                )}

                {/* Footer: Applied date */}
                <div className="flex items-center justify-between text-xs text-default-500 pt-2 border-t border-divider">
                    <div className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        <span>Applied {formatDate(application.application_date || application.created_at)}</span>
                    </div>
                    {application.notice_period !== null && (
                        <Tooltip content="Notice Period">
                            <span className="text-[10px] text-default-400">
                                {application.notice_period} days
                            </span>
                        </Tooltip>
                    )}
                </div>
            </CardBody>
        </Card>
    );
};

export default CandidateCard;
