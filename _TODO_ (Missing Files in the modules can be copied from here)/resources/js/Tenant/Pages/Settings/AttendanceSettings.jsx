import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Head, usePage } from "@inertiajs/react";
import App from "@/Layouts/App";
import { motion } from "framer-motion";
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Input,
    Switch,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Tooltip,
    ScrollShadow,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Spinner,
    Select,
    SelectItem,
    Checkbox,
    CheckboxGroup,
    Textarea,
    Tabs,
    Tab,
    Accordion,
    AccordionItem,
} from "@heroui/react";
import {
    ClockIcon,
    CalendarDaysIcon,
    CogIcon,
    MapPinIcon,
    PencilIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    DocumentTextIcon,
    XMarkIcon,
    PlusIcon,
    TrashIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
    CheckCircleIcon as CheckCircleSolid,
    XCircleIcon as XCircleSolid,
} from "@heroicons/react/24/solid";

// Fix Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map click handler for waypoint selection
const WaypointMapClickHandler = ({ onLocationSelect, isAddingWaypoint }) => {
    useMapEvents({
        click(e) {
            if (isAddingWaypoint) {
                const { lat, lng } = e.latlng;
                onLocationSelect({
                    lat: lat.toFixed(6),
                    lng: lng.toFixed(6)
                });
            }
        },
    });
    return null;
};

// Map click handler for polygon point selection
const PolygonMapClickHandler = ({ onLocationSelect, isAddingPoint }) => {
    useMapEvents({
        click(e) {
            if (isAddingPoint) {
                const { lat, lng } = e.latlng;
                onLocationSelect({
                    lat: lat.toFixed(6),
                    lng: lng.toFixed(6)
                });
            }
        },
    });
    return null;
};

// Route renderer component using Leaflet Routing Machine
const WaypointRoute = ({ waypoints }) => {
    const map = useMap();
    
    useEffect(() => {
        if (!map || waypoints.length < 2) return;

        // Clear existing routing controls
        map.eachLayer((layer) => {
            if (layer.options && (layer.options.isRoute || layer.options.isRoutingControl)) {
                map.removeLayer(layer);
            }
        });

        // Remove existing routing controls
        map.getContainer().querySelectorAll('.leaflet-routing-container').forEach(el => el.remove());

        // Create route using actual roads with Leaflet Routing Machine
        const validWaypoints = waypoints.filter(w => w.lat && w.lng);
        if (validWaypoints.length >= 2) {
            // Convert waypoints to Leaflet LatLng objects
            const routeWaypoints = validWaypoints.map(w => 
                L.latLng(parseFloat(w.lat), parseFloat(w.lng))
            );

            const routingControl = L.Routing.control({
                waypoints: routeWaypoints,
                routeWhileDragging: false,
                addWaypoints: false,
                createMarker: () => null, // Hide default markers (we have custom ones)
                lineOptions: {
                    styles: [{
                        color: 'var(--theme-primary, #3b82f6)',
                        weight: 4,
                        opacity: 0.8,
                        dashArray: '8, 4'
                    }]
                },
                show: false, // Hide turn-by-turn instructions
                fitSelectedRoutes: false, // Don't auto-fit (we handle this manually)
                router: L.Routing.osrmv1({
                    serviceUrl: 'https://router.project-osrm.org/route/v1'
                })
            }).addTo(map);

            // Handle route found event to add custom information
            routingControl.on('routesfound', function(e) {
                const routes = e.routes;
                const summary = routes[0].summary;
                
                // Create route information popup
                const totalDistance = summary.totalDistance;
                const totalTime = summary.totalTime;
                
                // Find center point of the route
                const coordinates = routes[0].coordinates;
                const centerIndex = Math.floor(coordinates.length / 2);
                const centerPoint = coordinates[centerIndex];

                const routeInfo = L.popup({
                    autoClose: false,
                    closeOnClick: false,
                    className: 'route-info-popup'
                })
                    .setLatLng([centerPoint.lat, centerPoint.lng])
                    .setContent(`
                        <div style="
                            font-family: var(--fontFamily, 'Inter'); 
                            text-align: center;
                            padding: 8px;
                            min-width: 150px;
                        ">
                            <div style="
                                background: var(--theme-primary, #3b82f6);
                                color: white;
                                padding: 4px 8px;
                                border-radius: 6px;
                                margin-bottom: 6px;
                                font-weight: bold;
                                font-size: 12px;
                            ">Route Information</div>
                            <div style="font-size: 11px; line-height: 1.4;">
                                <div><strong>Waypoints:</strong> ${validWaypoints.length}</div>
                                <div><strong>Distance:</strong> ${(totalDistance / 1000).toFixed(2)} km</div>
                                <div><strong>Est. Time:</strong> ${Math.round(totalTime / 60)} min</div>
                            </div>
                        </div>
                    `)
                    .openOn(map);

                // Fit map to show entire route with padding
                setTimeout(() => {
                    // Calculate bounds from waypoints since getBounds() doesn't exist
                    const bounds = L.latLngBounds(routeWaypoints);
                    map.fitBounds(bounds, { 
                        padding: [40, 40],
                        maxZoom: 15
                    });
                }, 100);
            });

            // Store reference for cleanup
            map._waypointRoutingControl = routingControl;
        }

        return () => {
            // Cleanup on unmount
            if (map._waypointRoutingControl) {
                map.removeControl(map._waypointRoutingControl);
                delete map._waypointRoutingControl;
            }
            
            // Remove any remaining routing elements
            map.getContainer().querySelectorAll('.leaflet-routing-container').forEach(el => el.remove());
        };
    }, [map, waypoints]);

    return null;
};

// Polygon renderer component
const PolygonRenderer = ({ polygonPoints }) => {
    const map = useMap();
    
    useEffect(() => {
        if (!map || polygonPoints.length < 3) return;

        // Clear existing polygon layers
        map.eachLayer((layer) => {
            if (layer.options && layer.options.isPolygon) {
                map.removeLayer(layer);
            }
        });

        // Create polygon if we have at least 3 points
        const validPoints = polygonPoints.filter(p => p.lat && p.lng);
        if (validPoints.length >= 3) {
            const polygonCoordinates = validPoints.map(p => [parseFloat(p.lat), parseFloat(p.lng)]);
            
            const polygon = L.polygon(polygonCoordinates, {
                color: 'var(--theme-primary, #3b82f6)',
                fillColor: 'var(--theme-primary, #3b82f6)',
                fillOpacity: 0.2,
                weight: 3,
                opacity: 0.8,
                isPolygon: true
            }).addTo(map);

            // Add area information popup
            const area = polygon.getLatLngs()[0].reduce((total, point, index, array) => {
                const nextIndex = (index + 1) % array.length;
                const nextPoint = array[nextIndex];
                return total + (point.lat * nextPoint.lng - nextPoint.lat * point.lng);
            }, 0);
            const areaInSqKm = Math.abs(area / 2 * 111.32 * 111.32 / 1000000).toFixed(3);
            
            const polygonInfo = L.popup()
                .setLatLng(polygon.getBounds().getCenter())
                .setContent(`
                    <div style="font-family: var(--fontFamily, 'Inter'); text-align: center;">
                        <strong>Geofence Area</strong><br>
                        <small>Points: ${validPoints.length}</small><br>
                        <small>Area: ~${areaInSqKm} km²</small>
                    </div>
                `)
                .openOn(map);

            // Fit map to show entire polygon
            if (validPoints.length > 0) {
                map.fitBounds(polygon.getBounds(), { padding: [30, 30] });
            }
        }

        return () => {
            // Cleanup on unmount
            map.eachLayer((layer) => {
                if (layer.options && layer.options.isPolygon) {
                    map.removeLayer(layer);
                }
            });
        };
    }, [map, polygonPoints]);

    return null;
};

