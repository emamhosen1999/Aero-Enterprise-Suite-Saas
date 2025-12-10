import {
    Button,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem
} from "@heroui/react";
import React, {useEffect, useState} from "react";
import {User} from 'lucide-react';
import {showToast} from "@/utils/toastUtils";

const PersonalInformationForm = ({user,setUser, open, closeModal }) => {
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
        passport_no: user.passport_no || '',
        passport_exp_date: user.passport_exp_date || '',
        nationality: user.nationality || '',
        religion: user.religion || '',
        marital_status: user.marital_status || '',
        employment_of_spouse: user.employment_of_spouse || '',
        number_of_children: user.number_of_children || '', // Assuming number_of_children should default to 0 if not provided
        nid: user.nid || '' // Default to empty string if nid is not provided
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

            // Special case handling
            if (key === 'marital_status' && value === 'Single') {
                updatedData['employment_of_spouse'] = '';
                updatedData['number_of_children'] = '';
            }

            return updatedData;
        });

        setChangedUserData((prevUser) => {
            const updatedData = { ...prevUser, [key]: value };

            // Remove the key if the value is an empty string
            if (value === '') {
                delete updatedData[key];
            }

            // Special case handling
            if (key === 'marital_status' && value === 'Single') {
                updatedData['employment_of_spouse'] = null;
                updatedData['number_of_children'] = null;
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
                ruleSet: 'personal',
                ...initialUserData,
            });

            if (response.status === 200) {
                setUser(response.data.user);
                showToast.success(response.data.messages?.length > 0 ? response.data.messages.join(' ') : 'Personal information updated successfully', {
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
                    showToast.error(error.response.data.error || 'Failed to update personal information.', {
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
                        <User size={20} style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <span className="text-lg font-semibold" style={{
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}>
                        Personal Information
                    </span>
                </ModalHeader>
            <form onSubmit={handleSubmit}>
                <ModalBody className="py-4 px-4 sm:py-6 sm:px-6" style={{
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Input
                                label="Passport No"
                                value={changedUserData.passport_no || initialUserData.passport_no || ''}
                                onChange={(e) => handleChange('passport_no', e.target.value)}
                                isInvalid={Boolean(errors.passport_no)}
                                errorMessage={errors.passport_no}
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
                                label="Passport Expiry Date"
                                type="date"
                                value={changedUserData.passport_exp_date || initialUserData.passport_exp_date || ''}
                                onChange={(e) => handleChange('passport_exp_date', e.target.value)}
                                isInvalid={Boolean(errors.passport_exp_date)}
                                errorMessage={errors.passport_exp_date}
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
                                label="NID No"
                                value={changedUserData.nid || initialUserData.nid || ''}
                                onChange={(e) => handleChange('nid', e.target.value)}
                                isInvalid={Boolean(errors.nid)}
                                errorMessage={errors.nid}
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
                                label="Nationality"
                                value={changedUserData.nationality || initialUserData.nationality || ''}
                                onChange={(e) => handleChange('nationality', e.target.value)}
                                isInvalid={Boolean(errors.nationality)}
                                errorMessage={errors.nationality}
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
                                label="Religion"
                                value={changedUserData.religion || initialUserData.religion || ''}
                                onChange={(e) => handleChange('religion', e.target.value)}
                                isInvalid={Boolean(errors.religion)}
                                errorMessage={errors.religion}
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
                            <Select
                                label="Marital Status"
                                selectedKeys={changedUserData.marital_status || initialUserData.marital_status ? [changedUserData.marital_status || initialUserData.marital_status] : []}
                                onSelectionChange={(keys) => handleChange('marital_status', Array.from(keys)[0])}
                                isInvalid={Boolean(errors.marital_status)}
                                errorMessage={errors.marital_status}
                                variant="bordered"
                                size="sm"
                                radius={getThemeRadius()}
                                classNames={{
                                    trigger: "min-h-unit-10",
                                    value: "text-small"
                                }}
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                <SelectItem key="na" value="na">-</SelectItem>
                                <SelectItem key="Single" value="Single">Single</SelectItem>
                                <SelectItem key="Married" value="Married">Married</SelectItem>
                            </Select>
                        </div>
                        <div>
                            <Input
                                label="Employment of spouse"
                                value={changedUserData.marital_status === 'Single' ? '' : changedUserData.employment_of_spouse || initialUserData.employment_of_spouse}
                                onChange={(e) => handleChange('employment_of_spouse', e.target.value)}
                                isInvalid={Boolean(errors.employment_of_spouse)}
                                errorMessage={errors.employment_of_spouse}
                                isDisabled={changedUserData.marital_status === 'Single' || initialUserData.marital_status === 'Single'}
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
                                label="No. of children"
                                type="number"
                                value={changedUserData.marital_status === 'Single' ? '' : changedUserData.number_of_children || initialUserData.number_of_children}
                                onChange={(e) => handleChange('number_of_children', e.target.value)}
                                isInvalid={Boolean(errors.number_of_children)}
                                errorMessage={errors.number_of_children}
                                isDisabled={changedUserData.marital_status === 'Single' || initialUserData.marital_status === 'Single'}
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

export default PersonalInformationForm;
