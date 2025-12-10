import {Button, Card, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/react";
import React, {useEffect, useState} from "react";
import {Phone} from 'lucide-react';
import {showToast} from "@/utils/toastUtils";

const EmergencyContactForm = ({user,setUser, open, closeModal }) => {
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

    const [initialUserData, setInitialUserData] = useState({
        id: user.id,
        emergency_contact_primary_name: user.emergency_contact_primary_name || '',
        emergency_contact_primary_relationship: user.emergency_contact_primary_relationship || '',
        emergency_contact_primary_phone: user.emergency_contact_primary_phone || '',
        emergency_contact_secondary_name: user.emergency_contact_secondary_name || '',
        emergency_contact_secondary_relationship: user.emergency_contact_secondary_relationship || '',
        emergency_contact_secondary_phone: user.emergency_contact_secondary_phone || ''
    });

    const [changedUserData, setChangedUserData] = useState({
        id: user.id,
    });

    const [dataChanged, setDataChanged] = useState(false);


    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const handleChange = (key, value) => {
        setInitialUserData((prevUser) => {
            const updatedData = { ...prevUser, [key]: value };

            // Remove the key if the value is an empty string
            if (value === '') {
                delete updatedData[key];
            }

            return updatedData;
        });

        setChangedUserData((prevUser) => {
            const updatedData = { ...prevUser, [key]: value };

            // Remove the key if the value is an empty string
            if (value === '') {
                delete updatedData[key];
            }

            return updatedData;
        });
    };

    useEffect(() => {
        // Function to filter out unchanged data from changedUserData
        for (const key in changedUserData) {
            // Skip comparison for 'id' or if the value matches the original data
            if (key !== 'id' && changedUserData[key] === user[key]) {
                delete changedUserData[key]; // Skip this iteration
            }
        }
        const hasChanges = Object.keys(changedUserData).filter(key => key !== 'id').length > 0;

        setDataChanged(hasChanges);

    }, [initialUserData, changedUserData, user]);



    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);

        try {
            const response = await axios.post(route('profile.update'), {
                ruleSet: 'emergency',
                ...initialUserData,
            });

            if (response.status === 200) {
                setUser(response.data.user);
                showToast.success(response.data.messages?.length > 0 ? response.data.messages.join(' ') : 'Emergency contact updated successfully', {
                    icon: '🟢',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: 'var(--theme-content1)',
                        border: '1px solid var(--theme-divider)',
                        color: 'var(--theme-primary)',
                    }
                });
                closeModal();
            }
        } catch (error) {
            setProcessing(false);

            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                if (error.response.status === 422) {
                    // Handle validation errors
                    setErrors(error.response.data.errors || {});
                    showToast.error(error.response.data.error || 'Failed to update emergency contact.', {
                        icon: '🔴',
                        style: {
                            backdropFilter: 'blur(16px) saturate(200%)',
                            background: 'var(--theme-content1)',
                            border: '1px solid var(--theme-divider)',
                            color: 'var(--theme-primary)',
                        }
                    });
                } else {
                    // Handle other HTTP errors
                    showToast.error('An unexpected error occurred. Please try again later.', {
                        icon: '🔴',
                        style: {
                            backdropFilter: 'blur(16px) saturate(200%)',
                            background: 'var(--theme-content1)',
                            border: '1px solid var(--theme-divider)',
                            color: 'var(--theme-primary)',
                        }
                    });
                }
                console.error(error.response.data);
            } else if (error.request) {
                // The request was made but no response was received
                showToast.error('No response received from the server. Please check your internet connection.', {
                    icon: '🔴',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: 'var(--theme-content1)',
                        border: '1px solid var(--theme-divider)',
                        color: 'var(--theme-primary)',
                    }
                });
                console.error(error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                showToast.error('An error occurred while setting up the request.', {
                    icon: '🔴',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: 'var(--theme-content1)',
                        border: '1px solid var(--theme-divider)',
                        color: 'var(--theme-primary)',
                    }
                });
                console.error('Error', error.message);
            }
        } finally {
            setProcessing(false);
        }
    };



    return (
        <Modal
            isOpen={open}
            onOpenChange={processing ? undefined : closeModal}
            size="2xl"
            radius={getThemeRadius()}
            scrollBehavior="inside"
            classNames={{
                base: "bg-content1",
                backdrop: "bg-black/50 backdrop-blur-sm",
            }}
            style={{
                fontFamily: `var(--fontFamily, "Inter")`,
            }}
        >
            <ModalContent>
                <ModalHeader className="flex gap-3 items-center" style={{
                    fontFamily: `var(--fontFamily, "Inter")`,
                    borderBottom: '1px solid var(--theme-divider)'
                }}>
                    <div className="p-2 rounded-lg" style={{
                        background: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)',
                        borderRadius: `var(--borderRadius, 8px)`,
                    }}>
                        <Phone size={20} style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <span className="text-lg font-semibold" style={{
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}>
                        Emergency Contact Information
                    </span>
                </ModalHeader>
            <form onSubmit={handleSubmit}>
                <ModalBody className="py-4 px-4 sm:py-6 sm:px-6" style={{
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}>
                    <div className="space-y-6">
                        {/* Primary Contact Section */}
                        <div>
                            <Card className="shadow-lg">
                                <div className="p-4">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Primary Contact
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Input
                                                label="Name"
                                                isRequired
                                                value={changedUserData.emergency_contact_primary_name || initialUserData.emergency_contact_primary_name || ""}
                                                onChange={(e) => handleChange("emergency_contact_primary_name", e.target.value)}
                                                isInvalid={Boolean(errors.emergency_contact_primary_name)}
                                                errorMessage={errors.emergency_contact_primary_name}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                classNames={{
                                                    input: "text-small",
                                                    inputWrapper: "min-h-unit-10"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                label="Relationship"
                                                isRequired
                                                value={changedUserData.emergency_contact_primary_relationship || initialUserData.emergency_contact_primary_relationship || ""}
                                                onChange={(e) => handleChange("emergency_contact_primary_relationship", e.target.value)}
                                                isInvalid={Boolean(errors.emergency_contact_primary_relationship)}
                                                errorMessage={errors.emergency_contact_primary_relationship}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                classNames={{
                                                    input: "text-small",
                                                    inputWrapper: "min-h-unit-10"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                label="Phone"
                                                isRequired
                                                value={changedUserData.emergency_contact_primary_phone || initialUserData.emergency_contact_primary_phone || ""}
                                                onChange={(e) => handleChange("emergency_contact_primary_phone", e.target.value)}
                                                isInvalid={Boolean(errors.emergency_contact_primary_phone)}
                                                errorMessage={errors.emergency_contact_primary_phone}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                classNames={{
                                                    input: "text-small",
                                                    inputWrapper: "min-h-unit-10"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Secondary Contact Section */}
                        <div>
                            <Card className="shadow-lg">
                                <div className="p-4">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Secondary Contact
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Input
                                                label="Name"
                                                value={changedUserData.emergency_contact_secondary_name || initialUserData.emergency_contact_secondary_name || ""}
                                                onChange={(e) => handleChange("emergency_contact_secondary_name", e.target.value)}
                                                isInvalid={Boolean(errors.emergency_contact_secondary_name)}
                                                errorMessage={errors.emergency_contact_secondary_name}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                classNames={{
                                                    input: "text-small",
                                                    inputWrapper: "min-h-unit-10"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                label="Relationship"
                                                value={changedUserData.emergency_contact_secondary_relationship || initialUserData.emergency_contact_secondary_relationship || ""}
                                                onChange={(e) => handleChange("emergency_contact_secondary_relationship", e.target.value)}
                                                isInvalid={Boolean(errors.emergency_contact_secondary_relationship)}
                                                errorMessage={errors.emergency_contact_secondary_relationship}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                classNames={{
                                                    input: "text-small",
                                                    inputWrapper: "min-h-unit-10"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                label="Phone"
                                                value={changedUserData.emergency_contact_secondary_phone || initialUserData.emergency_contact_secondary_phone || ""}
                                                onChange={(e) => handleChange("emergency_contact_secondary_phone", e.target.value)}
                                                isInvalid={Boolean(errors.emergency_contact_secondary_phone)}
                                                errorMessage={errors.emergency_contact_secondary_phone}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                classNames={{
                                                    input: "text-small",
                                                    inputWrapper: "min-h-unit-10"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter style={{
                    borderTop: '1px solid var(--theme-divider)',
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}>
                    <Button
                        onPress={closeModal}
                        isDisabled={processing}
                        variant="light"
                        radius={getThemeRadius()}
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        isDisabled={!dataChanged}
                        variant="bordered"
                        color="primary"
                        type="submit"
                        isLoading={processing}
                        radius={getThemeRadius()}
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    >
                        Submit
                    </Button>
                </ModalFooter>
            </form>
            </ModalContent>
        </Modal>
    );
};

export default EmergencyContactForm;






