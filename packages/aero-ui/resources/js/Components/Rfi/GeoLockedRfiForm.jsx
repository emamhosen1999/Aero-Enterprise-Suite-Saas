import React, { useCallback, useEffect, useState } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Select,
    SelectItem,
    Textarea,
    Chip,
    Spinner,
    Card,
    CardBody,
} from "@heroui/react";
import {
    MapPinIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useForm } from '@inertiajs/react';

/**
 * GeoLockedRfiForm - PATENTABLE CORE IP
 * 
 * RFI submission form with automatic GPS validation to prevent fraudulent location claims.
 * Uses Haversine distance algorithm to verify user is within 50m of claimed chainage.
 * 
 * NOVELTY:
 * - Real-time GPS capture and validation
 * - Chainage-to-GPS interpolation using project alignment
 * - Visual feedback for location accuracy
 * - Automatic blocking for out-of-range submissions
 * - Admin override capability with audit logging
 * 
 * @param {boolean} open - Modal open state
 * @param {function} onClose - Close callback
 * @param {number} projectId - Project identifier
 * @param {object} existingRfi - Existing RFI for edit mode (optional)
 * @param {function} onSuccess - Success callback after submission
 */
const GeoLockedRfiForm = ({
    open = false,
    onClose = () => {},
    projectId,
    existingRfi = null,
    onSuccess = () => {},
}) => {
    const isEditMode = !!existingRfi;

    // Form state with Inertia
    const form = useForm({
        project_id: projectId,
        work_type: existingRfi?.work_type || '',
        layer: existingRfi?.layer || '',
        start_chainage: existingRfi?.start_chainage || '',
        end_chainage: existingRfi?.end_chainage || '',
        description: existingRfi?.description || '',
        quantity: existingRfi?.quantity || '',
        unit: existingRfi?.unit || '',
        latitude: existingRfi?.latitude || null,
        longitude: existingRfi?.longitude || null,
        geo_validation_result: existingRfi?.geo_validation_result || null,
    });

    // GPS state
    const [gpsState, setGpsState] = useState({
        capturing: false,
        captured: false,
        validated: false,
        validationResult: null,
        error: null,
    });

    const [themeRadius, setThemeRadius] = useState('lg');

    // Get theme radius
    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) setThemeRadius('none');
        else if (radiusValue <= 4) setThemeRadius('sm');
        else if (radiusValue <= 8) setThemeRadius('md');
        else if (radiusValue <= 16) setThemeRadius('lg');
        else setThemeRadius('full');
    }, []);

    // Capture GPS coordinates
    const captureGPS = useCallback(() => {
        setGpsState(prev => ({ ...prev, capturing: true, error: null }));

        if (!navigator.geolocation) {
            setGpsState(prev => ({
                ...prev,
                capturing: false,
                error: 'GPS not supported by your browser',
            }));
            showToast.error('GPS not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;

                form.setData({
                    ...form.data,
                    latitude: lat,
                    longitude: lng,
                });

                setGpsState(prev => ({
                    ...prev,
                    capturing: false,
                    captured: true,
                    error: null,
                }));

                showToast.success(`GPS captured (±${accuracy.toFixed(0)}m accuracy)`);

                // Auto-validate if chainage is already set
                if (form.data.start_chainage) {
                    validateGPS(lat, lng, form.data.start_chainage);
                }
            },
            (error) => {
                let errorMessage = 'Failed to capture GPS';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'GPS permission denied. Please enable location access.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'GPS position unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'GPS request timed out';
                        break;
                }

                setGpsState(prev => ({
                    ...prev,
                    capturing: false,
                    captured: false,
                    error: errorMessage,
                }));

                showToast.error(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }, [form.data.start_chainage]);

    // Validate GPS against chainage
    const validateGPS = useCallback(async (lat, lng, chainage) => {
        if (!lat || !lng || !chainage || !projectId) return;

        try {
            const response = await axios.post(route('rfi.geofencing.validate'), {
                latitude: lat,
                longitude: lng,
                claimed_chainage: chainage,
                project_id: projectId,
            });

            if (response.status === 200) {
                const result = response.data;

                form.setData({
                    ...form.data,
                    geo_validation_result: result,
                });

                setGpsState(prev => ({
                    ...prev,
                    validated: true,
                    validationResult: result,
                }));

                if (result.valid) {
                    showToast.success(`Location verified (${result.distance.toFixed(1)}m from expected)`);
                } else {
                    showToast.error(`Location mismatch: ${result.distance.toFixed(1)}m from expected location`);
                }
            }
        } catch (error) {
            showToast.error('Failed to validate GPS location');
            setGpsState(prev => ({
                ...prev,
                validated: false,
                validationResult: null,
            }));
        }
    }, [projectId, form.data]);

    // Re-validate when chainage changes
    useEffect(() => {
        if (form.data.latitude && form.data.longitude && form.data.start_chainage) {
            validateGPS(form.data.latitude, form.data.longitude, form.data.start_chainage);
        }
    }, [form.data.start_chainage]);

    // Submit form
    const handleSubmit = async () => {
        // Validate GPS is captured and validated
        if (!form.data.latitude || !form.data.longitude) {
            showToast.error('GPS location is required. Please capture your current location.');
            return;
        }

        if (!gpsState.validated || !gpsState.validationResult) {
            showToast.error('GPS validation pending. Please wait for validation to complete.');
            return;
        }

        if (!gpsState.validationResult.valid) {
            showToast.error(
                'GPS validation failed. Your location is too far from the claimed chainage. Contact supervisor for override.'
            );
            return;
        }

        const promise = new Promise(async (resolve, reject) => {
            try {
                const endpoint = isEditMode
                    ? route('rfi.update', existingRfi.id)
                    : route('rfi.store');

                const response = await axios({
                    method: isEditMode ? 'put' : 'post',
                    url: endpoint,
                    data: form.data,
                });

                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || 'RFI saved successfully']);
                    onSuccess(response.data);
                    handleClose();
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to save RFI']);
            }
        });

        showToast.promise(promise, {
            loading: isEditMode ? 'Updating RFI...' : 'Creating RFI...',
            success: (data) => data.join(', '),
            error: (data) => (Array.isArray(data) ? data.join(', ') : data),
        });
    };

    const handleClose = () => {
        form.reset();
        setGpsState({
            capturing: false,
            captured: false,
            validated: false,
            validationResult: null,
            error: null,
        });
        onClose();
    };

    // Layer options
    const layerOptions = [
        { key: 'earthwork_excavation', label: 'Earthwork Excavation' },
        { key: 'earthwork_compaction', label: 'Earthwork Compaction' },
        { key: 'sub_base', label: 'Sub-Base' },
        { key: 'base_course', label: 'Base Course' },
        { key: 'binder_course', label: 'Binder Course' },
        { key: 'wearing_course', label: 'Wearing Course' },
        { key: 'surface_treatment', label: 'Surface Treatment' },
    ];

    const workTypeOptions = [
        { key: 'excavation', label: 'Excavation' },
        { key: 'compaction', label: 'Compaction' },
        { key: 'paving', label: 'Paving' },
        { key: 'concrete', label: 'Concrete Work' },
        { key: 'asphalt', label: 'Asphalt Laying' },
        { key: 'drainage', label: 'Drainage' },
    ];

    return (
        <Modal
            isOpen={open}
            onOpenChange={handleClose}
            size="2xl"
            scrollBehavior="inside"
            classNames={{
                base: "bg-content1",
                header: "border-b border-divider",
                body: "py-6",
                footer: "border-t border-divider",
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">
                        {isEditMode ? 'Edit Geo-Locked RFI' : 'Create Geo-Locked RFI'}
                    </h2>
                    <p className="text-sm text-default-500 font-normal">
                        GPS validation required to prevent fraudulent location claims
                    </p>
                </ModalHeader>

                <ModalBody>
                    <div className="space-y-4">
                        {/* GPS Capture Card */}
                        <Card className="bg-content2">
                            <CardBody className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                                            <MapPinIcon className="w-5 h-5 text-primary" />
                                            GPS Location Verification
                                        </h3>

                                        {!gpsState.captured && !gpsState.capturing && (
                                            <p className="text-sm text-default-600 mb-3">
                                                Capture your current GPS location to proceed
                                            </p>
                                        )}

                                        {gpsState.capturing && (
                                            <div className="flex items-center gap-2 text-sm text-primary">
                                                <Spinner size="sm" />
                                                <span>Capturing GPS coordinates...</span>
                                            </div>
                                        )}

                                        {gpsState.captured && !gpsState.validated && (
                                            <div className="flex items-center gap-2 text-sm text-warning">
                                                <Spinner size="sm" color="warning" />
                                                <span>Validating location...</span>
                                            </div>
                                        )}

                                        {gpsState.validated && gpsState.validationResult && (
                                            <div className="space-y-2">
                                                <div
                                                    className={`flex items-center gap-2 text-sm ${
                                                        gpsState.validationResult.valid
                                                            ? 'text-success'
                                                            : 'text-danger'
                                                    }`}
                                                >
                                                    {gpsState.validationResult.valid ? (
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                    ) : (
                                                        <ExclamationTriangleIcon className="w-5 h-5" />
                                                    )}
                                                    <span className="font-semibold">
                                                        {gpsState.validationResult.message}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-default-600 space-y-1">
                                                    <p>
                                                        Captured: {form.data.latitude?.toFixed(6)},{' '}
                                                        {form.data.longitude?.toFixed(6)}
                                                    </p>
                                                    <p>
                                                        Distance from expected:{' '}
                                                        {gpsState.validationResult.distance?.toFixed(1)}m
                                                    </p>
                                                    {!gpsState.validationResult.valid && (
                                                        <p className="text-danger">
                                                            Maximum allowed: 50m (configure tolerance in settings)
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {gpsState.error && (
                                            <div className="flex items-center gap-2 text-sm text-danger">
                                                <ExclamationTriangleIcon className="w-5 h-5" />
                                                <span>{gpsState.error}</span>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        size="sm"
                                        color="primary"
                                        variant={gpsState.captured ? 'flat' : 'solid'}
                                        onPress={captureGPS}
                                        isLoading={gpsState.capturing}
                                        startContent={
                                            !gpsState.capturing && (
                                                gpsState.captured ? (
                                                    <ArrowPathIcon className="w-4 h-4" />
                                                ) : (
                                                    <MapPinIcon className="w-4 h-4" />
                                                )
                                            )
                                        }
                                    >
                                        {gpsState.captured ? 'Recapture' : 'Capture GPS'}
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Work Type */}
                        <Select
                            label="Work Type"
                            placeholder="Select work type"
                            selectedKeys={form.data.work_type ? [form.data.work_type] : []}
                            onSelectionChange={(keys) => form.setData('work_type', Array.from(keys)[0])}
                            isInvalid={!!form.errors.work_type}
                            errorMessage={form.errors.work_type}
                            isRequired
                            radius={themeRadius}
                        >
                            {workTypeOptions.map((option) => (
                                <SelectItem key={option.key}>{option.label}</SelectItem>
                            ))}
                        </Select>

                        {/* Layer */}
                        <Select
                            label="Layer"
                            placeholder="Select layer"
                            selectedKeys={form.data.layer ? [form.data.layer] : []}
                            onSelectionChange={(keys) => form.setData('layer', Array.from(keys)[0])}
                            isInvalid={!!form.errors.layer}
                            errorMessage={form.errors.layer}
                            isRequired
                            radius={themeRadius}
                        >
                            {layerOptions.map((option) => (
                                <SelectItem key={option.key}>{option.label}</SelectItem>
                            ))}
                        </Select>

                        {/* Chainage Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                type="number"
                                label="Start Chainage (km)"
                                placeholder="0.000"
                                step="0.001"
                                value={form.data.start_chainage}
                                onValueChange={(value) => form.setData('start_chainage', value)}
                                isInvalid={!!form.errors.start_chainage}
                                errorMessage={form.errors.start_chainage}
                                isRequired
                                radius={themeRadius}
                            />
                            <Input
                                type="number"
                                label="End Chainage (km)"
                                placeholder="0.000"
                                step="0.001"
                                value={form.data.end_chainage}
                                onValueChange={(value) => form.setData('end_chainage', value)}
                                isInvalid={!!form.errors.end_chainage}
                                errorMessage={form.errors.end_chainage}
                                isRequired
                                radius={themeRadius}
                            />
                        </div>

                        {/* Quantity & Unit */}
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                type="number"
                                label="Quantity"
                                placeholder="0"
                                step="0.01"
                                value={form.data.quantity}
                                onValueChange={(value) => form.setData('quantity', value)}
                                isInvalid={!!form.errors.quantity}
                                errorMessage={form.errors.quantity}
                                radius={themeRadius}
                            />
                            <Input
                                label="Unit"
                                placeholder="e.g., m³, ton, m²"
                                value={form.data.unit}
                                onValueChange={(value) => form.setData('unit', value)}
                                isInvalid={!!form.errors.unit}
                                errorMessage={form.errors.unit}
                                radius={themeRadius}
                            />
                        </div>

                        {/* Description */}
                        <Textarea
                            label="Description"
                            placeholder="Describe the work performed..."
                            value={form.data.description}
                            onValueChange={(value) => form.setData('description', value)}
                            isInvalid={!!form.errors.description}
                            errorMessage={form.errors.description}
                            minRows={3}
                            radius={themeRadius}
                        />
                    </div>
                </ModalBody>

                <ModalFooter>
                    <Button variant="flat" onPress={handleClose} radius={themeRadius}>
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleSubmit}
                        isLoading={form.processing}
                        isDisabled={
                            !gpsState.validated ||
                            !gpsState.validationResult?.valid ||
                            form.processing
                        }
                        radius={themeRadius}
                    >
                        {isEditMode ? 'Update RFI' : 'Submit RFI'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default GeoLockedRfiForm;
