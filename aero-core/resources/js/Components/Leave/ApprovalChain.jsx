import React from 'react';
import { Card, CardBody, Chip, Avatar, Progress } from '@heroui/react';
import { CheckCircleIcon, ClockIcon, XCircleIcon, UserIcon } from '@heroicons/react/24/outline';

export default function ApprovalChain({ approvalChain, currentLevel, status }) {
    if (!approvalChain || approvalChain.length === 0) {
        return null;
    }

    const getStatusIcon = (levelStatus) => {
        switch (levelStatus) {
            case 'approved':
                return <CheckCircleIcon className="w-5 h-5 text-success" />;
            case 'rejected':
                return <XCircleIcon className="w-5 h-5 text-danger" />;
            case 'pending':
                return <ClockIcon className="w-5 h-5 text-warning" />;
            default:
                return <ClockIcon className="w-5 h-5 text-default-400" />;
        }
    };

    const getStatusColor = (levelStatus) => {
        switch (levelStatus) {
            case 'approved':
                return 'success';
            case 'rejected':
                return 'danger';
            case 'pending':
                return 'warning';
            default:
                return 'default';
        }
    };

    const approvedCount = approvalChain.filter(l => l.status === 'approved').length;
    const progress = (approvedCount / approvalChain.length) * 100;

    return (
        <Card className="w-full">
            <CardBody className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">Approval Workflow</h4>
                    <Chip size="sm" color={getStatusColor(status)} variant="flat">
                        {status || 'Pending'}
                    </Chip>
                </div>

                <Progress 
                    value={progress} 
                    color={status === 'rejected' ? 'danger' : 'success'} 
                    size="sm"
                    className="mb-2"
                />

                <div className="space-y-3">
                    {approvalChain.map((level, index) => {
                        const isCurrentLevel = level.level === currentLevel;
                        const isPastLevel = level.level < currentLevel;

                        return (
                            <div
                                key={index}
                                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                                    isCurrentLevel 
                                        ? 'bg-warning-50 dark:bg-warning-900/20 border-l-3 border-warning' 
                                        : level.status === 'approved'
                                        ? 'bg-success-50 dark:bg-success-900/20'
                                        : level.status === 'rejected'
                                        ? 'bg-danger-50 dark:bg-danger-900/20'
                                        : 'bg-default-100 dark:bg-default-50'
                                }`}
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    {getStatusIcon(level.status)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-semibold text-foreground truncate">
                                            Level {level.level}: {level.approver_name}
                                        </p>
                                        {isCurrentLevel && (
                                            <Chip size="sm" color="warning" variant="flat">
                                                Current
                                            </Chip>
                                        )}
                                    </div>

                                    {level.approved_at && (
                                        <p className="text-xs text-default-500">
                                            {level.status === 'approved' ? 'Approved' : 'Reviewed'} on{' '}
                                            {new Date(level.approved_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    )}

                                    {level.comments && (
                                        <p className="text-xs text-default-600 mt-1 italic">
                                            "{level.comments}"
                                        </p>
                                    )}

                                    {isCurrentLevel && level.status === 'pending' && (
                                        <p className="text-xs text-warning-600 dark:text-warning-400 mt-1 font-medium">
                                            Awaiting approval
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {status === 'pending' && (
                    <div className="text-xs text-default-500 text-center pt-2 border-t border-divider">
                        {approvedCount} of {approvalChain.length} approvals completed
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
