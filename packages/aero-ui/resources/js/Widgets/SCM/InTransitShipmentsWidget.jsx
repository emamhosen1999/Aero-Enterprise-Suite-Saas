import { Card, CardBody, CardHeader, Chip, Button, Skeleton } from '@heroui/react';
import { TruckIcon, MapPinIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function InTransitShipmentsWidget({ shipments = [], in_transit_count = 0, expected_today = 0, delayed = 0, loading, show_more_url, title }) {
    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-6 w-40 rounded" />
                </CardHeader>
                <CardBody className="p-4">
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full rounded" />
                        <Skeleton className="h-10 w-full rounded" />
                    </div>
                </CardBody>
            </Card>
        );
    }

    const isEmpty = in_transit_count === 0;

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <TruckIcon className="w-5 h-5 text-primary" />
                        <span className="font-semibold">{title || 'In-Transit Shipments'}</span>
                    </div>
                    {in_transit_count > 0 && (
                        <Chip size="sm" color="primary" variant="flat">
                            {in_transit_count}
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {isEmpty ? (
                    <div className="text-center py-4">
                        <TruckIcon className="w-10 h-10 mx-auto text-default-300 mb-2" />
                        <p className="text-default-500 text-sm">No shipments in transit</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <TruckIcon className="w-5 h-5 mx-auto text-primary mb-1" />
                                <p className="text-lg font-bold text-primary">{in_transit_count}</p>
                                <p className="text-xs text-default-500">In Transit</p>
                            </div>
                            <div className="p-2 bg-success/10 rounded-lg">
                                <CheckCircleIcon className="w-5 h-5 mx-auto text-success mb-1" />
                                <p className="text-lg font-bold text-success">{expected_today}</p>
                                <p className="text-xs text-default-500">Due Today</p>
                            </div>
                            <div className="p-2 bg-danger/10 rounded-lg">
                                <ClockIcon className="w-5 h-5 mx-auto text-danger mb-1" />
                                <p className="text-lg font-bold text-danger">{delayed}</p>
                                <p className="text-xs text-default-500">Delayed</p>
                            </div>
                        </div>
                        {shipments && shipments.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs text-default-500 font-medium">Recent Shipments</p>
                                {shipments.slice(0, 3).map((shipment, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 bg-content2 rounded-lg">
                                        <MapPinIcon className="w-4 h-4 text-default-400" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{shipment.reference}</p>
                                            <p className="text-xs text-default-500">{shipment.origin} → {shipment.destination}</p>
                                        </div>
                                        <Chip 
                                            size="sm" 
                                            color={shipment.status === 'delayed' ? 'danger' : 'primary'}
                                            variant="flat"
                                        >
                                            {shipment.eta}
                                        </Chip>
                                    </div>
                                ))}
                            </div>
                        )}
                        {show_more_url && (
                            <Button
                                as={Link}
                                href={show_more_url}
                                size="sm"
                                variant="flat"
                                color="primary"
                                className="w-full"
                            >
                                Track Shipments
                            </Button>
                        )}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
