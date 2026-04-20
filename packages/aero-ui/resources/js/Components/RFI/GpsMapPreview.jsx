import React, { useEffect, useRef, useState } from 'react';
import { Card, CardBody, CardHeader, Chip, Spinner } from "@heroui/react";
import { MapPinIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

/**
 * GpsMapPreview - Interactive GPS Map with Geofence Visualization
 * 
 * Displays:
 * - User's current GPS location
 * - Expected chainage location
 * - 50m geofence radius circle
 * - Distance calculation
 * - Validation status
 * 
 * PATENTABLE FEATURE: GPS Geo-Fencing visualization
 */
const GpsMapPreview = ({
    userLat,
    userLng,
    expectedLat,
    expectedLng,
    distance,
    isValid,
    tolerance = 50,
    chainageStart,
    chainageEnd,
    loading = false
}) => {
    const mapRef = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [markers, setMarkers] = useState({ user: null, expected: null });
    const [circle, setCircle] = useState(null);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || !window.google) return;

        const center = expectedLat && expectedLng 
            ? { lat: expectedLat, lng: expectedLng }
            : { lat: 25.2048, lng: 55.2708 }; // Default to Dubai

        const map = new window.google.maps.Map(mapRef.current, {
            center,
            zoom: 17,
            mapTypeId: 'satellite',
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true
        });

        setMapInstance(map);
    }, [expectedLat, expectedLng]);

    // Update markers and geofence circle
    useEffect(() => {
        if (!mapInstance) return;

        // Clear existing markers and circle
        if (markers.user) markers.user.setMap(null);
        if (markers.expected) markers.expected.setMap(null);
        if (circle) circle.setMap(null);

        const newMarkers = { user: null, expected: null };
        let newCircle = null;

        // Add expected location marker (blue)
        if (expectedLat && expectedLng) {
            newMarkers.expected = new window.google.maps.Marker({
                position: { lat: expectedLat, lng: expectedLng },
                map: mapInstance,
                title: `Expected Location (Ch ${chainageStart}${chainageEnd ? `-${chainageEnd}` : ''})`,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: '#0070F3',
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2
                },
                label: {
                    text: 'E',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }
            });

            // Add geofence circle (50m tolerance)
            newCircle = new window.google.maps.Circle({
                map: mapInstance,
                center: { lat: expectedLat, lng: expectedLng },
                radius: tolerance, // meters
                fillColor: isValid ? '#10B981' : '#EF4444',
                fillOpacity: 0.15,
                strokeColor: isValid ? '#10B981' : '#EF4444',
                strokeOpacity: 0.6,
                strokeWeight: 2
            });

            // Fit bounds to show both markers
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend({ lat: expectedLat, lng: expectedLng });
            
            if (userLat && userLng) {
                bounds.extend({ lat: userLat, lng: userLng });
            }
            
            mapInstance.fitBounds(bounds);
        }

        // Add user location marker (red/green based on validation)
        if (userLat && userLng) {
            newMarkers.user = new window.google.maps.Marker({
                position: { lat: userLat, lng: userLng },
                map: mapInstance,
                title: `Your Location (${distance?.toFixed(1)}m away)`,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: isValid ? '#10B981' : '#EF4444',
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2
                },
                label: {
                    text: 'U',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }
            });

            // Draw line between markers if both exist
            if (newMarkers.expected) {
                new window.google.maps.Polyline({
                    path: [
                        { lat: expectedLat, lng: expectedLng },
                        { lat: userLat, lng: userLng }
                    ],
                    geodesic: true,
                    strokeColor: isValid ? '#10B981' : '#EF4444',
                    strokeOpacity: 0.7,
                    strokeWeight: 2,
                    map: mapInstance
                });
            }
        }

        setMarkers(newMarkers);
        setCircle(newCircle);

        // Cleanup on unmount
        return () => {
            if (newMarkers.user) newMarkers.user.setMap(null);
            if (newMarkers.expected) newMarkers.expected.setMap(null);
            if (newCircle) newCircle.setMap(null);
        };
    }, [mapInstance, userLat, userLng, expectedLat, expectedLng, distance, isValid, tolerance, chainageStart, chainageEnd]);

    return (
        <Card className="w-full">
            <CardHeader className="flex justify-between items-center border-b border-divider">
                <div className="flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">GPS Validation Map</h3>
                </div>
                
                {distance !== undefined && (
                    <Chip
                        size="sm"
                        variant="flat"
                        color={isValid ? "success" : "danger"}
                        startContent={isValid ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                    >
                        {distance.toFixed(1)}m {isValid ? '(Valid)' : '(Invalid)'}
                    </Chip>
                )}
            </CardHeader>
            
            <CardBody className="p-0">
                {loading ? (
                    <div className="flex items-center justify-center h-64 bg-default-100">
                        <Spinner label="Loading map..." />
                    </div>
                ) : (
                    <div 
                        ref={mapRef} 
                        className="w-full h-64 sm:h-96"
                        style={{ minHeight: '256px' }}
                    />
                )}
                
                {/* Legend */}
                <div className="p-4 bg-content2 border-t border-divider">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                            <span>Expected Location (E)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${isValid ? 'bg-success' : 'bg-danger'} border-2 border-white`}></div>
                            <span>Your Location (U)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-6 h-3 rounded ${isValid ? 'bg-success/20' : 'bg-danger/20'} border border-${isValid ? 'success' : 'danger'}`}></div>
                            <span>Geofence ({tolerance}m radius)</span>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default GpsMapPreview;
