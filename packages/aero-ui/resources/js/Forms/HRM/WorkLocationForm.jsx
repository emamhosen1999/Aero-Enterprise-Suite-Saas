import React, {useEffect, useState} from 'react';
import {
    Button,
    Divider,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
} from "@heroui/react";
import {DocumentTextIcon, MapPinIcon, UserIcon} from "@heroicons/react/24/outline";
import {showToast} from "@/utils/toastUtils";

const WorkLocationForm = ({ modalType, open, closeModal, setData, currentRow, users }) => {
    const [formData, setFormData] = useState({
        location: '',
        start_chainage: '',
        end_chainage: '',
        incharge: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Helper function to convert theme borderRadius to HeroUI radius values
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

    useEffect(() => {
        if (modalType === 'update' && currentRow) {
            setFormData({
                location: currentRow.location || '',
                start_chainage: currentRow.start_chainage || '',
                end_chainage: currentRow.end_chainage || '',
                incharge: currentRow.incharge || '',
            });
        } else {
            setFormData({
                location: '',
                start_chainage: '',
                end_chainage: '',
                incharge: '',
            });
        }
        setErrors({});
    }, [modalType, currentRow, open]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.location.trim()) {
            newErrors.location = 'Location name is required';
        }
        
        if (!formData.start_chainage.trim()) {
            newErrors.start_chainage = 'Start chainage is required';
        }
        
        if (!formData.end_chainage.trim()) {
            newErrors.end_chainage = 'End chainage is required';
        }
        
        if (!formData.incharge) {
            newErrors.incharge = 'Incharge is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        const url = modalType === 'add' ? '/work-locations/add' : '/work-locations/update';
        const method = 'POST';
        
        const requestData = modalType === 'update' 
            ? { ...formData, id: currentRow.id }
            : formData;

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify(requestData),
            });

            const result = await response.json();

            if (response.ok) {
                setData(result.work_locations);
                showToast.success(result.message || `Work location ${modalType === 'add' ? 'added' : 'updated'} successfully!`);
                closeModal();
            } else {
                if (result.error && typeof result.error === 'object') {
                    setErrors(result.error);
                } else {
                    showToast.error(result.error || 'An error occurred');
                }
            }
        } catch (error) {
            showToast.error('Network error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            closeModal();
        }
    };

    return (
        <Modal 
            isOpen={open} 
            onClose={handleClose}
            size="lg"
            placement="center"
            classNames={{
                base: "bg-content1",
                backdrop: "bg-black/50 backdrop-blur-sm",
                header: "border-b border-divider",
                footer: "border-t border-divider",
                closeButton: "hover:bg-default-100 text-default-500 hover:text-default-700"
            }}
            style={{
                fontFamily: `var(--fontFamily, "Inter")`,
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="p-2 rounded-lg"
                                    style={{
                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                        color: 'var(--theme-primary)'
                                    }}
                                >
                                    <MapPinIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {modalType === 'add' ? 'Add New Work Location' : 'Edit Work Location'}
                                    </h2>
                                    <p className="text-sm text-default-500">
                                        {modalType === 'add' 
                                            ? 'Create a new work location with jurisdiction details'
                                            : 'Update work location information and assignments'
                                        }
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>
                        
                        <ModalBody className="py-6">
                            <div className="space-y-6">
                                {/* Location Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Location Name <span className="text-danger">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Enter work location name"
                                        value={formData.location}
                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                        variant="bordered"
                                        radius={getThemeRadius()}
                                        startContent={<MapPinIcon className="w-4 h-4 text-default-400" />}
                                        classNames={{
                                            input: "text-foreground",
                                            inputWrapper: `bg-content2/50 hover:bg-content2/70 
                                                         focus-within:bg-content2/90 border-divider/50 
                                                         hover:border-divider data-[focus]:border-primary`,
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                        isInvalid={!!errors.location}
                                        errorMessage={errors.location}
                                    />
                                </div>

                                <Divider />

                                {/* Chainage Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">
                                            Start Chainage <span className="text-danger">*</span>
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="e.g., 0+000"
                                            value={formData.start_chainage}
                                            onChange={(e) => handleInputChange('start_chainage', e.target.value)}
                                            variant="bordered"
                                            radius={getThemeRadius()}
                                            startContent={<DocumentTextIcon className="w-4 h-4 text-default-400" />}
                                            classNames={{
                                                input: "text-foreground",
                                                inputWrapper: `bg-content2/50 hover:bg-content2/70 
                                                             focus-within:bg-content2/90 border-divider/50 
                                                             hover:border-divider data-[focus]:border-primary`,
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                            isInvalid={!!errors.start_chainage}
                                            errorMessage={errors.start_chainage}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">
                                            End Chainage <span className="text-danger">*</span>
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="e.g., 5+000"
                                            value={formData.end_chainage}
                                            onChange={(e) => handleInputChange('end_chainage', e.target.value)}
                                            variant="bordered"
                                            radius={getThemeRadius()}
                                            startContent={<DocumentTextIcon className="w-4 h-4 text-default-400" />}
                                            classNames={{
                                                input: "text-foreground",
                                                inputWrapper: `bg-content2/50 hover:bg-content2/70 
                                                             focus-within:bg-content2/90 border-divider/50 
                                                             hover:border-divider data-[focus]:border-primary`,
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                            isInvalid={!!errors.end_chainage}
                                            errorMessage={errors.end_chainage}
                                        />
                                    </div>
                                </div>

                                <Divider />

                                {/* Incharge Selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Location Incharge <span className="text-danger">*</span>
                                    </label>
                                    <Select
                                        placeholder="Select an incharge"
                                        selectedKeys={formData.incharge ? [formData.incharge.toString()] : []}
                                        onSelectionChange={(keys) => {
                                            const selectedKey = Array.from(keys)[0];
                                            handleInputChange('incharge', selectedKey || '');
                                        }}
                                        variant="bordered"
                                        radius={getThemeRadius()}
                                        startContent={<UserIcon className="w-4 h-4 text-default-400" />}
                                        classNames={{
                                            trigger: `bg-content2/50 hover:bg-content2/70 
                                                     focus-within:bg-content2/90 border-divider/50 
                                                     hover:border-divider data-[focus]:border-primary`,
                                            value: "text-foreground",
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                        isInvalid={!!errors.incharge}
                                        errorMessage={errors.incharge}
                                    >
                                        {users?.map((user) => (
                                            <SelectItem key={user.id} value={user.id} textValue={user.name}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                        </ModalBody>
                        
                        <ModalFooter>
                            <Button
                                color="danger"
                                variant="light"
                                onPress={handleClose}
                                disabled={loading}
                                radius={getThemeRadius()}
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleSubmit}
                                isLoading={loading}
                                radius={getThemeRadius()}
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                {modalType === 'add' ? 'Add Location' : 'Update Location'}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default WorkLocationForm;
