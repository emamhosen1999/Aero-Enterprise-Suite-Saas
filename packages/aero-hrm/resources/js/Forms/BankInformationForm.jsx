import React, {useEffect, useState} from "react";
import {Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/react";
import {CreditCard} from 'lucide-react';
import {showToast} from "@/utils/toastUtils";

const BankInformationForm = ({ user, setUser, open, closeModal }) => {
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
        bank_name: user.bank_name || '', // Default to empty string if not provided
        bank_account_no: user.bank_account_no || '', // Default to empty string if not provided
        ifsc_code: user.ifsc_code || '', // Default to empty string if not provided
        pan_no: user.pan_no || '' // Default to empty string if not provided
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
                ruleSet: 'bank',
                ...initialUserData,
            });

            if (response.status === 200) {
                setUser(response.data.user);
                setErrors({});
                showToast.success(response.data.messages?.length > 0 ? response.data.messages.join(' ') : 'Bank information updated successfully', {
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
                    showToast.error(error.response.data.error || 'Failed to update bank information.', {
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
                        <CreditCard size={20} style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <span className="text-lg font-semibold" style={{
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}>
                        Bank Information
                    </span>
                </ModalHeader>
            <form onSubmit={handleSubmit}>
                <ModalBody className="py-4 px-4 sm:py-6 sm:px-6" style={{
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Input
                                label="Bank Name"
                                value={changedUserData.bank_name || initialUserData.bank_name || ''}
                                onChange={(e) => handleChange('bank_name', e.target.value)}
                                isInvalid={Boolean(errors.bank_name)}
                                errorMessage={errors.bank_name}
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
                                label="Bank Account No."
                                value={changedUserData.bank_account_no || initialUserData.bank_account_no || ''}
                                onChange={(e) => handleChange('bank_account_no', e.target.value)}
                                isInvalid={Boolean(errors.bank_account_no)}
                                errorMessage={errors.bank_account_no}
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
                                label="IFSC Code"
                                value={changedUserData.ifsc_code || initialUserData.ifsc_code || ''}
                                onChange={(e) => handleChange('ifsc_code', e.target.value)}
                                isInvalid={Boolean(errors.ifsc_code)}
                                errorMessage={errors.ifsc_code}
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
                                label="PAN No."
                                value={changedUserData.pan_no || initialUserData.pan_no || ''}
                                onChange={(e) => handleChange('pan_no', e.target.value)}
                                isInvalid={Boolean(errors.pan_no)}
                                errorMessage={errors.pan_no}
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

export default BankInformationForm;
