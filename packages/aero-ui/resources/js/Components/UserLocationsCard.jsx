import React, { Suspense } from 'react';
import { Skeleton } from '@heroui/react';

/**
 * UserLocationsCard — lazy-loaded wrapper.
 *
 * All leaflet / react-leaflet / leaflet-routing-machine imports live in
 * UserLocationsCardContent.jsx and are only loaded when this component
 * actually renders, keeping them out of the initial bundle.
 */
const LazyUserLocationsCard = React.lazy(() => import('./UserLocationsCardContent'));

const UserLocationsCard = (props) => (
    <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-lg" />}>
        <LazyUserLocationsCard {...props} />
    </Suspense>
);

export default UserLocationsCard;
