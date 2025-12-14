import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Button, Input, Spinner, Card, CardBody } from '@heroui/react';
import { MapPinIcon, GlobeAltIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// GPS Status constants
const GPS_STATUS = {
    CHECKING: 'checking',
    ACTIVE: 'active',
    DENIED: 'denied',
    INACTIVE: 'inactive'
};

// Map click handler component
const MapClickHandler = ({ onLocationSelect }) => {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            onLocationSelect({
                latitude: lat,
                longitude: lng,
                accuracy: 10, // Default accuracy for manual selection
                source: 'manual'
            });
        },
    });
    return null;
};

const LocationPickerMap = ({ 
    onLocationChange, 
    initialLocation = null,
    className = "",
    style = {}
}) => {
    // Helper function to convert theme borderRadius to values
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

    // Location state
    const [locationState, setLocationState] = useState({
        status: GPS_STATUS.CHECKING,
        coordinates: initialLocation || { latitude: 23.8103, longitude: 90.4125 }, // Default to Dhaka
        error: null,
        accuracy: null
    });

    // Manual coordinate input state
    const [manualCoords, setManualCoords] = useState({
        latitude: '',
        longitude: ''
    });

    // Get current location from GPS
    const getCurrentLocation = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 30000
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const locationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        source: 'gps'
                    };
                    resolve(locationData);
                },
                (error) => {
                    let message = 'Location unavailable';
                    switch (error.code) {
                        case 1:
                            message = 'Location access denied. Please allow location permission.';
                            break;
                        case 2:
                            message = 'Location unavailable. Please ensure GPS is enabled.';
                            break;
                        case 3:
                            message = 'Location request timed out.';
                            break;
                        default:
                            message = 'Unable to retrieve location.';
                    }
                    reject(new Error(message));
                },
                options
            );
        });
    }, []);

    // Initialize location
    useEffect(() => {
        if (initialLocation) {
            setLocationState(prev => ({
                ...prev,
                status: GPS_STATUS.ACTIVE,
                coordinates: initialLocation,
                accuracy: initialLocation.accuracy || null
            }));
            return;
        }

        // Try to get current location
        setLocationState(prev => ({ ...prev, status: GPS_STATUS.CHECKING }));
        
        getCurrentLocation()
            .then((coords) => {
                setLocationState({
                    status: GPS_STATUS.ACTIVE,
                    coordinates: coords,
                    error: null,
                    accuracy: coords.accuracy
                });
                onLocationChange?.(coords);
            })
            .catch((error) => {
                const isPermissionDenied = error.message.includes('denied');
                setLocationState({
                    status: isPermissionDenied ? GPS_STATUS.DENIED : GPS_STATUS.INACTIVE,
                    coordinates: { latitude: 23.8103, longitude: 90.4125 }, // Default to Dhaka
                    error: error.message,
                    accuracy: null
                });
            });
    }, [initialLocation]); // Remove onLocationChange and getCurrentLocation from dependencies

    // Handle location selection from map click
    const handleLocationSelect = useCallback((coords) => {
        setLocationState(prev => ({
            ...prev,
            coordinates: coords,
            status: GPS_STATUS.ACTIVE,
            accuracy: coords.accuracy || 10
        }));
        onLocationChange?.(coords);
    }, []); // Remove onLocationChange from dependencies to prevent infinite loops

    // Handle manual coordinate input
    const handleManualCoordSubmit = useCallback(() => {
        const lat = parseFloat(manualCoords.latitude);
        const lng = parseFloat(manualCoords.longitude);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            setLocationState(prev => ({
                ...prev,
                error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.'
            }));
            return;
        }

        const coords = {
            latitude: lat,
            longitude: lng,
            accuracy: 50, // Default accuracy for manual entry
            source: 'manual'
        };

        handleLocationSelect(coords);
        setManualCoords({ latitude: '', longitude: '' });
    }, [manualCoords, handleLocationSelect]);

    // Retry GPS location
    const retryGPSLocation = useCallback(() => {
        setLocationState(prev => ({ ...prev, status: GPS_STATUS.CHECKING, error: null }));
        
        getCurrentLocation()
            .then((coords) => {
                setLocationState({
                    status: GPS_STATUS.ACTIVE,
                    coordinates: coords,
                    error: null,
                    accuracy: coords.accuracy
                });
                onLocationChange?.(coords);
            })
            .catch((error) => {
                const isPermissionDenied = error.message.includes('denied');
                setLocationState(prev => ({
                    ...prev,
                    status: isPermissionDenied ? GPS_STATUS.DENIED : GPS_STATUS.INACTIVE,
                    error: error.message
                }));
            });
    }, [getCurrentLocation]); // Remove onLocationChange from dependencies

    return (
        <div className={`space-y-4 ${className}`} style={style}>
            {/* GPS Status and Controls */}
            <Card style={{
                background: `color-mix(in srgb, var(--theme-content1) 80%, transparent)`,
                borderColor: `color-mix(in srgb, var(--theme-divider) 50%, transparent)`,
                borderWidth: `var(--borderWidth, 1px)`,
                borderRadius: `var(--borderRadius, 8px)`,
            }}>
                <CardBody className="p-3">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--theme-foreground)' }}>
                                Location Selection
                            </span>
                        </div>
                        
                        {locationState.status === GPS_STATUS.CHECKING && (
                            <Spinner size="sm" />
                        )}
                        
                        {(locationState.status === GPS_STATUS.DENIED || locationState.status === GPS_STATUS.INACTIVE) && (
                            <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                onPress={retryGPSLocation}
                                startContent={<GlobeAltIcon className="w-3 h-3" />}
                            >
                                Get GPS
                            </Button>
                        )}
                    </div>

                    {/* Current coordinates display */}
                    {locationState.coordinates && (
                        <div className="text-xs space-y-1" style={{ color: 'var(--theme-foreground-600)' }}>
                            <div>
                                <strong>Lat:</strong> {locationState.coordinates.latitude.toFixed(6)}, 
                                <strong> Lng:</strong> {locationState.coordinates.longitude.toFixed(6)}
                            </div>
                            {locationState.accuracy && (
                                <div><strong>Accuracy:</strong> ±{Math.round(locationState.accuracy)}m</div>
                            )}
                        </div>
                    )}

                    {/* Error display */}
                    {locationState.error && (
                        <div className="flex items-start gap-2 mt-2 p-2 rounded" style={{
                            background: `color-mix(in srgb, var(--theme-danger) 10%, transparent)`,
                            color: 'var(--theme-danger)',
                        }}>
                            <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span className="text-xs">{locationState.error}</span>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Map Container */}
            <Card style={{
                borderRadius: `var(--borderRadius, 8px)`,
                overflow: 'hidden'
            }}>
                <div style={{ height: '300px', width: '100%' }}>
                    {locationState.coordinates && (
                        <MapContainer
                            center={[locationState.coordinates.latitude, locationState.coordinates.longitude]}
                            zoom={16}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <Marker position={[locationState.coordinates.latitude, locationState.coordinates.longitude]} />
                            <MapClickHandler onLocationSelect={handleLocationSelect} />
                        </MapContainer>
                    )}
                </div>
            </Card>

            {/* Manual coordinate entry */}
            <Card style={{
                background: `color-mix(in srgb, var(--theme-content2) 60%, transparent)`,
                borderColor: `color-mix(in srgb, var(--theme-divider) 50%, transparent)`,
                borderWidth: `var(--borderWidth, 1px)`,
                borderRadius: `var(--borderRadius, 8px)`,
            }}>
                <CardBody className="p-3">
                    <div className="flex items-center gap-2 mb-3">
                        <GlobeAltIcon className="w-4 h-4" style={{ color: 'var(--theme-secondary)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--theme-foreground)' }}>
                            Manual Coordinates
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Input
                            size="sm"
                            label="Latitude"
                            placeholder="23.8103"
                            value={manualCoords.latitude}
                            onValueChange={(value) => setManualCoords(prev => ({ ...prev, latitude: value }))}
                            variant="bordered"
                            radius={getThemeRadius()}
                        />
                        <Input
                            size="sm"
                            label="Longitude"
                            placeholder="90.4125"
                            value={manualCoords.longitude}
                            onValueChange={(value) => setManualCoords(prev => ({ ...prev, longitude: value }))}
                            variant="bordered"
                            radius={getThemeRadius()}
                        />
                        <Button
                            size="sm"
                            color="secondary"
                            variant="flat"
                            onPress={handleManualCoordSubmit}
                            isDisabled={!manualCoords.latitude || !manualCoords.longitude}
                            className="h-10"
                        >
                            Set Location
                        </Button>
                    </div>
                    
                    <p className="text-xs mt-2" style={{ color: 'var(--theme-foreground-600)' }}>
                        Click on the map or enter coordinates manually to set the punch location.
                    </p>
                </CardBody>
            </Card>
        </div>
    );
};

export default LocationPickerMap;
