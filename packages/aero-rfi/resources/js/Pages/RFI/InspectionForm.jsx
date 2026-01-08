import React, { useState, useEffect, useCallback } from 'react';
import { Head, usePage, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Select,
    SelectItem,
    Textarea,
    Chip,
    Spinner
} from "@heroui/react";
import {
    ClipboardDocumentCheckIcon,
    MapPinIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowLeftIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import GpsMapPreview from '@/Components/RFI/GpsMapPreview.jsx';
import LayerDependencyIndicator from '@/Components/RFI/LayerDependencyIndicator.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

/**
 * InspectionForm - RFI Create/Edit Form with GPS Capture & Continuity Validation
 * 
 * Features:
 * - GPS coordinate capture with real-time validation
 * - Live continuity checking with visual indicators
 * - Layer dependency visualization
 * - Map preview component
 * - File upload support
 * - Precognition validation
 * 
 * @param {Object} rfi - Existing RFI data for edit mode (null for create)
 * @param {string} mode - 'create' or 'edit'
 * @param {Array} workLayers - Available work layers
 * @param {Array} workLocations - Available work locations
 * @param {Object} project - Current project data
 */
const InspectionForm = ({ rfi = null, mode = 'create', workLayers = [], workLocations = [], project = {} }) => {
    const { auth } = usePage().props;
    const isEditMode = mode === 'edit' && rfi !== null;

    // Theme radius helper
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

    // Form state with Inertia
    const form = useForm({
        work_location_id: rfi?.work_location_id || '',
        work_layer_id: rfi?.work_layer_id || '',
        chainage_start: rfi?.chainage_start || '',
        chainage_end: rfi?.chainage_end || '',
        inspection_date: rfi?.inspection_date || new Date().toISOString().split('T')[0],
        gps_latitude: rfi?.gps_latitude || '',
        gps_longitude: rfi?.gps_longitude || '',
        description: rfi?.description || '',
        remarks: rfi?.remarks || '',
        files: []
    });

    // State
    const [loading, setLoading] = useState(false);
    const [gpsValidation, setGpsValidation] = useState(null);
    const [continuityCheck, setContinuityCheck] = useState(null);
    const [checkingContinuity, setCheckingContinuity] = useState(false);
    const [capturingGps, setCapturingGps] = useState(false);
    const [expectedGps, setExpectedGps] = useState(null);

    // Capture GPS from device
    const captureGps = useCallback(() => {
        if (!navigator.geolocation) {
            showToast.error('GPS is not supported by your browser');
            return;
        }

        setCapturingGps(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                form.setData({
                    ...form.data,
                    gps_latitude: position.coords.latitude.toFixed(6),
                    gps_longitude: position.coords.longitude.toFixed(6)
                });
                setCapturingGps(false);
                showToast.success('GPS coordinates captured successfully');
            },
            (error) => {
                setCapturingGps(false);
                showToast.error(`GPS capture failed: ${error.message}`);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [form]);

    // Validate GPS coordinates
    const validateGps = useCallback(async () => {
        if (!form.data.gps_latitude || !form.data.gps_longitude || !form.data.chainage_start) {
            return;
        }

        try {
            const response = await axios.post(route('rfi.rfis.validate-gps'), {
                gps_latitude: form.data.gps_latitude,
                gps_longitude: form.data.gps_longitude,
                chainage_start: form.data.chainage_start,
                chainage_end: form.data.chainage_end,
                project_id: project.id
            });

            if (response.status === 200) {
                setGpsValidation(response.data);
                setExpectedGps({
                    lat: response.data.expected_latitude,
                    lng: response.data.expected_longitude
                });
            }
        } catch (error) {
            console.error('GPS validation failed:', error);
        }
    }, [form.data.gps_latitude, form.data.gps_longitude, form.data.chainage_start, form.data.chainage_end, project.id]);

    // Check layer continuity
    const checkContinuity = useCallback(async () => {
        if (!form.data.work_layer_id || !form.data.chainage_start || !form.data.chainage_end) {
            return;
        }

        setCheckingContinuity(true);
        try {
            const response = await axios.post(route('rfi.rfis.check-continuity'), {
                work_layer_id: form.data.work_layer_id,
                chainage_start: form.data.chainage_start,
                chainage_end: form.data.chainage_end,
                project_id: project.id
            });

            if (response.status === 200) {
                setContinuityCheck(response.data);
            }
        } catch (error) {
            console.error('Continuity check failed:', error);
            setContinuityCheck(null);
        } finally {
            setCheckingContinuity(false);
        }
    }, [form.data.work_layer_id, form.data.chainage_start, form.data.chainage_end, project.id]);

    // Auto-validate GPS when coordinates change
    useEffect(() => {
        validateGps();
    }, [validateGps]);

    // Auto-check continuity when layer/chainage changes
    useEffect(() => {
        checkContinuity();
    }, [checkContinuity]);

    // Submit form
    const handleSubmit = (e) => {
        e.preventDefault();
        
        const submitPromise = new Promise(async (resolve, reject) => {
            try {
                if (isEditMode) {
                    await form.put(route('rfi.rfis.update', rfi.id));
                } else {
                    await form.post(route('rfi.rfis.store'));
                }
                resolve([`RFI ${isEditMode ? 'updated' : 'created'} successfully`]);
            } catch (error) {
                reject(error.response?.data?.errors || ['An error occurred']);
            }
        });

        showToast.promise(submitPromise, {
            loading: `${isEditMode ? 'Updating' : 'Creating'} RFI...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data
        });
    };

    const themeRadius = getThemeRadius();
    const selectedLayer = workLayers.find(l => l.id === parseInt(form.data.work_layer_id));

    return (
        <>
            <Head title={isEditMode ? 'Edit RFI' : 'Create RFI'} />
            
            <div className="flex flex-col w-full h-full p-4" role="main">
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
                            background: `linear-gradient(135deg, 
                                var(--theme-content1, #FAFAFA) 20%, 
                                var(--theme-content2, #F4F4F5) 10%, 
                                var(--theme-content3, #F1F3F4) 20%)`
                        }}
                    >
                        <CardHeader 
                            className="border-b p-0"
                            style={{ borderColor: `var(--theme-divider, #E4E4E7)` }}
                        >
                            <div className="p-6 w-full">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl" style={{
                                            background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                            borderRadius: `var(--borderRadius, 12px)`
                                        }}>
                                            <ClipboardDocumentCheckIcon className="w-8 h-8" 
                                                style={{ color: 'var(--theme-primary)' }} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-bold">
                                                {isEditMode ? 'Edit RFI' : 'Create New RFI'}
                                            </h4>
                                            <p className="text-sm text-default-500">
                                                {isEditMode ? 'Update inspection details' : 'Submit new inspection request with GPS validation'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="flat"
                                        startContent={<ArrowLeftIcon className="w-4 h-4" />}
                                        onPress={() => window.history.back()}
                                    >
                                        Back
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardBody className="p-6">
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column - Form Inputs */}
                                    <div className="space-y-6">
                                        {/* Work Location */}
                                        <Select
                                            label="Work Location"
                                            placeholder="Select work location"
                                            selectedKeys={form.data.work_location_id ? [String(form.data.work_location_id)] : []}
                                            onSelectionChange={(keys) => form.setData('work_location_id', Array.from(keys)[0])}
                                            isInvalid={!!form.errors.work_location_id}
                                            errorMessage={form.errors.work_location_id}
                                            isRequired
                                            radius={themeRadius}
                                            classNames={{ trigger: "bg-default-100" }}
                                        >
                                            {workLocations?.map(location => (
                                                <SelectItem key={String(location.id)}>
                                                    {location.name}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        {/* Work Layer */}
                                        <Select
                                            label="Work Layer"
                                            placeholder="Select work layer"
                                            selectedKeys={form.data.work_layer_id ? [String(form.data.work_layer_id)] : []}
                                            onSelectionChange={(keys) => form.setData('work_layer_id', Array.from(keys)[0])}
                                            isInvalid={!!form.errors.work_layer_id}
                                            errorMessage={form.errors.work_layer_id}
                                            isRequired
                                            radius={themeRadius}
                                            classNames={{ trigger: "bg-default-100" }}
                                        >
                                            {workLayers?.map(layer => (
                                                <SelectItem key={String(layer.id)}>
                                                    {layer.name}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        {/* Layer Dependency Indicator */}
                                        {selectedLayer && (
                                            <LayerDependencyIndicator
                                                layer={selectedLayer}
                                                projectId={project.id}
                                                chainageStart={form.data.chainage_start}
                                                chainageEnd={form.data.chainage_end}
                                            />
                                        )}

                                        {/* Chainage Range */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                type="number"
                                                label="Chainage Start (m)"
                                                placeholder="0"
                                                value={form.data.chainage_start}
                                                onValueChange={(value) => form.setData('chainage_start', value)}
                                                isInvalid={!!form.errors.chainage_start}
                                                errorMessage={form.errors.chainage_start}
                                                isRequired
                                                radius={themeRadius}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />
                                            <Input
                                                type="number"
                                                label="Chainage End (m)"
                                                placeholder="100"
                                                value={form.data.chainage_end}
                                                onValueChange={(value) => form.setData('chainage_end', value)}
                                                isInvalid={!!form.errors.chainage_end}
                                                errorMessage={form.errors.chainage_end}
                                                isRequired
                                                radius={themeRadius}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />
                                        </div>

                                        {/* Continuity Check Result */}
                                        {checkingContinuity && (
                                            <div className="flex items-center gap-2 text-sm text-default-500">
                                                <Spinner size="sm" />
                                                <span>Checking layer continuity...</span>
                                            </div>
                                        )}
                                        {continuityCheck && (
                                            <Card className="bg-default-50">
                                                <CardBody className="p-4">
                                                    <div className="flex items-start gap-3">
                                                        {continuityCheck.can_proceed ? (
                                                            <CheckCircleIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                                                        ) : (
                                                            <XCircleIcon className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                                                        )}
                                                        <div className="flex-1">
                                                            <p className={`font-semibold ${continuityCheck.can_proceed ? 'text-success' : 'text-danger'}`}>
                                                                {continuityCheck.can_proceed ? 'Continuity Check Passed' : 'Continuity Issues Detected'}
                                                            </p>
                                                            <p className="text-sm text-default-600 mt-1">
                                                                {continuityCheck.message}
                                                            </p>
                                                            {continuityCheck.coverage_percentage !== undefined && (
                                                                <p className="text-xs text-default-500 mt-2">
                                                                    Coverage: {continuityCheck.coverage_percentage.toFixed(1)}%
                                                                </p>
                                                            )}
                                                            {continuityCheck.violations?.length > 0 && (
                                                                <div className="mt-2 space-y-1">
                                                                    {continuityCheck.violations.map((violation, idx) => (
                                                                        <p key={idx} className="text-xs text-danger">
                                                                            • {violation}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        )}

                                        {/* Inspection Date */}
                                        <Input
                                            type="date"
                                            label="Inspection Date"
                                            value={form.data.inspection_date}
                                            onValueChange={(value) => form.setData('inspection_date', value)}
                                            isInvalid={!!form.errors.inspection_date}
                                            errorMessage={form.errors.inspection_date}
                                            isRequired
                                            radius={themeRadius}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />

                                        {/* Description */}
                                        <Textarea
                                            label="Description"
                                            placeholder="Enter inspection description..."
                                            value={form.data.description}
                                            onValueChange={(value) => form.setData('description', value)}
                                            isInvalid={!!form.errors.description}
                                            errorMessage={form.errors.description}
                                            minRows={3}
                                            radius={themeRadius}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />

                                        {/* Remarks */}
                                        <Textarea
                                            label="Remarks"
                                            placeholder="Enter additional remarks..."
                                            value={form.data.remarks}
                                            onValueChange={(value) => form.setData('remarks', value)}
                                            isInvalid={!!form.errors.remarks}
                                            errorMessage={form.errors.remarks}
                                            minRows={2}
                                            radius={themeRadius}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />
                                    </div>

                                    {/* Right Column - GPS & Map */}
                                    <div className="space-y-6">
                                        {/* GPS Capture */}
                                        <Card className="bg-default-50">
                                            <CardBody className="p-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <MapPinIcon className="w-5 h-5 text-primary" />
                                                        <span className="font-semibold">GPS Location</span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        color="primary"
                                                        variant="flat"
                                                        onPress={captureGps}
                                                        isLoading={capturingGps}
                                                        startContent={!capturingGps && <MapPinIcon className="w-4 h-4" />}
                                                    >
                                                        {capturingGps ? 'Capturing...' : 'Capture GPS'}
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <Input
                                                        type="number"
                                                        label="Latitude"
                                                        placeholder="0.000000"
                                                        value={form.data.gps_latitude}
                                                        onValueChange={(value) => form.setData('gps_latitude', value)}
                                                        isInvalid={!!form.errors.gps_latitude}
                                                        errorMessage={form.errors.gps_latitude}
                                                        size="sm"
                                                        radius={themeRadius}
                                                        classNames={{ inputWrapper: "bg-white" }}
                                                    />
                                                    <Input
                                                        type="number"
                                                        label="Longitude"
                                                        placeholder="0.000000"
                                                        value={form.data.gps_longitude}
                                                        onValueChange={(value) => form.setData('gps_longitude', value)}
                                                        isInvalid={!!form.errors.gps_longitude}
                                                        errorMessage={form.errors.gps_longitude}
                                                        size="sm"
                                                        radius={themeRadius}
                                                        classNames={{ inputWrapper: "bg-white" }}
                                                    />
                                                </div>

                                                {/* GPS Validation Status */}
                                                {gpsValidation && (
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <Chip
                                                            color={gpsValidation.is_valid ? 'success' : 'danger'}
                                                            size="sm"
                                                            variant="flat"
                                                            startContent={
                                                                gpsValidation.is_valid ? 
                                                                <CheckCircleIcon className="w-4 h-4" /> : 
                                                                <XCircleIcon className="w-4 h-4" />
                                                            }
                                                        >
                                                            {gpsValidation.is_valid ? 'Valid' : 'Invalid'} 
                                                            {gpsValidation.distance && ` - ${gpsValidation.distance.toFixed(1)}m`}
                                                        </Chip>
                                                        {gpsValidation.reason && !gpsValidation.is_valid && (
                                                            <span className="text-xs text-danger">
                                                                {gpsValidation.reason}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </CardBody>
                                        </Card>

                                        {/* Map Preview */}
                                        {form.data.gps_latitude && form.data.gps_longitude && expectedGps && (
                                            <GpsMapPreview
                                                userLat={parseFloat(form.data.gps_latitude)}
                                                userLng={parseFloat(form.data.gps_longitude)}
                                                expectedLat={expectedGps.lat}
                                                expectedLng={expectedGps.lng}
                                                distance={gpsValidation?.distance}
                                                isValid={gpsValidation?.is_valid}
                                                tolerance={gpsValidation?.tolerance || 50}
                                                chainageStart={form.data.chainage_start}
                                                chainageEnd={form.data.chainage_end}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-divider">
                                    <Button
                                        type="button"
                                        variant="flat"
                                        onPress={() => window.history.back()}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        color="primary"
                                        isLoading={form.processing}
                                        isDisabled={continuityCheck && !continuityCheck.can_proceed}
                                    >
                                        {isEditMode ? 'Update RFI' : 'Create RFI'}
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

InspectionForm.layout = (page) => <App children={page} />;
export default InspectionForm;