const AttendanceSettings = () => {
    const { title, attendanceSettings: initialSettings, attendanceTypes: initialTypes } = usePage().props;
    
    // Helper function to extract base slug (removes _2, _3, etc. suffixes)
    const getBaseSlug = (slug) => {
        if (!slug) return '';
        return slug.replace(/_\d+$/, '');
    };
    
    // Custom media queries (following LeavesAdmin pattern)
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Helper function to convert theme borderRadius to HeroUI radius values (following LeavesAdmin pattern)
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

    // State management
    const [settings, setSettings] = useState(initialSettings || {});
    const [types, setTypes] = useState(initialTypes || []);
    const [loading, setLoading] = useState(false);
    const [typeLoading, setTypeLoading] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [searchValue, setSearchValue] = useState('');
    const [selectedTab, setSelectedTab] = useState('general');

    // Modal management
    const {
        isOpen: isTypeModalOpen,
        onOpen: onTypeModalOpen,
        onClose: onTypeModalClose
    } = useDisclosure();

    const {
        isOpen: isWaypointModalOpen,
        onOpen: onWaypointModalOpen,
        onClose: onWaypointModalClose
    } = useDisclosure();

    const {
        isOpen: isPolygonModalOpen,
        onOpen: onPolygonModalOpen,
        onClose: onPolygonModalClose
    } = useDisclosure();

    // Form state for type editing
    const [typeFormData, setTypeFormData] = useState({
        name: '',
        description: '',
        is_active: false
    });

    // Waypoint state - Single route with multiple waypoints
    const [waypointForm, setWaypointForm] = useState({
        tolerance: 150,
        waypoints: [],
    });

    // Enhanced waypoint map state
    const [isAddingWaypoint, setIsAddingWaypoint] = useState(false);
    const [mapCenter, setMapCenter] = useState([23.8103, 90.4125]); // Default to Dhaka
    const [mapZoom, setMapZoom] = useState(13);

    // Geo polygon state - Single polygon with multiple points
    const [polygonForm, setPolygonForm] = useState({
        polygon: [],
    });
    const [isAddingPolygonPoint, setIsAddingPolygonPoint] = useState(false);
    const [polygonMapCenter, setPolygonMapCenter] = useState([23.8103, 90.4125]);
    const [polygonMapZoom, setPolygonMapZoom] = useState(13);

    // Filter types based on search
    const filteredTypes = useMemo(() => {
        if (!searchValue) return types;
        
        return types.filter(type =>
            type.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            type.description?.toLowerCase().includes(searchValue.toLowerCase()) ||
            type.slug.toLowerCase().includes(searchValue.toLowerCase())
        );
    }, [types, searchValue]);

    // Group attendance types by slug category for accordion display
    const groupedTypes = useMemo(() => {
        const categoryConfig = {
            'geo_polygon': {
                title: 'Geo Polygon Attendance',
                description: 'Location-based attendance using polygon boundaries',
                icon: '📍',
                color: 'warning',
            },
            'wifi_ip': {
                title: 'WiFi/IP Attendance',
                description: 'Network-based attendance using IP addresses',
                icon: '📶',
                color: 'secondary',
            },
            'route_waypoint': {
                title: 'Route Waypoint Attendance',
                description: 'Route-based attendance with waypoint tracking',
                icon: '🗺️',
                color: 'primary',
            },
            'qr_code': {
                title: 'QR Code Attendance',
                description: 'QR code scanning for attendance',
                icon: '📱',
                color: 'success',
            },
        };

        // Initialize all categories (always show all four accordions)
        const grouped = {};
        Object.entries(categoryConfig).forEach(([slug, config]) => {
            grouped[slug] = {
                ...config,
                types: []
            };
        });
        
        // Add types to their respective categories
        filteredTypes.forEach(type => {
            const baseSlug = getBaseSlug(type.slug);
            if (grouped[baseSlug]) {
                grouped[baseSlug].types.push(type);
            }
        });

        return grouped;
    }, [filteredTypes, getBaseSlug]);

    // Handle settings update
    const handleSettingsUpdate = useCallback(async (formData) => {
        setLoading(true);
        try {
            const response = await axios.post('/settings/attendance/update', formData);
            
            if (response.data.attendanceSettings) {
                setSettings(response.data.attendanceSettings);
                showToast.success(response.data.message || 'Settings updated successfully');
            }
        } catch (error) {
            console.error('Settings update error:', error);
            showToast.error(error.response?.data?.message || 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle settings form submission
    const handleSettingsSubmit = useCallback((e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Handle weekend days as array
        const weekendDays = [];
        if (data.weekend_saturday) weekendDays.push('saturday');
        if (data.weekend_sunday) weekendDays.push('sunday');
        if (data.weekend_friday) weekendDays.push('friday');
        
        const finalData = {
            ...data,
            weekend_days: weekendDays,
            break_time_duration: parseInt(data.break_time_duration) || 0,
            late_mark_after: parseInt(data.late_mark_after) || 0,
            early_leave_before: parseInt(data.early_leave_before) || 0,
            overtime_after: parseInt(data.overtime_after) || 0,
        };
        
        // Remove individual weekend checkboxes from final data
        delete finalData.weekend_saturday;
        delete finalData.weekend_sunday;
        delete finalData.weekend_friday;
        
        handleSettingsUpdate(finalData);
    }, [handleSettingsUpdate]);

    // Handle attendance type editing
    const openTypeModal = useCallback((type = null) => {
        setEditingType(type ? {
            ...type,
            config: type.config || {}
        } : null);
        
        // Set form data
        if (type) {
            setTypeFormData({
                name: type.name || '',
                description: type.description || '',
                is_active: type.is_active || false
            });
        } else {
            setTypeFormData({
                name: '',
                description: '',
                is_active: false
            });
        }
        
        onTypeModalOpen();
    }, [onTypeModalOpen]);

    const handleTypeUpdate = useCallback(async (typeData) => {
        setTypeLoading(true);
        try {
            let response;
            
            if (editingType?.id) {
                // Update existing type
                response = await axios.put(`/settings/attendance-type/${editingType.id}`, typeData);
                
                if (response.data.attendanceType) {
                    const updatedType = response.data.attendanceType;
                    setTypes(prev => prev.map(type => 
                        type.id === updatedType.id ? updatedType : type
                    ));
                    showToast.success(response.data.message || 'Attendance type updated successfully');
                }
            } else {
                // Create new type
                response = await axios.post('/settings/attendance-type', {
                    ...typeData,
                    slug: editingType?.slug,
                    icon: editingType?.icon,
                });
                
                if (response.data.attendanceType) {
                    setTypes(prev => [...prev, response.data.attendanceType]);
                    showToast.success(response.data.message || 'Attendance type created successfully');
                }
            }
            
            onTypeModalClose();
        } catch (error) {
            console.error('Type update error:', error);
            showToast.error(error.response?.data?.message || 'Failed to save attendance type');
        } finally {
            setTypeLoading(false);
        }
    }, [editingType, onTypeModalClose]);

    const handleDeleteType = useCallback(async (type) => {
        if (!confirm(`Are you sure you want to delete "${type.name}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            await axios.delete(`/settings/attendance-type/${type.id}`);
            setTypes(prev => prev.filter(t => t.id !== type.id));
            showToast.success('Attendance type deleted successfully');
        } catch (error) {
            console.error('Type delete error:', error);
            showToast.error(error.response?.data?.message || 'Failed to delete attendance type');
        }
    }, []);

    const handleTypeSubmit = useCallback((e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Handle config based on type - now supporting multi-config structure
        let config = editingType?.config || {};
        
        const baseSlug = getBaseSlug(editingType?.slug);
        
        if (baseSlug === 'geo_polygon') {
            // Keep existing polygons data (multi-polygon support)
            config = { 
                ...config,
                validation_mode: data.validation_mode || config.validation_mode || 'any',
                allow_without_location: data.allow_without_location === 'true' || config.allow_without_location || false,
            };
        } else if (baseSlug === 'wifi_ip') {
            // Parse allowed_ips and allowed_ranges from comma-separated string
            const allowedIps = data.allowed_ips 
                ? data.allowed_ips.split(',').map(ip => ip.trim()).filter(ip => ip)
                : config.allowed_ips || [];
            const allowedRanges = data.allowed_ranges
                ? data.allowed_ranges.split(',').map(range => range.trim()).filter(range => range)
                : config.allowed_ranges || [];
            
            config = {
                ...config,
                allowed_ips: allowedIps,
                allowed_ranges: allowedRanges,
                validation_mode: data.validation_mode || config.validation_mode || 'any',
                allow_without_network: data.allow_without_network === 'true' || config.allow_without_network || false,
            };
        } else if (baseSlug === 'route_waypoint') {
            // Keep existing routes data (multi-route support)
            config = {
                ...config,
                tolerance: parseInt(data.tolerance) || config.tolerance || 150,
                validation_mode: data.validation_mode || config.validation_mode || 'any',
                allow_without_location: data.allow_without_location === 'true' || config.allow_without_location || false,
            };
        } else if (baseSlug === 'qr_code') {
            // Keep existing qr_codes data (multi-QR support)
            config = {
                ...config,
                code_expiry_hours: parseInt(data.code_expiry_hours) || config.code_expiry_hours || 24,
                one_time_use: data.one_time_use === 'true' || config.one_time_use || false,
                require_location: data.require_location === 'true' || config.require_location || false,
                max_distance: parseInt(data.max_distance) || config.max_distance || 100,
            };
        }
        
        const finalData = {
            name: typeFormData.name,
            description: typeFormData.description,
            is_active: typeFormData.is_active,
            config: config
        };
        
        handleTypeUpdate(finalData);
    }, [editingType, typeFormData, handleTypeUpdate]);

    // Waypoint management - Single route with multiple waypoints
    const openWaypointModal = useCallback((type) => {
        setEditingType(type);
        const waypoints = type.config?.waypoints || [];
        
        setWaypointForm({
            tolerance: type.config?.tolerance || 150,
            waypoints: waypoints,
        });
        
        // Center map on first waypoint if available
        if (waypoints.length > 0 && waypoints[0]?.lat && waypoints[0]?.lng) {
            setMapCenter([parseFloat(waypoints[0].lat), parseFloat(waypoints[0].lng)]);
            setMapZoom(15);
        } else {
            setMapCenter([23.8103, 90.4125]); // Default to Dhaka
            setMapZoom(13);
        }
        
        setIsAddingWaypoint(false);
        onWaypointModalOpen();
    }, [onWaypointModalOpen]);

    const addWaypoint = () => {
        setIsAddingWaypoint(true);
        showToast.info('Click on the map to add a waypoint');
    };

    const addWaypointFromMap = useCallback((coords) => {
        setWaypointForm(prev => ({
            ...prev,
            waypoints: [...prev.waypoints, coords]
        }));
        setIsAddingWaypoint(false);
        showToast.success('Waypoint added successfully');
    }, []);

    const removeWaypoint = (index) => {
        setWaypointForm(prev => ({
            ...prev,
            waypoints: prev.waypoints.filter((_, i) => i !== index)
        }));
    };

    const updateWaypoint = (index, field, value) => {
        setWaypointForm(prev => ({
            ...prev,
            waypoints: prev.waypoints.map((waypoint, i) => 
                i === index ? { ...waypoint, [field]: value } : waypoint
            )
        }));
    };

    const centerMapOnWaypoint = (waypoint) => {
        if (waypoint.lat && waypoint.lng) {
            setMapCenter([parseFloat(waypoint.lat), parseFloat(waypoint.lng)]);
            setMapZoom(16);
        }
    };

    // Polygon management - Single polygon with multiple points
    const openPolygonModal = useCallback((type) => {
        setEditingType(type);
        const polygon = type.config?.polygon || [];
        
        setPolygonForm({
            polygon: polygon,
        });
        
        // Center map on polygon center if available
        if (polygon.length > 0) {
            const latSum = polygon.reduce((sum, p) => sum + parseFloat(p.lat || 0), 0);
            const lngSum = polygon.reduce((sum, p) => sum + parseFloat(p.lng || 0), 0);
            setPolygonMapCenter([latSum / polygon.length, lngSum / polygon.length]);
            setPolygonMapZoom(15);
        } else {
            setPolygonMapCenter([23.8103, 90.4125]); // Default to Dhaka
            setPolygonMapZoom(13);
        }
        
        setIsAddingPolygonPoint(false);
        onPolygonModalOpen();
    }, [onPolygonModalOpen]);

    const addPolygonPoint = () => {
        setIsAddingPolygonPoint(true);
        showToast.info('Click on the map to add a polygon point');
    };

    const addPolygonPointFromMap = useCallback((coords) => {
        setPolygonForm(prev => ({
            ...prev,
            polygon: [...prev.polygon, coords]
        }));
        setIsAddingPolygonPoint(false);
        showToast.success('Polygon point added successfully');
    }, []);

    const removePolygonPoint = (index) => {
        setPolygonForm(prev => ({
            ...prev,
            polygon: prev.polygon.filter((_, i) => i !== index)
        }));
    };

    const updatePolygonPoint = (index, field, value) => {
        setPolygonForm(prev => ({
            ...prev,
            polygon: prev.polygon.map((point, i) => 
                i === index ? { ...point, [field]: value } : point
            )
        }));
    };

    const centerMapOnPolygonPoint = (point) => {
        if (point.lat && point.lng) {
            setPolygonMapCenter([parseFloat(point.lat), parseFloat(point.lng)]);
            setPolygonMapZoom(16);
        }
    };

    const handlePolygonSubmit = useCallback(async () => {
        // Validate polygon has at least 3 points
        const validPoints = polygonForm.polygon.filter(pt => pt.lat && pt.lng);
        
        if (validPoints.length < 3) {
            showToast.error('Polygon requires minimum 3 points');
            return;
        }

        try {
            const updatedConfig = {
                ...editingType.config,
                polygon: validPoints,
            };
            
            const response = await axios.put(`/settings/attendance-type/${editingType.id}`, { 
                config: updatedConfig 
            });
            
            setTypes(prev => prev.map(type => 
                type.id === editingType.id ? response.data.attendanceType : type
            ));
            
            showToast.success('Polygon updated successfully');
            onPolygonModalClose();
        } catch (error) {
            showToast.error('Failed to update polygon');
        }
    }, [editingType, polygonForm, onPolygonModalClose]);

    const handleWaypointSubmit = useCallback(async () => {
        // Validate waypoints
        const validWaypoints = waypointForm.waypoints.filter(w => w.lat && w.lng);
        
        if (validWaypoints.length < 2) {
            showToast.error('At least 2 waypoints are required for a route');
            return;
        }

        try {
            const updatedConfig = {
                ...editingType.config,
                waypoints: validWaypoints,
                tolerance: waypointForm.tolerance || 150,
            };
            
            const response = await axios.put(`/settings/attendance-type/${editingType.id}`, { 
                config: updatedConfig 
            });
            
            setTypes(prev => prev.map(type => 
                type.id === editingType.id ? response.data.attendanceType : type
            ));
            
            showToast.success('Route waypoints updated successfully');
            onWaypointModalClose();
        } catch (error) {
            showToast.error('Failed to update waypoints');
        }
    }, [editingType, waypointForm, onWaypointModalClose]);

    // Get status color and icon
    const getStatusDisplay = (isActive) => ({
        color: isActive ? 'success' : 'default',
        icon: isActive ? CheckCircleSolid : XCircleSolid,
        text: isActive ? 'Active' : 'Inactive'
    });

    return (
        <App title={title}>
            <Head title={title} />
            
            <div 
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Attendance Settings"
            >
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card 
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, 
                                        var(--theme-content1, #FAFAFA) 20%, 
                                        var(--theme-content2, #F4F4F5) 10%, 
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                <CardHeader 
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col space-y-4">
                                            {/* Main Header Content */}
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                {/* Title Section */}
                                                <div className="flex items-center gap-3 lg:gap-4">
                                                    <div 
                                                        className={`
                                                            ${!isMobile ? 'p-3' : 'p-2'} 
                                                            rounded-xl flex items-center justify-center
                                                        `}
                                                        style={{
                                                            background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                            borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                            borderWidth: `var(--borderWidth, 2px)`,
                                                            borderRadius: `var(--borderRadius, 12px)`,
                                                        }}
                                                    >
                                                        <CogIcon 
                                                            className={`
                                                                ${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}
                                                            `}
                                                            style={{ color: 'var(--theme-primary)' }}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 
                                                            className={`
                                                                ${!isMobile ? 'text-2xl' : 'text-xl'}
                                                                font-bold text-foreground
                                                                ${isMobile ? 'truncate' : ''}
                                                            `}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Attendance Settings
                                                        </h4>
                                                        <p 
                                                            className={`
                                                                ${!isMobile ? 'text-sm' : 'text-xs'} 
                                                                text-default-500
                                                                ${isMobile ? 'truncate' : ''}
                                                            `}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Configure attendance policies, working hours, and tracking methods
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {/* Search for attendance types */}
                                                <div className="flex gap-2 flex-wrap">
                                                    <Input
                                                        placeholder="Search attendance types..."
                                                        value={searchValue}
                                                        onChange={(e) => setSearchValue(e.target.value)}
                                                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                                        variant="bordered"
                                                        size="sm"
                                                        radius={getThemeRadius()}
                                                        className="w-64"
                                                        aria-label="Search attendance types"
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <Tabs 
                                        selectedKey={selectedTab}
                                        onSelectionChange={setSelectedTab}
                                        variant="underlined"
                                        className="w-full"
                                        radius={getThemeRadius()}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    >
                                        {/* General Settings Tab */}
                                        <Tab key="general" title="General Settings">
                                            <form onSubmit={handleSettingsSubmit} className="space-y-8 mt-6">
                                                {/* Office Timing */}
                                                <div className="space-y-4">
                                                    <h5 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                                        <ClockIcon className="w-5 h-5 text-primary" />
                                                        Office Timing
                                                    </h5>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <Input
                                                            type="time"
                                                            label="Office Start Time"
                                                            name="office_start_time"
                                                            defaultValue={settings?.office_start_time || "09:00"}
                                                            variant="bordered"
                                                            radius={getThemeRadius()}
                                                            className="max-w-full"
                                                            labelPlacement="outside"
                                                            isRequired
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        />
                                                        
                                                        <Input
                                                            type="time"
                                                            label="Office End Time"
                                                            name="office_end_time"
                                                            defaultValue={settings?.office_end_time || "18:00"}
                                                            variant="bordered"
                                                            radius={getThemeRadius()}
                                                            className="max-w-full"
                                                            labelPlacement="outside"
                                                            isRequired
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        />
                                                    </div>
                                                    
                                                    <Input
                                                        type="number"
                                                        label="Break Time Duration (minutes)"
                                                        name="break_time_duration"
                                                        defaultValue={settings?.break_time_duration || "60"}
                                                        variant="bordered"
                                                        radius={getThemeRadius()}
                                                        className="max-w-md"
                                                        labelPlacement="outside"
                                                        min="0"
                                                        max="480"
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    />
                                                </div>

                                                {/* Attendance Policies */}
                                                <div className="space-y-4">
                                                    <h5 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                                        <CogIcon className="w-5 h-5 text-primary" />
                                                        Attendance Policies
                                                    </h5>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <Input
                                                            type="number"
                                                            label="Late Mark After (minutes)"
                                                            name="late_mark_after"
                                                            defaultValue={settings?.late_mark_after || "15"}
                                                            variant="bordered"
                                                            radius={getThemeRadius()}
                                                            className="max-w-full"
                                                            labelPlacement="outside"
                                                            min="0"
                                                            max="120"
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        />
                                                        
                                                        <Input
                                                            type="number"
                                                            label="Early Leave Before (minutes)"
                                                            name="early_leave_before"
                                                            defaultValue={settings?.early_leave_before || "30"}
                                                            variant="bordered"
                                                            radius={getThemeRadius()}
                                                            className="max-w-full"
                                                            labelPlacement="outside"
                                                            min="0"
                                                            max="120"
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        />
                                                    </div>
                                                    
                                                    <Input
                                                        type="number"
                                                        label="Overtime After (minutes)"
                                                        name="overtime_after"
                                                        defaultValue={settings?.overtime_after || "30"}
                                                        variant="bordered"
                                                        radius={getThemeRadius()}
                                                        className="max-w-md"
                                                        labelPlacement="outside"
                                                        min="0"
                                                        max="240"
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    />
                                                </div>

                                                {/* Weekend Configuration */}
                                                <div className="space-y-4">
                                                    <h5 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                                        <CalendarDaysIcon className="w-5 h-5 text-primary" />
                                                        Weekend Configuration
                                                    </h5>
                                                    
                                                    <div className="flex flex-wrap gap-4">
                                                        <Checkbox
                                                            name="weekend_friday"
                                                            defaultSelected={settings?.weekend_days?.includes('friday')}
                                                            radius={getThemeRadius()}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Friday
                                                        </Checkbox>
                                                        <Checkbox
                                                            name="weekend_saturday"
                                                            defaultSelected={settings?.weekend_days?.includes('saturday')}
                                                            radius={getThemeRadius()}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Saturday
                                                        </Checkbox>
                                                        <Checkbox
                                                            name="weekend_sunday"
                                                            defaultSelected={settings?.weekend_days?.includes('sunday')}
                                                            radius={getThemeRadius()}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Sunday
                                                        </Checkbox>
                                                    </div>
                                                </div>

                                                {/* Save Button */}
                                                <div className="flex justify-end pt-4">
                                                    <Button
                                                        type="submit"
                                                        color="primary"
                                                        variant="shadow"
                                                        isLoading={loading}
                                                        size={isMobile ? "sm" : "md"}
                                                        className="font-semibold"
                                                        radius={getThemeRadius()}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                        aria-label="Save attendance settings"
                                                    >
                                                        Save Settings
                                                    </Button>
                                                </div>
                                            </form>
                                        </Tab>

                                        {/* Attendance Types Tab */}
                                        <Tab key="types" title="Attendance Types">
                                            <div className="mt-6">
                                                <ScrollShadow className="max-h-[600px]">
                                                    {Object.keys(groupedTypes).length === 0 ? (
                                                        <Card>
                                                            <CardBody className="text-center py-12">
                                                                <ClockIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
                                                                <p className="text-default-500 text-lg">No attendance types found</p>
                                                                <p className="text-sm text-default-400 mt-2">
                                                                    {searchValue ? 'Try adjusting your search criteria' : 'Configure attendance types to get started'}
                                                                </p>
                                                            </CardBody>
                                                        </Card>
                                                    ) : (
                                                        <Accordion 
                                                            variant="splitted"
                                                            selectionMode="multiple"
                                                            defaultExpandedKeys={Object.keys(groupedTypes)}
                                                            className="px-0"
                                                        >
                                                            {Object.entries(groupedTypes).map(([slug, category]) => (
                                                                <AccordionItem
                                                                    key={slug}
                                                                    aria-label={category.title}
                                                                    startContent={
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-2xl">{category.icon}</span>
                                                                            <div>
                                                                                <p className="font-semibold text-foreground">{category.title}</p>
                                                                                <p className="text-xs text-default-500">{category.description}</p>
                                                                            </div>
                                                                        </div>
                                                                    }
                                                                    subtitle={
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <Chip size="sm" variant="flat" color={category.color}>
                                                                                {category.types.length} configuration{category.types.length !== 1 ? 's' : ''}
                                                                            </Chip>
                                                                            <Chip size="sm" variant="flat" color="success">
                                                                                {category.types.filter(t => t.is_active).length} active
                                                                            </Chip>
                                                                        </div>
                                                                    }
                                                                    classNames={{
                                                                        base: "py-0 w-full",
                                                                        title: "font-medium text-medium",
                                                                        trigger: "px-4 py-3 data-[hover=true]:bg-default-100 rounded-lg",
                                                                        indicator: "text-medium",
                                                                        content: "px-2 pb-4",
                                                                    }}
                                                                >
                                                                    <div className="space-y-4">
                                                                        {/* Add New Button */}
                                                                        <div className="flex justify-end">
                                                                            <Button
                                                                                color="primary"
                                                                                size="sm"
                                                                                variant="flat"
                                                                                startContent={<PlusIcon className="w-4 h-4" />}
                                                                                radius={getThemeRadius()}
                                                                                onPress={() => {
                                                                                    // Open modal to create new attendance type of this category
                                                                                    const newType = {
                                                                                        id: null,
                                                                                        name: '',
                                                                                        description: '',
                                                                                        slug: slug,
                                                                                        icon: category.icon,
                                                                                        is_active: true,
                                                                                        config: {}
                                                                                    };
                                                                                    openTypeModal(newType);
                                                                                }}
                                                                                style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                                            >
                                                                                Add New {category.title.replace(' Attendance', '')}
                                                                            </Button>
                                                                        </div>

                                                                        {/* Table of attendance types */}
                                                                        {category.types.length > 0 ? (
                                                                            <Table
                                                                                aria-label={`${category.title} configurations`}
                                                                                removeWrapper
                                                                                classNames={{
                                                                                    th: "bg-default-100 text-default-600 text-xs uppercase",
                                                                                    td: "py-3",
                                                                                }}
                                                                            >
                                                                                <TableHeader>
                                                                                    <TableColumn>NAME</TableColumn>
                                                                                    <TableColumn>DESCRIPTION</TableColumn>
                                                                                    <TableColumn>STATUS</TableColumn>
                                                                                    <TableColumn align="center">ACTIONS</TableColumn>
                                                                                </TableHeader>
                                                                                <TableBody>
                                                                                    {category.types.map((type) => {
                                                                                        const status = getStatusDisplay(type.is_active);
                                                                                        const StatusIcon = status.icon;
                                                                                        const typeBaseSlug = getBaseSlug(type.slug);
                                                                                        
                                                                                        return (
                                                                                            <TableRow key={type.id}>
                                                                                                <TableCell>
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <span className="text-lg">{type.icon}</span>
                                                                                                        <span className="font-medium">{type.name}</span>
                                                                                                    </div>
                                                                                                </TableCell>
                                                                                                <TableCell>
                                                                                                    <span className="text-default-500 text-sm">
                                                                                                        {type.description || 'No description'}
                                                                                                    </span>
                                                                                                </TableCell>
                                                                                                <TableCell>
                                                                                                    <Chip
                                                                                                        startContent={<StatusIcon className="w-3 h-3" />}
                                                                                                        variant="flat"
                                                                                                        color={status.color}
                                                                                                        size="sm"
                                                                                                        radius={getThemeRadius()}
                                                                                                    >
                                                                                                        {status.text}
                                                                                                    </Chip>
                                                                                                </TableCell>
                                                                                                <TableCell>
                                                                                                    <div className="flex items-center justify-center gap-1">
                                                                                                        <Tooltip content="Edit">
                                                                                                            <Button
                                                                                                                isIconOnly
                                                                                                                size="sm"
                                                                                                                variant="light"
                                                                                                                color="primary"
                                                                                                                radius={getThemeRadius()}
                                                                                                                onPress={() => openTypeModal(type)}
                                                                                                            >
                                                                                                                <PencilIcon className="w-4 h-4" />
                                                                                                            </Button>
                                                                                                        </Tooltip>
                                                                                                        {typeBaseSlug === 'route_waypoint' && (
                                                                                                            <Tooltip content="Configure Routes">
                                                                                                                <Button
                                                                                                                    isIconOnly
                                                                                                                    size="sm"
                                                                                                                    variant="light"
                                                                                                                    color="secondary"
                                                                                                                    radius={getThemeRadius()}
                                                                                                                    onPress={() => openWaypointModal(type)}
                                                                                                                >
                                                                                                                    <MapPinIcon className="w-4 h-4" />
                                                                                                                </Button>
                                                                                                            </Tooltip>
                                                                                                        )}
                                                                                                        {typeBaseSlug === 'geo_polygon' && (
                                                                                                            <Tooltip content="Configure Polygon">
                                                                                                                <Button
                                                                                                                    isIconOnly
                                                                                                                    size="sm"
                                                                                                                    variant="light"
                                                                                                                    color="warning"
                                                                                                                    radius={getThemeRadius()}
                                                                                                                    onPress={() => openPolygonModal(type)}
                                                                                                                >
                                                                                                                    <MapPinIcon className="w-4 h-4" />
                                                                                                                </Button>
                                                                                                            </Tooltip>
                                                                                                        )}
                                                                                                        <Tooltip content="Delete" color="danger">
                                                                                                            <Button
                                                                                                                isIconOnly
                                                                                                                size="sm"
                                                                                                                variant="light"
                                                                                                                color="danger"
                                                                                                                radius={getThemeRadius()}
                                                                                                                onPress={() => handleDeleteType(type)}
                                                                                                            >
                                                                                                                <TrashIcon className="w-4 h-4" />
                                                                                                            </Button>
                                                                                                        </Tooltip>
                                                                                                    </div>
                                                                                                </TableCell>
                                                                                            </TableRow>
                                                                                        );
                                                                                    })}
                                                                                </TableBody>
                                                                            </Table>
                                                                        ) : (
                                                                            <Card className="border border-dashed border-divider">
                                                                                <CardBody className="text-center py-8">
                                                                                    <span className="text-4xl mb-3 block">{category.icon}</span>
                                                                                    <p className="text-default-500">No {category.title.toLowerCase()} configured yet</p>
                                                                                    <p className="text-xs text-default-400 mt-1">Click the button above to add one</p>
                                                                                </CardBody>
                                                                            </Card>
                                                                        )}
                                                                    </div>
                                                                </AccordionItem>
                                                            ))}
                                                        </Accordion>
                                                    )}
                                                </ScrollShadow>
                                            </div>
                                        </Tab>
                                    </Tabs>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Edit Attendance Type Modal */}
            <Modal 
                isOpen={isTypeModalOpen} 
                onClose={onTypeModalClose}
                size="2xl"
                scrollBehavior="inside"
                radius={getThemeRadius()}
                classNames={{
                    base: "bg-content1",
                    backdrop: "bg-black/50",
                    header: "border-b border-divider",
                    footer: "border-t border-divider",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">{editingType?.icon}</div>
                                    <div>
                                        <h2 className="text-xl font-bold">
                                            {editingType?.id ? `Edit ${editingType?.name}` : `Create New ${groupedTypes[editingType?.slug?.replace(/_\d+$/, '')]?.title || 'Attendance Type'}`}
                                        </h2>
                                        <p className="text-sm text-default-500">
                                            {editingType?.id ? 'Configure attendance type settings' : 'Add a new attendance type configuration'}
                                        </p>
                                    </div>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <form id="editTypeForm" onSubmit={handleTypeSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-4">
                                        <Input
                                            key={`name-${editingType?.id}`}
                                            label="Name"
                                            name="name"
                                            value={typeFormData.name}
                                            onChange={(e) => setTypeFormData(prev => ({ ...prev, name: e.target.value }))}
                                            variant="bordered"
                                            radius={getThemeRadius()}
                                            isRequired
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        />
                                        
                                        <Textarea
                                            key={`description-${editingType?.id}`}
                                            label="Description"
                                            name="description"
                                            value={typeFormData.description}
                                            onChange={(e) => setTypeFormData(prev => ({ ...prev, description: e.target.value }))}
                                            variant="bordered"
                                            radius={getThemeRadius()}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        />

                                        <Switch
                                            key={`switch-${editingType?.id}-${editingType?.is_active}`}
                                            name="is_active"
                                            isSelected={typeFormData.is_active}
                                            onValueChange={(value) => setTypeFormData(prev => ({ ...prev, is_active: value }))}
                                            radius={getThemeRadius()}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            Active
                                        </Switch>
                                    </div>

                                    {/* Type-specific configurations */}
                                    {getBaseSlug(editingType?.slug) === 'wifi_ip' && (
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-semibold">Network Configuration</h5>
                                            <Input
                                                key={`allowed_ips-${editingType?.id}`}
                                                label="Allowed IPs (comma-separated)"
                                                name="allowed_ips"
                                                defaultValue={editingType?.config?.allowed_ips?.join(', ') || ""}
                                                variant="bordered"
                                                radius={getThemeRadius()}
                                                placeholder="192.168.1.1, 10.0.0.1"
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />
                                            <Input
                                                key={`allowed_ranges-${editingType?.id}`}
                                                label="Allowed IP Ranges (comma-separated)"
                                                name="allowed_ranges"
                                                defaultValue={editingType?.config?.allowed_ranges?.join(', ') || ""}
                                                variant="bordered"
                                                radius={getThemeRadius()}
                                                placeholder="192.168.1.0/24, 10.0.0.0/16"
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />
                                        </div>
                                    )}

                                    {getBaseSlug(editingType?.slug) === 'route_waypoint' && (
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-semibold">Route Configuration</h5>
                                            <Input
                                                key={`tolerance-${editingType?.id}`}
                                                label="Tolerance (meters)"
                                                name="tolerance"
                                                type="number"
                                                defaultValue={editingType?.config?.tolerance || 150}
                                                variant="bordered"
                                                radius={getThemeRadius()}
                                                min="10"
                                                max="1000"
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />
                                            <p className="text-sm text-default-500">
                                                Current waypoints: {editingType?.config?.waypoints?.length || 0} configured
                                            </p>
                                        </div>
                                    )}

                                    {getBaseSlug(editingType?.slug) === 'qr_code' && (
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-semibold">QR Code Configuration</h5>
                                            <Input
                                                key={`max_distance-${editingType?.id}`}
                                                label="Max Distance (meters)"
                                                name="max_distance"
                                                type="number"
                                                defaultValue={editingType?.config?.max_distance || 50}
                                                variant="bordered"
                                                radius={getThemeRadius()}
                                                min="1"
                                                max="500"
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />
                                        </div>
                                    )}

                                    {getBaseSlug(editingType?.slug) === 'geo_polygon' && (
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-semibold">Geofence Configuration</h5>
                                            <p className="text-sm text-default-500">
                                                Polygon zones: {editingType?.config?.polygons?.length || 0} configured
                                            </p>
                                        </div>
                                    )}
                                </form>
                            </ModalBody>
                            <ModalFooter>
                                <Button 
                                    color="danger" 
                                    variant="light" 
                                    onPress={onClose}
                                    radius={getThemeRadius()}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    color="primary" 
                                    onPress={() => {
                                        const form = document.getElementById('editTypeForm');
                                        if (form) {
                                            form.requestSubmit();
                                        }
                                    }}
                                    isLoading={typeLoading}
                                    radius={getThemeRadius()}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    {editingType?.id ? 'Update Type' : 'Create Type'}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Waypoint Configuration Modal */}
            <Modal 
                isOpen={isWaypointModalOpen} 
                onClose={() => {
                    setIsAddingWaypoint(false);
                    onWaypointModalClose();
                }}
                size="5xl"
                scrollBehavior="inside"
                radius={getThemeRadius()}
                classNames={{
                    base: "bg-content1",
                    backdrop: "bg-black/50",
                    header: "border-b border-divider",
                    footer: "border-t border-divider",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <MapPinIcon className="w-6 h-6 text-primary" />
                                    <div>
                                        <h2 className="text-xl font-bold">Configure Route Waypoints</h2>
                                        <p className="text-sm text-default-500">Set route waypoints for {editingType?.name}</p>
                                    </div>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <div className="space-y-6">
                                    {/* Tolerance and Stats */}
                                    <div className="flex items-center gap-4">
                                        <Input
                                            label="Tolerance (meters)"
                                            type="number"
                                            value={waypointForm.tolerance}
                                            onChange={(e) => setWaypointForm(prev => ({ ...prev, tolerance: parseInt(e.target.value) || 150 }))}
                                            variant="bordered"
                                            radius={getThemeRadius()}
                                            min="10"
                                            max="1000"
                                            className="max-w-xs"
                                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                        />
                                        <Chip 
                                            variant="flat" 
                                            color="primary" 
                                            size="sm"
                                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                        >
                                            {waypointForm.waypoints.length} waypoint{waypointForm.waypoints.length !== 1 ? 's' : ''}
                                        </Chip>
                                        {waypointForm.waypoints.length >= 2 && (
                                            <Chip 
                                                variant="flat" 
                                                color="success" 
                                                size="sm"
                                                style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                            >
                                                {waypointForm.waypoints.length - 1} segment{waypointForm.waypoints.length > 2 ? 's' : ''}
                                            </Chip>
                                        )}
                                    </div>

                                    {/* Interactive Map */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h5 className="text-lg font-semibold">Interactive Route Map</h5>
                                                <p className="text-sm text-default-500">
                                                    {waypointForm.waypoints.length >= 2 
                                                        ? 'Actual road route is displayed between waypoints with distance and time estimates'
                                                        : 'Add waypoints to visualize the actual road route path'
                                                    }
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    color={isAddingWaypoint ? "danger" : "primary"}
                                                    variant={isAddingWaypoint ? "flat" : "solid"}
                                                    size="sm"
                                                    onPress={() => {
                                                        if (isAddingWaypoint) {
                                                            setIsAddingWaypoint(false);
                                                            showToast.info('Waypoint adding mode disabled');
                                                        } else {
                                                            addWaypoint();
                                                        }
                                                    }}
                                                    startContent={isAddingWaypoint ? <XMarkIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                                                    radius={getThemeRadius()}
                                                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                >
                                                    {isAddingWaypoint ? 'Cancel Adding' : 'Add Waypoint'}
                                                </Button>
                                                {waypointForm.waypoints.length > 0 && (
                                                    <Button
                                                        color="secondary"
                                                        variant="flat"
                                                        size="sm"
                                                        onPress={() => {
                                                            if (waypointForm.waypoints.length > 0) {
                                                                const bounds = L.latLngBounds(
                                                                    waypointForm.waypoints.map(w => [parseFloat(w.lat), parseFloat(w.lng)])
                                                                );
                                                                const center = bounds.getCenter();
                                                                setMapCenter([center.lat, center.lng]);
                                                                setMapZoom(12);
                                                            }
                                                        }}
                                                        startContent={<ArrowPathIcon className="w-4 h-4" />}
                                                        radius={getThemeRadius()}
                                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    >
                                                        Fit All
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {isAddingWaypoint && (
                                            <div className="p-3 rounded-lg" style={{
                                                background: `color-mix(in srgb, var(--theme-primary) 10%, transparent)`,
                                                border: `1px solid color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                borderRadius: `var(--borderRadius, 8px)`,
                                            }}>
                                                <p className="text-sm text-primary font-medium">
                                                    📍 Click anywhere on the map to add a waypoint
                                                </p>
                                            </div>
                                        )}

                                        {/* Map Container */}
                                        <Card style={{
                                            borderRadius: `var(--borderRadius, 8px)`,
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{ height: '400px', width: '100%' }}>
                                                <MapContainer
                                                    center={mapCenter}
                                                    zoom={mapZoom}
                                                    style={{ height: '100%', width: '100%' }}
                                                    scrollWheelZoom={true}
                                                    doubleClickZoom={true}
                                                    dragging={true}
                                                    touchZoom={true}
                                                >
                                                    <TileLayer
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                    />
                                                    
                                                    {/* Existing waypoint markers */}
                                                    {waypointForm.waypoints.map((waypoint, index) => (
                                                        waypoint.lat && waypoint.lng && (
                                                            <Marker 
                                                                key={`waypoint-${index}`}
                                                                position={[parseFloat(waypoint.lat), parseFloat(waypoint.lng)]}
                                                                icon={L.divIcon({
                                                                    html: `<div style="
                                                                        background: var(--theme-primary, #3b82f6);
                                                                        color: white;
                                                                        border-radius: 50%;
                                                                        width: 30px;
                                                                        height: 30px;
                                                                        display: flex;
                                                                        align-items: center;
                                                                        justify-content: center;
                                                                        font-weight: bold;
                                                                        font-size: 12px;
                                                                        border: 2px solid white;
                                                                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                                                    ">${index + 1}</div>`,
                                                                    className: 'custom-waypoint-marker',
                                                                    iconSize: [30, 30],
                                                                    iconAnchor: [15, 15],
                                                                })}
                                                            />
                                                        )
                                                    ))}
                                                    
                                                    {/* Route rendering */}
                                                    <WaypointRoute waypoints={waypointForm.waypoints} />
                                                    
                                                    {/* Map click handler */}
                                                    <WaypointMapClickHandler 
                                                        onLocationSelect={addWaypointFromMap}
                                                        isAddingWaypoint={isAddingWaypoint}
                                                    />
                                                </MapContainer>
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Waypoint List */}
                                    <div className="space-y-4">
                                        <h5 className="text-lg font-semibold">Waypoint List</h5>
                                        
                                        {waypointForm.waypoints.length === 0 ? (
                                            <Card>
                                                <CardBody className="text-center py-8">
                                                    <MapPinIcon className="w-12 h-12 text-default-300 mx-auto mb-3" />
                                                    <p className="text-default-500">No waypoints configured</p>
                                                    <p className="text-sm text-default-400 mt-1">Click "Add Waypoint" and then click on the map to add waypoints</p>
                                                </CardBody>
                                            </Card>
                                        ) : (
                                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                                {waypointForm.waypoints.map((waypoint, index) => (
                                                    <Card key={index} className="border border-divider">
                                                        <CardBody className="p-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div 
                                                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                                                        style={{ background: 'var(--theme-primary, #3b82f6)' }}
                                                                    >
                                                                        {index + 1}
                                                                    </div>
                                                                    <h6 className="font-medium">Waypoint {index + 1}</h6>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        isIconOnly
                                                                        color="secondary"
                                                                        variant="light"
                                                                        size="sm"
                                                                        onPress={() => centerMapOnWaypoint(waypoint)}
                                                                        radius={getThemeRadius()}
                                                                        title="Center map on waypoint"
                                                                    >
                                                                        <MapPinIcon className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        isIconOnly
                                                                        color="danger"
                                                                        variant="light"
                                                                        size="sm"
                                                                        onPress={() => removeWaypoint(index)}
                                                                        radius={getThemeRadius()}
                                                                    >
                                                                        <TrashIcon className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <Input
                                                                    label="Latitude"
                                                                    type="number"
                                                                    step="any"
                                                                    value={waypoint.lat}
                                                                    onChange={(e) => updateWaypoint(index, 'lat', e.target.value)}
                                                                    variant="bordered"
                                                                    radius={getThemeRadius()}
                                                                    placeholder="e.g., 23.7588"
                                                                    size="sm"
                                                                    style={{
                                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                                    }}
                                                                />
                                                                <Input
                                                                    label="Longitude"
                                                                    type="number"
                                                                    step="any"
                                                                    value={waypoint.lng}
                                                                    onChange={(e) => updateWaypoint(index, 'lng', e.target.value)}
                                                                    variant="bordered"
                                                                    radius={getThemeRadius()}
                                                                    placeholder="e.g., 90.3783"
                                                                    size="sm"
                                                                    style={{
                                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button 
                                    color="danger" 
                                    variant="light" 
                                    onPress={() => {
                                        setIsAddingWaypoint(false);
                                        onClose();
                                    }}
                                    radius={getThemeRadius()}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    color="primary" 
                                    onPress={handleWaypointSubmit}
                                    radius={getThemeRadius()}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    Save Waypoints ({waypointForm.waypoints.length})
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Polygon Configuration Modal */}
            <Modal 
                isOpen={isPolygonModalOpen} 
                onClose={() => {
                    setIsAddingPolygonPoint(false);
                    onPolygonModalClose();
                }}
                size="5xl"
                scrollBehavior="inside"
                radius={getThemeRadius()}
                classNames={{
                    base: "bg-content1",
                    backdrop: "bg-black/50",
                    header: "border-b border-divider",
                    footer: "border-t border-divider",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <MapPinIcon className="w-6 h-6 text-warning" />
                                    <div>
                                        <h2 className="text-xl font-bold">Configure Geo Polygon</h2>
                                        <p className="text-sm text-default-500">Set polygon boundary for {editingType?.name}</p>
                                    </div>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <div className="space-y-6">
                                    {/* Polygon Info */}
                                    <div className="flex items-center gap-4">
                                        <Chip 
                                            variant="flat" 
                                            color="warning" 
                                            size="sm"
                                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                        >
                                            {polygonForm.polygon.length} point{polygonForm.polygon.length !== 1 ? 's' : ''}
                                        </Chip>
                                        {polygonForm.polygon.length >= 3 && (
                                            <Chip 
                                                variant="flat" 
                                                color="success" 
                                                size="sm"
                                                style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                            >
                                                Valid polygon boundary
                                            </Chip>
                                        )}
                                        {polygonForm.polygon.length > 0 && polygonForm.polygon.length < 3 && (
                                            <Chip 
                                                variant="flat" 
                                                color="danger" 
                                                size="sm"
                                                style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                            >
                                                Minimum 3 points required
                                            </Chip>
                                        )}
                                    </div>

                                    {/* Interactive Map */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h5 className="text-lg font-semibold">Interactive Polygon Map</h5>
                                                <p className="text-sm text-default-500">
                                                    {polygonForm.polygon.length >= 3 
                                                        ? 'Polygon boundary is displayed with fill area'
                                                        : 'Add points to create the polygon boundary (minimum 3 points)'
                                                    }
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    color={isAddingPolygonPoint ? "danger" : "warning"}
                                                    variant={isAddingPolygonPoint ? "flat" : "solid"}
                                                    size="sm"
                                                    onPress={() => {
                                                        if (isAddingPolygonPoint) {
                                                            setIsAddingPolygonPoint(false);
                                                            showToast.info('Point adding mode disabled');
                                                        } else {
                                                            addPolygonPoint();
                                                        }
                                                    }}
                                                    startContent={isAddingPolygonPoint ? <XMarkIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                                                    radius={getThemeRadius()}
                                                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                >
                                                    {isAddingPolygonPoint ? 'Cancel Adding' : 'Add Point'}
                                                </Button>
                                                {polygonForm.polygon.length > 0 && (
                                                    <Button
                                                        color="secondary"
                                                        variant="flat"
                                                        size="sm"
                                                        onPress={() => {
                                                            if (polygonForm.polygon.length > 0) {
                                                                const bounds = L.latLngBounds(
                                                                    polygonForm.polygon.map(p => [parseFloat(p.lat), parseFloat(p.lng)])
                                                                );
                                                                const center = bounds.getCenter();
                                                                setPolygonMapCenter([center.lat, center.lng]);
                                                                setPolygonMapZoom(12);
                                                            }
                                                        }}
                                                        startContent={<ArrowPathIcon className="w-4 h-4" />}
                                                        radius={getThemeRadius()}
                                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    >
                                                        Fit All
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {isAddingPolygonPoint && (
                                            <div className="p-3 rounded-lg" style={{
                                                background: `color-mix(in srgb, var(--theme-warning) 10%, transparent)`,
                                                border: `1px solid color-mix(in srgb, var(--theme-warning) 25%, transparent)`,
                                                borderRadius: `var(--borderRadius, 8px)`,
                                            }}>
                                                <p className="text-sm text-warning font-medium">
                                                    📍 Click anywhere on the map to add a polygon point
                                                </p>
                                            </div>
                                        )}

                                        {/* Map Container */}
                                        <Card style={{
                                            borderRadius: `var(--borderRadius, 8px)`,
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{ height: '400px', width: '100%' }}>
                                                <MapContainer
                                                    center={polygonMapCenter}
                                                    zoom={polygonMapZoom}
                                                    style={{ height: '100%', width: '100%' }}
                                                    scrollWheelZoom={true}
                                                    doubleClickZoom={true}
                                                    dragging={true}
                                                    touchZoom={true}
                                                >
                                                    <TileLayer
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                    />
                                                    
                                                    {/* Existing polygon point markers */}
                                                    {polygonForm.polygon.map((point, index) => (
                                                        point.lat && point.lng && (
                                                            <Marker 
                                                                key={`polygon-point-${index}`}
                                                                position={[parseFloat(point.lat), parseFloat(point.lng)]}
                                                                icon={L.divIcon({
                                                                    html: `<div style="
                                                                        background: var(--theme-warning, #f5a524);
                                                                        color: white;
                                                                        border-radius: 50%;
                                                                        width: 30px;
                                                                        height: 30px;
                                                                        display: flex;
                                                                        align-items: center;
                                                                        justify-content: center;
                                                                        font-weight: bold;
                                                                        font-size: 12px;
                                                                        border: 2px solid white;
                                                                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                                                    ">${index + 1}</div>`,
                                                                    className: 'custom-polygon-marker',
                                                                    iconSize: [30, 30],
                                                                    iconAnchor: [15, 15],
                                                                })}
                                                            />
                                                        )
                                                    ))}
                                                    
                                                    {/* Polygon rendering */}
                                                    <PolygonRenderer polygonPoints={polygonForm.polygon} />
                                                    
                                                    {/* Map click handler */}
                                                    <PolygonMapClickHandler 
                                                        onLocationSelect={addPolygonPointFromMap}
                                                        isAddingPoint={isAddingPolygonPoint}
                                                    />
                                                </MapContainer>
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Polygon Point List */}
                                    <div className="space-y-4">
                                        <h5 className="text-lg font-semibold">Polygon Points</h5>
                                        
                                        {polygonForm.polygon.length === 0 ? (
                                            <Card>
                                                <CardBody className="text-center py-8">
                                                    <MapPinIcon className="w-12 h-12 text-default-300 mx-auto mb-3" />
                                                    <p className="text-default-500">No polygon points configured</p>
                                                    <p className="text-sm text-default-400 mt-1">Click "Add Point" and then click on the map to add points (minimum 3 required)</p>
                                                </CardBody>
                                            </Card>
                                        ) : (
                                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                                {polygonForm.polygon.map((point, index) => (
                                                    <Card key={index} className="border border-divider">
                                                        <CardBody className="p-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div 
                                                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                                                        style={{ background: 'var(--theme-warning, #f5a524)' }}
                                                                    >
                                                                        {index + 1}
                                                                    </div>
                                                                    <h6 className="font-medium">Point {index + 1}</h6>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        isIconOnly
                                                                        color="secondary"
                                                                        variant="light"
                                                                        size="sm"
                                                                        onPress={() => centerMapOnPolygonPoint(point)}
                                                                        radius={getThemeRadius()}
                                                                        title="Center map on point"
                                                                    >
                                                                        <MapPinIcon className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        isIconOnly
                                                                        color="danger"
                                                                        variant="light"
                                                                        size="sm"
                                                                        onPress={() => removePolygonPoint(index)}
                                                                        radius={getThemeRadius()}
                                                                    >
                                                                        <TrashIcon className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <Input
                                                                    label="Latitude"
                                                                    type="number"
                                                                    step="any"
                                                                    value={point.lat}
                                                                    onChange={(e) => updatePolygonPoint(index, 'lat', e.target.value)}
                                                                    variant="bordered"
                                                                    radius={getThemeRadius()}
                                                                    placeholder="e.g., 23.7588"
                                                                    size="sm"
                                                                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                                />
                                                                <Input
                                                                    label="Longitude"
                                                                    type="number"
                                                                    step="any"
                                                                    value={point.lng}
                                                                    onChange={(e) => updatePolygonPoint(index, 'lng', e.target.value)}
                                                                    variant="bordered"
                                                                    radius={getThemeRadius()}
                                                                    placeholder="e.g., 90.3783"
                                                                    size="sm"
                                                                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                                />
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button 
                                    color="danger" 
                                    variant="light" 
                                    onPress={() => {
                                        setIsAddingPolygonPoint(false);
                                        onClose();
                                    }}
                                    radius={getThemeRadius()}
                                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    color="warning" 
                                    onPress={handlePolygonSubmit}
                                    isDisabled={polygonForm.polygon.length < 3}
                                    radius={getThemeRadius()}
                                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                    Save Polygon ({polygonForm.polygon.length}/3+ points)
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </App>
    );
};

export default AttendanceSettings;
