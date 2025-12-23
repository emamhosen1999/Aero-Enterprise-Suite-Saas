import React from 'react';
import { Card, CardBody, CardHeader, Chip, Button, Skeleton, Avatar } from '@heroui/react';
import { 
    ClipboardDocumentListIcon,
    StarIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

/**
 * Pending Reviews Widget
 * Shows performance reviews awaiting the user's action.
 */
export default function PendingReviewsWidget({ 
    reviews = [],
    self_assessments_due = 0,
    peer_reviews_due = 0,
    manager_reviews_due = 0,
    loading = false,
    view_all_url = '/hrm/performance',
    title = 'Pending Reviews'
}) {
    const totalPending = self_assessments_due + peer_reviews_due + manager_reviews_due;

    const reviewTypes = [
        { label: 'Self Assessment', count: self_assessments_due, color: 'primary' },
        { label: 'Peer Reviews', count: peer_reviews_due, color: 'secondary' },
        { label: 'Manager Reviews', count: manager_reviews_due, color: 'warning' },
    ].filter(t => t.count > 0);

    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-5 w-36 rounded" />
                </CardHeader>
                <CardBody className="p-4 space-y-3">
                    <div className="flex justify-around">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="text-center space-y-2">
                                <Skeleton className="h-8 w-8 rounded-full mx-auto" />
                                <Skeleton className="h-3 w-16 rounded" />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                        {[1, 2].map((i) => (
                            <Skeleton key={i} className="h-14 w-full rounded-lg" />
                        ))}
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-3 sm:p-4">
                <div className="flex items-center justify-between w-full gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <ClipboardDocumentListIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                        <h3 className="text-base sm:text-lg font-semibold truncate">{title}</h3>
                    </div>
                    {totalPending > 0 && (
                        <Chip color="warning" variant="flat" size="sm" className="shrink-0">
                            {totalPending} Due
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-3 sm:p-4">
                {totalPending === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 sm:py-6 text-center">
                        <StarIcon className="w-10 h-10 sm:w-12 sm:h-12 text-default-300 mb-2" />
                        <p className="text-sm sm:text-base text-default-500">No pending reviews</p>
                        <p className="text-xs text-default-400 mt-1">
                            You're all caught up!
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Review Type Summary */}
                        <div className="flex justify-around mb-4 py-2">
                            {reviewTypes.map((type) => (
                                <div key={type.label} className="text-center">
                                    <div className={`text-2xl font-bold text-${type.color}`}>
                                        {type.count}
                                    </div>
                                    <p className="text-xs text-default-500">{type.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Pending Review Items */}
                        <div className="space-y-2">
                            {reviews.slice(0, 4).map((review) => (
                                <div 
                                    key={review.id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-default-100 transition-colors"
                                >
                                    <Avatar
                                        src={review.employee?.avatar}
                                        name={review.employee?.name}
                                        size="sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {review.employee?.name}
                                        </p>
                                        <p className="text-xs text-default-500">
                                            {review.review_type} • Due {review.due_date}
                                        </p>
                                    </div>
                                    <Chip 
                                        size="sm" 
                                        variant="flat" 
                                        color={review.days_remaining <= 2 ? 'danger' : 'warning'}
                                    >
                                        {review.days_remaining}d left
                                    </Chip>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-divider">
                            <Button
                                as={Link}
                                href={view_all_url}
                                variant="flat"
                                color="primary"
                                fullWidth
                                size="sm"
                            >
                                View All Reviews
                            </Button>
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
}
